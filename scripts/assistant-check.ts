// Live check of healthapp-assistant's logic against the REAL model (MIN-4487), no database and no deploy:
// the real handler, the real model wrapper, and an in-memory store holding the synthetic Maria record of
// tests/synthetic/ground-truth.json (documents 1 to 5, the same rows as supabase/sql/010_seed_record.sql).
//   HEALTHAPP_GEMINI_API_KEY=... deno run --allow-env --allow-net --allow-read scripts/assistant-check.ts
// Prints, per question: milliseconds, model calls, segments, cites, whether each cite resolves to a row of
// the record, and the text. Synthetic data only. Costs a few model calls.
import { AssistantResponse } from "../supabase/functions/_shared/contract.ts";
import { generateJson } from "../supabase/functions/_shared/model.ts";
import type { PatientRecord } from "../supabase/functions/_shared/assistant.ts";
import { makeHandler } from "../supabase/functions/healthapp-assistant/handler.ts";

const gt = JSON.parse(Deno.readTextFileSync(new URL("../tests/synthetic/ground-truth.json", import.meta.url)));
const KEYS: [string, RegExp][] = [["crp", /crp|c-reactive|αντιδρωσα/], ["esr", /esr|sedimentation|τκε/], ["anti_ccp", /anti-ccp|αντι-ccp/], ["rf", /rheumatoid|ρευματοειδ/]];
const strip = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const keyOf = (a: string) => KEYS.find(([, re]) => re.test(strip(a.toLowerCase())))?.[0] ?? null;
const id = (a: number, n: number) => `5eed0000-0000-4000-80${a}0-${String(n).padStart(12, "0")}`;

const rec: PatientRecord = { results: [], findings: [], diary: [] };
for (const d of gt.documents.slice(0, 5)) {
  d.results.forEach((r: Record<string, unknown>, i: number) =>
    rec.results.push({
      id: id(1, d.n * 100 + i), exam_date: d.exam_date, kind: d.kind, provenance: "uploaded_by_patient",
      analyte: r.analyte as string, analyte_key: keyOf(r.analyte as string), value_num: r.value_num as number, value_text: r.value as string,
      unit: r.unit as string, ref_low: r.ref_low as number | null, ref_high: r.ref_high as number | null, ref_text: r.ref as string,
      flag: r.flag as string, edited_by_patient: false,
    })
  );
  d.findings.forEach((f: Record<string, unknown>, i: number) =>
    rec.findings.push({
      id: id(2, d.n * 100 + i), exam_date: d.exam_date, kind: d.kind, provenance: "uploaded_by_patient", finding_kind: f.kind as string,
      text_original: f.text as string, finding_date: f.date as string, specialty: null, edited_by_patient: false,
    })
  );
}
rec.diary = [
  { id: id(3, 1), day: "2026-11-02", severity: 5, text: "Woke with stiff hands, about 45 minutes before they loosened." },
  { id: id(3, 2), day: "2026-11-06", severity: 6, text: "Right knee ached after the stairs at the metro." },
  { id: id(3, 3), day: "2026-11-10", severity: 4, text: "Hands stiff again in the morning, easier after a warm shower." },
];

const known = new Map<string, string>();
for (const r of rec.results) known.set(`r:${r.id}`, `${r.exam_date} ${r.analyte} ${r.value_num}`);
for (const f of rec.findings) known.set(`f:${f.id}`, `${f.finding_date} ${f.text_original.slice(0, 40)}`);
for (const d of rec.diary) known.set(`d:${d.id}`, `${d.day} severity ${d.severity}`);

const DOCTOR = "33333333-3333-4333-8333-333333333333";
const GRANT = "99999999-9999-4999-8999-999999999999";
const handler = makeHandler({
  auth: { verify: () => Promise.resolve(DOCTOR) },
  store: {
    roleOf: () => Promise.resolve("doctor"),
    grantState: () => Promise.resolve({ patient_id: "x", live: true }),
    record: () => Promise.resolve(rec),
  },
  generate: (call) => generateJson({ ...call, model: Deno.env.get("HEALTHAPP_GEMINI_MODEL") ?? undefined }, { apiKey: Deno.env.get("HEALTHAPP_GEMINI_API_KEY") }),
  log: (l) => console.log("   log", JSON.stringify(l)),
  now: () => Date.now(),
});

const questions = Deno.args.length ? Deno.args : [
  "When was her CRP raised?",
  "How have her rheumatoid factor and anti-CCP changed over time?",
  "What medication was prescribed, and what did the orthopaedic letter say?",
  "How has her morning stiffness been?",
  "Does she smoke?",
];
for (const q of questions) {
  const t0 = Date.now();
  const res = await handler(new Request("https://x/f", {
    method: "POST",
    headers: { authorization: "Bearer t", "x-healthapp-env": "dev", "content-type": "application/json" },
    body: JSON.stringify({ grant_id: GRANT, mode: "ask", question: q }),
  }));
  const ms = Date.now() - t0;
  const body = await res.json();
  console.log(`\nQ: ${q}\n   status ${res.status}, ${ms} ms`);
  if (res.status !== 200) { console.log("  ", JSON.stringify(body)); continue; }
  const out = AssistantResponse.parse(body);
  const cites = out.segments.flatMap((s) => s.cites);
  console.log(`   not_in_record=${out.not_in_record} segments=${out.segments.length} cites=${cites.length} resolved=${cites.filter((c) => known.has(c)).length}`);
  for (const s of out.segments) console.log(`   [${s.kind}] ${s.text}  <- ${s.cites.map((c) => known.get(c)).join(" | ")}`);
}
