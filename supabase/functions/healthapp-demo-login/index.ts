import { createClient } from "jsr:@supabase/supabase-js@2";
import { allowTry } from "../_shared/pgstore.ts";
import { makeHandler, type Session } from "./handler.ts";

Deno.serve(makeHandler({
  secret: (name) => Deno.env.get(name),
  allowTry,
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
