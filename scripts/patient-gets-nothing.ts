// Real-token checks for the patient-gets-nothing rules and the diary insert (MIN-4481, C1 + C2),
// schema healthapp_dev. Uses the throwaway QA users of supabase/sql/checks/qa_users_setup.sql, signed in
// through GoTrue, and the Data API exactly as the app does. Prints one PASS/FAIL line per check.
//   SUPABASE_URL=... SUPABASE_ANON_KEY=... HS_PASSWORD=... deno run --node-modules-dir=none --allow-env --allow-net \
//     scripts/patient-gets-nothing.ts
import { createClient } from "jsr:@supabase/supabase-js@2";

const URL_ = Deno.env.get("SUPABASE_URL")!, ANON = Deno.env.get("SUPABASE_ANON_KEY")!, PW = Deno.env.get("HS_PASSWORD")!;
if (!URL_ || !ANON || !PW) throw new Error("SUPABASE_URL, SUPABASE_ANON_KEY and HS_PASSWORD are required");
const SCHEMA = "healthapp_dev";
const PATIENT = "7a000000-0000-4000-8000-000000000001", DOCTOR = "7a000000-0000-4000-8000-000000000002";

async function token(name: string) {
  const c = createClient(URL_, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await c.auth.signInWithPassword({ email: `qa-${name}.dev@healthapp.invalid`, password: PW });
  if (error || !data.session) throw new Error(`sign-in failed for ${name}`);
  return data.session.access_token;
}
const [P, D] = [await token("patient"), await token("doctor")];

const H = (t: string, extra: Record<string, string> = {}) => ({
  apikey: ANON, authorization: `Bearer ${t}`, "accept-profile": SCHEMA, "content-profile": SCHEMA, "content-type": "application/json", ...extra,
});
async function count(t: string, table: string, filter = "", col = "id") {
  const r = await fetch(`${URL_}/rest/v1/${table}?select=${col}${filter}`, { headers: H(t, { prefer: "count=exact", range: "0-0" }) });
  if (!r.ok) return `HTTP ${r.status} ${(await r.json()).code ?? ""}`.trim();
  return (r.headers.get("content-range") ?? "").split("/")[1];
}
// `minimal` asks for no row back. A refusal check must use it: with return=representation an insert for
// someone else also fails on the read-back (the patient cannot select that row), which would hide a
// missing insert policy behind the select policy.
async function insertDiary(t: string, row: Record<string, unknown>, minimal = false) {
  const r = await fetch(`${URL_}/rest/v1/diary_entries`, { method: "POST", headers: H(t, { prefer: minimal ? "return=minimal" : "return=representation" }), body: JSON.stringify(row) });
  const j = await r.json().catch(() => null);
  return { status: r.status, code: j?.code as string | undefined, row: Array.isArray(j) ? j[0] : null };
}

let failed = 0;
const check = (name: string, got: string, want: string) => {
  const ok = got === want;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}  got=${got} want=${want}`);
};
const call = async (t: string, fn: string, body: unknown) => {
  const r = await fetch(`${URL_}/functions/v1/healthapp-${fn}`, { method: "POST", headers: { apikey: ANON, authorization: `Bearer ${t}`, "x-healthapp-env": "dev", "content-type": "application/json" }, body: JSON.stringify(body) });
  return { status: r.status, code: (await r.json().catch(() => null))?.error?.code as string | undefined };
};

// C1: the diary is a direct insert with exactly {text, severity, occurred_at}, as the app sends it.
const hourAgo = new Date(Date.now() - 3600_000).toISOString();
const own = await insertDiary(P, { text: "check: headache", severity: 4, occurred_at: hourAgo });
check("C1 patient inserts {text, severity, occurred_at} under RLS", String(own.status), "201");
check("C1 patient_id defaults to the caller", own.row?.patient_id ?? "none", PATIENT);
check("C1 recorded_at is the server's now, not the client's", String(Math.abs(Date.now() - new Date(own.row?.recorded_at ?? 0).getTime()) < 30_000), "true");
check("C1 a time changed by an hour is marked time_edited", String(own.row?.time_edited), "true");
const plain = await insertDiary(P, { text: "check: now", severity: 2 });
check("C1 no occurred_at: now, and not marked edited", `${plain.status} ${plain.row?.time_edited}`, "201 false");
check("C1 the patient reads their own entries", String(Number(await count(P, "diary_entries")) >= 2), "true");

// C2: what a patient must not do or see.
check("C2 patient inserts a diary entry for another person: refused", JSON.stringify(await insertDiary(P, { patient_id: DOCTOR, text: "x", severity: 3 }, true).then((r) => [r.status, r.code])), '[403,"42501"]');
check("C2 patient sends recorded_at: refused", JSON.stringify(await insertDiary(P, { text: "x", severity: 3, recorded_at: "2020-01-01T00:00:00Z" }, true).then((r) => [r.status, r.code])), '[403,"42501"]');
check("C2 patient reads 0 rows of assistant turns", await count(P, "assistant_turns"), "0");
check("C2 patient reads nothing of tokens or rate events", `${await count(P, "handshake_tokens", "", "jti")} | ${await count(P, "rate_events")}`, "HTTP 403 42501 | HTTP 403 42501");
const asst = await call(P, "assistant", { grant_id: "00000000-0000-4000-8000-000000000000", mode: "ask", question: "x" });
check("C2 patient calls healthapp-assistant: 403 wrong_role", `${asst.status} ${asst.code}`, "403 wrong_role");

// N1: a doctor with no grant gets nothing, and never the match keys.
for (const t of ["documents", "results", "findings", "diary_entries"]) check(`N1 doctor without a grant reads 0 rows of ${t}`, await count(D, t, `&patient_id=eq.${PATIENT}`), "0");
check("N1 doctor without a grant cannot see the patient's profile", await count(D, "profiles", `&id=eq.${PATIENT}`), "0");
check("N1 doctor inserts a diary entry: refused", JSON.stringify(await insertDiary(D, { patient_id: DOCTOR, text: "x", severity: 3 }, true).then((r) => [r.status, r.code])), '[403,"42501"]');
check("N1 doctor asks for national_id_norm: 403 42501 (column not granted)", await (async () => {
  const r = await fetch(`${URL_}/rest/v1/profiles?select=national_id_norm`, { headers: H(D) });
  return `${r.status} ${(await r.json()).code}`;
})(), "403 42501");
check("N1 the assistant answers a doctor without a grant with 403", await (async () => {
  const r = await call(D, "assistant", { grant_id: "00000000-0000-4000-8000-000000000000", mode: "ask", question: "x" });
  return String(r.status);
})(), "403");

console.log(failed === 0 ? "ALL PASS" : `${failed} FAILED`);
Deno.exit(failed === 0 ? 0 : 1);
