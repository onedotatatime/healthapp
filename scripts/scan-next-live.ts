// deno-lint-ignore-file no-explicit-any
// Live check of the scan-next flow on dev with the SYNTHETIC set (MIN-4556): N uploads in a row, each one
// doc-create -> signed upload -> the kick (keepalive-style, the answer is not waited for), then the list is polled
// like the phone would until nothing is queued or reading. Prints codes, statuses and timings only: no value, no name.
//
//   HEALTHAPP_DEMO_PASSCODE=... SUPABASE_ANON_KEY=... \
//   deno run -A scripts/scan-next-live.ts [--docs 1,2,6,7,8] [--create doc-create-t] [--extract extract-exam-t]
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
  const l = await fn("my-exams", {}, token);
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
  const want = g.expected.outcome === "draft" ? "draft" : "refused";
  const good = r?.status === want && (want === "draft" || r.reason === g.expected.reason);
  if (good) ok++;
  console.log(`doc ${String(k.n).padStart(2)}  expected ${want}${g.expected.reason ? "/" + g.expected.reason : ""}  got ${r?.status ?? "NOT FINAL"}${r?.reason ? "/" + r.reason : ""}  values_read=${r?.values_read ?? "-"}  can_retry=${r?.can_retry}  ${good ? "ok" : "FAIL"}`);
}
console.log(`${ok}/${kicked.length} reached the expected final status; kicks all 202: ${kicked.every((k) => k.kickStatus === 202)}; slowest kick ${Math.max(...kicked.map((k) => k.kickMs))} ms`);
console.log(`ids: ${kicked.map((k) => k.id).join(",")}`);
if (ok !== kicked.length) Deno.exit(1);
