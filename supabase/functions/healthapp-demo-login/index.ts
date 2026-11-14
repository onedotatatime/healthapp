import { createClient } from "jsr:@supabase/supabase-js@2";
import { allowTry } from "../_shared/pgstore.ts";
import { makeHandler, type Session } from "./handler.ts";

const noPersist = { auth: { persistSession: false, autoRefreshToken: false } };

Deno.serve(makeHandler({
  secret: (name) => Deno.env.get(name),
  allowTry,
  async signIn(email, password) {
    const url = Deno.env.get("SUPABASE_URL");
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !anon) return null;
    const client = createClient(url, anon, noPersist);
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error || !data.session) return null;
    return data.session as unknown as Session;
  },
  // The founder's demo account has a random password nobody holds. After the passcode check the
  // function mints a one-time link for that one address (no email is sent) and trades it for a session.
  async signInUser(email) {
    const url = Deno.env.get("SUPABASE_URL");
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !anon || !service) return null;
    const admin = createClient(url, service, noPersist);
    const link = await admin.auth.admin.generateLink({ type: "magiclink", email });
    const tokenHash = link.data?.properties?.hashed_token;
    if (link.error || !tokenHash) return null;
    const client = createClient(url, anon, noPersist);
    const { data, error } = await client.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
    if (error || !data.session) return null;
    return data.session as unknown as Session;
  },
}));
