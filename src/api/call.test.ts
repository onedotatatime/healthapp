import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { parseEnv } from '../lib/env';
import { ApiError, makeCall } from './call';
import { DemoLoginResponse } from './contract';

const env = parseEnv({ VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_ANON_KEY: 'anon', VITE_HEALTHAPP_ENV: 'dev' });
if (env.status !== 'ok') throw new Error('test env');

const reply = (status: number, body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status }));

describe('callFunction', () => {
  it('posts to healthapp-<name> with the env header and the anon key when there is no session', async () => {
    const f = reply(200, { ok: true });
    await makeCall(env, f as unknown as typeof fetch)('hello', undefined, z.object({ ok: z.boolean() }));
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://x.supabase.co/functions/v1/healthapp-hello');
    expect(init.headers).toMatchObject({ 'x-healthapp-env': 'dev', apikey: 'anon', authorization: 'Bearer anon' });
  });
  it('uses the user token when one is given', async () => {
    const f = reply(200, { ok: true });
    await makeCall(env, f as unknown as typeof fetch)('x', {}, z.object({ ok: z.boolean() }), { accessToken: 'user-jwt' });
    expect((f.mock.calls[0] as unknown as [string, RequestInit])[1].headers).toMatchObject({ authorization: 'Bearer user-jwt' });
  });
  it('turns a non-2xx answer into an ApiError that keeps the status', async () => {
    const f = reply(403, { error: 'bad passcode' });
    await expect(makeCall(env, f as unknown as typeof fetch)('demo-login', {}, DemoLoginResponse)).rejects.toMatchObject({ status: 403, message: 'bad passcode' });
  });
  it('rejects an answer that does not match the schema instead of passing it on', async () => {
    const f = reply(200, { session: {}, role: 'admin' });
    await expect(makeCall(env, f as unknown as typeof fetch)('demo-login', {}, DemoLoginResponse)).rejects.toBeInstanceOf(ApiError);
  });
  it('reports an unreachable server as status 0', async () => {
    const f = vi.fn(async () => {
      throw new TypeError('network');
    });
    await expect(makeCall(env, f as unknown as typeof fetch)('hello', undefined, z.unknown())).rejects.toMatchObject({ status: 0 });
  });
  it('accepts a valid demo-login answer', async () => {
    const f = reply(200, { session: { access_token: 'a', refresh_token: 'b' }, role: 'doctor' });
    await expect(makeCall(env, f as unknown as typeof fetch)('demo-login', {}, DemoLoginResponse)).resolves.toMatchObject({ role: 'doctor' });
  });
});
