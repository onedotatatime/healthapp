// Live check of the handshake and grant functions with real session tokens (MIN-4484), schema
// healthapp_dev only. Signs in three throwaway QA users (supabase/sql/checks/qa_users_setup.sql) through
// GoTrue, calls the deployed functions, and prints one line per check with its timing. Realtime: both
// parties and a second doctor subscribe to postgres_changes on grants; the second doctor must hear nothing.
// The doctor's RLS reads between the steps are done by hand in SQL at the marked PAUSEs (the Data API
// does not expose healthapp_dev yet), or by this script over REST once it does (it tries, and says so).
//
//   SUPABASE_URL=... SUPABASE_ANON_KEY=... HS_PASSWORD=... HS_GATE=<file> deno run --node-modules-dir=none \
//     --allow-env --allow-net --allow-read scripts/handshake-live.ts
// A PAUSE waits until the file HS_GATE exists, then deletes it. Prints no token and no password.
import { createClient } from "jsr:@supabase/supabase-js@2";

const URL_ = Deno.env.get("SUPABASE_URL")!, ANON = Deno.env.get("SUPABASE_ANON_KEY")!, PW = Deno.env.get("HS_PASSWORD")!;
const GATE = Deno.env.get("HS_GATE") ?? "";
if (!URL_ || !ANON || !PW) throw new Error("SUPABASE_URL, SUPABASE_ANON_KEY and HS_PASSWORD are required");
const ENV = "dev";

// deno-lint-ignore no-explicit-any
type Who = { name: string; token: string; client: any };
async function login(name: string): Promise<Who> {
  const client = createClient(URL_, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.signInWithPassword({ email: `qa-${name}.dev@healthapp.invalid`, password: PW });
  if (error || !data.session) throw new Error(`sign-in failed for ${name}: ${error?.message}`);
  return { name, token: data.session.access_token, client };
}

// deno-lint-ignore no-explicit-any
async function call(who: Who, fn: string, body: unknown): Promise<{ status: number; ms: number; json: any }> {
  const t0 = performance.now();
  const r = await fetch(`${URL_}/functions/v1/healthapp-${fn}`, {
    method: "POST",
    headers: { apikey: ANON, authorization: `Bearer ${who.token}`, "x-healthapp-env": ENV, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const ms = Math.round(performance.now() - t0);
  let json: unknown = null;
  try {
    json = await r.json();
  } catch { /* empty */ }
  return { status: r.status, ms, json };
}

let failed = 0;
function check(name: string, ok: boolean, detail = "") {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? "  " + detail : ""}`);
}
const code = (r: { json: { error?: { code?: string } } | null }) => r.json?.error?.code;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function pause(label: string) {
  if (!GATE) {
    console.log(`PAUSE ${label}: skipped (no HS_GATE)`);
    return;
  }
  console.log(`PAUSE ${label}: waiting for ${GATE}`);
  for (let i = 0; i < 600; i++) {
    try {
      await Deno.stat(GATE);
      await Deno.remove(GATE);
      return;
    } catch { /* not yet */ }
    await sleep(500);
  }
  throw new Error(`pause ${label} timed out`);
}

// Realtime listeners: who heard which transition, and when.
const heard: { who: string; type: string; status: string; at: number }[] = [];
function listen(w: Who) {
  return new Promise<void>((resolve, reject) => {
    w.client.channel(`g-${w.name}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: `healthapp_${ENV}`, table: "grants" }, (p) => {
        // deno-lint-ignore no-explicit-any
        heard.push({ who: w.name, type: p.eventType, status: (p.new as any)?.status, at: performance.now() });
      })
      .subscribe((s, err) => {
        if (s === "SUBSCRIBED") resolve();
        if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") reject(new Error(`realtime ${w.name}: ${s} ${err?.message ?? ""}`));
      });
  });
}
async function heardWithin(who: string, status: string, since: number, ms = 4000) {
  const end = performance.now() + ms;
  while (performance.now() < end) {
    const h = heard.find((x) => x.who === who && x.status === status && x.at >= since);
    if (h) return Math.round(h.at - since);
    await sleep(25);
  }
  return null;
}

const P = await login("patient"), D1 = await login("doctor"), D2 = await login("doctor2");
let realtime = true;
try {
  await Promise.all([listen(P), listen(D1), listen(D2)]);
} catch (e) {
  realtime = false;
  console.log(`REALTIME unavailable: ${(e as Error).message}`);
}

async function rest(who: Who, table: string): Promise<string> {
  const r = await fetch(`${URL_}/rest/v1/${table}?select=id`, {
    headers: { apikey: ANON, authorization: `Bearer ${who.token}`, "accept-profile": `healthapp_${ENV}`, prefer: "count=exact", range: "0-0" },
  });
  if (r.status === 406) return "406 (schema not exposed in the Data API yet)";
  return (r.headers.get("content-range") ?? "").split("/")[1] ?? String(r.status);
}

// ---- grant A: claim, wrong claims, approve, doctor reads, revoke --------------------------------
const mk = await call(P, "handshake-create", {});
check("create: 200, hs1 token, 8-char code, 120 s", mk.status === 200 && /^hs1\.[\w-]{22}$/.test(mk.json.token) && /^[2-9A-HJ-KM-NP-Z]{8}$/.test(mk.json.short_code) &&
  Math.abs(new Date(mk.json.expires_at).getTime() - new Date(mk.json.server_now).getTime() - 120000) < 2000, `${mk.ms} ms`);
console.log(`     create ${mk.ms} ms`);

const t0 = performance.now();
const cl = await call(D1, "handshake-claim", { token: mk.json.token });
const g = cl.json?.grant;
check("claim by token: 200, a pending grant, patient and doctor parties filled", cl.status === 200 && g?.status === "pending" && g.doctor.specialty === "Cardiology" && g.patient.full_name === "QA Patient" &&
  g.approved_at === null, `${cl.ms} ms`);
const pendingLapse = (new Date(g.expires_at).getTime() - new Date(cl.json.server_now).getTime()) / 1000;
check("pending expires_at is the request lapse (about 120 s)", pendingLapse > 100 && pendingLapse <= 121, `${pendingLapse.toFixed(0)} s`);
if (realtime) {
  const ms = await heardWithin("patient", "pending", t0 - 50);
  check("realtime: the patient hears the new pending grant", ms !== null, `${ms} ms after the request started`);
}
const again = await call(D1, "handshake-claim", { token: mk.json.token });
check("same token twice: 409 token_used, no second grant", again.status === 409 && code(again) === "token_used");
const second = await call(D2, "handshake-claim", { token: mk.json.token });
check("a second doctor with the used token: 409 token_used", second.status === 409 && code(second) === "token_used");
const bad = await call(D1, "handshake-claim", { token: "hs1.AAAAAAAAAAAAAAAAAAAAAA" });
check("a well-formed token that does not exist: 404 token_invalid", bad.status === 404 && code(bad) === "token_invalid");
const badCode = await call(D1, "handshake-claim", { short_code: "ZZZZZZZZ" });
check("a code that does not exist: 404 token_invalid", badCode.status === 404 && code(badCode) === "token_invalid");
const noGrantId = await call(D1, "grant-status", {});
check("failed claims created no grant: D1's open grant is still the one", noGrantId.json?.grant?.grant_id === g.grant_id);
const peek = await call(D2, "grant-status", { grant_id: g.grant_id });
check("a second doctor cannot read the first doctor's grant: 404", peek.status === 404 && code(peek) === "not_found");
const peekNone = await call(D2, "grant-status", {});
check("second doctor, no grant_id: grant null", peekNone.status === 200 && peekNone.json.grant === null);
const dDec = await call(D1, "grant-decide", { grant_id: g.grant_id, approve: true });
check("a doctor cannot approve: 403 wrong_role", dDec.status === 403 && code(dDec) === "wrong_role");
const otherDec = await call(P, "grant-decide", { grant_id: "00000000-0000-4000-8000-000000000000", approve: true });
check("deciding a grant that is not yours: 404 not_found", otherDec.status === 404 && code(otherDec) === "not_found");
const ps = await call(P, "grant-status", {});
check("patient status without id: the pending grant, doctor named", ps.json?.grant?.status === "pending" && ps.json.grant.doctor.full_name === "QA Doctor One", `${ps.ms} ms`);

const tA = performance.now();
const ap = await call(P, "grant-decide", { grant_id: g.grant_id, approve: true });
const life = ap.json?.grant ? (new Date(ap.json.grant.expires_at).getTime() - new Date(ap.json.grant.approved_at).getTime()) / 1000 : -1;
check("approve: 200, active, the length is the server's 900 s", ap.status === 200 && ap.json.grant.status === "active" && life === 900, `${ap.ms} ms, ${life} s`);
if (realtime) {
  const ms = await heardWithin("doctor", "active", tA - 50);
  check("realtime: the doctor hears the approval", ms !== null, `${ms} ms`);
}
const ds = await call(D1, "grant-status", { grant_id: g.grant_id });
check("doctor status: active", ds.json?.grant?.status === "active", `${ds.ms} ms`);
console.log(`     doctor REST reads while active: documents=${await rest(D1, "documents")} results=${await rest(D1, "results")} findings=${await rest(D1, "findings")} diary=${await rest(D1, "diary_entries")}`);
await pause("A: grant is ACTIVE. Read as the doctor in SQL: expect 1/1/1/1");

const tR = performance.now();
const rv = await call(P, "grant-revoke", { grant_id: g.grant_id });
check("revoke: 200, revoked, revoked_at set", rv.status === 200 && rv.json.grant.status === "revoked" && !!rv.json.grant.revoked_at, `${rv.ms} ms`);
if (realtime) {
  const ms = await heardWithin("doctor", "revoked", tR - 50);
  check("realtime: the doctor hears the revoke", ms !== null, `${ms} ms`);
}
const rv2 = await call(P, "grant-revoke", { grant_id: g.grant_id });
check("revoke again: idempotent 200", rv2.status === 200 && rv2.json.grant.status === "revoked");
const dsr = await call(D1, "grant-status", { grant_id: g.grant_id });
check("doctor status after revoke: revoked", dsr.json?.grant?.status === "revoked");
const dsn = await call(D1, "grant-status", {});
check("doctor status without id after revoke: null", dsn.json?.grant === null);
const reDecide = await call(P, "grant-decide", { grant_id: g.grant_id, approve: true });
check("approve after revoke: 403 grant_expired", reDecide.status === 403 && code(reDecide) === "grant_expired");
console.log(`     doctor REST reads after revoke: documents=${await rest(D1, "documents")} results=${await rest(D1, "results")}`);
await pause("B: grant is REVOKED. Read as the doctor in SQL: expect 0/0/0/0");

// ---- grant B: refuse ------------------------------------------------------------------------------
const mkB = await call(P, "handshake-create", {});
const clB = await call(D1, "handshake-claim", { short_code: mkB.json.short_code.toLowerCase().replace(/^(.{4})/, "$1 ") });
check("typed code in lower case with a space is accepted", clB.status === 200 && clB.json.grant.status === "pending");
const rf = await call(P, "grant-decide", { grant_id: clB.json.grant.grant_id, approve: false });
check("refuse: 200, refused", rf.status === 200 && rf.json.grant.status === "refused");
const rfd = await call(D1, "grant-status", { grant_id: clB.json.grant.grant_id });
check("doctor sees refused", rfd.json?.grant?.status === "refused");

// ---- grant C: a pending request that lapses ------------------------------------------------------
const mkC = await call(P, "handshake-create", {});
const clC = await call(D1, "handshake-claim", { token: mkC.json.token });
await pause(`C: pending grant ${clC.json.grant.grant_id.slice(0, 8)} lapses: SQL set expires_at = now() - 1 s where status = 'pending'`);
const lapsedSt = await call(D1, "grant-status", { grant_id: clC.json.grant.grant_id });
check("a lapsed pending request reads as expired", lapsedSt.json?.grant?.status === "expired");
const lapsedDec = await call(P, "grant-decide", { grant_id: clC.json.grant.grant_id, approve: true });
check("approving a lapsed request: 403 grant_expired", lapsedDec.status === 403 && code(lapsedDec) === "grant_expired");

// ---- grant D: a short grant that ends by itself --------------------------------------------------
const mkD = await call(P, "handshake-create", {});
const clD = await call(D1, "handshake-claim", { token: mkD.json.token });
const apD = await call(P, "grant-decide", { grant_id: clD.json.grant.grant_id, approve: true });
check("grant D approved", apD.json?.grant?.status === "active");
await pause("D: SQL set the active grant's expires_at = now() + 30 s, read as the doctor: expect 1/1/1/1");
const endsAt = new Date((await call(P, "grant-status", { grant_id: clD.json.grant.grant_id })).json.grant.expires_at).getTime();
await sleep(Math.max(0, endsAt - Date.now()) + 1500);
const tE = performance.now();
const exp = await call(D1, "grant-status", { grant_id: clD.json.grant.grant_id });
check("after the end time: grant-status says expired", exp.json?.grant?.status === "expired", `${exp.ms} ms`);
if (realtime) {
  const ms = await heardWithin("patient", "expired", tE - 50);
  check("realtime: the patient hears the expiry once somebody asks (lazy write)", ms !== null, `${ms} ms`);
}
const expNone = await call(D1, "grant-status", {});
check("after the end time: no open grant (null)", expNone.json?.grant === null);
const expRv = await call(P, "grant-revoke", { grant_id: clD.json.grant.grant_id });
check("revoking an expired grant: 403 grant_expired", expRv.status === 403 && code(expRv) === "grant_expired");
await pause("E: grant D has ENDED. Read as the doctor in SQL: expect 0/0/0/0");

// ---- the second doctor never heard any of it -----------------------------------------------------
if (realtime) {
  await sleep(500);
  check("realtime: the second doctor heard none of the grants", heard.filter((h) => h.who === "doctor2").length === 0,
    `p=${heard.filter((h) => h.who === "patient").length} d1=${heard.filter((h) => h.who === "doctor").length} d2=${heard.filter((h) => h.who === "doctor2").length} events`);
}

// ---- rate limit: 5 failures a minute per doctor, and not a shared limit -------------------------
let sixth = 0, firstLimited = 0;
for (let i = 1; i <= 8; i++) {
  const r = await call(D2, "handshake-claim", { token: `hs1.${"B".repeat(21)}${i}` });
  if (r.status === 429 && !firstLimited) {
    firstLimited = i;
    sixth = r.status;
  }
}
const mkF = await call(P, "handshake-create", {});
const d1ok = await call(D1, "handshake-claim", { token: mkF.json.token });
check("rate limit: D2 is limited after its failures this minute (429 rate_limited)", sixth === 429, `first 429 on D2's try ${firstLimited} (failures so far in the window included)`);
check("rate limit is per doctor: D1 still claims a valid token", d1ok.status === 200);
const d2valid = await call(D2, "handshake-claim", { token: mkF.json.token });
check("a limited doctor is refused even with a valid unused token", d2valid.status === 429 && code(d2valid) === "rate_limited");

// ---- auth edges ----------------------------------------------------------------------------------
const noAuth = await fetch(`${URL_}/functions/v1/healthapp-grant-status`, { method: "POST", headers: { "x-healthapp-env": ENV, "content-type": "application/json", apikey: ANON }, body: "{}" });
check("no session: 401", noAuth.status === 401);
const pClaim = await call(P, "handshake-claim", { token: mkF.json.token });
check("a patient cannot claim: 403 wrong_role", pClaim.status === 403 && code(pClaim) === "wrong_role");
const dCreate = await call(D1, "handshake-create", {});
check("a doctor cannot create a code: 403 wrong_role", dCreate.status === 403 && code(dCreate) === "wrong_role");

console.log(failed === 0 ? "ALL PASS" : `${failed} FAILED`);
Deno.exit(failed === 0 ? 0 : 1);
