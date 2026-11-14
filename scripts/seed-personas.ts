// Seed the synthetic personas of one env as auth users (MIN-4471, MIN-4449 decision 1.5).
// Creates or updates <persona>.<env>@healthapp.invalid, already confirmed (no email is sent),
// with the marker app_metadata {app: "healthapp", env}. Their password is HEALTHAPP_PERSONA_PASSWORD,
// which also lives in the function secrets so healthapp-demo-login can sign them in.
// Profiles are written by supabase/sql/003_seed_personas.sql (rendered by hdb), after this.
//
//   deno run --allow-env --allow-net scripts/seed-personas.ts dev
// Needs SUPABASE_URL and the service key in the environment (read only by _shared/admin.ts).
import { adminClient } from "../supabase/functions/_shared/admin.ts";

const env = Deno.args[0];
if (env !== "dev" && env !== "demo") throw new Error("usage: seed-personas.ts dev|demo");
const password = Deno.env.get("HEALTHAPP_PERSONA_PASSWORD");
if (!password || password.length < 24) throw new Error("HEALTHAPP_PERSONA_PASSWORD missing or short");

const admin = adminClient();
const marker = { app: "healthapp", env };
const personas = ["patient", "doctor"] as const;

const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listErr) throw listErr;

for (const persona of personas) {
  const email = `${persona}.${env}@healthapp.invalid`;
  const existing = list.users.find((u) => u.email === email);
  if (existing) {
    const m = existing.app_metadata ?? {};
    if (m.app !== "healthapp" || m.env !== env) throw new Error(`${email} exists without the marker: refusing`);
    const { error } = await admin.auth.admin.updateUserById(existing.id, { password });
    if (error) throw error;
    console.log(`${persona}: updated`);
  } else {
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: marker,
    });
    if (error) throw error;
    console.log(`${persona}: created`);
  }
}
