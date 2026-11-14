import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { makeHandler, MAX_TRIES, type ResetCounts } from "./handler.ts";
import { RESET_SQL, SCHEMA } from "./sql.ts";

const PASS = "correct-passcode";
const COUNTS: ResetCounts = { grants: 2, handshake_tokens: 1, assistant_turns: 3, documents: 13, diary_entries: 0 };

function setup() {
  const calls = { reset: 0, tries: 0 };
  const h = makeHandler({
    secret: () => PASS,
    allowTry: () => Promise.resolve(++calls.tries <= MAX_TRIES),
    reset: () => {
      calls.reset++;
      return Promise.resolve(COUNTS);
    },
  });
  return { h, calls };
}
const req = (body: unknown, env = "dev") =>
  new Request("https://x/functions/v1/healthapp-demo-reset", {
    method: "POST",
    headers: { "x-healthapp-env": env, "content-type": "application/json", "x-forwarded-for": "203.0.113.7" },
    body: JSON.stringify(body),
  });

Deno.test("right passcode on dev: 200 and the counts removed", async () => {
  const { h, calls } = setup();
  const res = await h(req({ passcode: PASS }));
  assertEquals(res.status, 200);
  assertEquals(await res.json(), { ok: true, removed: COUNTS });
  assertEquals(calls.reset, 1);
});

Deno.test("wrong or missing passcode: 401 / 400 and nothing is reset", async () => {
  const { h, calls } = setup();
  const bad = await h(req({ passcode: "nope" }));
  assertEquals([bad.status, (await bad.json()).error.code], [401, "bad_passcode"]);
  assertEquals((await h(req({}))).status, 400);
  assertEquals(calls.reset, 0);
});

Deno.test("any env but dev is refused before the passcode is read", async () => {
  const { h, calls } = setup();
  for (const env of ["demo", "prod", ""]) assertEquals((await h(req({ passcode: PASS }, env))).status, 400);
  assertEquals(calls.reset, 0);
  assertEquals(calls.tries, 0);
});

Deno.test("sixth try in a minute is 429, even with the right passcode", async () => {
  const { h, calls } = setup();
  for (let i = 0; i < MAX_TRIES; i++) await h(req({ passcode: "nope" }));
  assertEquals((await h(req({ passcode: PASS }))).status, 429);
  assertEquals(calls.reset, 0);
});

Deno.test("preflight answers 204 with CORS", async () => {
  const res = await setup().h(new Request("https://x", { method: "OPTIONS", headers: { origin: "https://staging.healthapp-8ui.pages.dev" } }));
  assertEquals(res.status, 204);
  assertEquals(res.headers.get("access-control-allow-origin"), "https://staging.healthapp-8ui.pages.dev");
});

Deno.test("the SQL is dev-only, synthetic-scoped, and keeps the seeded ids", () => {
  assertEquals(SCHEMA, "healthapp_dev");
  assertEquals(/healthapp_demo|healthapp-demo/.test(RESET_SQL), false);
  assertEquals(/\$\{|__SCHEMA__/.test(RESET_SQL), false);
  assertStringIncludes(RESET_SQL, "patient.dev@healthapp.invalid");
  assertStringIncludes(RESET_SQL, "5eed0000-0000-4000-%");
  assertStringIncludes(RESET_SQL, "md5('min-4505:persona:letter')");
  // every delete names the schema and carries a where clause
  const deletes = RESET_SQL.match(/delete from [^\n]*/g) ?? [];
  assertEquals(deletes.length, 5);
  for (const d of deletes) assertEquals(/delete from healthapp_dev\.\w+ (\w+ )?where /.test(d), true, d);
});
