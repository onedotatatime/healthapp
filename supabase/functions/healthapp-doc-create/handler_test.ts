import { assertEquals } from "jsr:@std/assert@1";
import { DocCreateResponse } from "../_shared/contract.ts";
import { call, ENV, fakeAuth, fakeBlobs, fakeStore, PATIENT } from "../_shared/testkit_docs.ts";
import { makeHandler } from "./handler.ts";

function setup() {
  const s = fakeStore(), b = fakeBlobs();
  return { s, b, h: makeHandler({ auth: fakeAuth, store: s.store, blobs: b.blobs }) };
}
const body = { content_type: "image/jpeg", size_bytes: 400_000 };

Deno.test("a patient gets a queued row, a path under their own id, and a signed upload; no-store", async () => {
  const { s, h } = setup();
  const res = await h(call("healthapp-doc-create", body));
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("cache-control"), "no-store");
  const out = DocCreateResponse.parse(await res.json());
  assertEquals(out.bucket, "healthapp-dev");
  assertEquals(out.path, `${PATIENT}/${out.doc_id}`);
  assertEquals(s.docs.get(out.doc_id)?.document.status, "queued"); // read later, in the background (MIN-4556)
  assertEquals(s.docs.get(out.doc_id)?.document.patient_id, PATIENT);
});

Deno.test("no token, a bad token, no env header: refused before anything is written", async () => {
  const { s, h } = setup();
  assertEquals((await h(call("x", body, null))).status, 401);
  assertEquals((await h(call("x", body, "nope"))).status, 401);
  assertEquals((await h(call("x", body, "tp", null))).status, 400);
  assertEquals((await h(call("x", body, "tp", "prod"))).status, 400);
  assertEquals(s.calls.length, 0);
});

Deno.test("signed in without a profile is 403 no_profile; a doctor is 403 wrong_role", async () => {
  const { s, h } = setup();
  const o = await h(call("x", body, "to"));
  assertEquals([o.status, (await o.json()).error.code], [403, "no_profile"]);
  const d = await h(call("x", body, "td"));
  assertEquals([d.status, (await d.json()).error.code], [403, "wrong_role"]);
  assertEquals(s.calls.length, 0);
});

Deno.test("PDF, other types, bad sizes and bad JSON are 400 and write nothing", async () => {
  const { s, h } = setup();
  for (const b of [{ content_type: "application/pdf", size_bytes: 10 }, { content_type: "image/gif", size_bytes: 10 },
    { content_type: "image/png", size_bytes: 0 }, { content_type: "image/png", size_bytes: 21 * 1024 * 1024 }, {}, "{nope"]) {
    const r = await h(call("x", b));
    assertEquals(r.status, 400);
  }
  assertEquals(s.calls.length, 0);
});

Deno.test("the env header picks the schema: demo is passed through, not assumed", async () => {
  const seen: string[] = [];
  const s = fakeStore();
  const real = s.store.createDraft;
  s.store.createDraft = (e, p, c) => { seen.push(e); return real(e, p, c); };
  const h = makeHandler({ auth: fakeAuth, store: s.store, blobs: fakeBlobs().blobs });
  await h(call("x", body, "tp", "demo"));
  assertEquals([seen, ENV], [["demo"], "dev"]);
});
