import { assertEquals } from "jsr:@std/assert@1";
import { type Deps, GLOBAL_MAX_TRIES, makeHandler, MAX_TRIES, type Session } from "./handler.ts";

const PASS = "correct-passcode";
const DEMO_PASS = "correct-demo-passcode";
const FOUNDER_ID = "0b6d3a58-1c2e-4f7a-8d90-5e4f3a2b1c00";
const PW = "p".repeat(32);

function fakeDeps(over: Partial<Deps> = {}) {
  const tries = new Map<string, number>();
  const signIns: string[] = [];
  const deps: Deps = {
    secret: (n) => (n === "HEALTHAPP_DEMO_PASSCODE" ? PASS : n === "HEALTHAPP_DEMO_PASSCODE_DEMO" ? DEMO_PASS : PW),
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
    signInUser(email) {
      signIns.push(`user:${email}`);
      const env = email.split("@")[0].split(".")[1];
      const s: Session = {
        access_token: "fat", refresh_token: "frt", expires_at: 1794729600,
        user: { id: FOUNDER_ID, app_metadata: { app: "healthapp", env } },
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

Deno.test("a global ceiling: callers who each send a new x-forwarded-for are still stopped at 30 a minute (MIN-4492)", async () => {
  const { deps, signIns } = fakeDeps();
  const h = makeHandler(deps);
  const codes: number[] = [];
  for (let i = 0; i < GLOBAL_MAX_TRIES; i++) {
    codes.push((await h(req({ persona: "patient", passcode: "nope" }, { "x-forwarded-for": `198.51.100.${i}` }))).status);
  }
  assertEquals(codes.every((c) => c === 401), true);
  const next = await h(req({ persona: "patient", passcode: PASS }, { "x-forwarded-for": "203.0.113.200" }));
  assertEquals(next.status, 429);
  assertEquals((await next.json()).error.code, "rate_limited");
  assertEquals(signIns.length, 0); // refused before the passcode or a sign-in is looked at
});

Deno.test("tries refused by the per-address limit do not eat the global ceiling", async () => {
  const { deps } = fakeDeps();
  const h = makeHandler(deps);
  for (let i = 0; i < 60; i++) await h(req({ persona: "patient", passcode: "nope" })); // one address, 55 refused
  // 5 counted, so a fresh address still has the rest of the ceiling
  assertEquals((await h(req({ persona: "patient", passcode: PASS }, { "x-forwarded-for": "198.51.100.77" }))).status, 200);
});

Deno.test("the global ceiling store failing closes the door (503), never opens it", async () => {
  const { deps } = fakeDeps({
    allowTry: (_e, key) => (key === "global" ? Promise.reject(new Error("down")) : Promise.resolve(true)),
  });
  assertEquals((await makeHandler(deps)(req({ persona: "patient", passcode: PASS }))).status, 503);
});

const demoReq = (persona: string, passcode: string, headers: Record<string, string> = {}) =>
  req({ persona, passcode }, { "x-healthapp-env": "demo", ...headers });

Deno.test("demo, founder, the demo passcode: 200, his session, founder.demo address, no password used (MIN-4541)", async () => {
  const { deps, signIns } = fakeDeps();
  const res = await makeHandler(deps)(demoReq("founder", DEMO_PASS));
  assertEquals(res.status, 200);
  const b = await res.json();
  assertEquals([b.access_token, b.user_id, b.persona, b.role], ["fat", FOUNDER_ID, "founder", "patient"]);
  assertEquals(signIns, ["user:founder.demo@healthapp.invalid"]);
});

Deno.test("demo: the dev passcode is refused, the founder is not signed in (MIN-4541)", async () => {
  const { deps, signIns } = fakeDeps();
  const res = await makeHandler(deps)(demoReq("founder", PASS));
  assertEquals(res.status, 401);
  assertEquals((await res.json()).error.code, "bad_passcode");
  assertEquals(signIns.length, 0);
});

Deno.test("dev: the founder persona is a 400 with either passcode, and nobody is signed in (MIN-4541)", async () => {
  const { deps, signIns } = fakeDeps();
  const h = makeHandler(deps);
  assertEquals((await h(req({ persona: "founder", passcode: PASS }))).status, 400);
  assertEquals((await h(req({ persona: "founder", passcode: DEMO_PASS }))).status, 400);
  assertEquals(signIns.length, 0);
});

Deno.test("dev: the demo passcode does not open dev for patient or doctor (MIN-4541)", async () => {
  const { deps, signIns } = fakeDeps();
  assertEquals((await makeHandler(deps)(req({ persona: "patient", passcode: DEMO_PASS }))).status, 401);
  assertEquals(signIns.length, 0);
});

Deno.test("demo: patient and doctor sign in with the demo passcode and their demo address (MIN-4541)", async () => {
  const { deps, signIns } = fakeDeps();
  const h = makeHandler(deps);
  assertEquals((await h(demoReq("doctor", DEMO_PASS))).status, 200);
  assertEquals((await h(demoReq("patient", PASS))).status, 401);
  assertEquals(signIns, ["user:doctor.demo@healthapp.invalid"]);
});

Deno.test("demo: every persona goes through the link path, signIn(password) is never called, even with no persona password set (MIN-4541 F1)", async () => {
  const called: string[] = [];
  const { deps } = fakeDeps({
    secret: (n) => (n === "HEALTHAPP_DEMO_PASSCODE_DEMO" ? DEMO_PASS : n === "HEALTHAPP_DEMO_PASSCODE" ? PASS : undefined),
    signIn: (email) => { called.push(`password:${email}`); return Promise.resolve(null); },
  });
  const h = makeHandler(deps);
  for (const p of ["patient", "doctor", "founder"]) {
    const res = await h(demoReq(p, DEMO_PASS, { "x-forwarded-for": `198.51.100.${p.length}` }));
    assertEquals(res.status, 200);
  }
  assertEquals(called, []);
});

Deno.test("dev: personas still sign in with the persona password, not the link (MIN-4541 F1)", async () => {
  const links: string[] = [];
  const { deps, signIns } = fakeDeps({ signInUser: (e) => { links.push(e); return Promise.resolve(null); } });
  assertEquals((await makeHandler(deps)(req({ persona: "patient", passcode: PASS }))).status, 200);
  assertEquals(signIns, ["patient.dev@healthapp.invalid"]);
  assertEquals(links, []);
});

Deno.test("demo: no demo passcode configured fails closed, even for the right dev passcode (MIN-4541)", async () => {
  const { deps, signIns } = fakeDeps({ secret: (n) => (n === "HEALTHAPP_DEMO_PASSCODE" ? PASS : n === "HEALTHAPP_DEMO_PASSCODE_DEMO" ? undefined : PW) });
  assertEquals((await makeHandler(deps)(demoReq("founder", PASS))).status, 500);
  assertEquals(signIns.length, 0);
});

Deno.test("demo founder: a session without the demo marker is refused, a failed link is a 500 (MIN-4541)", async () => {
  const wrong = fakeDeps({
    signInUser: () => Promise.resolve({
      access_token: "x", refresh_token: "y", expires_at: 1,
      user: { id: FOUNDER_ID, app_metadata: { app: "healthapp", env: "dev" } },
    }),
  }).deps;
  assertEquals((await makeHandler(wrong)(demoReq("founder", DEMO_PASS))).status, 403);
  const none = fakeDeps({ signInUser: () => Promise.resolve(null) }).deps;
  assertEquals((await makeHandler(none)(demoReq("founder", DEMO_PASS))).status, 500);
});

Deno.test("demo founder: the same limits apply: 6th try per address and the global ceiling (MIN-4541)", async () => {
  const { deps } = fakeDeps();
  const h = makeHandler(deps);
  for (let i = 0; i < MAX_TRIES; i++) await h(demoReq("founder", "nope"));
  assertEquals((await h(demoReq("founder", DEMO_PASS))).status, 429);
  const g = fakeDeps().deps;
  const hg = makeHandler(g);
  for (let i = 0; i < GLOBAL_MAX_TRIES; i++) await hg(demoReq("founder", "nope", { "x-forwarded-for": `198.51.100.${i}` }));
  assertEquals((await hg(demoReq("founder", DEMO_PASS, { "x-forwarded-for": "203.0.113.200" }))).status, 429);
});
