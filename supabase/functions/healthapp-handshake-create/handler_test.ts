import { assertEquals, assertMatch, assertNotEquals } from "jsr:@std/assert@1";
import { HandshakeCreateResponse } from "../_shared/contract.ts";
import { newShortCode } from "../_shared/grants.ts";
import { errorCode, fakeAuth, fakeStore, post } from "../_shared/testkit_grants.ts";
import { makeHandler } from "./handler.ts";

Deno.test("patient: 200, the contract's shape, a token the QR can carry and an 8-character code", async () => {
  const { store, calls } = fakeStore();
  const r = await makeHandler({ auth: fakeAuth, store })(post("handshake-create", {}, "tp"));
  assertEquals(r.status, 200);
  assertEquals(r.headers.get("cache-control"), "no-store");
  const out = HandshakeCreateResponse.parse(await r.json());
  assertMatch(out.token, /^hs1\.[A-Za-z0-9_-]{22}$/);
  assertEquals(calls[0].startsWith(`createToken:${out.token.slice(4)}:${out.short_code}`), true);
});

Deno.test("two calls give two different tokens and codes", async () => {
  const { store } = fakeStore();
  const h = makeHandler({ auth: fakeAuth, store });
  const a = await (await h(post("handshake-create", {}, "tp"))).json();
  const b = await (await h(post("handshake-create", {}, "tp"))).json();
  assertNotEquals(a.token, b.token);
  assertNotEquals(a.short_code, b.short_code);
});

Deno.test("a doctor is refused (wrong_role), no session is 401, no profile is 403, nothing is stored", async () => {
  const { store, calls } = fakeStore();
  const h = makeHandler({ auth: fakeAuth, store });
  const d = await h(post("handshake-create", {}, "td"));
  assertEquals([d.status, await errorCode(d)], [403, "wrong_role"]);
  const n = await h(post("handshake-create", {}, null));
  assertEquals([n.status, await errorCode(n)], [401, "unauthenticated"]);
  const o = await h(post("handshake-create", {}, "to"));
  assertEquals([o.status, await errorCode(o)], [403, "no_profile"]);
  const e = await h(post("handshake-create", {}, "tp", null));
  assertEquals([e.status, await errorCode(e)], [400, "bad_request"]);
  assertEquals(calls, []);
});

Deno.test("a short-code collision is retried, five in a row is a 500", async () => {
  let n = 0;
  const { store } = fakeStore({
    createToken: () => (++n < 3 ? Promise.resolve("taken") : Promise.resolve({ expires_at: "2026-11-14T15:02:00.000Z", server_now: "2026-11-14T15:00:00.000Z" })),
  });
  assertEquals((await makeHandler({ auth: fakeAuth, store })(post("handshake-create", {}, "tp"))).status, 200);
  assertEquals(n, 3);
  const always = fakeStore({ createToken: () => Promise.resolve("taken") }).store;
  assertEquals((await makeHandler({ auth: fakeAuth, store: always })(post("handshake-create", {}, "tp"))).status, 500);
});

Deno.test("the code uses only the 31-letter alphabet (no 0, O, 1, I, L) and is uniform enough", () => {
  const counts = new Map<string, number>();
  for (let i = 0; i < 4000; i++) {
    const c = newShortCode();
    assertMatch(c, /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/);
    for (const ch of c) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  }
  assertEquals(counts.size, 31);
  const expected = (4000 * 8) / 31; // about 1032 each
  for (const n of counts.values()) assertEquals(n > expected * 0.8 && n < expected * 1.2, true);
});
