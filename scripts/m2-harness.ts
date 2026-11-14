// deno-lint-ignore-file no-explicit-any
// The M2 harness (MIN-4475): one command runs the synthetic set through the deployed functions
// (doc-create -> upload -> extract-exam) as the synthetic patient and prints, per document, the time,
// the outcome, fields correct / fields, and name, ID and date. Counts, times and field names only:
// no extracted value is printed. Optional `--checks` adds the access checks and a confirm round trip.
//
//   HEALTHAPP_PERSONA_PASSWORD=... SUPABASE_ANON_KEY=... \
//   deno run --allow-env --allow-net --allow-read scripts/m2-harness.ts [--docs 1,2,3] [--checks] [--env dev]
//
// Works against dev only (synthetic data). SUPABASE_URL defaults to the conductor project.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { type DraftOut, type Gt, score } from "./m2/score.ts";

const args = Deno.args;
const flag = (n: string) => args.includes(`--${n}`);
const opt = (n: string) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const ENV = opt("env") ?? "dev";
if (ENV !== "dev") throw new Error("the harness runs on dev (synthetic data) only");
const URL_ = Deno.env.get("SUPABASE_URL") ?? "https://fnbnhvgrnkrbsrwhgcgc.supabase.co";
const ANON = Deno.env.get("SUPABASE_ANON_KEY");
const PASSWORD = Deno.env.get("HEALTHAPP_PERSONA_PASSWORD");
if (!ANON || !PASSWORD) throw new Error("SUPABASE_ANON_KEY and HEALTHAPP_PERSONA_PASSWORD are required");

const root = new URL("../tests/synthetic/", import.meta.url);
const gt = JSON.parse(Deno.readTextFileSync(new URL("ground-truth.json", root))).documents as Gt[];
const wanted = opt("docs")?.split(",").map(Number);

async function signIn(persona: string): Promise<string> {
  const r = await fetch(`${URL_}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: ANON!, "content-type": "application/json" },
    body: JSON.stringify({ email: `${persona}.${ENV}@healthapp.invalid`, password: PASSWORD }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`sign-in failed for ${persona}: ${r.status}`);
  return j.access_token;
}

async function fn(name: string, body: unknown, token: string | null) {
  const headers: Record<string, string> = { apikey: ANON!, "content-type": "application/json", "x-healthapp-env": ENV };
  if (token) headers.authorization = `Bearer ${token}`;
  const t0 = performance.now();
  const r = await fetch(`${URL_}/functions/v1/healthapp-${name}`, { method: "POST", headers, body: JSON.stringify(body) });
  const ms = Math.round(performance.now() - t0);
  let json: any = null;
  const raw = await r.text();
  try { json = JSON.parse(raw); } catch { /* not JSON */ }
  return { status: r.status, json, ms, raw: r.status === 200 ? "" : raw.slice(0, 200) };
}

const storage = createClient(URL_, ANON, { auth: { persistSession: false } });
const patient = await signIn("patient");

async function upload(g: Gt): Promise<{ doc_id: string } | null> {
  const bytes = await Deno.readFile(new URL(`docs/${g.file}`, root));
  const c = await fn("doc-create", { content_type: "image/jpeg", size_bytes: bytes.length }, patient);
  if (c.status !== 200) { console.log(`doc ${g.n}: doc-create ${c.status}`); return null; }
  const { error } = await storage.storage.from(c.json.bucket).uploadToSignedUrl(c.json.path, c.json.token, new Blob([bytes], { type: "image/jpeg" }), { contentType: "image/jpeg" });
  if (error) { console.log(`doc ${g.n}: upload failed`); return null; }
  return { doc_id: c.json.doc_id };
}

const rows: string[] = [];
let correct = 0, total = 0, identityBad = 0, nameBad = 0, idBad = 0, idFolded = 0, dateBad = 0, refusalsOk = 0, refusalsExpected = 0;
const times: number[] = [];
const draftIds: Record<number, string> = {};
const drafts: Record<number, any> = {};
const wrongBy: string[] = [];

for (const g of gt) {
  if (wanted && !wanted.includes(g.n)) continue;
  const up = await upload(g);
  if (!up) { rows.push(`${String(g.n).padStart(2)}  upload failed`); continue; }
  const r = await fn("extract-exam", { doc_id: up.doc_id }, patient);
  times.push(r.ms);
  const t = `${(r.ms / 1000).toFixed(1)} s`;
  if (r.status !== 200) { rows.push(`${String(g.n).padStart(2)}  http ${r.status} ${r.json?.error?.code ?? ""} ${r.json?.error?.message ?? r.raw}  ${t}`); continue; }
  if (g.expected.outcome === "refused") {
    refusalsExpected++;
    const got = r.json.outcome === "refused" ? r.json.reason : r.json.outcome;
    // B1: a mismatch refusal carries the two values that differ
    const mm = r.json.outcome === "refused" && (got === "name_mismatch" || got === "id_mismatch")
      ? !!(r.json.mismatch?.printed && r.json.mismatch?.profile) : true;
    const ok = got === g.expected.reason && mm;
    // "leaves no record": the document must be gone, so its photo link is 404
    const gone = (await fn("doc-photo", { doc_id: up.doc_id }, patient)).status === 404;
    if (ok && gone) refusalsOk++;
    rows.push(`${String(g.n).padStart(2)}  refused:${got}  expected ${g.expected.reason}  no record: ${gone ? "yes" : "NO"}  ${t}  ${ok && gone ? "PASS" : "FAIL"}`);
    continue;
  }
  if (r.json.outcome !== "draft") { rows.push(`${String(g.n).padStart(2)}  refused:${r.json.reason}  expected a draft  ${t}  FAIL`); total += 1; continue; }
  const d = r.json.draft;
  draftIds[g.n] = up.doc_id;
  drafts[g.n] = d;
  const out: DraftOut = { document: d.document, printed_name: d.printed_name, printed_id: d.printed_id, results: d.results, findings: d.findings };
  const s = score(g, out);
  correct += s.correct; total += s.total;
  const wantIdentity = (g.expected as { identity?: string }).identity;
  if (wantIdentity && d.document.identity_status !== wantIdentity) { identityBad++; wrongBy.push(`doc ${g.n}: identity_status`); }
  if (d.document.provenance !== "uploaded_by_patient") { identityBad++; wrongBy.push(`doc ${g.n}: provenance`); }
  if (!s.nameOk) nameBad++;
  if (!s.idOk) idBad++;
  else if (!s.idExact) idFolded++;
  if (!s.dateOk) dateBad++;
  for (const w of s.wrong) wrongBy.push(`doc ${g.n}: ${w}`);
  rows.push(`${String(g.n).padStart(2)}  draft  ${String(s.correct).padStart(3)}/${String(s.total).padEnd(3)} ${(100 * s.correct / s.total).toFixed(0).padStart(3)}%  name ${s.nameOk ? "ok" : "WRONG"}  id ${s.idOk ? (s.idExact ? "ok" : "ok*") : "WRONG"}  date ${s.dateOk ? "ok" : "WRONG"}  ${t}`);
}

console.log(`M2 harness · env ${ENV} · contract-shaped calls to healthapp-doc-create / -extract-exam`);
console.log(" #  outcome   fields           name   id   date   time");
for (const r of rows) console.log(r);
console.log("");
if (total) console.log(`fields correct: ${correct}/${total} = ${(100 * correct / total).toFixed(1)}%   (target >= 90%)`);
console.log(`name wrong: ${nameBad}   id wrong: ${idBad}   exam date wrong: ${dateBad}   (target 0 each)`);
if (idFolded) console.log(`ok* = ${idFolded} ID(s) printed with Greek lookalike letters, equal after normalizeId() (B1 must compare with it)`);
console.log(`identity_status / provenance wrong on drafts: ${identityBad}   (target 0)`);
console.log(`refusals as expected: ${refusalsOk}/${refusalsExpected}`);
times.sort((a, b) => a - b);
if (times.length) console.log(`extract-exam ms: min ${times[0]}  median ${times[Math.floor(times.length / 2)]}  max ${times.at(-1)}  (30 s target, 60 s limit)`);
if (wrongBy.length) { console.log("\nwrong fields (names only):"); for (const w of wrongBy) console.log(`  ${w.replace(/ [!=]= .*$/, "")}`); }

if (flag("checks")) await checks();

async function checks() {
  console.log("\nAccess and confirm checks");
  const first = draftIds[wanted ? wanted[0] : 1] ?? Object.values(draftIds)[0];
  if (!first) { console.log("  no draft to check against"); return; }
  const p2 = await signIn("patient2"), doc = await signIn("doctor"), outsider = await signIn("outsider");
  const line = (what: string, status: number, code?: string) => console.log(`  ${what.padEnd(58)} ${status}${code ? " " + code : ""}`);
  let r = await fn("confirm-doc", { doc_id: first, printed_name: "SOMEONE ELSE" }, patient);
  line("confirm-doc editing the name (own document)", r.status, r.json?.error?.code);
  r = await fn("confirm-doc", { doc_id: first, printed_id: "ZZ000000" }, patient);
  line("confirm-doc editing the ID (own document)", r.status, r.json?.error?.code);
  r = await fn("doc-photo", { doc_id: first }, p2);
  line("patient 2 reads patient 1's photo link", r.status, r.json?.error?.code);
  r = await fn("confirm-doc", { doc_id: first }, p2);
  line("patient 2 confirms patient 1's document", r.status, r.json?.error?.code);
  r = await fn("extract-exam", { doc_id: first }, p2);
  line("patient 2 extracts patient 1's document", r.status, r.json?.error?.code);
  r = await fn("doc-create", { content_type: "image/jpeg", size_bytes: 10 }, doc);
  line("a doctor creates a document", r.status, r.json?.error?.code);
  r = await fn("doc-create", { content_type: "image/jpeg", size_bytes: 10 }, outsider);
  line("signed in with no profile creates a document", r.status, r.json?.error?.code);
  r = await fn("doc-create", { content_type: "image/jpeg", size_bytes: 10 }, null);
  line("no session creates a document", r.status, r.json?.error?.code);
  r = await fn("doc-photo", { doc_id: first, grant_id: crypto.randomUUID() }, doc);
  line("a doctor with no grant opens the photo", r.status, r.json?.error?.code);

  // a real confirm with one edit, then the photo link opens an image
  const st = await fn("confirm-doc", { doc_id: first, results: [] }, patient);
  line("confirm-doc, no edits (own document)", st.status);
  if (st.status === 200) {
    console.log(`  record hash length ${st.json.sha256_record.length}, status ${st.json.document.status}, edited marks ${st.json.results.filter((x: any) => x.edited_by_patient).length}`);
    const again = await fn("confirm-doc", { doc_id: first }, patient);
    line("confirm-doc a second time (safe, same hash)", again.status, again.json?.sha256_record === st.json.sha256_record ? "same hash" : "DIFFERENT HASH");
  }
  // edits on a second draft: marked, flag recomputed from the printed range, hash changes
  const second = Object.keys(draftIds).map(Number).find((n) => draftIds[n] !== first);
  if (second) {
    const d = drafts[second];
    const crp = d.results.find((x: any) => x.analyte_key === "crp");
    const e = await fn("confirm-doc", { doc_id: draftIds[second], exam_date: d.document.exam_date, results: crp ? [{ id: crp.id, value_num: 3.1 }, { id: d.results[1].id, unit: d.results[1].unit }] : [] }, patient);
    line(`confirm-doc with a CRP edit (doc ${second}) -> 200`, e.status);
    if (e.status === 200 && crp) {
      const c = e.json.results.find((x: any) => x.id === crp.id);
      console.log(`  edited CRP: value ${c.value_num}, flag ${c.flag} (was ${crp.flag}), edited_by_patient ${c.edited_by_patient}; marks on other rows: ${e.json.results.filter((x: any) => x.edited_by_patient && x.id !== crp.id).length}`);
    }
  }
  const grant = opt("grant");
  const ph = await fn("doc-photo", { doc_id: first }, patient);
  if (ph.status === 200) {
    const img = await fetch(ph.json.signed_url);
    const ct = img.headers.get("content-type");
    await img.body?.cancel();
    line(`doc-photo link -> fetch (${ct}), expires_at in ${Math.round((Date.parse(ph.json.expires_at) - Date.now()) / 1000)} s`, img.status);
  } else line("doc-photo (own document)", ph.status, ph.json?.error?.code);
  if (grant) {
    const g = await fn("doc-photo", { doc_id: first, grant_id: grant }, doc);
    line("a doctor in a live grant opens the confirmed photo", g.status, g.json?.error?.code);
    if (g.status === 200) console.log(`  link expires in ${Math.round((Date.parse(g.json.expires_at) - Date.now()) / 1000)} s (60 s, never past the grant)`);
    const dr = await fn("doc-photo", { doc_id: Object.values(draftIds).find((x) => x !== first && x !== draftIds[second ?? 0]) ?? first, grant_id: grant }, doc);
    line("the same doctor opens a draft (never confirmed)", dr.status, dr.json?.error?.code);
  }
}
