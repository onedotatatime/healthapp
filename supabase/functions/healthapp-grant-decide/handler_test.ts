import { assertEquals } from "jsr:@std/assert@1";
import { GRANT_SECONDS, readConfig } from "../_shared/grants.ts";
import { errorCode, ENVELOPE, fakeAuth, fakeStore, GRANT, post } from "../_shared/testkit_grants.ts";
import { makeHandler } from "./handler.ts";

const config = readConfig(() => undefined);
const mk = (over = {}) => {
  const f = fakeStore(over);
  return { ...f, h: makeHandler({ auth: fakeAuth, store: f.store, config }) };
};

Deno.test("approve: the server's grant length is used, never one from the body", async () => {
  const { h, calls } = mk();
  const r = await h(post("grant-decide", { grant_id: GRANT, approve: true, seconds: 99999, expires_at: "2099-01-01T00:00:00Z" }, "tp"));
  assertEquals(r.status, 200);
  assertEquals((await r.json()).grant.grant_id, ENVELOPE.grant.grant_id);
  assertEquals(calls, [`decide:true:${GRANT_SECONDS}`]);
  assertEquals(GRANT_SECONDS, 900);
});

Deno.test("HEALTHAPP_GRANT_SECONDS is the one knob; a bad value falls back to 15 minutes", () => {
  assertEquals(readConfig((n) => (n === "HEALTHAPP_GRANT_SECONDS" ? "60" : undefined)).grantSeconds, 60);
  for (const v of ["0", "-5", "abc", "999999999", ""]) assertEquals(readConfig(() => v).grantSeconds, 900);
});

Deno.test("refuse passes approve=false", async () => {
  const { h, calls } = mk();
  assertEquals((await h(post("grant-decide", { grant_id: GRANT, approve: false }, "tp"))).status, 200);
  assertEquals(calls, [`decide:false:${GRANT_SECONDS}`]);
});

Deno.test("a doctor cannot decide; bad bodies are 400", async () => {
  const { h, calls } = mk();
  const d = await h(post("grant-decide", { grant_id: GRANT, approve: true }, "td"));
  assertEquals([d.status, await errorCode(d)], [403, "wrong_role"]);
  for (const b of [{}, { grant_id: "nope", approve: true }, { grant_id: GRANT }, { grant_id: GRANT, approve: "yes" }]) {
    assertEquals((await h(post("grant-decide", b, "tp"))).status, 400);
  }
  assertEquals(calls, []);
});

Deno.test("store outcomes map to the contract: not_found 404, ended 403 grant_expired, wrong_state 400", async () => {
  for (const [kind, status, code] of [["not_found", 404, "not_found"], ["ended", 403, "grant_expired"], ["wrong_state", 400, "bad_request"]] as const) {
    const { h } = mk({ decide: () => Promise.resolve({ kind }) });
    const r = await h(post("grant-decide", { grant_id: GRANT, approve: true }, "tp"));
    assertEquals([r.status, await errorCode(r)], [status, code]);
  }
});
