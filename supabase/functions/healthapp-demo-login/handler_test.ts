import { assertEquals } from "jsr:@std/assert@1";
import { type Deps, makeHandler, MAX_TRIES, type Session } from "./handler.ts";

const PASS = "correct-passcode";
const PW = "p".repeat(32);

function fakeDeps(over: Partial<Deps> = {}) {
  const tries = new Map<string, number>();
  const signIns: string[] = [];
  const deps: Deps = {
    secret: (n) => (n === "HEALTHAPP_DEMO_PASSCODE" ? PASS : PW),
    allowTry(_env, key, max) {
      const n = (tries.get(key) ?? 0) + 1;
      tries.set(key, n);
      return Promise.resolve(n <= max);
    },
    signIn(email, password) {
      signIns.push(email);
      if (password !== PW) return Promise.resolve(null);
      const env = email.split("@")[0].split(".")[1];
      const s: Session = {
        access_token: "at", refresh_token: "rt", expires_at: 1794729600,
        user: { id: "6f1d2c3b-4a59-4e2f-9b1a-0c8d7e6f5a41", app_metadata: { app: "healthapp", env } },
      };
      return Promise.resolve(s);
    },
    ...over,
  };
  return { deps, signIns };
}

function req(body: unknown, headers: Record<string, string> = {}) {
  return new Request("https://x/functions/v1/healthapp-demo-login", {
    method: "POST",
    headers: { "x-healthapp-env": "dev", "content-type": "application/json", "x-forwarded-for": "203.0.113.7", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

Deno.test("right passcode: 200, a session, no-store, the persona's dev address", async () => {
  const { deps, signIns } = fakeDeps();
  const res = await makeHandler(deps)(req({ persona: "doctor", passcode: PASS }));
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("cache-control"), "no-store");
  const b = await res.json();
  assertEquals([b.access_token, b.refresh_token, b.persona, b.role], ["at", "rt", "doctor", "doctor"]);
  assertEquals(signIns, ["doctor.dev@healthapp.invalid"]);
});

Deno.test("wrong passcode: 401 bad_passcode and no sign-in attempted", async () => {
  const { deps, signIns } = fakeDeps();
  const res = await makeHandler(deps)(req({ persona: "patient", passcode: "nope" }));
  assertEquals(res.status, 401);
  assertEquals((await res.json()).error.code, "bad_passcode");
  assertEquals(signIns.length, 0);
});

Deno.test("the sixth try in a minute is refused, even with the right passcode", async () => {
  const { deps } = fakeDeps();
  const h = makeHandler(deps);
  const codes: number[] = [];
  for (let i = 0; i < MAX_TRIES; i++) codes.push((await h(req({ persona: "patient", passcode: "nope" }))).status);
  const sixth = await h(req({ persona: "patient", passcode: PASS }));
  assertEquals(codes, [401, 401, 401, 401, 401]);
  assertEquals(sixth.status, 429);
  assertEquals((await sixth.json()).error.code, "rate_limited");
  // another address is not limited
  assertEquals((await h(req({ persona: "patient", passcode: PASS }, { "x-forwarded-for": "198.51.100.9" }))).status, 200);
});

Deno.test("env header, body and method are checked before anything else", async () => {
  const { deps, signIns } = fakeDeps();
  const h = makeHandler(deps);
  assertEquals((await h(req({ persona: "patient", passcode: PASS }, { "x-healthapp-env": "prod" }))).status, 400);
  assertEquals((await h(req({ persona: "admin", passcode: PASS }))).status, 400);
  assertEquals((await h(req("not json"))).status, 400);
  assertEquals((await h(new Request("https://x", { method: "GET", headers: { "x-healthapp-env": "dev" } }))).status, 400);
  assertEquals(signIns.length, 0);
});

Deno.test("a user without the healthapp marker for this env is refused", async () => {
  const { deps } = fakeDeps({
    signIn: () => Promise.resolve({
      access_token: "at", refresh_token: "rt", expires_at: 1,
      user: { id: "6f1d2c3b-4a59-4e2f-9b1a-0c8d7e6f5a41", app_metadata: { app: "healthapp", env: "demo" } },
    }),
  });
  assertEquals((await makeHandler(deps)(req({ persona: "patient", passcode: PASS }))).status, 403);
});

Deno.test("not configured, or the rate store down: fails closed", async () => {
  assertEquals((await makeHandler(fakeDeps({ secret: () => undefined }).deps)(req({ persona: "patient", passcode: PASS }))).status, 500);
  const down = fakeDeps({ allowTry: () => Promise.reject(new Error("x")) }).deps;
  assertEquals((await makeHandler(down)(req({ persona: "patient", passcode: PASS }))).status, 503);
});

Deno.test("preflight from the Pages origin answers 204 with CORS", async () => {
  const res = await makeHandler(fakeDeps().deps)(new Request("https://x", {
    method: "OPTIONS",
    headers: { origin: "https://staging.healthapp-8ui.pages.dev" },
  }));
  assertEquals(res.status, 204);
  assertEquals(res.headers.get("access-control-allow-origin"), "https://staging.healthapp-8ui.pages.dev");
});
