import { assertEquals } from "jsr:@std/assert@1";
import { GrantEnvelope } from "../_shared/contract.ts";
import { readConfig } from "../_shared/grants.ts";
import { errorCode, ENVELOPE, fakeAuth, fakeStore, post } from "../_shared/testkit_grants.ts";
import { makeHandler } from "./handler.ts";

const TOKEN = "hs1.AbCdEfGhIjKlMnOpQrStUv"; // 22 characters
const config = readConfig(() => undefined);
const mk = (over = {}) => {
  const f = fakeStore(over);
  return { ...f, h: makeHandler({ auth: fakeAuth, store: f.store, config }) };
};

Deno.test("scanned token: the claim key is the 22-character body, the answer is the grant envelope", async () => {
  const { h, calls } = mk();
  const r = await h(post("handshake-claim", { token: TOKEN }, "td"));
  assertEquals(r.status, 200);
  assertEquals(GrantEnvelope.parse(await r.json()), ENVELOPE);
  assertEquals(calls, [`claim:{"jti":"AbCdEfGhIjKlMnOpQrStUv"}`]);
});

Deno.test("typed code: any case, spaces and dashes are forgiven", async () => {
  const { h, calls } = mk();
  assertEquals((await h(post("handshake-claim", { short_code: "ab3d-k9mn" }, "td"))).status, 200);
  assertEquals((await h(post("handshake-claim", { short_code: " ab3d k9mn " }, "td"))).status, 200);
  assertEquals(calls, [`claim:{"short_code":"AB3DK9MN"}`, `claim:{"short_code":"AB3DK9MN"}`]);
});

Deno.test("a patient cannot claim; a signed-in stranger cannot claim; the store is not touched", async () => {
  const { h, calls } = mk();
  const p = await h(post("handshake-claim", { token: TOKEN }, "tp"));
  assertEquals([p.status, await errorCode(p)], [403, "wrong_role"]);
  const o = await h(post("handshake-claim", { token: TOKEN }, "to"));
  assertEquals([o.status, await errorCode(o)], [403, "no_profile"]);
  assertEquals(calls, []);
});

Deno.test("both, neither or a non-object body is 400; a malformed value is token_invalid (404) and counts as a failure", async () => {
  const { h, calls, failures } = mk();
  for (const b of [{ token: TOKEN, short_code: "AB3DK9MN" }, {}, "[]", "nope"]) {
    const r = await h(post("handshake-claim", b, "td"));
    assertEquals([r.status, await errorCode(r)], [400, "bad_request"]);
  }
  assertEquals(failures(), 0);
  for (const b of [{ token: "hs1.short" }, { token: "xx1.AbCdEfGhIjKlMnOpQrStUv" }, { short_code: "0OIL1111" }, { short_code: "ABC" }, { token: 12 }]) {
    const r = await h(post("handshake-claim", b, "td"));
    assertEquals([r.status, await errorCode(r)], [404, "token_invalid"]);
  }
  assertEquals(failures(), 5);
  assertEquals(calls.filter((c) => c.startsWith("claim:")), []); // never reached the store
});

Deno.test("typed errors: invalid 404, used 409, expired 409, and each one is recorded against the doctor", async () => {
  for (const [kind, status, code] of [["invalid", 404, "token_invalid"], ["used", 409, "token_used"], ["expired", 409, "token_expired"]] as const) {
    const { h, failures } = mk({ claim: () => Promise.resolve({ kind }) });
    const r = await h(post("handshake-claim", { token: TOKEN }, "td"));
    assertEquals([r.status, await errorCode(r)], [status, code]);
    assertEquals(failures(), 1);
  }
});

Deno.test("the sixth failure in the window is 429 before the store is asked; a success is never counted", async () => {
  let asked = 0;
  const { h, failures } = mk({ claim: () => (asked++, Promise.resolve({ kind: "invalid" as const })) });
  for (let i = 0; i < 5; i++) assertEquals((await h(post("handshake-claim", { token: TOKEN }, "td"))).status, 404);
  const r = await h(post("handshake-claim", { token: TOKEN }, "td"));
  assertEquals([r.status, await errorCode(r)], [429, "rate_limited"]);
  assertEquals(failures(), 5);
  assertEquals(asked, 5);

  const ok = mk();
  for (let i = 0; i < 9; i++) assertEquals((await ok.h(post("handshake-claim", { token: TOKEN }, "td"))).status, 200);
  assertEquals(ok.failures(), 0);
});

Deno.test("the failure count is per doctor: a second doctor is not limited by the first", async () => {
  const keys: string[] = [];
  const { store } = fakeStore({
    failedClaims: (_e, key) => {
      keys.push(key);
      return Promise.resolve(key === keys[0] ? 5 : 0);
    },
  });
  const h = makeHandler({ auth: fakeAuth, store, config });
  assertEquals((await h(post("handshake-claim", { token: TOKEN }, "td"))).status, 429);
  assertEquals((await h(post("handshake-claim", { token: TOKEN }, "td2"))).status, 200);
  assertEquals(keys[0] !== keys[1], true);
  assertEquals(/^[0-9a-f]{32}$/.test(keys[0]), true); // a hash, not the doctor's id
});
