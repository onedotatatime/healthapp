import { describe, expect, it } from 'vitest';
import { parseEnv } from './env';

const good = { VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_ANON_KEY: 'k', VITE_HEALTHAPP_ENV: 'dev' };

describe('parseEnv', () => {
  it('derives the schema from the env name', () => {
    expect(parseEnv(good)).toMatchObject({ status: 'ok', env: 'dev', schema: 'healthapp_dev' });
    expect(parseEnv({ ...good, VITE_HEALTHAPP_ENV: 'demo' })).toMatchObject({ schema: 'healthapp_demo', bucket: 'healthapp-demo', functionPrefix: 'healthapp-' });
  });
  it('names every missing variable instead of crashing', () => {
    const r = parseEnv({});
    expect(r.status).toBe('error');
    expect(r.status === 'error' && r.message).toContain('VITE_SUPABASE_URL');
    expect(r.status === 'error' && r.message).toContain('VITE_HEALTHAPP_ENV');
  });
  it('rejects an env name that is not dev or demo', () => {
    const r = parseEnv({ ...good, VITE_HEALTHAPP_ENV: 'prod' });
    expect(r).toEqual({ status: 'error', message: 'VITE_HEALTHAPP_ENV must be "dev" or "demo", got "prod".' });
  });
  it('rejects a malformed URL', () => {
    expect(parseEnv({ ...good, VITE_SUPABASE_URL: 'nope' }).status).toBe('error');
  });
});
