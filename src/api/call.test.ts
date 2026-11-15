import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { parseEnv } from '../lib/env';
import { ApiError, makeCall, makeStream } from './call';
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
    const f = reply(401, { error: { code: 'bad_passcode', message: 'bad passcode' } });
    await expect(makeCall(env, f as unknown as typeof fetch)('demo-login', {}, DemoLoginResponse)).rejects.toMatchObject({ status: 401, message: 'bad passcode', code: 'bad_passcode' });
  });
  it("reads Cron's nested error body and keeps its code", async () => {
    const f = reply(503, { error: { code: 'model_unavailable', message: 'The model call failed.' } });
    await expect(makeCall(env, f as unknown as typeof fetch)('extract-exam', {}, z.unknown())).rejects.toMatchObject({
      status: 503,
      code: 'model_unavailable',
      message: 'The model call failed.',
    });
  });
  it('rejects an answer that does not match the schema instead of passing it on', async () => {
    const f = reply(200, { access_token: 'x', role: 'admin' });
    await expect(makeCall(env, f as unknown as typeof fetch)('demo-login', {}, DemoLoginResponse)).rejects.toBeInstanceOf(ApiError);
  });
  it('reports an unreachable server as status 0', async () => {
    const f = vi.fn(async () => {
      throw new TypeError('network');
    });
    await expect(makeCall(env, f as unknown as typeof fetch)('hello', undefined, z.unknown())).rejects.toMatchObject({ status: 0 });
  });
  it('accepts a valid demo-login answer', async () => {
    const f = reply(200, { access_token: 'a', refresh_token: 'b', expires_at: 4102444800, user_id: '00000000-0000-4000-8000-000000000001', persona: 'doctor', role: 'doctor' });
    await expect(makeCall(env, f as unknown as typeof fetch)('demo-login', {}, DemoLoginResponse)).resolves.toMatchObject({ role: 'doctor' });
  });
});

describe('streamFunction (MIN-4675)', () => {
  it('posts once to healthapp-<name> with the user token and the env header, and hands the body back unread', async () => {
    const f = vi.fn(async () => new Response('{"t":"start"}\n', { status: 200 }));
    const res = await makeStream(env, f as unknown as typeof fetch)('simulate-live', { accessToken: 'doctor-jwt' });
    expect(f).toHaveBeenCalledTimes(1);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://x.supabase.co/functions/v1/healthapp-simulate-live');
    expect(init.method).toBe('POST');
    expect(init.body).toBeUndefined();
    expect(init.headers).toMatchObject({ 'x-healthapp-env': 'dev', apikey: 'anon', authorization: 'Bearer doctor-jwt', accept: 'application/x-ndjson' });
    expect(res.bodyUsed).toBe(false);
    expect(await res.text()).toBe('{"t":"start"}\n');
  });
  it('turns a non-2xx answer into the same ApiError, so authedCall can refresh on a 401', async () => {
    const f = reply(401, { error: { code: 'unauthenticated', message: 'Not signed in.' } });
    await expect(makeStream(env, f as unknown as typeof fetch)('simulate-live', { accessToken: 't' })).rejects.toMatchObject({ status: 401, code: 'unauthenticated' });
    const g = vi.fn(async () => new Response('<html>bad gateway</html>', { status: 502 }));
    await expect(makeStream(env, g as unknown as typeof fetch)('simulate-live', { accessToken: 't' })).rejects.toMatchObject({ status: 502, message: 'HTTP 502' });
  });
  it('reports an unreachable server as status 0', async () => {
    const f = vi.fn(async () => { throw new TypeError('network'); });
    await expect(makeStream(env, f as unknown as typeof fetch)('simulate-live', { accessToken: 't' })).rejects.toMatchObject({ status: 0 });
  });
});
