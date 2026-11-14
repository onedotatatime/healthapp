import { assertEquals, assertNotEquals } from "jsr:@std/assert@1";
import { ConfirmDocResponse } from "../_shared/contract.ts";
import type { DraftIn } from "../_shared/extract.ts";
import { call, fakeAuth, fakeStore, PATIENT } from "../_shared/testkit_docs.ts";
import { makeHandler } from "./handler.ts";

const DRAFT: DraftIn = {
  kind: "blood_test", language: "el", exam_date: "2025-05-14", issuer: "Εργαστήριο", printed_name: "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ",
  printed_id: "AK123456", header_confidence: { exam_date: 1, issuer: 1, printed_name: 1, printed_id: 1 },
  results: [
    { analyte: "CRP", analyte_key: "crp", value_num: 18.4, value_text: null, unit: "mg/L", ref_low: 0, ref_high: 5, ref_text: "0 - 5", flag: "high", confidence: 0.9 },
    { analyte: "Αιμοσφαιρίνη", analyte_key: "hemoglobin", value_num: 12.4, value_text: null, unit: "g/dL", ref_low: 12, ref_high: 16, ref_text: "12,0 - 16,0", flag: "normal", confidence: 0.9 },
  ],
  findings: [{ kind: "note", text_original: "Σχόλιο", text_lang: "el", finding_date: "2025-05-14", specialty: null, confidence: 0.8 }],
};

async function setup() {
  const s = fakeStore();
  const logs: Record<string, unknown>[] = [];
  const h = makeHandler({ auth: fakeAuth, store: s.store, log: (l) => logs.push(l) });
  const d = await s.store.createDraft("dev", PATIENT, "image/jpeg");
  await s.store.saveExtraction("dev", PATIENT, d.id, DRAFT, "a".repeat(64));
  return { s, h, logs, id: d.id, st: () => s.docs.get(d.id)! };
}

Deno.test("confirm with no edits: confirmed, hash set, nothing marked edited", async () => {
  const { h, id, st } = await setup();
  const res = await h(call("x", { doc_id: id }));
  assertEquals(res.status, 200);
  const out = ConfirmDocResponse.parse(await res.json());
  assertEquals(out.document.status, "confirmed");
  assertEquals(out.results.map((r) => r.edited_by_patient), [false, false]);
  assertEquals(st().meta.sha256_record, out.sha256_record);
  assertEquals(JSON.stringify(out).includes("storage_path"), false);
});

Deno.test("edits are accepted, marked edited, and the flag is recomputed from the printed range", async () => {
  const { h, id, st } = await setup();
  const [crp, hb] = st().results;
  const res = await h(call("x", {
    doc_id: id, exam_date: "2025-05-15",
    results: [{ id: crp.id, value_num: 3.1 }, { id: hb.id, value_num: 12.4, unit: "g/dL" }],
    findings: [{ id: st().findings[0].id, text_original: "Σχόλιο, διορθωμένο" }],
  }));
  assertEquals(res.status, 200);
  const out = ConfirmDocResponse.parse(await res.json());
  const by = (n: string) => out.results.find((r) => r.analyte === n)!;
  assertEquals([by("CRP").value_num, by("CRP").flag, by("CRP").edited_by_patient], [3.1, "normal", true]);
  assertEquals([by("Αιμοσφαιρίνη").edited_by_patient, by("Αιμοσφαιρίνη").flag], [false, "normal"]); // same value sent: not an edit
  assertEquals([out.findings[0].text_original, out.findings[0].edited_by_patient], ["Σχόλιο, διορθωμένο", true]);
  assertEquals(out.document.exam_date, "2025-05-15");
});

Deno.test("a changed value changes the stored record hash", async () => {
  const a = await setup(), c = await setup();
  const hashOf = async (t: Awaited<ReturnType<typeof setup>>, value?: number) => {
    const body = { doc_id: t.id, results: value === undefined ? [] : [{ id: t.st().results[0].id, value_num: value }] };
    return ConfirmDocResponse.parse(await (await t.h(call("x", body))).json()).sha256_record;
  };
  const ha = await hashOf(a), hc = await hashOf(c, 19);
  assertNotEquals(ha, hc);
  assertEquals(ha.length, 64);
});

Deno.test("name and ID edits are rejected on the server, in every spelling, and nothing is written", async () => {
  const { h, s, id, st } = await setup();
  const before = JSON.stringify(st());
  for (const extra of [{ printed_name: "X" }, { printed_id: "X" }, { full_name: "X" }, { name: "X" }, { patient_name: "X" },
    { national_id: "X" }, { patient_id: PATIENT }, { id: id }, { kind: "doctor_letter" }]) {
    const res = await h(call("x", { doc_id: id, ...extra }));
    assertEquals(res.status, 400, JSON.stringify(extra));
    assertEquals((await res.json()).error.code, "bad_request");
  }
  const nested = await h(call("x", { doc_id: id, results: [{ id: st().results[0].id, analyte: "Hacked", printed_name: "X" }] }));
  assertEquals(nested.status, 400);
  assertEquals(JSON.stringify(st()), before);
  assertEquals(s.calls.includes("confirm"), false); // refused before the store was asked anything
});

Deno.test("another patient's document is 404; an unknown result id is 400; a bad date is 400", async () => {
  const { h, id, st } = await setup();
  assertEquals((await h(call("x", { doc_id: id }, "tp2"))).status, 404);
  assertEquals(st().document.status, "draft");
  assertEquals((await h(call("x", { doc_id: id, results: [{ id: "00000000-0000-4000-8000-0000000fffff", value_num: 1 }] }))).status, 400);
  assertEquals((await h(call("x", { doc_id: id, exam_date: "2025-02-30" }))).status, 400);
  assertEquals((await h(call("x", { doc_id: id, exam_date: "14/05/2025" }))).status, 400);
  assertEquals(st().document.status, "draft");
});

Deno.test("confirming twice returns the saved record and ignores the second request's edits", async () => {
  const { h, id, st } = await setup();
  const first = ConfirmDocResponse.parse(await (await h(call("x", { doc_id: id }))).json());
  const second = await h(call("x", { doc_id: id, results: [{ id: st().results[0].id, value_num: 99 }] }));
  assertEquals(second.status, 200);
  const out = ConfirmDocResponse.parse(await second.json());
  assertEquals(out.sha256_record, first.sha256_record);
  assertEquals(out.results[0].value_num, 18.4);
});

Deno.test("a doctor, no token, no profile: refused", async () => {
  const { h, id } = await setup();
  assertEquals((await h(call("x", { doc_id: id }, "td"))).status, 403);
  assertEquals((await h(call("x", { doc_id: id }, null))).status, 401);
  assertEquals((await h(call("x", { doc_id: id }, "to"))).status, 403);
});
