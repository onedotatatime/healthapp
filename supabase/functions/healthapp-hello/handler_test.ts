import { assertEquals } from "jsr:@std/assert@1";
import { handle } from "./handler.ts";

const URL_ = "http://x/functions/v1/healthapp-hello";
const req = (h: Record<string, string> = {}, method = "GET") => new Request(URL_, { method, headers: h });

Deno.test("dev returns 200, env dev, no-store", async () => {
  const r = handle(req({ "x-healthapp-env": "dev" }));
  assertEquals(r.status, 200);
  assertEquals(r.headers.get("cache-control"), "no-store");
  assertEquals(await r.json(), { ok: true, env: "dev" });
});

Deno.test("demo returns 200, env demo", async () => {
  const r = handle(req({ "x-healthapp-env": "demo" }));
  assertEquals(r.status, 200);
  assertEquals((await r.json()).env, "demo");
});

Deno.test("missing or unknown env header returns 400, still no-store", async () => {
  for (const h of [{} as Record<string, string>, { "x-healthapp-env": "prod" }, { "x-healthapp-env": "DEV" }]) {
    const r = handle(req(h));
    assertEquals(r.status, 400);
    assertEquals(r.headers.get("cache-control"), "no-store");
    await r.body?.cancel();
  }
});

Deno.test("CORS: allowed origins are echoed, others are not", async () => {
  const ok = [
    "https://healthapp-8ui.pages.dev",
    "https://staging.healthapp-8ui.pages.dev",
    "https://a1b2c3.healthapp-8ui.pages.dev",
    "http://localhost:5173",
  ];
  for (const o of ok) {
    const r = handle(req({ origin: o, "x-healthapp-env": "dev" }));
    assertEquals(r.headers.get("access-control-allow-origin"), o);
    await r.body?.cancel();
  }
  const bad = ["https://evil.example", "https://healthapp-8ui.pages.dev.evil.example", "https://x.evil.healthapp-8ui.pages.dev"];
  for (const o of bad) {
    const r = handle(req({ origin: o, "x-healthapp-env": "dev" }));
    assertEquals(r.headers.get("access-control-allow-origin"), null, o);
    await r.body?.cancel();
  }
});

Deno.test("preflight allows x-healthapp-env", () => {
  const r = handle(req({ origin: "https://staging.healthapp-8ui.pages.dev" }, "OPTIONS"));
  assertEquals(r.status, 204);
  assertEquals(r.headers.get("access-control-allow-headers")?.includes("x-healthapp-env"), true);
});
