import { assertEquals, assertRejects } from "jsr:@std/assert@1";
import { z } from "npm:zod@4.6.7";
import { generateJson, ModelError } from "./model.ts";

const Answer = z.object({ readable: z.boolean(), exam_date: z.string() });
const ok = (obj: unknown) =>
  new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(obj) }] } }] }), { status: 200 });
const noSleep = () => Promise.resolve();

function fakeFetch(answers: (() => Response | Promise<Response>)[]) {
  const calls: { url: string; init: RequestInit }[] = [];
  const f = ((url: string, init: RequestInit) => {
    calls.push({ url, init });
    const next = answers[Math.min(calls.length - 1, answers.length - 1)];
    return Promise.resolve(next());
  }) as unknown as typeof fetch;
  return { f, calls };
}

Deno.test("one call: schema-valid JSON, temperature 0, forced JSON schema, key in a header", async () => {
  const { f, calls } = fakeFetch([() => ok({ readable: true, exam_date: "2026-03-12" })]);
  const r = await generateJson({ parts: [{ text: "x" }], schema: Answer }, { apiKey: "k", fetch: f, sleep: noSleep });
  assertEquals(r.data, { readable: true, exam_date: "2026-03-12" });
  assertEquals(r.attempts, 1);
  const body = JSON.parse(String(calls[0].init.body));
  assertEquals(body.generationConfig.temperature, 0);
  assertEquals(body.generationConfig.responseMimeType, "application/json");
  assertEquals(body.generationConfig.responseJsonSchema.required.sort(), ["exam_date", "readable"]);
  assertEquals("$schema" in body.generationConfig.responseJsonSchema, false);
  assertEquals((calls[0].init.headers as Record<string, string>)["x-goog-api-key"], "k");
  assertEquals(calls[0].url.includes("k"), false);
});

Deno.test("retries 503 and 429, then succeeds", async () => {
  const { f, calls } = fakeFetch([
    () => new Response("", { status: 503 }),
    () => new Response("", { status: 429 }),
    () => ok({ readable: true, exam_date: "d" }),
  ]);
  const r = await generateJson({ parts: [], schema: Answer }, { apiKey: "k", fetch: f, sleep: noSleep });
  assertEquals([r.attempts, calls.length], [3, 3]);
});

Deno.test("an answer that is not the schema is retried; still wrong after 3 tries is an error", async () => {
  const { f, calls } = fakeFetch([() => ok({ readable: "yes" })]);
  const e = await assertRejects(
    () => generateJson({ parts: [], schema: Answer }, { apiKey: "k", fetch: f, sleep: noSleep }),
    ModelError,
  );
  assertEquals([e.kind, e.attempts, calls.length], ["invalid", 3, 3]);
});

Deno.test("a 400 is not retried", async () => {
  const { f, calls } = fakeFetch([() => new Response("", { status: 400 })]);
  const e = await assertRejects(
    () => generateJson({ parts: [], schema: Answer }, { apiKey: "k", fetch: f, sleep: noSleep }),
    ModelError,
  );
  assertEquals([e.kind, e.status, calls.length], ["http", 400, 1]);
});

Deno.test("the whole call is aborted at the deadline", async () => {
  const hang = ((_u: string, init: RequestInit) =>
    new Promise((_r, reject) => init.signal?.addEventListener("abort", () => reject(new DOMException("abort", "AbortError"))))) as unknown as typeof fetch;
  const t0 = Date.now();
  const e = await assertRejects(
    () => generateJson({ parts: [], schema: Answer, timeoutMs: 50 }, { apiKey: "k", fetch: hang, sleep: noSleep }),
    ModelError,
  );
  assertEquals(e.kind, "timeout");
  assertEquals(Date.now() - t0 < 1000, true);
});

Deno.test("no key: a config error before any request", async () => {
  const { f, calls } = fakeFetch([() => ok({})]);
  const e = await assertRejects(() => generateJson({ parts: [], schema: Answer }, { apiKey: undefined, fetch: f }), ModelError);
  assertEquals([e.kind, calls.length], ["config", 0]);
});

const errBody = (status: string, message: string) =>
  new Response(JSON.stringify({ error: { code: 400, status, message } }), { status: 400 });

Deno.test("a 400 puts Gemini's status and message on detail (capped at 300), not in the Error message", async () => {
  const long = "schema too large ".repeat(40);
  const { f } = fakeFetch([() => errBody("INVALID_ARGUMENT", long)]);
  const e = await assertRejects(
    () => generateJson({ parts: [], schema: Answer }, { apiKey: "k", fetch: f, sleep: noSleep }),
    ModelError,
  );
  assertEquals(e.detail, `INVALID_ARGUMENT: ${long}`.slice(0, 300));
  assertEquals(e.detail?.length, 300);
  assertEquals(e.message.includes("schema"), false);
  const { f: f2 } = fakeFetch([() => errBody("INVALID_ARGUMENT", "too deep")]);
  const e2 = await assertRejects(
    () => generateJson({ parts: [], schema: Answer }, { apiKey: "k", fetch: f2, sleep: noSleep }),
    ModelError,
  );
  assertEquals(e2.detail, "INVALID_ARGUMENT: too deep");
});

Deno.test("a 400 whose body is not JSON gives no detail; a retryable status gives none either", async () => {
  const { f } = fakeFetch([() => new Response("<html>nope</html>", { status: 400 })]);
  const e = await assertRejects(
    () => generateJson({ parts: [], schema: Answer }, { apiKey: "k", fetch: f, sleep: noSleep }),
    ModelError,
  );
  assertEquals(e.detail, undefined);
  const { f: f2 } = fakeFetch([() => new Response(JSON.stringify({ error: { status: "UNAVAILABLE", message: "busy" } }), { status: 503 })]);
  const e2 = await assertRejects(
    () => generateJson({ parts: [], schema: Answer, maxAttempts: 1 }, { apiKey: "k", fetch: f2, sleep: noSleep }),
    ModelError,
  );
  assertEquals([e2.status, e2.detail], [503, undefined]);
});
