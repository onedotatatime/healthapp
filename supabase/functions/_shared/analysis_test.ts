// The file analysis (MIN-4549): what the model may write, what the server keeps, and the file facts it computes.
import { assertEquals } from "jsr:@std/assert@1";
import { z } from "npm:zod@4.6.7";
import { type AnalysisDeps, analyseFile, itemsNotInRecord, MIN_MODEL_MS, ModelAnalysis, recordTokens, tokens } from "./analysis.ts";
import { FileAnalysisRow } from "./contract.ts";
import type { DocState } from "./docs.ts";
import { fakeBlobs, PATIENT } from "./testkit_docs.ts";

// The one free string. Anything else the model returns is an enum, a boolean or an integer, so a new string field
// in ModelAnalysis (a place for an opinion) fails here before it ships.
function freeStrings(node: unknown, path: string, out: string[]) {
  if (typeof node !== "object" || node === null) return;
  const n = node as Record<string, unknown>;
  const isString = n.type === "string" || (Array.isArray(n.type) && n.type.includes("string"));
  if (isString && !("enum" in n) && !("const" in n)) out.push(path);
  for (const [k, v] of Object.entries(n)) freeStrings(v, `${path}.${k}`, out);
}
Deno.test("the model's schema has exactly one free-text field: items[].text_original", () => {
  const out: string[] = [];
  freeStrings(z.toJSONSchema(ModelAnalysis, { target: "draft-2020-12" }), "$", out);
  assertEquals(out, ["$.properties.items.items.properties.text_original"]);
});

Deno.test("the stored row's schema has no free string but the items' words; the lint is able to see one", () => {
  const out: string[] = [];
  freeStrings(z.toJSONSchema(FileAnalysisRow, { target: "draft-2020-12", io: "output" }), "$", out);
  // Besides the items' words: two ids, a mime type, a hash and two timestamps, all computed by the server
  // (or read from a row), none written by the model.
  const names = [...new Set(out.map((p) => p.replace(/\.anyOf\.\d+/g, "")).filter((p) => !p.endsWith("text_original")))].sort();
  assertEquals(names, [
    "$.properties.analysed_at", "$.properties.document_id", "$.properties.mime", "$.properties.patient_id",
    "$.properties.sha256", "$.properties.uploaded_at",
  ]);
  // forced red: a schema with an opinion field is caught
  const bad: string[] = [];
  freeStrings(z.toJSONSchema(ModelAnalysis.extend({ opinion: z.string() })), "$", bad);
  assertEquals(bad.includes("$.properties.opinion"), true);
});

Deno.test("tokens: accents, case, Greek and decimal commas", () => {
  assertEquals(tokens("Ηπατική ΤΡΑΝΣΑΜΙΝΑΣΗ 18,4 mg/L"), ["ηπατικη", "τρανσαμιναση", "18", "4", "mg", "l"]);
});

function state(): DocState {
  return {
    document: { id: "d1", patient_id: PATIENT, kind: "blood_test", issuer: "Lab", exam_date: "2025-05-14", created_at: "2026-11-14T10:00:00+00:00" } as never,
    meta: { storage_path: `${PATIENT}/d1`, content_type: "image/jpeg", sha256_file: null, sha256_record: null, printed_name: "MARIA", printed_id: "AK123456" },
    results: [{ analyte: "CRP", value_text: "18,4", value_num: 18.4, unit: "mg/L", ref_text: "0 - 5" } as never],
    findings: [{ text_original: "Mild increase", finding_date: null, specialty: null } as never],
  };
}

Deno.test("itemsNotInRecord: a row the record holds is dropped; a missing word or number keeps it; no model text outlives the caps", () => {
  const have = recordTokens(state());
  assertEquals(itemsNotInRecord([{ text_original: "CRP 18,4 mg/L (0 - 5)", page: 1 }], have), []);
  assertEquals(itemsNotInRecord([{ text_original: "CRP 19,4 mg/L", page: 1 }], have).length, 1); // 19 is not in the record
  assertEquals(itemsNotInRecord([{ text_original: "   ", page: 1 }, { text_original: "---", page: 1 }], have), []);
  assertEquals(itemsNotInRecord([{ text_original: "Ferritin 45", page: 2 }, { text_original: "ferritin  45", page: 2 }], have).length, 1);
  assertEquals(itemsNotInRecord([{ text_original: "Ferritin 45", page: 2 }, { text_original: "Ferritin 45", page: 3 }], have).length, 2);
});

function deps(over: Partial<AnalysisDeps> = {}) {
  const b = fakeBlobs();
  b.files.set(`${PATIENT}/d1`, new Uint8Array([1, 2, 3]));
  const saved: unknown[] = [];
  let calls = 0;
  const logs: Record<string, unknown>[] = [];
  const d: AnalysisDeps = {
    blobs: b.blobs,
    store: {
      objectMeta: () => Promise.resolve({ mime: "image/jpeg", size: 3, created_at: "2026-11-14T10:00:30+00:00" }),
      saveAnalysis: (_e, _p, _d, f) => { saved.push(f); return Promise.resolve(); },
    },
    generate: ((_c: unknown) => {
      calls++;
      return Promise.resolve({ data: { readable: true, doc_type: "blood_test", pages: 1, blurred: false, cropped: false, rotated: false, handwriting_present: false, issuer_present: true, date_present: true, stamp_or_signature_present: false, items: [] }, model: "m", attempts: 1, ms: 1 });
    }) as never,
    log: (l) => logs.push(l),
    now: () => Date.now(),
    ...over,
  };
  return { d, saved, logs, calls: () => calls, b };
}

Deno.test("under the minimum budget the model is not called: a failed budget row that still has the file facts", async () => {
  const t = deps();
  const o = await analyseFile(t.d, { env: "dev", patientId: PATIENT, state: state(), budgetMs: MIN_MODEL_MS - 1 });
  assertEquals([o.status, o.error_code, t.calls()], ["failed", "budget", 0]);
  const row = t.saved[0] as Record<string, unknown>;
  assertEquals([row.sha256, row.bytes, row.hash_verified, row.doc_type], [
    "039058c6f2c0cb492c533b0a4d14ef77cc0f78abccced5287d84a1a2011cfb81", 3, true, null,
  ]);
});

Deno.test("a PDF is not sent to the model: failed unsupported_type, hash and size still stored", async () => {
  const t = deps({ store: { objectMeta: () => Promise.resolve({ mime: "application/pdf", size: 3, created_at: null }), saveAnalysis: (_e, _p, _d, f) => { t.saved.push(f); return Promise.resolve(); } } });
  const s = state();
  s.meta.content_type = "application/pdf";
  const o = await analyseFile(t.d, { env: "dev", patientId: PATIENT, state: s, budgetMs: 40_000 });
  assertEquals([o.error_code, t.calls(), (t.saved[0] as { sha256: string }).sha256.length], ["unsupported_type", 0, 64]);
});

Deno.test("a file whose size differs from the stored object's size, or whose hash differs from the extraction's, is hash_verified false", async () => {
  const sizeOff = deps({ store: { objectMeta: () => Promise.resolve({ mime: "image/jpeg", size: 99, created_at: null }), saveAnalysis: (_e, _p, _d, f) => { sizeOff.saved.push(f); return Promise.resolve(); } } });
  await analyseFile(sizeOff.d, { env: "dev", patientId: PATIENT, state: state(), budgetMs: 40_000 });
  assertEquals((sizeOff.saved[0] as { hash_verified: boolean }).hash_verified, false);
  const hashOff = deps();
  const s = state();
  s.meta.sha256_file = "0".repeat(64);
  await analyseFile(hashOff.d, { env: "dev", patientId: PATIENT, state: s, budgetMs: 40_000 });
  assertEquals((hashOff.saved[0] as { hash_verified: boolean }).hash_verified, false);
  const ok = deps();
  const good = state();
  good.meta.sha256_file = "039058c6f2c0cb492c533b0a4d14ef77cc0f78abccced5287d84a1a2011cfb81";
  await analyseFile(ok.d, { env: "dev", patientId: PATIENT, state: good, budgetMs: 40_000 });
  assertEquals((ok.saved[0] as { hash_verified: boolean }).hash_verified, true);
});

Deno.test("the analysis log line holds a status, a code and two numbers, never a word of the file", async () => {
  const t = deps({ generate: (() => Promise.resolve({ data: { readable: true, doc_type: "other", pages: 1, blurred: false, cropped: false, rotated: false, handwriting_present: true, issuer_present: false, date_present: false, stamp_or_signature_present: false, items: [{ text_original: "SECRET WORDS 777", page: 1 }] }, model: "m", attempts: 1, ms: 1 })) as never });
  await analyseFile(t.d, { env: "dev", patientId: PATIENT, state: state(), budgetMs: 40_000 });
  assertEquals(Object.keys(t.logs[0]).sort(), ["error", "fn", "items", "ms", "pass", "status"]);
  assertEquals(JSON.stringify(t.logs).includes("SECRET"), false);
  assertEquals((t.saved[0] as { items_count: number }).items_count, 1);
});
