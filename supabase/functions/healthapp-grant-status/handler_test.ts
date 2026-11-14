import { assertEquals } from "jsr:@std/assert@1";
import { GrantStatusResponse } from "../_shared/contract.ts";
import { errorCode, ENVELOPE, fakeAuth, fakeStore, GRANT, post } from "../_shared/testkit_grants.ts";
import { makeHandler } from "./handler.ts";

Deno.test("both roles may ask; no grant_id passes null; the answer is the contract's", async () => {
  const { store, calls } = fakeStore();
  const h = makeHandler({ auth: fakeAuth, store });
  for (const t of ["tp", "td"]) {
    const r = await h(post("grant-status", {}, t));
    assertEquals(r.status, 200);
    assertEquals(GrantStatusResponse.parse(await r.json()).grant?.grant_id, ENVELOPE.grant.grant_id);
  }
  assertEquals(calls, ["status:null", "status:null"]);
});

Deno.test("with a grant_id it is passed through; without a match the answer is grant: null, not an error", async () => {
  const { store } = fakeStore({ status: () => Promise.resolve({ kind: "ok", grant: null, server_now: ENVELOPE.server_now }) });
  const h = makeHandler({ auth: fakeAuth, store });
  const r = await h(post("grant-status", {}, "tp"));
  assertEquals(await r.json(), { grant: null, server_now: ENVELOPE.server_now });
  const { store: s2, calls: c2 } = fakeStore();
  await makeHandler({ auth: fakeAuth, store: s2 })(post("grant-status", { grant_id: GRANT }, "td"));
  assertEquals(c2, [`status:${GRANT}`]);
});

Deno.test("a grant that is not the caller's is 404 not_found; a bad grant_id is 400; no profile is 403", async () => {
  const { store } = fakeStore({ status: () => Promise.resolve({ kind: "not_found" }) });
  const h = makeHandler({ auth: fakeAuth, store });
  const n = await h(post("grant-status", { grant_id: GRANT }, "td2"));
  assertEquals([n.status, await errorCode(n)], [404, "not_found"]);
  assertEquals((await h(post("grant-status", { grant_id: "x" }, "tp"))).status, 400);
  const o = await h(post("grant-status", {}, "to"));
  assertEquals([o.status, await errorCode(o)], [403, "no_profile"]);
});
