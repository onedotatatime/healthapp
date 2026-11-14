import { assertEquals } from "jsr:@std/assert@1";
import { ExamDraftResponse, MyExamsResponse } from "../_shared/contract.ts";
import { MAX_READS } from "../_shared/docs.ts";
import type { DraftIn } from "../_shared/extract.ts";
import { call, fakeAuth, fakeBlobs, fakeStore, PATIENT, PATIENT2 } from "../_shared/testkit_docs.ts";
import { makeHandler } from "./handler.ts";

const DRAFT: DraftIn = {
  kind: "blood_test", language: "el", exam_date: "2025-05-14", issuer: "Εργαστήριο", printed_name: "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ",
  printed_id: "AK123456", header_confidence: { exam_date: 0.9, issuer: 0.8, printed_name: 0.95, printed_id: 0.97 },
  results: [
    { analyte: "CRP", analyte_key: "crp", value_num: 18.4, value_text: null, unit: "mg/L", ref_low: 0, ref_high: 5, ref_text: "0 - 5", flag: "high", confidence: 0.9 },
    { analyte: "Αιμοσφαιρίνη", analyte_key: "hemoglobin", value_num: 12.4, value_text: null, unit: "g/dL", ref_low: 12, ref_high: 16, ref_text: "12,0 - 16,0", flag: "normal", confidence: 0.9 },
  ],
  findings: [{ kind: "note", text_original: "Σχόλιο", text_lang: "el", finding_date: "2025-05-14", specialty: null, confidence: 0.8 }],
};

function setup() {
  const s = fakeStore(), b = fakeBlobs();
  s.setBlobFiles(() => b.files.keys());
  const logs: Record<string, unknown>[] = [];
  const h = makeHandler({ auth: fakeAuth, store: s.store, log: (l) => logs.push(l), now: () => s.clock.now });
  /** An upload with its photo in the bucket, in the status the test needs. */
  const make = async (status: "queued" | "reading" | "draft" | "refused" | "failed" | "confirmed", patient = PATIENT, opts: { file?: boolean; attempts?: number } = {}) => {
    const d = await s.store.createDraft("dev", patient, "image/jpeg");
    if (opts.file !== false) b.files.set(d.storage_path, new Uint8Array([1, 2, 3]));
    if (status !== "queued") {
      await s.store.claimForReading("dev", patient, d.id);
      if (status === "draft" || status === "confirmed") await s.store.saveExtraction("dev", patient, d.id, DRAFT, "a".repeat(64), "match");
      if (status === "confirmed") s.docs.get(d.id)!.document.status = "confirmed";
      if (status === "refused") await s.store.markRefused("dev", patient, d.id, "name_mismatch");
      if (status === "failed") await s.store.markFailed("dev", patient, d.id, "model_timeout");
    }
    if (opts.attempts !== undefined) s.extra.get(d.id)!.attempts = opts.attempts;
    return d;
  };
  const list = async (token = "tp") => {
    const res = await h(call("x", {}, token));
    return { res, out: res.status === 200 ? MyExamsResponse.parse(await res.clone().json()) : null };
  };
  return { s, b, h, logs, make, list };
}

Deno.test("the list: one row per upload, newest first, each status with its actions and only what it may show", async () => {
  const t = setup();
  const ids: Record<string, string> = {};
  for (const st of ["confirmed", "failed", "refused", "draft", "reading", "queued"] as const) {
    ids[st] = (await t.make(st)).id;
    t.s.clock.now += 1000; // each upload a second after the last: the newest is `queued`
  }
  const { out } = await t.list();
  const rows = out!.exams;
  assertEquals(rows.map((r) => r.status), ["queued", "reading", "draft", "refused", "failed", "confirmed"]);
  const by = Object.fromEntries(rows.map((r) => [r.status, r]));
  assertEquals([by.queued.can_retry, by.queued.can_delete, by.queued.reason, by.queued.values_read, by.queued.kind], [false, true, null, null, null]);
  assertEquals([by.reading.can_retry, by.reading.can_delete], [false, true]);
  assertEquals([by.draft.kind, by.draft.exam_date, by.draft.values_read, by.draft.can_delete, by.draft.can_retry], ["blood_test", "2025-05-14", 2, true, false]);
  assertEquals([by.refused.reason, by.refused.kind, by.refused.exam_date, by.refused.values_read, by.refused.can_retry, by.refused.can_delete], ["name_mismatch", null, null, null, false, true]);
  assertEquals([by.failed.reason, by.failed.can_retry, by.failed.can_delete], ["model_timeout", true, true]);
  assertEquals([by.confirmed.kind, by.confirmed.values_read, by.confirmed.can_delete, by.confirmed.can_retry], ["blood_test", 2, false, false]);
  assertEquals(by.failed.id, ids.failed);
  // kind and date are shown only once something was read: a failed row that somehow carries them shows null
  const f = t.s.docs.get(ids.failed)!;
  f.document = { ...f.document, kind: "blood_test", exam_date: "2025-01-01" };
  const f2 = (await t.list()).out!.exams.find((r) => r.id === ids.failed)!;
  assertEquals([f2.kind, f2.exam_date, f2.values_read], [null, null, null]);
  // no value, no name, no mark, no mismatch pair anywhere in the answer
  const text = JSON.stringify(out);
  for (const k of ["value_num", "printed", "\"flag\"", "\"mismatch\"", "ΠΑΠΑΔΟΠΟΥΛΟΥ", "CRP", "storage_path", "sha256"]) assertEquals(text.includes(k), false, k);
  assertEquals(t.logs.at(-1), { fn: "my-exams", status: "list", exams: 6, swept: 0, ms: 0 });
});

Deno.test("Try again is offered while a failed row has been read fewer than three times and its file exists, never otherwise", async () => {
  const t = setup();
  const one = await t.make("failed", PATIENT, { attempts: 1 });
  const spent = await t.make("failed", PATIENT, { attempts: MAX_READS });
  const noFile = await t.make("failed", PATIENT, { attempts: 1 });
  t.s.extra.get(noFile.id)!.reason = "no_file";
  const { out } = await t.list();
  const can = Object.fromEntries(out!.exams.map((r) => [r.id, r.can_retry]));
  assertEquals([can[one.id], can[spent.id], can[noFile.id]], [true, false, false]);
});

Deno.test("an old draft that was never read is listed as failed not_read and can be tried again", async () => {
  const t = setup();
  const d = await t.make("queued");
  t.s.docs.get(d.id)!.document.status = "draft"; // kind is null: a row from before this change
  const row = (await t.list()).out!.exams[0];
  assertEquals([row.status, row.reason, row.can_retry, row.can_delete, row.kind, row.values_read], ["failed", "not_read", true, true, null, null]);
});

Deno.test("the sweep: reading over 3 minutes and queued over 10 are failed; under the limit they are left alone", async () => {
  const t = setup();
  const staleReading = await t.make("reading");
  const freshReading = await t.make("reading");
  const staleQueued = await t.make("queued");
  const freshQueued = await t.make("queued");
  t.s.extra.get(staleReading.id)!.at -= 3 * 60_000 + 1000; // 3:01 ago
  t.s.extra.get(freshReading.id)!.at -= 3 * 60_000 - 1000; // 2:59 ago
  t.s.extra.get(staleQueued.id)!.at -= 10 * 60_000 + 1000;
  t.s.extra.get(freshQueued.id)!.at -= 10 * 60_000 - 1000;
  const { out } = await t.list();
  const by = Object.fromEntries(out!.exams.map((r) => [r.id, r]));
  assertEquals([by[staleReading.id].status, by[staleReading.id].reason, by[staleReading.id].can_retry], ["failed", "stuck", true]);
  assertEquals([by[freshReading.id].status, by[freshQueued.id].status], ["reading", "queued"]);
  assertEquals([by[staleQueued.id].status, by[staleQueued.id].reason], ["failed", "stuck"]); // the photo is there: Try again works
  assertEquals(t.logs.at(-1)?.swept, 2);
});

Deno.test("a queued row whose photo never arrived is failed no_file, with no Try again", async () => {
  const t = setup();
  const d = await t.make("queued", PATIENT, { file: false });
  t.s.extra.get(d.id)!.at -= 11 * 60_000;
  const row = (await t.list()).out!.exams[0];
  assertEquals([row.status, row.reason, row.can_retry, row.can_delete], ["failed", "no_file", false, true]);
});

Deno.test("a stuck row that was already read three times is too_many_attempts: Delete only", async () => {
  const t = setup();
  const d = await t.make("reading", PATIENT, { attempts: MAX_READS });
  t.s.extra.get(d.id)!.at -= 4 * 60_000;
  const row = (await t.list()).out!.exams[0];
  assertEquals([row.status, row.reason, row.can_retry], ["failed", "too_many_attempts", false]);
});

Deno.test("the sweep and the list touch only the caller's rows", async () => {
  const t = setup();
  const mine = await t.make("queued");
  const theirs = await t.make("queued", PATIENT2);
  t.s.extra.get(mine.id)!.at -= 11 * 60_000;
  t.s.extra.get(theirs.id)!.at -= 11 * 60_000;
  const { out } = await t.list("tp");
  assertEquals(out!.exams.map((r) => r.id), [mine.id]);
  assertEquals(t.s.docs.get(theirs.id)?.document.status, "queued"); // not swept by someone else's list
  assertEquals((await t.list("tp2")).out!.exams.map((r) => r.id), [theirs.id]);
});

Deno.test("a doctor, a stranger and no token get no list", async () => {
  const t = setup();
  await t.make("draft");
  assertEquals((await t.h(call("x", {}, "td"))).status, 403);
  assertEquals((await t.h(call("x", {}, "to"))).status, 403);
  assertEquals((await t.h(call("x", {}, null))).status, 401);
  assertEquals((await t.h(call("x", { doc_id: "nope" }))).status, 400);
  assertEquals(t.s.calls.includes("listOwn"), false);
});

Deno.test("the draft for the review: what extract-exam used to return, from the stored row, only for the caller's own draft", async () => {
  const t = setup();
  const d = await t.make("draft");
  const res = await t.h(call("x", { doc_id: d.id }));
  const { draft } = ExamDraftResponse.parse(await res.json());
  assertEquals([draft.document.status, draft.document.kind, draft.printed_name, draft.printed_id], ["draft", "blood_test", "ΠΑΠΑΔΟΠΟΥΛΟΥ ΜΑΡΙΑ", "AK123456"]);
  assertEquals(draft.header_confidence, DRAFT.header_confidence);
  assertEquals(draft.results.map((r) => [r.analyte, r.value_num, r.flag]), [["CRP", 18.4, "high"], ["Αιμοσφαιρίνη", 12.4, "normal"]]);
  assertEquals(draft.findings.length, 1);
  const text = JSON.stringify(draft);
  for (const secret of ["storage_path", "sha256", "content_type", "patient_id\":\"" + PATIENT2]) assertEquals(text.includes(secret), false, secret);
  assertEquals(JSON.stringify(t.logs).includes("ΠΑΠΑΔΟΠΟΥΛΟΥ"), false);
  // another patient, a saved exam, a queued one: not_found, never an empty draft
  assertEquals((await t.h(call("x", { doc_id: d.id }, "tp2"))).status, 404);
  for (const st of ["queued", "reading", "refused", "failed", "confirmed"] as const) {
    const o = await t.make(st);
    assertEquals((await t.h(call("x", { doc_id: o.id }))).status, 404, st);
  }
});
