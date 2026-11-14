// The one place the service role key is read (MIN-4449 decision 1.6; MIN-4456 CTO decision 2).
// Reads only SUPABASE_* from the environment.
import { createClient } from "jsr:@supabase/supabase-js@2";

function serviceClient(options: Record<string, unknown> = {}) {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, ...options });
}

/** Dashboard: storage only, never a table. Also the seed's auth.admin client. */
export function adminClient() {
  return serviceClient();
}

/** Healthapp functions: a service client pinned to schema healthapp_<env>. `env` comes from
 *  readEnv() (dev or demo only); every name is built from it, never from input. */
export function adminDb(env: "dev" | "demo") {
  return serviceClient({ db: { schema: `healthapp_${env}` } });
}
