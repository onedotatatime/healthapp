import { assertEquals } from "jsr:@std/assert@1";
import { ExtractResponse } from "../_shared/contract.ts";
import type { ModelExtract } from "../_shared/extract.ts";
import { ModelError } from "../_shared/model.ts";
import { call, fakeAuth, fakeBlobs, fakeStore, PATIENT } from "../_shared/testkit_docs.ts";
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

function setup(model: ModelExtract | Error = GOOD) {
  const s = fakeStore(), b = fakeBlobs();
  let modelCalls = 0;
  const logs: Record<string, unknown>[] = [];
  const h = makeHandler({
    auth: fakeAuth, store: s.store, blobs: b.blobs,
    generate: (_c) => {
      modelCalls++;
      if (model instanceof Error) return Promise.reject(model);
      return Promise.resolve({ data: model, model: "m", attempts: 1, ms: 5 });
    },
    log: (l) => logs.push(l), now: () => Date.now(),
  });
  return { s, b, h, logs, modelCalls: () => modelCalls };
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
  assertEquals(t.logs.at(-1)?.status, "draft");
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
