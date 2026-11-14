import { assertEquals } from "jsr:@std/assert@1";
import { errorCode, fakeAuth, fakeStore, GRANT, post } from "../_shared/testkit_grants.ts";
import { makeHandler } from "./handler.ts";

Deno.test("patient revokes: 200 with the view", async () => {
  const { store, calls } = fakeStore();
  const r = await makeHandler({ auth: fakeAuth, store })(post("grant-revoke", { grant_id: GRANT }, "tp"));
  assertEquals(r.status, 200);
  assertEquals((await r.json()).grant.grant_id, GRANT);
  assertEquals(calls, ["revoke"]);
});

Deno.test("a doctor cannot revoke; bad bodies are 400; the store is not touched", async () => {
  const { store, calls } = fakeStore();
  const h = makeHandler({ auth: fakeAuth, store });
  const d = await h(post("grant-revoke", { grant_id: GRANT }, "td"));
  assertEquals([d.status, await errorCode(d)], [403, "wrong_role"]);
  for (const b of [{}, { grant_id: "x" }, "no"]) assertEquals((await h(post("grant-revoke", b, "tp"))).status, 400);
  assertEquals(calls, []);
});

Deno.test("store outcomes: not_found 404 (another patient's grant looks the same), ended 403 grant_expired", async () => {
  for (const [kind, status, code] of [["not_found", 404, "not_found"], ["ended", 403, "grant_expired"]] as const) {
    const { store } = fakeStore({ revoke: () => Promise.resolve({ kind }) });
    const r = await makeHandler({ auth: fakeAuth, store })(post("grant-revoke", { grant_id: GRANT }, "tp"));
    assertEquals([r.status, await errorCode(r)], [status, code]);
  }
});
