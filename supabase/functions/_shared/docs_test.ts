import { assertEquals, assertNotEquals } from "jsr:@std/assert@1";
import { type DocRecord, type ExamRow, forbiddenConfirmKey, MAX_READS, planConfirm, recordHash, toListItem } from "./docs.ts";

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

// MIN-4637: the list item's two signals, `can_retry` (the button) and `file_kept` (the copy) -----------------------
const row = (o: Partial<ExamRow>): ExamRow => ({
  id: "00000000-0000-4000-8000-000000000001", status: "refused", status_reason: "name_mismatch", created_at: "2026-11-14T10:00:00.000+00:00",
  status_at: "2026-11-14T10:00:00.000+00:00", kind: null, exam_date: null, read_attempts: 1, has_file: true, values_read: 0, unchecked: false,
  kept_expired: false, ...o,
});
const sig = (o: Partial<ExamRow>) => { const i = toListItem(row(o)); return [i.can_retry, i.file_kept]; };

Deno.test("refused with its original kept: Try again while reads are left and the 14 days run; the copy says kept while the file exists", () => {
  assertEquals(sig({}), [true, true]);
  assertEquals(sig({ read_attempts: MAX_READS - 1 }), [true, true]);
  assertEquals(sig({ read_attempts: MAX_READS }), [false, true]); // criterion 8
  assertEquals(sig({ kept_expired: true }), [false, true]); // its time is up, the sweep has not deleted it yet
  assertEquals(sig({ has_file: false }), [false, false]); // an old refused row, or swept
  for (const r of ["unreadable", "unsupported_kind", "incomplete", "name_missing", "name_mismatch", "id_mismatch"]) {
    assertEquals(sig({ status_reason: r }), [true, true], r);
  }
});

Deno.test("file_kept is true for a refused row only (criterion 15); a failed one keeps its old Try again rule plus the end", () => {
  for (const status of ["queued", "reading", "draft", "confirmed", "failed"]) {
    assertEquals(toListItem(row({ status, status_reason: status === "failed" ? "model_timeout" : null, kind: "blood_test" })).file_kept, false, status);
  }
  assertEquals(sig({ status: "failed", status_reason: "model_timeout" }), [true, false]);
  assertEquals(sig({ status: "failed", status_reason: "model_timeout", kept_expired: true }), [false, false]);
  assertEquals(sig({ status: "failed", status_reason: "no_file" }), [false, false]);
  assertEquals(sig({ status: "confirmed", status_reason: null, kind: "blood_test" }), [false, false]);
});
