import { assertEquals, assertNotEquals } from "jsr:@std/assert@1";
import { type DocRecord, forbiddenConfirmKey, planConfirm, recordHash } from "./docs.ts";

const doc = {
  id: "d", patient_id: "p", kind: "blood_test", language: "el", exam_date: "2025-05-14", issuer: "Lab",
  identity_status: null, provenance: "uploaded_by_patient", status: "draft", created_at: "2026-11-14T10:00:00.000+00:00", confirmed_at: null,
} as unknown as DocRecord;
const r = (id: string, v: number) => ({ id, analyte: "CRP", value_num: v, value_text: null, unit: "mg/L", ref_low: 0, ref_high: 5, flag: "high" });

Deno.test("record hash: same record same hash, order of rows and of keys does not matter, any value does", async () => {
  const a = await recordHash(doc, "f", "2025-05-14", [r("1", 18), r("2", 9)], []);
  assertEquals(a, await recordHash(doc, "f", "2025-05-14", [r("2", 9), r("1", 18)], []));
  assertEquals(a, await recordHash(doc, "f", "2025-05-14", [{ ...r("1", 18) }, r("2", 9)].map((x) => Object.fromEntries(Object.entries(x).reverse())) as never, []));
  assertNotEquals(a, await recordHash(doc, "f", "2025-05-14", [r("1", 19), r("2", 9)], []));
  assertNotEquals(a, await recordHash(doc, "f", "2025-05-15", [r("1", 18), r("2", 9)], []));
  assertNotEquals(a, await recordHash(doc, "g", "2025-05-14", [r("1", 18), r("2", 9)], []));
});

Deno.test("forbidden keys: anything outside doc_id, exam_date, results, findings; and inside an edit", () => {
  assertEquals(forbiddenConfirmKey({ doc_id: "x", exam_date: "2025-01-01", results: [{ id: "1", value_num: 1, unit: "u", value_text: null }], findings: [{ id: "2", text_original: "t", finding_date: null }] }), null);
  assertEquals(forbiddenConfirmKey({ doc_id: "x", printed_name: "n" }), "printed_name");
  assertEquals(forbiddenConfirmKey({ doc_id: "x", results: [{ id: "1", analyte: "a" }] }), "analyte");
  assertEquals(forbiddenConfirmKey({ doc_id: "x", findings: [{ id: "1", kind: "note" }] }), "kind");
  assertEquals(forbiddenConfirmKey("x"), null);
});

Deno.test("plan: an unread draft (no kind) cannot be confirmed", async () => {
  const state = { document: { ...doc, kind: null }, meta: { sha256_file: null }, results: [], findings: [] } as never;
  const o = await planConfirm(state, { doc_id: "x", results: [], findings: [] });
  assertEquals(o.kind, "error");
});
