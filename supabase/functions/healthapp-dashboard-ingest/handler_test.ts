import { assertEquals, assertNotEquals } from "jsr:@std/assert@1";
import { MAX_BODY_BYTES } from "../_shared/dashboard.ts";
import { deps, fakeStore, PUSH, VIEW } from "../_shared/testkit.ts";
import { makeHandler } from "./handler.ts";

const URL_ = "http://x/functions/v1/healthapp-dashboard-ingest";
const good = JSON.stringify({ schema: 1, generatedAt: "2026-11-14T14:59:00Z", blocks: {} });
const post = (key: string | null, body: BodyInit | null = good, extra: Record<string, string> = {}) =>
  new Request(URL_, { method: "POST", body, headers: { ...(key === null ? {} : { "x-dashboard-key": key }), ...extra } });

async function status(req: Request, o = deps()) {
  const r = await makeHandler(o.d)(req);
  const body = await r.json();
  return { r, body, store: o.store };
}

Deno.test("key matrix: no key 401, wrong key 401, view key on ingest 401, right key 200", async () => {
  for (const key of [null, "", "wrong", "p".repeat(63), PUSH + "x", VIEW]) {
    const { r, store } = await status(post(key));
    assertEquals(r.status, 401, `key ${key === null ? "none" : key.slice(0, 3)}`);
    assertEquals(store.writes.length, 0, "nothing is written on a refusal");
  }
  const { r, body, store } = await status(post(PUSH));
  assertEquals(r.status, 200);
  assertEquals(body.ok, true);
  assertEquals(store.writes.length, 1);
});

Deno.test("a good call responds no-store, has no CORS, and sets receivedAt from the server clock", async () => {
  const o = deps();
  const { r } = await status(post(PUSH, JSON.stringify({ schema: 1, receivedAt: "1999-01-01T00:00:00Z", x: 1 }), { origin: "https://healthapp-dashboard.pages.dev" }), o);
  assertEquals(r.headers.get("cache-control"), "no-store");
  assertEquals(r.headers.get("access-control-allow-origin"), null);
  const written = JSON.parse(o.store.writes[0]);
  assertEquals(written.receivedAt, "2026-11-14T15:00:00.000Z");
  assertEquals(written.x, 1);
  assertEquals(written.schema, 1);
});

Deno.test("OPTIONS and GET are refused with 405 and no CORS", async () => {
  for (const method of ["OPTIONS", "GET", "PUT", "DELETE"]) {
    const r = await makeHandler(deps().d)(new Request(URL_, { method, headers: { origin: "https://healthapp-dashboard.pages.dev", "x-dashboard-key": PUSH } }));
    assertEquals(r.status, 405, method);
    assertEquals(r.headers.get("access-control-allow-origin"), null);
    await r.body?.cancel();
  }
});

Deno.test("size limit: exactly 256 KB passes, one byte more is 413, declared and streamed", async () => {
  const pad = (n: number) => {
    const head = '{"schema":1,"pad":"', tail = '"}';
    return head + "a".repeat(n - head.length - tail.length) + tail;
  };
  assertEquals((await status(post(PUSH, pad(MAX_BODY_BYTES)))).r.status, 200);
  assertEquals((await status(post(PUSH, pad(MAX_BODY_BYTES + 1)))).r.status, 413);
  // no content-length: a stream that keeps going is cut at the limit
  const chunk = new TextEncoder().encode("a".repeat(65536));
  let sent = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(c) {
      if (sent++ >= 10) return c.close();
      c.enqueue(chunk);
    },
  });
  const req = new Request(URL_, { method: "POST", body: stream, headers: { "x-dashboard-key": PUSH }, duplex: "half" } as RequestInit);
  const { r, store } = await status(req);
  assertEquals(r.status, 413);
  assertEquals(store.writes.length, 0);
  assertEquals(sent < 10, true, "the stream was cancelled, not read to the end");
});

Deno.test("a declared length over the limit is refused before any byte is read", async () => {
  let pulls = 0;
  const chunk = new TextEncoder().encode("a".repeat(65536));
  const stream = new ReadableStream<Uint8Array>({ pull(c) { pulls++; c.enqueue(chunk); } });
  const req = new Request(URL_, { method: "POST", body: stream, headers: { "x-dashboard-key": PUSH, "content-length": String(MAX_BODY_BYTES + 1) }, duplex: "half" } as RequestInit);
  const { r, store } = await status(req);
  assertEquals(r.status, 413);
  assertEquals(store.writes.length, 0);
  assertEquals(pulls <= 2, true, "at most the stream's own prefetch, " + pulls);
});

Deno.test("schema must be exactly 1; not JSON, arrays, strings and invalid UTF-8 are 400", async () => {
  const bad = ["", "not json", "[]", '"x"', "null", "{}", '{"schema":2}', '{"schema":"1"}', '{"schema":true}'];
  for (const b of bad) assertEquals((await status(post(PUSH, b))).r.status, 400, b);
  assertEquals((await status(post(PUSH, new Uint8Array([0x7b, 0xff, 0xfe, 0x7d])))).r.status, 400);
  assertEquals((await status(post(PUSH, '{"schema":1}'))).r.status, 200);
});

Deno.test("a body that holds something key-shaped is 400 and is not stored", async () => {
  const jwt = "eyJ" + "a".repeat(40);
  const bodies = ["lin" + "_api_" + "abc", jwt, "sb" + "_secret_" + "abc", "sbp" + "_" + "a".repeat(24), "SUPABASE_SERVICE" + "_ROLE_KEY=" + "a".repeat(30)];
  for (const secret of bodies) {
    const { r, store } = await status(post(PUSH, JSON.stringify({ schema: 1, tasks: { title: secret } })));
    assertEquals(r.status, 400, secret.slice(0, 6));
    assertEquals(store.writes.length, 0);
  }
  // ordinary words next to the patterns do not trip it
  assertEquals((await status(post(PUSH, JSON.stringify({ schema: 1, t: "RLS: service_role grants, eyJ short, sb_ prefix" })))).r.status, 200);
});

Deno.test("an unset, short or identical secret refuses everything with 503, never a clean 401 or 200", async () => {
  const cases: Record<string, string>[] = [
    { HEALTHAPP_DASHBOARD_PUSH_KEY: "" },
    { HEALTHAPP_DASHBOARD_PUSH_KEY: "short" },
    { HEALTHAPP_DASHBOARD_VIEW_KEY: "" },
    { HEALTHAPP_DASHBOARD_VIEW_KEY: PUSH },
  ];
  for (const vars of cases) {
    const { r, store } = await status(post(PUSH), deps({ vars }));
    assertEquals(r.status, 503, JSON.stringify(Object.keys(vars)));
    assertEquals(store.writes.length, 0);
  }
  const o = deps({ env: () => undefined });
  assertEquals((await status(post(PUSH), o)).r.status, 503);
});

Deno.test("a storage failure is 502 and the answer does not echo the error", async () => {
  const store = { ...fakeStore(), put: () => Promise.reject(new Error("secret-detail-" + PUSH)) };
  const { r, body } = await status(post(PUSH), deps({ store }));
  assertEquals(r.status, 502);
  assertEquals(JSON.stringify(body).includes("secret-detail"), false);
  assertNotEquals(r.status, 200);
});

Deno.test("nothing is logged for a refused or accepted call (no body, no header value)", async () => {
  const seen: unknown[][] = [];
  const orig = { log: console.log, error: console.error, warn: console.warn, info: console.info };
  console.log = console.error = console.warn = console.info = (...a: unknown[]) => void seen.push(a);
  try {
    await status(post("wrong-key-value"));
    await status(post(PUSH, '{"schema":1,"marker":"BODY-MARKER"}'));
  } finally {
    Object.assign(console, orig);
  }
  assertEquals(JSON.stringify(seen).includes("BODY-MARKER"), false);
  assertEquals(JSON.stringify(seen).includes("wrong-key-value"), false);
  assertEquals(JSON.stringify(seen).includes(PUSH), false);
});
