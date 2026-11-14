import { assertEquals } from "jsr:@std/assert@1";
import { ExtractResponse, FailReason } from "../_shared/contract.ts";
import { ModelAnalysis } from "../_shared/analysis.ts";
import type { ModelExtract } from "../_shared/extract.ts";
import { ModelError } from "../_shared/model.ts";
import { call, fakeAuth, fakeBlobs, fakeStore, PATIENT, PATIENT2 } from "../_shared/testkit_docs.ts";
import { autoConfirmable, MAX_READS } from "../_shared/docs.ts";
import { makeHandler as makeConfirm } from "../healthapp-confirm-doc/handler.ts";
import { makeHandler as makeUnconfirm } from "../healthapp-unconfirm-doc/handler.ts";
import { ANALYSIS_BUDGET_MS, makeHandler, READ_BUDGET_MS, TOTAL_BUDGET_MS } from "./handler.ts";

const GOOD: ModelExtract = {
  readable: true, document_kind: "blood_test", language: "el", issuer: "Εργαστήριο", exam_date: "14/05/2025",
  printed_name: "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ", printed_id: "AK123456",
  header_confidence: { exam_date: 0.9, issuer: 0.9, printed_name: 0.95, printed_id: 0.95 },
  results: [
    { analyte: "CRP", value: "18,4", unit: "mg/L", ref_text: "0 - 5", confidence: 0.95 },
    { analyte: "Αιμοσφαιρίνη", value: "12,4", unit: "g/dL", ref_text: "12,0 - 16,0", confidence: 0.9 },
  ],
  findings: [],
};

const GOOD_ANALYSIS: ModelAnalysis = {
  readable: true, doc_type: "blood_test", pages: 1, blurred: false, cropped: false, rotated: false,
  handwriting_present: false, issuer_present: true, date_present: true, stamp_or_signature_present: true, items: [],
};

function setup(model: ModelExtract | Error = GOOD, analysis: ModelAnalysis | Error = GOOD_ANALYSIS) {
  const s = fakeStore(), b = fakeBlobs();
  s.setBlobFiles(() => b.files.keys());
  let modelCalls = 0, analysisCalls = 0;
  /** What the extraction's model call and the analysis's model call were asked (timeout, attempts). */
  const asked: { read?: { timeoutMs?: number; maxAttempts?: number }; analysis?: { timeoutMs?: number } } = {};
  const tick = { ms: 0 };
  /** Runs before the model answers: a test hooks in here to change the world while the reading is in flight. */
  const hooks: { beforeModel?: () => void } = {};
  const logs: Record<string, unknown>[] = [];
  const work: Promise<unknown>[] = [];
  const inner = makeHandler({
    auth: fakeAuth, store: s.store, blobs: b.blobs,
    // deno-lint-ignore no-explicit-any
    generate: ((c: any) => {
      const second = c.schema === ModelAnalysis;
      second ? analysisCalls++ : modelCalls++;
      if (second) asked.analysis = { timeoutMs: c.timeoutMs };
      else {
        asked.read = { timeoutMs: c.timeoutMs, maxAttempts: c.maxAttempts };
        hooks.beforeModel?.();
      }
      const answer = second ? analysis : model;
      if (answer instanceof Error) return Promise.reject(answer);
      return Promise.resolve({ data: answer, model: "m", attempts: 1, ms: 5 });
      // deno-lint-ignore no-explicit-any
    }) as any,
    background: (w) => void work.push(w),
    log: (l) => logs.push(l), now: () => tick.ms,
  });
  /** Waits for the work that runs after the answer is sent (the file analysis). Every call settles it before the
   *  test goes on, so no timer or digest outlives the test. */
  const settle = async () => void (await Promise.all(work.splice(0)));
  const h = async (req: Request) => {
    const res = await inner(req);
    await settle();
    return res;
  };
  return { s, b, h, raw: inner, logs, settle, tick, asked, hooks, modelCalls: () => modelCalls, analysisCalls: () => analysisCalls };
}
async function newDoc(s: ReturnType<typeof setup>, patient = PATIENT, upload = true) {
  const d = await s.s.store.createDraft("dev", patient, "image/jpeg");
  if (upload) s.b.files.set(d.storage_path, new Uint8Array([1, 2, 3, 4]));
  return d;
}

/** The kick, then the background work to the end. Returns the stored row, which is where the answer now lives. */
async function kick(t: ReturnType<typeof setup>, id: string, who = "tp") {
  const res = await t.h(call("x", { doc_id: id }, who));
  return { res, doc: t.s.docs.get(id), x: t.s.extra.get(id) };
}
const ALL_NULL = ["storage_path", "content_type", "sha256_file", "sha256_record", "printed_name", "printed_id", "header_confidence"] as const;

Deno.test("the kick answers 202 queued before any model call; the reading then runs to a saved exam with no further request", async () => {
  const t = setup();
  const d = await newDoc(t);
  const res = await t.raw(call("x", { doc_id: d.id })); // the raw handler: the background work is not awaited here
  assertEquals([res.status, ExtractResponse.parse(await res.json())], [202, { outcome: "queued" }]);
  assertEquals(t.modelCalls(), 0); // the answer left before the reading started
  assertEquals([t.s.docs.get(d.id)?.document.status, t.s.extra.get(d.id)?.attempts], ["reading", 1]); // claimed, one attempt
  await t.settle();
  assertEquals([t.s.docs.get(d.id)?.document.status, t.modelCalls()], ["confirmed", 1]);
});

Deno.test("a draft: header, results with the flag computed from the printed range, nothing server-side in the 202", async () => {
  const t = setup();
  const d = await newDoc(t);
  const { res, doc } = await kick(t, d.id);
  const text = JSON.stringify(await res.json());
  for (const secret of ["storage_path", "sha256", "content_type", "printed", "results", "draft"]) assertEquals(text.includes(secret), false, secret);
  assertEquals(doc?.document.exam_date, "2025-05-14");
  assertEquals(doc?.meta.printed_name, "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ");
  assertEquals(doc?.results.map((r) => [r.value_num, r.flag]), [[18.4, "high"], [12.4, "normal"]]);
  assertEquals(doc?.meta.sha256_file?.length, 64);
  assertEquals(doc?.meta.header_confidence?.printed_id, 0.95); // stored, so the review can show it
  assertEquals(t.logs.find((l) => l.status === "confirmed")?.results, 2);
  assertEquals(JSON.stringify(t.logs).includes("ΠΑΠΑΔΟΠΟΥΛΟΥ"), false); // a log never carries the document's words
});

Deno.test("the model is asked for at most 60 s and one retry (two attempts)", async () => {
  const t = setup();
  const d = await newDoc(t);
  await kick(t, d.id);
  assertEquals([t.asked.read?.timeoutMs, t.asked.read?.maxAttempts], [READ_BUDGET_MS, 2]);
});

Deno.test("two kicks at once read once: the second claims nothing, and its answer is the same 202", async () => {
  const t = setup();
  const d = await newDoc(t);
  const [a, b] = await Promise.all([t.h(call("x", { doc_id: d.id })), t.h(call("x", { doc_id: d.id }))]);
  assertEquals([a.status, b.status], [202, 202]);
  assertEquals([t.modelCalls(), t.s.extra.get(d.id)?.attempts, t.s.docs.get(d.id)?.document.status], [1, 1, "confirmed"]);
  assertEquals(t.logs.filter((l) => l.status === "not_claimed").length, 1);
});

Deno.test("unreadable: the row is refused with the code, the file is deleted, and nothing of the reading is kept", async () => {
  const t = setup({ ...GOOD, readable: false, document_kind: "other", printed_name: "", exam_date: "", results: [] });
  const d = await newDoc(t);
  const { doc, x } = await kick(t, d.id);
  assertEquals([doc?.document.status, x?.reason], ["refused", "unreadable"]);
  assertEquals(t.b.removed, [d.storage_path]);
  assertEquals(t.b.files.has(d.storage_path), false); // yes/no: the file is gone
  for (const k of ALL_NULL) assertEquals(doc?.meta[k] ?? null, null, k);
  assertEquals([doc?.document.kind ?? null, doc?.document.exam_date, doc?.document.issuer, doc?.results.length, doc?.findings.length], [null, null, null, 0, 0]);
  assertEquals(t.logs.find((l) => l.status === "refused"), { fn: "extract-exam", status: "refused", reason: "unreadable", model: "m", attempts: 1, ms: 0 });
});

Deno.test("no printed name: name_missing, nothing saved", async () => {
  const t = setup({ ...GOOD, printed_name: "" });
  const d = await newDoc(t);
  const { doc, x } = await kick(t, d.id);
  assertEquals([doc?.document.status, x?.reason], ["refused", "name_missing"]);
  assertEquals(t.s.calls.includes("saveExtraction"), false);
});

Deno.test("another patient's document is 404 and the model is never called; the row stays queued", async () => {
  const t = setup();
  const d = await newDoc(t, PATIENT);
  const res = await t.h(call("x", { doc_id: d.id }, "tp2"));
  assertEquals(res.status, 404);
  assertEquals(t.modelCalls(), 0);
  assertEquals([t.s.docs.get(d.id)?.document.status, t.s.extra.get(d.id)?.attempts], ["queued", 0]);
});

Deno.test("unknown id: 404; no token: 401; a bad id: 400; no model call for any of them", async () => {
  const t = setup();
  const d = await newDoc(t);
  assertEquals((await t.h(call("x", { doc_id: "00000000-0000-4000-8000-0000000099ff" }))).status, 404);
  assertEquals((await t.h(call("x", { doc_id: d.id }, null))).status, 401);
  assertEquals((await t.h(call("x", { doc_id: "nope" }))).status, 400);
  assertEquals(t.modelCalls(), 0);
});

Deno.test("no upload yet: the row is failed no_file with no model call, and the kick still answers 202", async () => {
  const t = setup();
  const d = await newDoc(t, PATIENT, false);
  const { res, doc, x } = await kick(t, d.id);
  assertEquals([res.status, doc?.document.status, x?.reason, t.modelCalls()], [202, "failed", "no_file", 0]);
});

Deno.test("the model failing: a failed row with the code, the file kept; Try again is the same kick and reads again", async () => {
  for (const [kind, code] of [["timeout", "model_timeout"], ["http", "model_http"], ["invalid", "model_invalid"], ["config", "config"]] as const) {
    const t = setup(new ModelError(kind, 500, 2));
    const d = await newDoc(t);
    const { res, doc, x } = await kick(t, d.id);
    assertEquals([res.status, doc?.document.status, x?.reason], [202, "failed", code]);
    assertEquals(t.b.files.has(d.storage_path), true); // a failed upload keeps its photo until he retries or deletes
    assertEquals(t.logs.find((l) => l.status === "failed")?.reason, code);
    FailReason.parse(x?.reason);
  }
  // Try again: the same kick on a failed row, now with a model that answers
  const t = setup(new ModelError("timeout", undefined, 2));
  const d = await newDoc(t);
  await kick(t, d.id);
  const ok = setup();
  ok.s.docs.set(d.id, t.s.docs.get(d.id)!);
  ok.s.extra.set(d.id, { ...t.s.extra.get(d.id)! });
  ok.b.files.set(d.storage_path, new Uint8Array([1, 2, 3, 4]));
  const again = await kick(ok, d.id);
  assertEquals([again.doc?.document.status, again.x?.attempts], ["confirmed", 2]);
});

Deno.test("read three times and still failing: too_many_attempts, and a fourth kick claims nothing and calls no model", async () => {
  const t = setup(new ModelError("http", 500, 2));
  const d = await newDoc(t);
  for (let i = 0; i < MAX_READS; i++) await kick(t, d.id);
  assertEquals([t.s.extra.get(d.id)?.reason, t.s.extra.get(d.id)?.attempts, t.modelCalls()], ["too_many_attempts", 3, 3]);
  const res = await t.h(call("x", { doc_id: d.id }));
  assertEquals([res.status, t.modelCalls(), t.s.docs.get(d.id)?.document.status], [202, 3, "failed"]);
});

Deno.test("a document that is already saved, or already reading, is not read again", async () => {
  for (const status of ["confirmed", "reading", "refused", "draft"] as const) {
    const t = setup();
    const d = await newDoc(t);
    if (status === "draft") t.s.docs.get(d.id)!.document.kind = "blood_test"; // a draft that was read is not read again either
    t.s.docs.get(d.id)!.document.status = status;
    const res = await t.h(call("x", { doc_id: d.id }));
    assertEquals([res.status, t.modelCalls(), t.s.docs.get(d.id)?.document.status], [202, 0, status], status);
  }
});

Deno.test("an old draft that was never read is taken and read (it is listed as failed, so Try again must work)", async () => {
  const t = setup();
  const d = await newDoc(t);
  t.s.docs.get(d.id)!.document.status = "draft"; // kind is still null: the row from before this change
  const { doc } = await kick(t, d.id);
  assertEquals([doc?.document.status, t.modelCalls()], ["confirmed", 1]);
  assertEquals(doc?.document.kind, "blood_test");
});

Deno.test("a refused upload whose file cannot be deleted is failed delete_failed with the file still there, never refused", async () => {
  const t = setup({ ...GOOD, printed_name: "ΠΑΠΑΔΟΠΟΥΛΟΣ ΓΕΩΡΓΙΟΣ", printed_id: "AB654321" });
  t.b.refuseRemove(true);
  const d = await newDoc(t);
  const { doc, x } = await kick(t, d.id);
  assertEquals([doc?.document.status, x?.reason], ["failed", "delete_failed"]);
  assertEquals(t.b.files.has(d.storage_path), true);
  assertEquals(doc?.meta.storage_path, d.storage_path); // the row still points at the file it could not delete
  // the delete is tried before the row is written: a refusal never leaves a file behind a refused row
  t.b.refuseRemove(false);
  t.s.extra.get(d.id)!.attempts = 0;
  const again = await kick(t, d.id);
  assertEquals([again.doc?.document.status, again.x?.reason, t.b.files.has(d.storage_path)], ["refused", "name_mismatch", false]);
});

Deno.test("the row deleted while it is being read: the draft is not written, no analysis runs, nothing throws", async () => {
  const t = setup();
  const d = await newDoc(t);
  t.hooks.beforeModel = () => { t.s.docs.delete(d.id); };
  const res = await t.h(call("x", { doc_id: d.id }));
  assertEquals([res.status, t.analysisCalls(), t.s.analyses.size, t.logs.some((l) => l.status === "not_saved" && !l.pass)], [202, 0, 0, true]);
});

Deno.test("a row swept as stuck while its reading was in flight is not overwritten by the late draft", async () => {
  const t = setup();
  const d = await newDoc(t);
  t.hooks.beforeModel = () => { // 4 minutes later the list call swept it
    t.s.clock.now += 4 * 60_000;
    return void t.s.store.sweepStuck("dev", PATIENT);
  };
  await t.h(call("x", { doc_id: d.id }));
  assertEquals([t.s.docs.get(d.id)?.document.status, t.s.extra.get(d.id)?.reason, t.s.calls.includes("saveExtraction")], ["failed", "stuck", true]);
  assertEquals(t.s.docs.get(d.id)?.results.length, 0); // saveExtraction was refused: nothing was written
});

// B1 + B2 (MIN-4478): whose document is it, decided on the server from the model's output ---------
async function run(model: ModelExtract, who = "tp", body: Record<string, unknown> = {}) {
  const t = setup(model);
  const d = await newDoc(t, who === "tp2" ? PATIENT2 : PATIENT);
  const res = await t.h(call("x", { doc_id: d.id, ...body }, who));
  return { t, d, res, doc: t.s.docs.get(d.id), x: t.s.extra.get(d.id) };
}

Deno.test("doc 6, another person: refused name_mismatch, nothing saved, the upload is deleted, the printed pair is not stored", async () => {
  const { t, d, doc, x } = await run({ ...GOOD, printed_name: "ΠΑΠΑΔΟΠΟΥΛΟΣ ΓΕΩΡΓΙΟΣ", printed_id: "AB654321" });
  assertEquals([doc?.document.status, x?.reason], ["refused", "name_mismatch"]);
  assertEquals(t.s.calls.includes("saveExtraction"), false);
  assertEquals(t.b.removed, [d.storage_path]);
  assertEquals(t.logs.find((l) => l.status === "refused")?.reason, "name_mismatch");
  // neither the printed nor the profile name is anywhere: not on the row, not in a log
  const everything = JSON.stringify([doc, x, t.logs]);
  for (const word of ["ΠΑΠΑΔΟΠΟΥΛΟΣ", "ΓΕΩΡΓΙΟΣ", "AB654321", "Μαρία", "AK123456"]) assertEquals(everything.includes(word), false, word);
});

Deno.test("doc 8, her name and another ID: refused id_mismatch, nothing saved", async () => {
  const { t, doc, x } = await run({ ...GOOD, printed_name: "PAPADOPOULOU MARIA", printed_id: "AK987654" });
  assertEquals([doc?.document.status, x?.reason], ["refused", "id_mismatch"]);
  assertEquals(t.s.calls.includes("saveExtraction"), false);
  assertEquals(JSON.stringify([doc, t.logs]).includes("AK987654"), false);
});

Deno.test("doc 7, name and no ID: saved with no tap, marked name_only", async () => {
  const { doc } = await run({ ...GOOD, printed_id: "", header_confidence: { ...GOOD.header_confidence, printed_id: 0 } });
  assertEquals([doc?.document.status, doc?.document.identity_status, doc?.document.provenance], ["confirmed", "name_only", "uploaded_by_patient"]);
});

Deno.test("docs 1 to 5, name and ID match (Greek lookalike ID letters too): saved with no tap, marked match", async () => {
  for (const [name, id] of [["ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ", "AK123456"], ["PAPADOPOULOU MARIA", "ΑΚ123456"]]) {
    const { doc } = await run({ ...GOOD, printed_name: name, printed_id: id });
    assertEquals([doc?.document.status, doc?.document.identity_status, doc?.document.provenance], ["confirmed", "match", "uploaded_by_patient"]);
  }
});

Deno.test("the match is against the caller's own profile: Maria's page from Eleni is a refused name_mismatch", async () => {
  const { doc, x } = await run(GOOD, "tp2");
  assertEquals([doc?.document.status, x?.reason], ["refused", "name_mismatch"]);
});

Deno.test("no request field can set provenance, the match result or the name to compare", async () => {
  // The request carries doc_id and nothing else is read: these keys change neither the verdict nor the mark.
  const forged = { provenance: "verified_by_source", identity_status: "match", printed_name: "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ", printed_id: "AK123456" };
  const bad = await run({ ...GOOD, printed_name: "ΠΑΠΑΔΟΠΟΥΛΟΣ ΓΕΩΡΓΙΟΣ", printed_id: "AB654321" }, "tp", forged);
  assertEquals([bad.doc?.document.status, bad.x?.reason], ["refused", "name_mismatch"]);
  const nameOnly = await run({ ...GOOD, printed_id: "" }, "tp", forged);
  assertEquals([nameOnly.doc?.document.identity_status, nameOnly.doc?.document.provenance], ["name_only", "uploaded_by_patient"]);
});

// File analysis (MIN-4549, direction 3): the second pass over the stored file ----------------------
Deno.test("a draft also gets one analysis row with the server's file facts; the patient's answer carries none of it", async () => {
  const t = setup();
  const d = await newDoc(t);
  const res = await t.h(call("x", { doc_id: d.id }));
  const raw = await res.json();
  await t.settle();
  const row = t.s.analyses.get(d.id)!;
  assertEquals([row.status, row.error_code, row.doc_type, row.pages, row.readable, row.stamp_or_signature_present], ["done", null, "blood_test", 1, true, true]);
  assertEquals(row.sha256, t.s.docs.get(d.id)?.meta.sha256_file); // the extraction's hash and the analysis's are the same object
  assertEquals([row.bytes, row.mime, row.hash_verified, row.patient_id], [4, "image/jpeg", true, PATIENT]);
  assertEquals(row.uploaded_at, "2026-11-14T10:00:30.000+00:00");
  const text = JSON.stringify(raw);
  for (const k of ["items", "stamp_or_signature", "hash_verified", "handwriting", "doc_type"]) assertEquals(text.includes(k), false, k);
  assertEquals(t.logs.at(-1), { fn: "extract-exam", pass: "analysis", status: "done", error: null, items: 0, ms: 0 });
});

Deno.test("an item the record already holds is dropped, one it lacks is kept once with its page, words capped at 200 and 20 items", async () => {
  const many = Array.from({ length: 25 }, (_, i) => ({ text_original: `Ferritin test ${1000 + i} ng/mL`, page: 1 }));
  const t = setup(GOOD, {
    ...GOOD_ANALYSIS,
    items: [
      { text_original: "CRP 18,4 mg/L 0 - 5", page: 1 }, // every word and number is in the record
      { text_original: "Ferritin 45 ng/mL", page: 1 }, // not in the record
      { text_original: "Ferritin 45 ng/mL", page: 1 }, // the same twice
      { text_original: "x".repeat(300), page: 2 },
      ...many,
    ],
  });
  const d = await newDoc(t);
  await t.h(call("x", { doc_id: d.id }));
  await t.settle();
  const row = t.s.analyses.get(d.id)!;
  assertEquals(row.items.slice(0, 2), [{ text_original: "Ferritin 45 ng/mL", page: 1 }, { text_original: "x".repeat(200), page: 2 }]);
  assertEquals([row.items.length, row.items_count], [20, 20]);
  assertEquals(row.items.some((i) => i.text_original.startsWith("CRP")), false);
});

Deno.test("an unreadable file lists no items, even when the model lists some", async () => {
  const t = setup(GOOD, { ...GOOD_ANALYSIS, readable: false, items: [{ text_original: "Ferritin 45", page: 1 }] });
  const d = await newDoc(t);
  await t.h(call("x", { doc_id: d.id }));
  await t.settle();
  const row = t.s.analyses.get(d.id)!;
  assertEquals([row.status, row.readable, row.items_count], ["done", false, 0]);
});

Deno.test("a failing second pass leaves the reading saved and stores a failed row with a code", async () => {
  for (const [kind, code] of [["timeout", "model_timeout"], ["http", "model_http"], ["invalid", "model_invalid"], ["config", "config"]] as const) {
    const t = setup(GOOD, new ModelError(kind, 500, 2));
    const d = await newDoc(t);
    const res = await t.h(call("x", { doc_id: d.id }));
    assertEquals([res.status, ExtractResponse.parse(await res.json()).outcome, t.s.docs.get(d.id)?.document.status], [202, "queued", "confirmed"]);
    await t.settle();
    const row = t.s.analyses.get(d.id)!;
    assertEquals([row.status, row.error_code, row.doc_type, row.items_count, row.hash_verified], ["failed", code, null, 0, true]);
    assertEquals(row.sha256?.length, 64); // the file facts are still there
  }
});

Deno.test("a refused extraction stores no analysis and never calls the second pass", async () => {
  const t = setup({ ...GOOD, printed_name: "ΠΑΠΑΔΟΠΟΥΛΟΣ ΓΕΩΡΓΙΟΣ", printed_id: "AB654321" });
  const d = await newDoc(t);
  await t.h(call("x", { doc_id: d.id }));
  await t.settle();
  assertEquals([t.s.analyses.size, t.analysisCalls(), t.s.saves()], [0, 0, 0]);
});

Deno.test("analyse_only: twice leaves one row; only the caller's own document; a doctor is refused; the second pass only", async () => {
  const t = setup();
  const d = await newDoc(t);
  await t.h(call("x", { doc_id: d.id }));
  await t.settle();
  t.s.docs.get(d.id)!.document.status = "confirmed"; // a saved document: the extraction itself would answer 400
  for (let i = 0; i < 2; i++) {
    const res = await t.h(call("x", { doc_id: d.id, analyse_only: true }));
    assertEquals([res.status, await res.json()], [200, { outcome: "analysed", status: "done", error_code: null, items_count: 0 }]);
  }
  assertEquals([t.s.analyses.size, t.s.saves(), t.modelCalls()], [1, 3, 1]); // 3 writes, 1 row; extraction ran once
  assertEquals((await t.h(call("x", { doc_id: d.id, analyse_only: true }, "tp2"))).status, 404);
  assertEquals((await t.h(call("x", { doc_id: d.id, analyse_only: true }, "td"))).status, 403);
  assertEquals((await t.h(call("x", { doc_id: d.id, analyse_only: true }, null))).status, 401);
  assertEquals(t.s.saves(), 3);
});

Deno.test("analyse_only on demo is 400: no read of the document, no model call", async () => {
  const t = setup();
  const d = await newDoc(t);
  const res = await t.h(call("x", { doc_id: d.id, analyse_only: true }, "tp", "demo"));
  assertEquals([res.status, t.analysisCalls(), t.s.analyses.size], [400, 0, 0]);
});

Deno.test("analyse_only with the stored object gone: a failed no_object row, no model call", async () => {
  const t = setup();
  const d = await newDoc(t, PATIENT, false);
  const res = await t.h(call("x", { doc_id: d.id, analyse_only: true }));
  assertEquals((await res.json()).error_code, "no_object");
  assertEquals([t.analysisCalls(), t.s.analyses.get(d.id)?.sha256], [0, null]);
});

Deno.test("the object changing during the run is hash_verified false; an unchanged one is true", async () => {
  const t = setup();
  const d = await newDoc(t);
  await t.h(call("x", { doc_id: d.id }));
  await t.settle();
  assertEquals(t.s.analyses.get(d.id)?.hash_verified, true);
  // the same object is now a different file: the first download in the analysis sees the old bytes, the re-hash the new
  let n = 0;
  const orig = t.b.blobs.download;
  t.b.blobs.download = (b, p) => (++n >= 2 ? Promise.resolve(new Uint8Array([9, 9, 9, 9])) : orig(b, p));
  t.s.docs.get(d.id)!.document.status = "confirmed";
  await t.h(call("x", { doc_id: d.id, analyse_only: true }));
  assertEquals(t.s.analyses.get(d.id)?.hash_verified, false);
});

Deno.test("the analysis gets 45 s, or what is left of 120 s; under 15 s left its row is failed budget and the model is not called", async () => {
  const fast = setup();
  const d1 = await newDoc(fast);
  await kick(fast, d1.id);
  assertEquals([fast.asked.analysis?.timeoutMs, fast.analysisCalls()], [ANALYSIS_BUDGET_MS, 1]);

  const mid = setup();
  const d2 = await newDoc(mid);
  mid.hooks.beforeModel = () => { mid.tick.ms += 90_000; }; // the reading took 90 s: 30 s are left
  await kick(mid, d2.id);
  assertEquals([mid.asked.analysis?.timeoutMs, mid.analysisCalls()], [TOTAL_BUDGET_MS - 90_000, 1]);

  const late = setup();
  const d3 = await newDoc(late);
  late.hooks.beforeModel = () => { late.tick.ms += 110_000; }; // 10 s left: not enough to start
  await kick(late, d3.id);
  assertEquals(late.analysisCalls(), 0);
  const row = late.s.analyses.get(d3.id)!;
  assertEquals([row.status, row.error_code, late.s.docs.get(d3.id)?.document.status], ["failed", "budget", "confirmed"]); // the reading itself still succeeded
});

// --- MIN-4555 addendum: a successful reading is saved with no tap -------------------------------------------------
const row = (t: ReturnType<typeof setup>, id: string) => t.s.docs.get(id)!.document;

Deno.test("a reading that passes identity is saved with no tap: confirmed, confirmed_at and the record hash set, unchecked; one save call, no draft step", async () => {
  const t = setup();
  const d = await newDoc(t);
  const { doc } = await kick(t, d.id);
  assertEquals([doc?.document.status, doc?.document.unchecked, doc?.document.confirmed_at === null], ["confirmed", true, false]);
  assertEquals(/^[0-9a-f]{64}$/.test(doc?.meta.sha256_record ?? ""), true);
  // the confirm happens inside the save (one transaction in the real store), never as a second call after a visible draft
  assertEquals(t.s.calls.filter((c) => c === "saveExtraction").length, 1);
  assertEquals(t.s.calls.includes("confirm"), false);
  assertEquals(t.logs.find((l) => l.status === "confirmed")?.results, 2);
});

Deno.test("the four conditions of the automatic save, each missing alone: a reading with no kind, no result and no finding is not saved automatically", () => {
  const ok = { kind: "blood_test", results: [{}], findings: [] as unknown[] };
  assertEquals(autoConfirmable(ok), true);
  assertEquals(autoConfirmable({ ...ok, results: [], findings: [{}] }), true); // a finding alone is enough
  assertEquals(autoConfirmable({ ...ok, kind: null }), false);
  assertEquals(autoConfirmable({ ...ok, results: [], findings: [] }), false);
});

Deno.test("a reading that failed or was refused is never saved automatically; the store is not asked to confirm anything", async () => {
  // reading failed: no row to save
  const failedT = setup(new ModelError("http", 500, 2));
  const f = await newDoc(failedT);
  await kick(failedT, f.id);
  assertEquals([row(failedT, f.id).status, failedT.s.calls.includes("saveExtraction")], ["failed", false]);
  // identity refused: refused, nothing saved
  const refusedT = setup({ ...GOOD, printed_name: "ΠΑΠΑΔΟΠΟΥΛΟΣ ΓΕΩΡΓΙΟΣ", printed_id: "AB654321" });
  const r = await newDoc(refusedT);
  await kick(refusedT, r.id);
  assertEquals([row(refusedT, r.id).status, refusedT.s.calls.includes("saveExtraction")], ["refused", false]);
});

Deno.test("the store is handed the patient's own confirm plan only when the test holds, and a plan the shared code refuses leaves a draft", async () => {
  // test not met: the model's rows are all unusable is refused earlier (incomplete), so the handler passes no plan for a kind-less draft
  const t = setup();
  const d = await newDoc(t);
  let handed: unknown = "unset";
  const orig = t.s.store.saveExtraction;
  t.s.store.saveExtraction = (...a) => { handed = a[6]; return orig(...a); };
  await kick(t, d.id);
  assertEquals(typeof (handed as { plan?: unknown })?.plan, "function");
  // a refused plan: the reading is kept as a draft, not failed, and the analysis still runs
  const t2 = setup();
  const d2 = await newDoc(t2);
  const orig2 = t2.s.store.saveExtraction;
  t2.s.store.saveExtraction = (...a) => orig2(a[0], a[1], a[2], a[3], a[4], a[5], { plan: () => Promise.resolve({ kind: "error", status: 400, code: "bad_request", message: "x" }) });
  const { doc, x } = await kick(t2, d2.id);
  assertEquals([doc?.document.status, doc?.document.unchecked, x?.reason], ["draft", false, null]);
  assertEquals(t2.logs.find((l) => l.pass === "auto_confirm")?.why, "plan_refused");
  assertEquals(t2.analysisCalls(), 1);
});

Deno.test("automatic and manual confirm give the same record hash for the same data (unconfirm, then confirm by hand)", async () => {
  const t = setup();
  const d = await newDoc(t);
  await kick(t, d.id);
  const auto = t.s.docs.get(d.id)!.meta.sha256_record;
  const un = makeUnconfirm({ auth: fakeAuth, store: t.s.store, log: () => {} });
  assertEquals((await un(call("x", { doc_id: d.id }))).status, 200);
  const confirm = makeConfirm({ auth: fakeAuth, store: t.s.store, log: () => {} });
  const res = await confirm(call("x", { doc_id: d.id }));
  assertEquals(res.status, 200);
  assertEquals([auto === null, (await res.json()).sha256_record === auto], [false, true]);
  assertEquals([row(t, d.id).status, row(t, d.id).unchecked], ["confirmed", false]); // the patient's own confirm is never marked
});
