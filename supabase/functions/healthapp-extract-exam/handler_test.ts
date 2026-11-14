import { assertEquals } from "jsr:@std/assert@1";
import { ExtractResponse } from "../_shared/contract.ts";
import { ModelAnalysis } from "../_shared/analysis.ts";
import type { ModelExtract } from "../_shared/extract.ts";
import { ModelError } from "../_shared/model.ts";
import { call, fakeAuth, fakeBlobs, fakeStore, PATIENT, PATIENT2 } from "../_shared/testkit_docs.ts";
import { makeHandler } from "./handler.ts";

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
  let modelCalls = 0, analysisCalls = 0;
  const logs: Record<string, unknown>[] = [];
  const work: Promise<unknown>[] = [];
  const inner = makeHandler({
    auth: fakeAuth, store: s.store, blobs: b.blobs,
    // deno-lint-ignore no-explicit-any
    generate: ((c: any) => {
      const second = c.schema === ModelAnalysis;
      second ? analysisCalls++ : modelCalls++;
      const answer = second ? analysis : model;
      if (answer instanceof Error) return Promise.reject(answer);
      return Promise.resolve({ data: answer, model: "m", attempts: 1, ms: 5 });
      // deno-lint-ignore no-explicit-any
    }) as any,
    background: (w) => void work.push(w),
    log: (l) => logs.push(l), now: () => Date.now(),
  });
  /** Waits for the work that runs after the answer is sent (the file analysis). Every call settles it before the
   *  test goes on, so no timer or digest outlives the test. */
  const settle = async () => void (await Promise.all(work.splice(0)));
  const h = async (req: Request) => {
    const res = await inner(req);
    await settle();
    return res;
  };
  return { s, b, h, logs, settle, modelCalls: () => modelCalls, analysisCalls: () => analysisCalls };
}
async function newDoc(s: ReturnType<typeof setup>, patient = PATIENT, upload = true) {
  const d = await s.s.store.createDraft("dev", patient, "image/jpeg");
  if (upload) s.b.files.set(d.storage_path, new Uint8Array([1, 2, 3, 4]));
  return d;
}

Deno.test("a draft: header, results with the flag computed from the printed range, nothing server-side leaks", async () => {
  const t = setup();
  const d = await newDoc(t);
  const res = await t.h(call("x", { doc_id: d.id }));
  assertEquals(res.status, 200);
  const raw = await res.json();
  const out = ExtractResponse.parse(raw);
  if (out.outcome !== "draft") throw new Error("expected a draft");
  assertEquals(out.draft.document.exam_date, "2025-05-14");
  assertEquals(out.draft.printed_name, "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ");
  assertEquals(out.draft.results.map((r) => [r.value_num, r.flag]), [[18.4, "high"], [12.4, "normal"]]);
  const text = JSON.stringify(raw);
  for (const secret of ["storage_path", "sha256", "content_type"]) assertEquals(text.includes(secret), false, secret);
  assertEquals(t.s.docs.get(d.id)?.meta.sha256_file?.length, 64);
  assertEquals(t.logs.find((l) => !l.pass)?.status, "draft"); // the other line is the analysis
  assertEquals(JSON.stringify(t.logs).includes("ΠΑΠΑΔΟΠΟΥΛΟΥ"), false); // a log never carries the document's words
});

Deno.test("unreadable: 200 refused, no record, the upload is deleted", async () => {
  const t = setup({ ...GOOD, readable: false, document_kind: "other", printed_name: "", exam_date: "", results: [] });
  const d = await newDoc(t);
  const out = ExtractResponse.parse(await (await t.h(call("x", { doc_id: d.id }))).json());
  assertEquals(out.outcome === "refused" && out.reason, "unreadable");
  assertEquals(t.s.docs.has(d.id), false);
  assertEquals(t.b.removed, [d.storage_path]);
  assertEquals(t.logs.at(-1), { fn: "extract-exam", status: "refused", reason: "unreadable", model: "m", attempts: 1, ms: t.logs.at(-1)!.ms });
});

Deno.test("no printed name: name_missing, nothing saved", async () => {
  const t = setup({ ...GOOD, printed_name: "" });
  const d = await newDoc(t);
  const out = ExtractResponse.parse(await (await t.h(call("x", { doc_id: d.id }))).json());
  assertEquals(out.outcome === "refused" && out.reason, "name_missing");
  assertEquals(t.s.docs.size, 0);
  assertEquals(t.s.calls.includes("saveExtraction"), false);
});

Deno.test("another patient's document is 404 and the model is never called", async () => {
  const t = setup();
  const d = await newDoc(t, PATIENT);
  const res = await t.h(call("x", { doc_id: d.id }, "tp2"));
  assertEquals(res.status, 404);
  assertEquals(t.modelCalls(), 0);
  assertEquals(t.s.docs.get(d.id)?.document.status, "draft");
});

Deno.test("no upload yet: 400, no model call; unknown id: 404; no token: 401", async () => {
  const t = setup();
  const d = await newDoc(t, PATIENT, false);
  assertEquals((await t.h(call("x", { doc_id: d.id }))).status, 400);
  assertEquals((await t.h(call("x", { doc_id: "00000000-0000-4000-8000-0000000099ff" }))).status, 404);
  assertEquals((await t.h(call("x", { doc_id: d.id }, null))).status, 401);
  assertEquals((await t.h(call("x", { doc_id: "nope" }))).status, 400);
  assertEquals(t.modelCalls(), 0);
});

Deno.test("the model failing is 503 model_unavailable and the draft row is kept for a retry", async () => {
  for (const kind of ["timeout", "http", "invalid"] as const) {
    const t = setup(new ModelError(kind, 500, 3));
    const d = await newDoc(t);
    const res = await t.h(call("x", { doc_id: d.id }));
    assertEquals([res.status, (await res.json()).error.code], [503, "model_unavailable"]);
    assertEquals(t.s.docs.has(d.id), true);
    assertEquals(t.logs.at(-1)?.status, "model_error");
  }
  const t = setup(new ModelError("config"));
  const d = await newDoc(t);
  assertEquals((await t.h(call("x", { doc_id: d.id }))).status, 500);
});

Deno.test("an already confirmed document cannot be read again", async () => {
  const t = setup();
  const d = await newDoc(t);
  t.s.docs.get(d.id)!.document.status = "confirmed";
  assertEquals((await t.h(call("x", { doc_id: d.id }))).status, 400);
  assertEquals(t.modelCalls(), 0);
});

// B1 + B2 (MIN-4478): whose document is it, decided on the server from the model's output ---------
async function run(model: ModelExtract, who = "tp", body: Record<string, unknown> = {}) {
  const t = setup(model);
  const d = await newDoc(t, who === "tp2" ? PATIENT2 : PATIENT);
  const res = await t.h(call("x", { doc_id: d.id, ...body }, who));
  return { t, d, out: ExtractResponse.parse(await res.json()) };
}

Deno.test("doc 6, another person: name_mismatch with the two values, nothing saved, the upload is deleted", async () => {
  const { t, d, out } = await run({ ...GOOD, printed_name: "ΠΑΠΑΔΟΠΟΥΛΟΣ ΓΕΩΡΓΙΟΣ", printed_id: "AB654321" });
  if (out.outcome !== "refused") throw new Error("expected a refusal");
  assertEquals(out.reason, "name_mismatch");
  assertEquals(out.mismatch, { printed: "ΠΑΠΑΔΟΠΟΥΛΟΣ ΓΕΩΡΓΙΟΣ", profile: "Μαρία Παπαδοπούλου" });
  assertEquals(out.message.includes("ΠΑΠΑΔΟΠΟΥΛΟΣ ΓΕΩΡΓΙΟΣ") && out.message.includes("Μαρία Παπαδοπούλου"), true);
  assertEquals(t.s.docs.has(d.id), false);
  assertEquals(t.s.calls.includes("saveExtraction"), false);
  assertEquals(t.b.removed, [d.storage_path]);
  assertEquals(t.logs.at(-1)?.reason, "name_mismatch");
  assertEquals(JSON.stringify(t.logs).includes("ΠΑΠΑΔΟΠΟΥΛΟΣ"), false); // the log carries a code, not the words
});

Deno.test("doc 8, her name and another ID: id_mismatch with the two IDs, nothing saved", async () => {
  const { t, d, out } = await run({ ...GOOD, printed_name: "PAPADOPOULOU MARIA", printed_id: "AK987654" });
  if (out.outcome !== "refused") throw new Error("expected a refusal");
  assertEquals([out.reason, out.mismatch], ["id_mismatch", { printed: "AK987654", profile: "AK123456" }]);
  assertEquals(t.s.docs.has(d.id), false);
  assertEquals(t.s.calls.includes("saveExtraction"), false);
});

Deno.test("doc 7, name and no ID: a draft marked name_only", async () => {
  const { out } = await run({ ...GOOD, printed_id: "", header_confidence: { ...GOOD.header_confidence, printed_id: 0 } });
  if (out.outcome !== "draft") throw new Error("expected a draft");
  assertEquals([out.draft.document.identity_status, out.draft.document.provenance], ["name_only", "uploaded_by_patient"]);
});

Deno.test("docs 1 to 5, name and ID match (Greek lookalike ID letters too): a draft marked match", async () => {
  for (const [name, id] of [["ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ", "AK123456"], ["PAPADOPOULOU MARIA", "ΑΚ123456"]]) {
    const { out } = await run({ ...GOOD, printed_name: name, printed_id: id });
    if (out.outcome !== "draft") throw new Error("expected a draft");
    assertEquals([out.draft.document.identity_status, out.draft.document.provenance], ["match", "uploaded_by_patient"]);
  }
});

Deno.test("the match is against the caller's own profile: Maria's page from Eleni is a name_mismatch", async () => {
  const { out } = await run(GOOD, "tp2");
  assertEquals(out.outcome === "refused" && out.reason, "name_mismatch");
});

Deno.test("no request field can set provenance, the match result or the name to compare", async () => {
  // The request carries doc_id and nothing else is read: these keys change neither the verdict nor the mark.
  const forged = { provenance: "verified_by_source", identity_status: "match", printed_name: "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ", printed_id: "AK123456" };
  const bad = await run({ ...GOOD, printed_name: "ΠΑΠΑΔΟΠΟΥΛΟΣ ΓΕΩΡΓΙΟΣ", printed_id: "AB654321" }, "tp", forged);
  assertEquals(bad.out.outcome === "refused" && bad.out.reason, "name_mismatch");
  const nameOnly = await run({ ...GOOD, printed_id: "" }, "tp", forged);
  if (nameOnly.out.outcome !== "draft") throw new Error("expected a draft");
  assertEquals([nameOnly.out.draft.document.identity_status, nameOnly.out.draft.document.provenance], ["name_only", "uploaded_by_patient"]);
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
  assertEquals(t.logs.at(-1), { fn: "extract-exam", pass: "analysis", status: "done", error: null, items: 0, ms: t.logs.at(-1)!.ms });
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

Deno.test("a failing second pass leaves the extraction's answer a 200 draft and stores a failed row with a code", async () => {
  for (const [kind, code] of [["timeout", "model_timeout"], ["http", "model_http"], ["invalid", "model_invalid"], ["config", "config"]] as const) {
    const t = setup(GOOD, new ModelError(kind, 500, 2));
    const d = await newDoc(t);
    const res = await t.h(call("x", { doc_id: d.id }));
    assertEquals(ExtractResponse.parse(await res.json()).outcome, "draft");
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
