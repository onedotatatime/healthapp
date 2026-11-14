import { createClient } from "jsr:@supabase/supabase-js@2";
import { adminDb } from "../_shared/admin.ts";
import { makeHandler, type Session } from "./handler.ts";

Deno.serve(makeHandler({
  secret: (name) => Deno.env.get(name),
  async allowTry(env, key, max, windowSeconds) {
    const db = adminDb(env);
    const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
    const { count, error } = await db.from("rate_events").select("id", { count: "exact", head: true })
      .eq("kind", "demo_login").eq("key", key).gte("at", since);
    if (error) throw new Error("rate count failed");
    if ((count ?? 0) >= max) return false;
    const ins = await db.from("rate_events").insert({ kind: "demo_login", key });
    if (ins.error) throw new Error("rate insert failed");
    return true;
  },
  async signIn(email, password) {
    const url = Deno.env.get("SUPABASE_URL");
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !anon) return null;
    const client = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error || !data.session) return null;
    return data.session as unknown as Session;
  },
}));
