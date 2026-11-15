import { assertEquals } from "jsr:@std/assert@1";
import { UnconfirmDocResponse } from "../_shared/contract.ts";
import type { DraftIn } from "../_shared/extract.ts";
import { planConfirm } from "../_shared/docs.ts";
import { call, fakeAuth, fakeStore, PATIENT } from "../_shared/testkit_docs.ts";
import { makeHandler as makeConfirm } from "../healthapp-confirm-doc/handler.ts";
import { makeHandler } from "./handler.ts";

const DRAFT: DraftIn = {
  kind: "blood_test", language: "el", exam_date: "2025-05-14", issuer: "Εργαστήριο", printed_name: "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ",
  printed_id: "AK123456", header_confidence: { exam_date: 1, issuer: 1, printed_name: 1, printed_id: 1 },
  results: [
    { analyte: "CRP", analyte_key: "crp", value_num: 18.4, value_text: null, unit: "mg/L", ref_low: 0, ref_high: 5, ref_text: "0 - 5", flag: "high", confidence: 0.9, loinc: null },
  ],
  findings: [{ kind: "note", text_original: "Σχόλιο", text_lang: "el", finding_date: "2025-05-14", specialty: null, confidence: 0.8 }],
};

/** A saved exam the way the background reading leaves it: confirmed through the shared confirm, unchecked. */
async function setup() {
  const s = fakeStore();
  const logs: Record<string, unknown>[] = [];
  const h = makeHandler({ auth: fakeAuth, store: s.store, log: (l) => logs.push(l) });
  const d = await s.store.createDraft("dev", PATIENT, "image/jpeg");
  await s.store.claimForReading("dev", PATIENT, d.id);
  await s.store.saveExtraction("dev", PATIENT, d.id, DRAFT, "a".repeat(64), "match");
  await s.store.confirm("dev", PATIENT, d.id, (st) => planConfirm(st, { doc_id: d.id, results: [], findings: [] }), { unchecked: true });
  return { s, h, logs, id: d.id, st: () => s.docs.get(d.id)! };
}

Deno.test("unconfirm: confirmed becomes a draft, confirmed_at and the mark are cleared, values and file stay", async () => {
  const { h, id, st, logs } = await setup();
  const before = st();
  assertEquals([before.document.status, before.document.unchecked], ["confirmed", true]);
  const res = await h(call("x", { doc_id: id }));
  assertEquals(res.status, 200);
  const out = UnconfirmDocResponse.parse(await res.json());
  assertEquals([out.document.status, out.document.confirmed_at, out.document.unchecked], ["draft", null, false]);
  assertEquals([st().results.length, st().findings.length, st().meta.storage_path !== null], [1, 1, true]);
  assertEquals(logs.at(-1), { fn: "unconfirm-doc", status: "draft", results: 1, findings: 1 });
  assertEquals(JSON.stringify(out).includes("storage_path"), false);
});

Deno.test("unconfirm is for the owner: a doctor is 403, another patient and an unknown id are 404, no token is 401; nothing changes", async () => {
  const { h, s, id, st } = await setup();
  assertEquals((await h(call("x", { doc_id: id }, "td"))).status, 403);
  assertEquals((await h(call("x", { doc_id: id }, "tp2"))).status, 404);
  assertEquals((await h(call("x", { doc_id: "00000000-0000-4000-8000-0000000099ff" }))).status, 404);
  assertEquals((await h(call("x", { doc_id: id }, null))).status, 401);
  assertEquals((await h(call("x", { doc_id: "nope" }))).status, 400);
  assertEquals([st().document.status, st().document.unchecked], ["confirmed", true]);
  assertEquals(s.calls.filter((c) => c === "unconfirm").length, 2); // only the two calls that were an owner's or a patient's reached the store
});

Deno.test("unconfirm twice, or on a draft or a queued row: 404, never a second write", async () => {
  const { h, s, id, st } = await setup();
  assertEquals((await h(call("x", { doc_id: id }))).status, 200);
  assertEquals((await h(call("x", { doc_id: id }))).status, 404);
  const q = await s.store.createDraft("dev", PATIENT, "image/jpeg");
  assertEquals((await h(call("x", { doc_id: q.id }))).status, 404);
  assertEquals(st().document.status, "draft");
});

Deno.test("after unconfirm the existing confirm saves it again, taking the patient's edit; no edit is possible on a confirmed row", async () => {
  const { h, s, id, st } = await setup();
  const confirm = makeConfirm({ auth: fakeAuth, store: s.store, log: () => {} });
  const hashBefore = st().meta.sha256_record;
  // a confirmed row ignores an edit (the existing rule), so a value is changed only through unconfirm
  const ignored = await confirm(call("x", { doc_id: id, results: [{ id: st().results[0].id, value_num: 99 }] }));
  assertEquals([ignored.status, st().results[0].value_num], [200, 18.4]);
  await h(call("x", { doc_id: id }));
  const res = await confirm(call("x", { doc_id: id, results: [{ id: st().results[0].id, value_num: 3.1 }] }));
  assertEquals(res.status, 200);
  assertEquals([st().document.status, st().document.unchecked, st().results[0].value_num, st().results[0].edited_by_patient], ["confirmed", false, 3.1, true]);
  assertEquals(st().meta.sha256_record === hashBefore, false); // a changed value is a changed record hash
});
