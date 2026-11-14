// The one place the service role is used for the dashboard (MIN-4456, CTO decision 2).
// Reads only SUPABASE_* from the environment. Never touches a table: storage only.
import { createClient } from "jsr:@supabase/supabase-js@2";

export function adminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
