import { createClient } from '@supabase/supabase-js';
import { envState, type EnvState } from '../lib/env';
import { makeCall } from './call';

type OkEnv = Extract<EnvState, { status: 'ok' }>;

/** supabase-js with `db.schema = healthapp_<env>`. No global headers: `x-healthapp-env` is for function calls only. */
export function makeSupabase(env: OkEnv) {
  return createClient(env.supabaseUrl, env.anonKey, {
    db: { schema: env.schema },
    auth: { storageKey: 'healthapp-auth', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
}

/** Both are null when the env is not configured; the pages show the error from `envState`. */
export const supabase = envState.status === 'ok' ? makeSupabase(envState) : null;
export const callFunction = envState.status === 'ok' ? makeCall(envState) : null;
