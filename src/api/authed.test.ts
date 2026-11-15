import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({ getSession: vi.fn(), refreshSession: vi.fn() }));
vi.mock('./client', () => ({ supabase: { auth }, callFunction: null }));

import { authedCall } from './authed';
import { ApiError } from './call';
import { isGrantGone } from '../features/assistant/api';
import { codeErrorText } from '../features/handshake/PatientShare';

const session = (t: string) => ({ data: { session: { access_token: t } }, error: null });
const unauth = () => new ApiError(401, 'Not signed in.', 'unauthenticated');

beforeEach(() => {
  auth.getSession.mockReset().mockResolvedValue(session('old'));
  auth.refreshSession.mockReset();
});

describe('authedCall (MIN-4648)', () => {
  it('passes the token and returns the answer when the call works', async () => {
    const run = vi.fn(async (t: string) => `ok:${t}`);
    expect(await authedCall(run)).toBe('ok:old');
    expect(auth.refreshSession).not.toHaveBeenCalled();
  });

  it('on a 401 refreshes once and retries once with the new token', async () => {
    auth.refreshSession.mockResolvedValue(session('new'));
    const run = vi.fn(async (t: string) => {
      if (t === 'old') throw unauth();
      return `ok:${t}`;
    });
    expect(await authedCall(run)).toBe('ok:new');
    expect(run.mock.calls.map((c) => c[0])).toEqual(['old', 'new']);
    expect(auth.refreshSession).toHaveBeenCalledTimes(1);
  });

  it('retries a read that came back 401 even when it carries grant_expired (RLS read)', async () => {
    auth.refreshSession.mockResolvedValue(session('new'));
    const run = vi.fn(async (t: string) => {
      if (t === 'old') throw new ApiError(401, 'JWT expired', 'grant_expired');
      return 'rows';
    });
    expect(await authedCall(run)).toBe('rows');
  });

  it('throws session_ended and does not retry when the refresh is refused', async () => {
    auth.refreshSession.mockResolvedValue({ data: { session: null }, error: { name: 'AuthApiError', status: 400, message: 'session_not_found' } });
    const run = vi.fn(async () => {
      throw unauth();
    });
    await expect(authedCall(run)).rejects.toMatchObject({ status: 401, code: 'session_ended' });
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('keeps a network failure on the refresh as a network error (status 0)', async () => {
    const dead = async () => {
      throw unauth();
    };
    auth.refreshSession.mockResolvedValue({ data: { session: null }, error: { name: 'AuthRetryableFetchError', status: 0, message: 'fetch failed' } });
    await expect(authedCall(dead)).rejects.toMatchObject({ status: 0 });
    auth.refreshSession.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(authedCall(dead)).rejects.toMatchObject({ status: 0 });
  });

  it('never retries more than once: a second 401 is thrown, not looped', async () => {
    auth.refreshSession.mockResolvedValue(session('new'));
    const run = vi.fn(async () => {
      throw unauth();
    });
    await expect(authedCall(run)).rejects.toMatchObject({ status: 401, code: 'unauthenticated' });
    expect(run).toHaveBeenCalledTimes(2);
    expect(auth.refreshSession).toHaveBeenCalledTimes(1);
  });

  it('does not refresh on other errors (403) or when there is no session at all', async () => {
    await expect(
      authedCall(async () => {
        throw new ApiError(403, 'no');
      }),
    ).rejects.toMatchObject({ status: 403 });
    expect(auth.refreshSession).not.toHaveBeenCalled();
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    const run = vi.fn();
    await expect(authedCall(run)).rejects.toMatchObject({ status: 401, code: 'unauthenticated' });
    expect(run).not.toHaveBeenCalled();
    expect(auth.refreshSession).not.toHaveBeenCalled();
  });

  it('a doctor read goes through the same path: 401, refresh, retry', async () => {
    auth.refreshSession.mockResolvedValue(session('new'));
    const read = vi.fn(async () => {
      if (auth.refreshSession.mock.calls.length === 0) throw new ApiError(401, 'JWT expired', 'grant_expired');
      return [{ id: 'd1' }];
    });
    expect(await authedCall(read)).toEqual([{ id: 'd1' }]);
    expect(read).toHaveBeenCalledTimes(2);
  });
});

describe('isGrantGone', () => {
  it('a dead session is not "access ended"; an ended grant is', () => {
    expect(isGrantGone(new ApiError(401, 'x', 'unauthenticated'))).toBe(false);
    expect(isGrantGone(new ApiError(401, 'x', 'session_ended'))).toBe(false);
    expect(isGrantGone(new ApiError(403, 'x'))).toBe(true);
    expect(isGrantGone(new ApiError(410, 'x', 'grant_expired'))).toBe(true);
  });
});

describe('share code error text', () => {
  it('says the session ended on a dead session, and blames the connection otherwise', () => {
    expect(codeErrorText(new ApiError(401, 'x', 'session_ended'))).toBe('Your session ended. Sign in again to continue.');
    expect(codeErrorText(new ApiError(0, 'x'))).toBe('Could not make a code. Check the connection and try again.');
  });
});

describe('sign-out is this device only', () => {
  it("every supabase signOut call in src passes scope: 'local' (the default, 'global', ended the phone's session)", () => {
    const calls: string[] = [];
    const walk = (dir: string) => {
      for (const f of readdirSync(dir)) {
        const p = join(dir, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.tsx?$/.test(f) && !/\.test\./.test(f)) {
          for (const m of readFileSync(p, 'utf8').matchAll(/auth\??\.signOut\(([^)]*)\)/g)) calls.push(`${p}: ${m[0]}`);
        }
      }
    };
    walk(join(__dirname, '..'));
    expect(calls.length).toBeGreaterThan(0);
    for (const c of calls) expect(c).toContain("scope: 'local'");
  });
});
