import { assertEquals } from "jsr:@std/assert@1";
import { ExamDeleteResponse } from "../_shared/contract.ts";
import type { DraftIn } from "../_shared/extract.ts";
import { call, fakeAuth, fakeBlobs, fakeStore, PATIENT, PATIENT2 } from "../_shared/testkit_docs.ts";
import { makeHandler } from "./handler.ts";

const DRAFT: DraftIn = {
  kind: "blood_test", language: "el", exam_date: "2025-05-14", issuer: "Εργαστήριο", printed_name: "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ",
  printed_id: "AK123456", header_confidence: { exam_date: 1, issuer: 1, printed_name: 1, printed_id: 1 },
  results: [{ analyte: "CRP", analyte_key: "crp", value_num: 18.4, value_text: null, unit: "mg/L", ref_low: 0, ref_high: 5, ref_text: "0 - 5", flag: "high", confidence: 0.9, loinc: null }],
  findings: [],
};

function setup() {
  const s = fakeStore(), b = fakeBlobs();
  const logs: Record<string, unknown>[] = [];
  const h = makeHandler({ auth: fakeAuth, store: s.store, blobs: b.blobs, log: (l) => logs.push(l) });
  const make = async (status: "queued" | "reading" | "draft" | "refused" | "failed" | "confirmed", patient = PATIENT) => {
    const d = await s.store.createDraft("dev", patient, "image/jpeg");
    b.files.set(d.storage_path, new Uint8Array([1, 2, 3]));
    if (status !== "queued") {
      await s.store.claimForReading("dev", patient, d.id);
      if (status === "draft" || status === "confirmed") await s.store.saveExtraction("dev", patient, d.id, DRAFT, "a".repeat(64), "match");
      if (status === "confirmed") s.docs.get(d.id)!.document.status = "confirmed";
      if (status === "refused") await s.store.markRefused("dev", patient, d.id, "unreadable"); // MIN-4637: the original is kept
      if (status === "failed") await s.store.markFailed("dev", patient, d.id, "model_http");
    }
    return d;
  };
  return { s, b, h, logs, make };
}

Deno.test("every upload that is not saved can be deleted, file and row; a refused one with its kept original too (MIN-4637 criterion 14)", async () => {
  for (const st of ["queued", "reading", "draft", "failed", "refused"] as const) {
    const t = setup();
    const d = await t.make(st);
    if (st === "refused") assertEquals([t.s.docs.get(d.id)?.meta.storage_path, t.b.files.has(d.storage_path)], [d.storage_path, true]);
    const res = await t.h(call("x", { doc_id: d.id }));
    assertEquals([res.status, ExamDeleteResponse.parse(await res.json())], [200, { deleted: true, doc_id: d.id }]);
    assertEquals([t.s.docs.has(d.id), t.b.files.has(d.storage_path)], [false, false], st);
    assertEquals(t.b.removed, [d.storage_path], st);
  }
});

Deno.test("a refused row from before 017 has no file: the row is deleted and no storage call is made", async () => {
  const t = setup();
  const d = await t.make("refused");
  t.s.docs.get(d.id)!.meta = { ...t.s.docs.get(d.id)!.meta, storage_path: null, content_type: null };
  t.s.extra.get(d.id)!.keptUntil = null;
  assertEquals((await t.h(call("x", { doc_id: d.id }))).status, 200);
  assertEquals([t.s.docs.has(d.id), t.b.removed], [false, []]);
});

Deno.test("MIN-4637 criterion 9: another account cannot delete a refused row or its kept original", async () => {
  const t = setup();
  const d = await t.make("refused", PATIENT);
  assertEquals((await t.h(call("x", { doc_id: d.id }, "tp2"))).status, 404);
  assertEquals([t.s.docs.has(d.id), t.b.files.has(d.storage_path), t.b.removed], [true, true, []]);
});

Deno.test("a saved exam cannot be deleted here: 404, the file and the row stay", async () => {
  const t = setup();
  const d = await t.make("confirmed");
  assertEquals((await t.h(call("x", { doc_id: d.id }))).status, 404);
  assertEquals([t.s.docs.has(d.id), t.b.files.has(d.storage_path), t.b.removed.length], [true, true, 0]);
});

Deno.test("another patient's upload is 404 and nothing is touched; a doctor is 403; no token is 401; a bad id is 400", async () => {
  const t = setup();
  const d = await t.make("failed", PATIENT);
  assertEquals((await t.h(call("x", { doc_id: d.id }, "tp2"))).status, 404);
  assertEquals((await t.h(call("x", { doc_id: d.id }, "td"))).status, 403);
  assertEquals((await t.h(call("x", { doc_id: d.id }, null))).status, 401);
  assertEquals((await t.h(call("x", { doc_id: "nope" }))).status, 400);
  assertEquals((await t.h(call("x", { doc_id: "00000000-0000-4000-8000-0000000099ff" }))).status, 404);
  assertEquals([t.s.docs.has(d.id), t.b.files.has(d.storage_path), t.b.removed.length], [true, true, 0]);
  void PATIENT2;
});

Deno.test("the file goes first: when the storage refuses, the answer is 500 and the row is kept to try again", async () => {
  const t = setup();
  const d = await t.make("failed");
  t.b.refuseRemove(true);
  const res = await t.h(call("x", { doc_id: d.id }));
  assertEquals([res.status, (await res.json()).error.code], [500, "internal"]);
  assertEquals([t.s.docs.has(d.id), t.b.files.has(d.storage_path), t.s.calls.includes("deleteUnsaved")], [true, true, false]);
  t.b.refuseRemove(false);
  assertEquals((await t.h(call("x", { doc_id: d.id }))).status, 200);
});

Deno.test("the log carries the word deleted and the status it was, nothing of the document", async () => {
  const t = setup();
  const d = await t.make("draft");
  await t.h(call("x", { doc_id: d.id }));
  assertEquals(t.logs, [{ fn: "exam-delete", status: "deleted", was: "draft" }]);
});
