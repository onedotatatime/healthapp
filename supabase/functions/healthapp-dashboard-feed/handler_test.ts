import { assertEquals } from "jsr:@std/assert@1";
import { deps, fakeStore, PUSH, VIEW } from "../_shared/testkit.ts";
import { makeHandler } from "./handler.ts";

const URL_ = "http://x/functions/v1/healthapp-dashboard-feed";
const SNAP = '{"schema":1,"generatedAt":"2026-11-14T14:59:00Z","blocks":{}}';
const get = (key: string | null, extra: Record<string, string> = {}) =>
  new Request(URL_, { method: "GET", headers: { ...(key === null ? {} : { "x-dashboard-key": key }), ...extra } });
const ORIGIN = "https://healthapp-dashboard.pages.dev";

Deno.test("key matrix: no key 401, wrong key 401, push key on feed 401, right key 200 with the snapshot", async () => {
  for (const key of [null, "", "wrong", "v".repeat(63), VIEW + "x", PUSH]) {
    const store = fakeStore(SNAP);
    const r = await makeHandler(deps({ store }).d)(get(key));
    assertEquals(r.status, 401, `key ${key === null ? "none" : key.slice(0, 3)}`);
    assertEquals(store.reads, 0, "no read on a refusal");
    assertEquals((await r.json()).error, "unauthorized");
  }
  const r = await makeHandler(deps({ store: fakeStore(SNAP) }).d)(get(VIEW));
  assertEquals(r.status, 200);
  assertEquals(await r.text(), SNAP);
});

Deno.test("a good read is application/json and no-store; a 401 is no-store too", async () => {
  const o = deps({ store: fakeStore(SNAP) });
  const ok = await makeHandler(o.d)(get(VIEW));
  assertEquals(ok.headers.get("cache-control"), "no-store");
  assertEquals(ok.headers.get("content-type"), "application/json");
  await ok.body?.cancel();
  const no = await makeHandler(o.d)(get("nope"));
  assertEquals(no.headers.get("cache-control"), "no-store");
  await no.body?.cancel();
});

Deno.test("no snapshot yet is 404, a storage error is 502 and does not echo the error", async () => {
  const none = await makeHandler(deps({ store: fakeStore(null) }).d)(get(VIEW));
  assertEquals(none.status, 404);
  await none.body?.cancel();
  const store = { ...fakeStore(), get: () => Promise.reject(new Error("detail-" + VIEW)) };
  const r = await makeHandler(deps({ store }).d)(get(VIEW));
  assertEquals(r.status, 502);
  assertEquals((await r.text()).includes("detail"), false);
});

Deno.test("CORS: the dashboard origin and its previews are echoed; others, and localhost by default, are not", async () => {
  const h = makeHandler(deps({ store: fakeStore(SNAP) }).d);
  for (const o of [ORIGIN, "https://abc123.healthapp-dashboard.pages.dev", "https://staging.healthapp-dashboard.pages.dev"]) {
    const r = await h(get(VIEW, { origin: o }));
    assertEquals(r.headers.get("access-control-allow-origin"), o, o);
    assertEquals(r.headers.get("vary"), "Origin");
    await r.body?.cancel();
  }
  for (const o of ["https://evil.example", "https://healthapp-dashboard.pages.dev.evil.example", "https://healthapp-dashboard-pages.dev", "https://xhealthapp-dashboard.pages.dev", "https://a.b.healthapp-dashboard.pages.dev", "https://-.healthapp-dashboard.pages.dev.evil.example", "https://healthapp-8ui.pages.dev", "http://127.0.0.1:8765", "null", "http://healthapp-dashboard.pages.dev"]) {
    const r = await h(get(VIEW, { origin: o }));
    assertEquals(r.headers.get("access-control-allow-origin"), null, o);
    await r.body?.cancel();
  }
});

Deno.test("CORS: HEALTHAPP_DASHBOARD_ALLOWED_ORIGINS adds exact origins only", async () => {
  const vars = { HEALTHAPP_DASHBOARD_ALLOWED_ORIGINS: "http://127.0.0.1:8765, https://dash.example.com" };
  const h = makeHandler(deps({ store: fakeStore(SNAP), vars }).d);
  for (const o of ["http://127.0.0.1:8765", "https://dash.example.com"]) {
    const r = await h(get(VIEW, { origin: o }));
    assertEquals(r.headers.get("access-control-allow-origin"), o);
    await r.body?.cancel();
  }
  for (const o of ["http://127.0.0.1:8766", "https://dash.example.com.evil.example", "http://127.0.0.1"]) {
    const r = await h(get(VIEW, { origin: o }));
    assertEquals(r.headers.get("access-control-allow-origin"), null, o);
    await r.body?.cancel();
  }
});

Deno.test("preflight: allowed origin gets 204 with the key header allowed; a disallowed origin gets none", async () => {
  const h = makeHandler(deps().d);
  const ok = await h(new Request(URL_, { method: "OPTIONS", headers: { origin: ORIGIN } }));
  assertEquals(ok.status, 204);
  assertEquals(ok.headers.get("access-control-allow-origin"), ORIGIN);
  assertEquals(ok.headers.get("access-control-allow-headers")?.includes("x-dashboard-key"), true);
  assertEquals(ok.headers.get("access-control-allow-methods"), "GET, OPTIONS");
  const bad = await h(new Request(URL_, { method: "OPTIONS", headers: { origin: "https://evil.example" } }));
  assertEquals(bad.headers.get("access-control-allow-origin"), null);
});

Deno.test("POST, PUT, DELETE are 405", async () => {
  for (const method of ["POST", "PUT", "DELETE"]) {
    const r = await makeHandler(deps().d)(new Request(URL_, { method, headers: { "x-dashboard-key": VIEW } }));
    assertEquals(r.status, 405, method);
    await r.body?.cancel();
  }
});

Deno.test("an unset, short or identical secret refuses everything with 503", async () => {
  const cases: Record<string, string>[] = [
    { HEALTHAPP_DASHBOARD_VIEW_KEY: "" },
    { HEALTHAPP_DASHBOARD_VIEW_KEY: "short" },
    { HEALTHAPP_DASHBOARD_PUSH_KEY: "" },
    { HEALTHAPP_DASHBOARD_PUSH_KEY: VIEW },
  ];
  for (const vars of cases) {
    const store = fakeStore(SNAP);
    const r = await makeHandler(deps({ store, vars }).d)(get(VIEW));
    assertEquals(r.status, 503, JSON.stringify(Object.keys(vars)));
    assertEquals(store.reads, 0);
    await r.body?.cancel();
  }
});

Deno.test("nothing is logged for a refused or accepted read", async () => {
  const seen: unknown[][] = [];
  const orig = { log: console.log, error: console.error, warn: console.warn, info: console.info };
  console.log = console.error = console.warn = console.info = (...a: unknown[]) => void seen.push(a);
  try {
    const h = makeHandler(deps({ store: fakeStore(SNAP) }).d);
    await (await h(get("wrong-key-value"))).text();
    await (await h(get(VIEW))).text();
  } finally {
    Object.assign(console, orig);
  }
  assertEquals(JSON.stringify(seen).includes("wrong-key-value"), false);
  assertEquals(JSON.stringify(seen).includes(VIEW), false);
});
