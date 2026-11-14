export type HealthappEnv = 'dev' | 'demo';

export type EnvState =
  | { status: 'ok'; env: HealthappEnv; schema: string; supabaseUrl: string; anonKey: string }
  | { status: 'error'; message: string };

export interface RawEnv {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_HEALTHAPP_ENV?: string;
}

/** The one place that turns VITE_HEALTHAPP_ENV into the schema name. Pure, so it is unit tested. */
export function parseEnv(raw: RawEnv): EnvState {
  const missing = (['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_HEALTHAPP_ENV'] as const).filter(
    (k) => !raw[k]?.trim(),
  );
  if (missing.length > 0) {
    return { status: 'error', message: `Not configured: missing ${missing.join(', ')}.` };
  }
  const env = raw.VITE_HEALTHAPP_ENV!.trim();
  if (env !== 'dev' && env !== 'demo') {
    return { status: 'error', message: `VITE_HEALTHAPP_ENV must be "dev" or "demo", got "${env}".` };
  }
  let url: URL;
  try {
    url = new URL(raw.VITE_SUPABASE_URL!.trim());
  } catch {
    return { status: 'error', message: 'VITE_SUPABASE_URL is not a valid URL.' };
  }
  return {
    status: 'ok',
    env,
    schema: `healthapp_${env}`,
    supabaseUrl: url.origin,
    anonKey: raw.VITE_SUPABASE_ANON_KEY!.trim(),
  };
}

export const envState: EnvState = parseEnv(import.meta.env as RawEnv);
export const commitSha: string = __COMMIT_SHA__;
