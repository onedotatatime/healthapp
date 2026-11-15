import { assertEquals } from "jsr:@std/assert@1";
import { ExamDraftResponse, MyExamsResponse } from "../_shared/contract.ts";
import { KEEP_REFUSED_DAYS, MAX_READS } from "../_shared/docs.ts";
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
  const h = makeHandler({ auth: fakeAuth, store: s.store, blobs: b.blobs, log: (l) => logs.push(l), now: () => s.clock.now });
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
  // MIN-4637: a refusal keeps the original, so the refused row offers Try again and says its file is kept
  assertEquals([by.refused.reason, by.refused.kind, by.refused.exam_date, by.refused.values_read, by.refused.can_retry, by.refused.can_delete], ["name_mismatch", null, null, null, true, true]);
  assertEquals(rows.map((r) => [r.status, r.file_kept]), [["queued", false], ["reading", false], ["draft", false], ["refused", true], ["failed", false], ["confirmed", false]]);
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
  assertEquals(t.logs.at(-1), { fn: "my-exams", status: "list", exams: 6, swept: 0, kept_deleted: 0, kept_not_deleted: 0, ms: 0 });
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

Deno.test("the exam for the review: what extract-exam used to return, from the stored row, only for the caller's own draft or saved exam", async () => {
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
  for (const st of ["queued", "reading", "refused", "failed"] as const) {
    const o = await t.make(st);
    assertEquals((await t.h(call("x", { doc_id: o.id }))).status, 404, st);
  }
});

// --- MIN-4555 addendum: the mark, and opening a saved exam ---------------------------------------------------------
Deno.test("the list says which saved exams are unchecked; a draft or a queued row never carries the mark", async () => {
  const t = setup();
  const saved = await t.make("confirmed");
  const draft = await t.make("draft");
  await t.make("queued");
  t.s.docs.get(saved.id)!.document.unchecked = true;
  t.s.docs.get(draft.id)!.document.unchecked = true; // a stray column value on a draft must not show
  const { out } = await t.list();
  assertEquals(out!.exams.map((r) => [r.status, r.unchecked]), [["queued", false], ["draft", false], ["confirmed", true]]);
});

Deno.test("opening a saved exam answers the same shape as a draft, read-only, and clears the mark; opening it again changes nothing", async () => {
  const t = setup();
  const d = await t.make("confirmed");
  t.s.docs.get(d.id)!.document.unchecked = true;
  const first = ExamDraftResponse.parse(await (await t.h(call("x", { doc_id: d.id }))).json());
  assertEquals([first.draft.document.status, first.draft.document.unchecked, first.draft.results.length], ["confirmed", false, 2]);
  assertEquals(t.s.docs.get(d.id)!.document.unchecked, false);
  assertEquals((await t.list()).out!.exams[0].unchecked, false);
  assertEquals(t.s.calls.filter((c) => c === "markOpened").length, 1);
  await t.h(call("x", { doc_id: d.id }));
  assertEquals(t.s.calls.filter((c) => c === "markOpened").length, 1); // already open: no second write
  // only the owner's open clears it
  const other = await t.make("confirmed");
  t.s.docs.get(other.id)!.document.unchecked = true;
  assertEquals((await t.h(call("x", { doc_id: other.id }, "tp2"))).status, 404);
  assertEquals(t.s.docs.get(other.id)!.document.unchecked, true);
});

Deno.test("opening a draft does not touch the mark and a doctor cannot open anything", async () => {
  const t = setup();
  const d = await t.make("draft");
  await t.h(call("x", { doc_id: d.id }));
  assertEquals(t.s.calls.includes("markOpened"), false);
  assertEquals((await t.h(call("x", { doc_id: d.id }, "td"))).status, 403);
});

// --- MIN-4637: a refused scan keeps its original 14 days; the list deletes it once they have passed ----------------
const DAY = 86_400_000;

Deno.test("criterion 10: the list deletes an expired kept file through the storage API and clears its columns; an unexpired one stays", async () => {
  const t = setup();
  const old = await t.make("refused"); // refused now: its end is now + 14 days
  t.s.clock.now += 10 * DAY;
  const young = await t.make("refused"); // refused 10 days later
  t.s.clock.now += 4 * DAY + 1; // old is 14 days and 1 ms past its refusal, young is 4 days in
  const { out } = await t.list();
  assertEquals(t.b.removed, [old.storage_path]); // the delete ran for the expired path only
  assertEquals([t.b.files.has(old.storage_path), t.b.files.has(young.storage_path)], [false, true]);
  const o = t.s.docs.get(old.id)!, y = t.s.docs.get(young.id)!;
  assertEquals([o.meta.storage_path, o.meta.content_type, o.meta.sha256_file, t.s.extra.get(old.id)?.keptUntil], [null, null, null, null]);
  assertEquals([o.document.status, t.s.extra.get(old.id)?.reason], ["refused", "name_mismatch"]); // the row and its code stay
  assertEquals([y.meta.storage_path, t.s.extra.get(young.id)?.keptUntil], [young.storage_path, t.s.clock.now - 4 * DAY - 1 + KEEP_REFUSED_DAYS * DAY]);
  const by = Object.fromEntries(out!.exams.map((r) => [r.id, r]));
  assertEquals([by[old.id].file_kept, by[old.id].can_retry, by[old.id].can_delete], [false, false, true]);
  assertEquals([by[young.id].file_kept, by[young.id].can_retry], [true, true]);
  assertEquals([t.logs.at(-1)?.kept_deleted, t.logs.at(-1)?.kept_not_deleted], [1, 0]);
  // a second list finds nothing more to delete
  await t.list();
  assertEquals(t.b.removed, [old.storage_path]);
});

Deno.test("criterion 10, the edge: the end itself counts as passed; a millisecond before it does not", async () => {
  const t = setup();
  const d = await t.make("refused");
  t.s.clock.now += KEEP_REFUSED_DAYS * DAY - 1;
  await t.list();
  assertEquals(t.b.removed, []);
  t.s.clock.now += 1;
  await t.list();
  assertEquals(t.b.removed, [d.storage_path]);
});

Deno.test("criterion 12: a storage delete that fails keeps the row's path, offers no Try again, and the next list tries again", async () => {
  const t = setup();
  const d = await t.make("refused");
  t.s.clock.now += 15 * DAY;
  t.b.refuseRemove(true);
  const first = (await t.list()).out!.exams[0];
  assertEquals([t.b.removed, t.s.docs.get(d.id)?.meta.storage_path, t.b.files.has(d.storage_path)], [[d.storage_path], d.storage_path, true]);
  assertEquals([first.file_kept, first.can_retry, first.can_delete], [true, false, true]); // the file is there, its time is up
  assertEquals([t.logs.at(-1)?.kept_deleted, t.logs.at(-1)?.kept_not_deleted], [0, 1]);
  t.b.refuseRemove(false);
  const second = (await t.list()).out!.exams[0];
  assertEquals([t.b.removed, t.s.docs.get(d.id)?.meta.storage_path, second.file_kept], [[d.storage_path, d.storage_path], null, false]);
});

Deno.test("the sweep also deletes the file of a refused row that failed on its re-read, once its 14 days have passed", async () => {
  const t = setup();
  const d = await t.make("refused");
  await t.s.store.claimForReading("dev", PATIENT, d.id); // Try again
  await t.s.store.markFailed("dev", PATIENT, d.id, "model_timeout"); // and the reader timed out
  const before = (await t.list()).out!.exams[0];
  assertEquals([before.status, before.can_retry, before.file_kept, t.b.removed], ["failed", true, false, []]);
  t.s.clock.now += KEEP_REFUSED_DAYS * DAY;
  const after = (await t.list()).out!.exams[0];
  assertEquals([after.status, after.reason, after.can_retry, t.b.removed, t.s.docs.get(d.id)?.meta.storage_path], ["failed", "model_timeout", false, [d.storage_path], null]);
});

Deno.test("the retention sweep touches only the caller's rows, and never a saved exam, a draft or a plain failed upload", async () => {
  const t = setup();
  const theirs = await t.make("refused", PATIENT2);
  const saved = await t.make("confirmed");
  const draft = await t.make("draft");
  const failed = await t.make("failed");
  t.s.clock.now += 30 * DAY;
  await t.list("tp");
  assertEquals(t.b.removed, []);
  assertEquals([saved, draft, failed, theirs].map((d) => t.b.files.has(d.storage_path)), [true, true, true, true]);
  await t.list("tp2"); // their own list deletes their own expired file
  assertEquals(t.b.removed, [theirs.storage_path]);
});

Deno.test("criteria 8 and 15: a refused row read three times keeps saying its file is kept, and offers no Try again", async () => {
  const t = setup();
  const spent = await t.make("refused", PATIENT, { attempts: MAX_READS });
  const fresh = await t.make("refused");
  const noFile = await t.make("refused");
  t.s.docs.get(noFile.id)!.meta = { ...t.s.docs.get(noFile.id)!.meta, storage_path: null, content_type: null }; // a row from before 017
  t.s.extra.get(noFile.id)!.keptUntil = null;
  const by = Object.fromEntries((await t.list()).out!.exams.map((r) => [r.id, r]));
  assertEquals([by[spent.id].file_kept, by[spent.id].can_retry], [true, false]);
  assertEquals([by[fresh.id].file_kept, by[fresh.id].can_retry], [true, true]);
  assertEquals([by[noFile.id].file_kept, by[noFile.id].can_retry, by[noFile.id].can_delete], [false, false, true]);
});
