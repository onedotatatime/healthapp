import { describe, expect, it } from 'vitest';
import { ApiError } from '../../api/call';
import { claimErrorMessage } from './api';
import { createMockWorld } from './mock';

describe('claimErrorMessage: every typed code says why, in words', () => {
  const m = (code: string, status = 409) => claimErrorMessage(new ApiError(status, 'x', code));
  it('maps Cron\'s four claim errors to four different sentences', () => {
    const all = [m('token_expired'), m('token_used'), m('token_invalid', 404), m('rate_limited', 429)];
    expect(new Set(all).size).toBe(4);
    expect(m('token_expired')).toMatch(/expired/);
    expect(m('token_used')).toMatch(/already used/);
    expect(m('token_invalid', 404)).toMatch(/not valid/);
    expect(m('rate_limited', 429)).toMatch(/Wait a minute/);
  });
  it('an unreachable server and an unknown error are not mistaken for a bad code', () => {
    expect(claimErrorMessage(new ApiError(0, 'Could not reach the server.'))).toMatch(/Could not reach/);
    expect(claimErrorMessage(new Error('boom'))).toMatch(/could not be checked/);
  });
});

describe('mock server follows the contract (what the fixture drives the screens with)', () => {
  it('a code works once: the second claim is token_used, and no second grant exists', async () => {
    const { api, world } = createMockWorld();
    const c = await api.create();
    await api.claim({ token: c.token });
    await expect(api.claim({ short_code: c.short_code })).rejects.toMatchObject({ code: 'token_used', status: 409 });
    expect(world.grants).toHaveLength(1);
  });
  it('an expired code is token_expired and opens nothing; an unknown one is token_invalid', async () => {
    const { api, world } = createMockWorld({ codeSeconds: -1 });
    const c = await api.create();
    await expect(api.claim({ token: c.token })).rejects.toMatchObject({ code: 'token_expired' });
    await expect(api.claim({ short_code: 'AAAAAAAA' })).rejects.toMatchObject({ code: 'token_invalid', status: 404 });
    expect(world.grants).toHaveLength(0);
  });
  it('every answer carries server_now, and the server clock may disagree with the device', async () => {
    const { api, world } = createMockWorld();
    world.skewMs = 90_000;
    const c = await api.create();
    expect(Date.parse(c.server_now) - Date.now()).toBeGreaterThan(89_000);
  });
  it('a grant ends on its own at its time and status then says expired; revoke ends it at once', async () => {
    const { api, world } = createMockWorld({ grantSeconds: 1 });
    const c = await api.create();
    const claimed = await api.claim({ token: c.token });
    const id = claimed.grant.grant_id;
    expect((await api.decide(id, true)).grant.status).toBe('active');
    expect((await api.status()).grant?.grant_id).toBe(id); // newest pending or active, no id given
    world.grants[0].expiresAt = Date.now() - 1;
    expect((await api.status(id)).grant?.status).toBe('expired');
    expect((await api.status()).grant).toBeNull(); // nothing live any more
    const c2 = await api.create();
    const g2 = (await api.claim({ token: c2.token })).grant.grant_id;
    await api.decide(g2, true);
    expect((await api.revoke(g2)).grant.status).toBe('revoked');
  });
});
