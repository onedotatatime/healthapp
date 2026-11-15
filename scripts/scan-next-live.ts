// deno-lint-ignore-file no-explicit-any
// Live check of the scan-next flow on dev with the SYNTHETIC set (MIN-4556): N uploads in a row, each one
// doc-create -> signed upload -> the kick (keepalive-style, the answer is not waited for), then the list is polled
// like the phone would until nothing is queued or reading. Prints codes, statuses and timings only: no value, no name.
//
//   HEALTHAPP_DEMO_PASSCODE=... SUPABASE_ANON_KEY=... \
//   deno run -A scripts/scan-next-live.ts [--docs 1,2,6,7,8,11] [--create doc-create-t] [--extract extract-exam-t]
//                                          [--list my-exams-t] [--unconfirm unconfirm-doc-t]
// MIN-4555 addendum: a reading that passes identity ends `confirmed` and `unchecked` (no tap); opening one clears the mark;
// unconfirm takes it back to `draft`; a doctor cannot unconfirm; the existing confirm saves it again.
//
// Dev only, persona `patient` through healthapp-demo-login. Never run it on demo.
import { createClient } from "jsr:@supabase/supabase-js@2";

const args = Deno.args;
const opt = (n: string, d: string) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const URL_ = Deno.env.get("SUPABASE_URL") ?? "https://fnbnhvgrnkrbsrwhgcgc.supabase.co";
const ANON = Deno.env.get("SUPABASE_ANON_KEY");
const PASS = Deno.env.get("HEALTHAPP_DEMO_PASSCODE");
if (!ANON || !PASS) throw new Error("SUPABASE_ANON_KEY and HEALTHAPP_DEMO_PASSCODE are required");
const CREATE = opt("create", "doc-create"), EXTRACT = opt("extract", "extract-exam");
const LIST = opt("list", "my-exams"), UNCONFIRM = opt("unconfirm", "unconfirm-doc");
const wanted = opt("docs", "1,2,6,7,8").split(",").map(Number);
const root = new URL("../tests/synthetic/", import.meta.url);
const gt = JSON.parse(Deno.readTextFileSync(new URL("ground-truth.json", root))).documents as { n: number; file: string; expected: any }[];

const H = (token?: string) => ({ apikey: ANON!, "content-type": "application/json", "x-healthapp-env": "dev", ...(token ? { authorization: `Bearer ${token}` } : {}) });
async function fn(name: string, body: unknown, token?: string) {
  const t0 = performance.now();
  const r = await fetch(`${URL_}/functions/v1/healthapp-${name}`, { method: "POST", headers: H(token), body: JSON.stringify(body) });
  const ms = Math.round(performance.now() - t0);
  const text = await r.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { /* not JSON */ }
  return { status: r.status, json, ms };
}

const login = await fn("demo-login", { persona: "patient", passcode: PASS });
const token: string | undefined = login.json?.access_token ?? login.json?.session?.access_token;
if (login.status !== 200 || !token) throw new Error(`sign-in failed: ${login.status}`);
const storage = createClient(URL_, ANON, { auth: { persistSession: false } });

const kicked: { n: number; id: string; kickMs: number; kickStatus: number; saved: number; t0: number }[] = [];
for (const n of wanted) {
  const g = gt.find((x) => x.n === n)!;
  const bytes = await Deno.readFile(new URL(`docs/${g.file}`, root));
  const t0 = performance.now();
  const c = await fn(CREATE, { content_type: "image/jpeg", size_bytes: bytes.length }, token);
  if (c.status !== 200) throw new Error(`doc ${n}: create ${c.status}`);
  const { error } = await storage.storage.from(c.json.bucket).uploadToSignedUrl(c.json.path, c.json.token, new Blob([bytes], { type: "image/jpeg" }), { contentType: "image/jpeg" });
  if (error) throw new Error(`doc ${n}: upload failed`);
  const saved = Math.round(performance.now() - t0); // "Saved. Scan the next one" appears here
  const k = await fn(EXTRACT, { doc_id: c.json.doc_id }, token);
  kicked.push({ n, id: c.json.doc_id, kickMs: k.ms, kickStatus: k.status, saved, t0 });
  console.log(`doc ${String(n).padStart(2)}  upload saved in ${saved} ms, kick ${k.status} ${JSON.stringify(k.json)} in ${k.ms} ms`);
}

const started = performance.now();
const final: Record<string, any> = {};
let polls = 0;
while (performance.now() - started < 200_000) {
  const l = await fn(LIST, {}, token);
  polls++;
  const rows: any[] = l.json.exams.filter((r: any) => kicked.some((k) => k.id === r.id));
  for (const r of rows) if (!["queued", "reading"].includes(r.status) && !final[r.id]) final[r.id] = { ...r, afterKickS: Math.round((performance.now() - kicked[0].t0) / 1000) };
  if (rows.length === kicked.length && rows.every((r) => !["queued", "reading"].includes(r.status))) break;
  await new Promise((r) => setTimeout(r, 4000));
}
console.log(`polled ${polls} times, ${Math.round((performance.now() - started) / 1000)} s after the last kick`);
let ok = 0;
for (const k of kicked) {
  const r = final[k.id];
  const g = gt.find((x) => x.n === k.n)!;
  const want = g.expected.outcome === "draft" ? "confirmed" : "refused";
  const good = r?.status === want && (want === "refused" ? r.reason === g.expected.reason : r.unchecked === true);
  if (good) ok++;
  console.log(`doc ${String(k.n).padStart(2)}  expected ${want}${g.expected.reason ? "/" + g.expected.reason : ""}${g.expected.identity ? " (" + g.expected.identity + ")" : ""}  got ${r?.status ?? "NOT FINAL"}${r?.reason ? "/" + r.reason : ""}  values_read=${r?.values_read ?? "-"}  unchecked=${r?.unchecked}  can_retry=${r?.can_retry}  ${good ? "ok" : "FAIL"}`);
}
console.log(`${ok}/${kicked.length} reached the expected final status; kicks all 202: ${kicked.every((k) => k.kickStatus === 202)}; slowest kick ${Math.max(...kicked.map((k) => k.kickMs))} ms`);
console.log(`ids: ${kicked.map((k) => k.id).join(",")}`);

// --- the addendum's controls, on the first saved exam -------------------------------------------------------------
const saved = kicked.filter((k) => final[k.id]?.status === "confirmed");
let extra = 0, extraOk = 0;
const check = (what: string, good: boolean) => { extra++; if (good) extraOk++; console.log(`${good ? "ok  " : "FAIL"}  ${what}`); };
const rowOf = async (id: string) => (await fn(LIST, {}, token)).json.exams.find((r: any) => r.id === id);
if (saved.length > 0) {
  const a = saved[0];
  const before = await rowOf(a.id);
  const open = await fn(LIST, { doc_id: a.id }, token);
  check(`open a saved exam: 200, same shape as a draft, status confirmed, mark false (was unchecked=${before?.unchecked})`,
    open.status === 200 && open.json?.draft?.document?.status === "confirmed" && open.json?.draft?.document?.unchecked === false && Array.isArray(open.json?.draft?.results));
  const after = await rowOf(a.id);
  const others = await Promise.all(saved.slice(1).map((k) => rowOf(k.id)));
  check(`the list shows the opened exam as not unchecked and the other ${others.length} saved exam(s) still unchecked`, after?.unchecked === false && others.every((r: any) => r?.unchecked === true));
  const doc = await fn("demo-login", { persona: "doctor", passcode: PASS });
  const dtoken = doc.json?.access_token ?? doc.json?.session?.access_token;
  const dr = dtoken ? await fn(UNCONFIRM, { doc_id: a.id }, dtoken) : { status: 0 };
  check(`a doctor cannot unconfirm: ${dr.status}`, dr.status === 403);
  const un = await fn(UNCONFIRM, { doc_id: a.id }, token);
  check(`owner unconfirm: ${un.status}, status ${un.json?.document?.status}, confirmed_at ${un.json?.document?.confirmed_at}`, un.status === 200 && un.json?.document?.status === "draft" && un.json?.document?.confirmed_at === null && un.json?.document?.unchecked === false);
  const asDraft = await rowOf(a.id);
  check(`the list shows it as draft with its ${asDraft?.values_read} values kept`, asDraft?.status === "draft" && asDraft?.values_read > 0 && asDraft?.unchecked === false);
  const again = await fn(UNCONFIRM, { doc_id: a.id }, token);
  check(`unconfirm a draft: ${again.status}`, again.status === 404);
  const re = await fn("confirm-doc", { doc_id: a.id }, token);
  const back = await rowOf(a.id);
  check(`confirm again (the existing confirm): ${re.status}, row ${back?.status}, unchecked ${back?.unchecked}`, re.status === 200 && back?.status === "confirmed" && back?.unchecked === false);
}
console.log(`${extraOk}/${extra} addendum controls ok`);
if (ok !== kicked.length || extraOk !== extra) Deno.exit(1);
