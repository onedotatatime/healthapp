import { assertEquals } from "jsr:@std/assert@1";
import { DocPhotoResponse } from "../_shared/contract.ts";
import { call, DOCTOR, fakeAuth, fakeBlobs, fakeStore, PATIENT } from "../_shared/testkit_docs.ts";
import { makeHandler } from "./handler.ts";

const NOW = Date.now();
const GRANT = "99999999-9999-4999-8999-999999999999";

async function setup(status: "draft" | "confirmed" = "confirmed") {
  const s = fakeStore(), b = fakeBlobs();
  const h = makeHandler({ auth: fakeAuth, store: s.store, blobs: b.blobs, now: () => NOW });
  const d = await s.store.createDraft("dev", PATIENT, "image/jpeg");
  s.docs.get(d.id)!.document.status = status;
  return { s, b, h, id: d.id, path: d.storage_path };
}

Deno.test("the patient opens their own photo, draft or confirmed: a 60 second link", async () => {
  for (const status of ["draft", "confirmed"] as const) {
    const t = await setup(status);
    const res = await t.h(call("x", { doc_id: t.id }));
    assertEquals(res.status, 200);
    const out = DocPhotoResponse.parse(await res.json());
    assertEquals(out.expires_at, new Date(NOW + 60_000).toISOString());
    assertEquals([out.content_type, out.fingerprint], ["image/jpeg", "unchecked"]);
    assertEquals(t.b.signed, [{ path: t.path, seconds: 60 }]);
  }
});

Deno.test("another patient gets 404 and no link is minted", async () => {
  const t = await setup();
  const res = await t.h(call("x", { doc_id: t.id }, "tp2"));
  assertEquals(res.status, 404);
  assertEquals(t.b.signed.length, 0);
});

Deno.test("a doctor needs a live grant on this patient: none, wrong one, expired, or a draft -> refused", async () => {
  const t = await setup();
  const code = async (body: unknown) => {
    const r = await t.h(call("x", body, "td"));
    return [r.status, (await r.json()).error.code];
  };
  assertEquals(await code({ doc_id: t.id }), [403, "grant_expired"]); // no grant_id
  assertEquals(await code({ doc_id: t.id, grant_id: GRANT }), [403, "grant_expired"]); // unknown grant
  t.s.grants.set(GRANT, { doctor: "55555555-5555-4555-8555-555555555555", patient: PATIENT, end: "2026-11-14T13:00:00.000Z" });
  assertEquals(await code({ doc_id: t.id, grant_id: GRANT }), [403, "grant_expired"]); // somebody else's grant
  t.s.grants.set(GRANT, { doctor: DOCTOR, patient: "66666666-6666-4666-8666-666666666666", end: "2099-01-01T00:00:00.000Z" });
  assertEquals(await code({ doc_id: t.id, grant_id: GRANT }), [403, "grant_expired"]); // a grant on a different patient
  t.s.docs.get(t.id)!.document.status = "draft";
  t.s.grants.set(GRANT, { doctor: DOCTOR, patient: PATIENT, end: "2099-01-01T00:00:00.000Z" });
  assertEquals(await code({ doc_id: t.id, grant_id: GRANT }), [404, "not_found"]); // drafts are the patient's alone
  assertEquals(t.b.signed.length, 0);
});

Deno.test("a doctor in a live grant gets a link that never outlives the grant", async () => {
  const t = await setup();
  t.s.grants.set(GRANT, { doctor: DOCTOR, patient: PATIENT, end: "2099-01-01T00:00:00.000Z" });
  const full = DocPhotoResponse.parse(await (await t.h(call("x", { doc_id: t.id, grant_id: GRANT }, "td"))).json());
  assertEquals(full.expires_at, new Date(NOW + 60_000).toISOString());
  t.s.grants.set(GRANT, { doctor: DOCTOR, patient: PATIENT, end: new Date(NOW + 30_500).toISOString() });
  const clipped = DocPhotoResponse.parse(await (await t.h(call("x", { doc_id: t.id, grant_id: GRANT }, "td"))).json());
  assertEquals(clipped.expires_at, new Date(NOW + 30_000).toISOString()); // 30 s left on the grant, not 60
  assertEquals(t.b.signed.at(-1)?.seconds, 30);
  t.s.grants.set(GRANT, { doctor: DOCTOR, patient: PATIENT, end: new Date(NOW - 1000).toISOString() });
  assertEquals((await t.h(call("x", { doc_id: t.id, grant_id: GRANT }, "td"))).status, 403); // ended
  // still live by the store's clock but under a second left: a link of 0 seconds is refused, not minted
  t.s.grants.set(GRANT, { doctor: DOCTOR, patient: PATIENT, end: new Date(Date.now() + 60_000).toISOString() });
  const before = t.b.signed.length;
  const short = makeHandler({ auth: fakeAuth, store: t.s.store, blobs: t.b.blobs, now: () => Date.now() + 59_500 });
  assertEquals((await short(call("x", { doc_id: t.id, grant_id: GRANT }, "td"))).status, 403);
  assertEquals(t.b.signed.length, before);
});
