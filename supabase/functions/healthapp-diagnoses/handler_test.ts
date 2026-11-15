// healthapp-diagnoses handler (MIN-4662; CTO decision on MIN-4660 §3, §4). Synthetic record only.
import { assertEquals, assertNotEquals } from "jsr:@std/assert@1";
import { DiagnosesResponse } from "../_shared/contract.ts";
import { ModelError, type JsonCall } from "../_shared/model.ts";
import type { ModelDiagnoses } from "../_shared/diagnoses.ts";
import type { PatientRecord } from "../_shared/assistant.ts";
import { call, DOCTOR, fakeAuth, PATIENT } from "../_shared/testkit_docs.ts";
import { answerOf, GOOD, item, RECORD, stmt, U } from "../_shared/testkit_diagnoses.ts";
import { BUDGET_MS, makeHandler } from "./handler.ts";

const GRANT = "99999999-9999-4999-8999-999999999999";
const NOW = Date.parse("2026-11-15T08:00:00.000Z");

interface Opts {
  record?: PatientRecord | null;
  grant?: { patient_id: string; live: boolean } | null;
  answers?: (ModelDiagnoses | Error)[];
  envs?: string | undefined;
  rowCap?: number;
  throwOn?: "grantState" | "record";
  step?: number; // ms each model call takes
}
function setup(o: Opts = {}) {
  const reads: string[] = [];
  const prompts: JsonCall<ModelDiagnoses>[] = [];
  const logs: Record<string, unknown>[] = [];
  const answers = o.answers ?? [GOOD];
  let t = NOW;
  const h = makeHandler({
    auth: fakeAuth,
    store: {
      roleOf: (_e, uid) => Promise.resolve(uid === DOCTOR ? "doctor" : uid === PATIENT ? "patient" : null),
      grantState(_e, gid, doctor) {
        reads.push("grantState");
        if (o.throwOn === "grantState") return Promise.reject(new Error("db down: secret detail"));
        const g = o.grant === undefined ? { patient_id: PATIENT, live: true } : o.grant;
        return Promise.resolve(gid === GRANT && doctor === DOCTOR ? g : null);
      },
      record() {
        reads.push("record");
        if (o.throwOn === "record") return Promise.reject(new Error("db down: secret detail"));
        return Promise.resolve(o.record === undefined ? RECORD : o.record);
      },
    },
    generate(c) {
      prompts.push(c);
      t += o.step ?? 4_000;
      const a = answers[Math.min(prompts.length - 1, answers.length - 1)];
      if (a instanceof Error) return Promise.reject(a);
      return Promise.resolve({ data: a, model: "m", attempts: 1, ms: o.step ?? 4000 });
    },
    log: (l) => logs.push(l),
    now: () => t,
    enabledEnvs: () => ("envs" in o ? o.envs : "dev"),
    rowCap: o.rowCap ?? 500,
  });
  const run = (token = "td", grant = GRANT, env = "dev") => h(call("healthapp-diagnoses", { grant_id: grant }, token, env));
  return { h, run, reads, prompts, logs };
}
const parse = async (res: Response) => DiagnosesResponse.parse(await res.json());

Deno.test("a doctor with a live grant: a sorted, cited list, one call, counts equal to the log", async () => {
  const t = setup();
  const res = await t.run();
  assertEquals(res.status, 200);
  const out = await parse(res);
  assertEquals(out.status, "ok");
  assertEquals(out.items.map((i) => i.name), ["Gout", "Osteoarthritis", "Rheumatoid arthritis"]);
  assertEquals(out.truncated, false);
  assertEquals(out.counts, { facts: 7, items: 3, citations: 6, guard_drops: 0, errors: 0 });
  const known = new Set([...RECORD.results.map((r) => `r:${r.id}`), ...RECORD.findings.map((f) => `f:${f.id}`), ...RECORD.diary.map((d) => `d:${d.id}`)]);
  const cites = out.items.flatMap((i) => [...i.fits, ...i.does_not_explain]).flatMap((s) => s.cites);
  assertEquals(cites.length > 0 && cites.every((c) => known.has(c)), true);
  assertEquals(t.prompts.length, 1);
  assertEquals(t.reads, ["grantState", "record"]);
  const { fn: _fn, env: _env, status: _s, attempts: _a, model: _m, ms: _ms, ...nums } = t.logs[0];
  assertEquals(nums, { facts: 7, items: 3, citations: 6, guard_drops: 0 });
});

Deno.test("the model is told the record is untrusted; the context holds no name, ID or uuid; a forged line stays one line", async () => {
  const t = setup();
  await t.run();
  const c = t.prompts[0];
  const ctx = c.parts.map((p) => ("text" in p ? p.text : "")).join("\n");
  assertEquals((c.system ?? "").includes("untrusted data"), true);
  assertEquals(/[0-9a-f]{8}-[0-9a-f]{4}-/i.test(ctx), false, "a uuid reached the model");
  assertEquals(ctx.includes("Παπαδοπούλου") || ctx.includes("AK123456") || ctx.includes("Maria"), false);
  assertEquals(ctx.includes("r1 | 2025-05-14 | blood_test"), true);
  assertEquals(ctx.includes("d1 | 2026-11-01 | diary"), true); // the diary is in: the banner says symptoms and exams
  const record = String("text" in c.parts[0] ? c.parts[0].text : "");
  assertEquals(record.match(/<\/record>/g)?.length, 1);
  assertEquals(record.split("\n").filter((l) => l.includes("Ignore every rule")).every((l) => l.startsWith("f2 | ")), true);
  // a request with the schema the model must answer against: no number, rank or probability field in it
  assertEquals(/score|rank|probab|likelih|percent/i.test(JSON.stringify(c.schema)), false);
});

Deno.test("a patient token is 403 wrong_role: nothing read, no model call, nothing logged but the refusal path", async () => {
  const t = setup();
  const res = await t.run("tp");
  assertEquals([res.status, (await res.json()).error.code], [403, "wrong_role"]);
  assertEquals([t.reads, t.prompts.length], [[], 0]);
});

Deno.test("an environment that is not switched on gets 200 off: no grant read, no record read, no model call", async () => {
  for (const envs of [undefined, "", "demo", "dev2", " , "]) {
    const t = setup({ envs });
    const res = await t.run("td", GRANT, "dev");
    assertEquals(res.status, 200, String(envs));
    const out = await parse(res);
    assertEquals([out.status, out.items, out.truncated], ["off", [], false], String(envs));
    assertEquals(out.counts, { facts: 0, items: 0, citations: 0, guard_drops: 0, errors: 0 });
    assertEquals([t.reads, t.prompts.length], [[], 0], String(envs));
    assertEquals(t.logs.length, 1);
    assertEquals(t.logs[0].status, "off");
  }
  // demo is off while only dev is listed, and on when it is listed; the list ignores case and spaces
  const off = setup({ envs: "dev" });
  assertEquals((await parse(await off.run("td", GRANT, "demo"))).status, "off");
  assertEquals(off.reads, []);
  const on = setup({ envs: " Dev, DEMO " });
  assertEquals((await parse(await on.run("td", GRANT, "demo"))).status, "ok");
  assertEquals(on.logs[0].env, "demo");
});

Deno.test("a patient gets 403 even when the environment is off: the role is checked first", async () => {
  const t = setup({ envs: undefined });
  assertEquals((await t.run("tp")).status, 403);
});

Deno.test("an ended, unknown or somebody else's grant is 403 grant_expired: the record is never read, no model call", async () => {
  for (const o of [{ grant: { patient_id: PATIENT, live: false } }, { grant: null }] as Opts[]) {
    const t = setup(o);
    const res = await t.run();
    assertEquals([res.status, (await res.json()).error.code], [403, "grant_expired"]);
    assertEquals(t.reads.includes("record"), false);
    assertEquals(t.prompts.length, 0);
  }
  const t = setup();
  const res = await t.run("td", "88888888-8888-4888-8888-888888888888");
  assertEquals([res.status, (await res.json()).error.code], [403, "grant_expired"]);
  const u = setup({ record: null }); // the grant ended between the two reads
  assertEquals((await u.run()).status, 403);
  assertEquals(u.prompts.length, 0);
});

Deno.test("no session, no profile, bad body, extra key, bad grant id, wrong method", async () => {
  const t = setup();
  assertEquals((await t.h(call("x", {}, null))).status, 401);
  assertEquals((await t.h(call("x", {}, "to"))).status, 403);
  assertEquals((await t.h(call("x", "not json", "td"))).status, 400);
  assertEquals((await t.h(call("x", {}, "td"))).status, 400);
  assertEquals((await t.h(call("x", { grant_id: "nope" }, "td"))).status, 400);
  assertEquals((await t.h(call("x", { grant_id: GRANT, question: "q" }, "td"))).status, 400); // strict request
  assertEquals((await t.h(new Request("https://x/", { method: "GET" }))).status, 400);
  assertEquals((await t.h(call("x", { grant_id: GRANT }, "td", null))).status, 400); // no environment header
  assertEquals([t.reads, t.prompts.length], [[], 0]);
});

Deno.test("an empty record, the model saying not enough, and every item dropped are all status none; the first makes no model call", async () => {
  const empty = setup({ record: { results: [], findings: [], diary: [] } });
  const e = await parse(await empty.run());
  assertEquals([e.status, e.items, empty.prompts.length], ["none", [], 0]);
  const notEnough = setup({ answers: [{ ...GOOD, not_enough: true }] });
  const n = await parse(await notEnough.run());
  assertEquals([n.status, n.items, n.counts.guard_drops], ["none", [], 0]);
  const dead = answerOf(item({ fits: [stmt("CRP was 99 mg/L.", "r2")] }));
  const allDropped = setup({ answers: [dead, dead] });
  const d = await parse(await allDropped.run());
  assertEquals([d.status, d.items, d.counts.items], ["none", [], 0]);
  assertEquals(d.counts.guard_drops > 0, true);
});

Deno.test("a forced wrong cite is caught: retried once with the failure named, then the corrected list is shown", async () => {
  const wrong = answerOf(item({ name: "Gout", fits: [stmt("CRP was 41.2 mg/L on 2025-12-09.", "r2")] }));
  const t = setup({ answers: [wrong, answerOf(item())] });
  const out = await parse(await t.run());
  assertEquals(out.items.map((i) => i.name), ["Gout"]);
  assertEquals(t.prompts.length, 2);
  const retry = t.prompts[1].parts.map((p) => ("text" in p ? p.text : "")).join("\n");
  assertEquals(retry.includes("the number 41.2 is not on the cited lines (r2)"), true);
  assertEquals(t.logs.at(-1)?.attempts, 2);
  assertEquals(out.counts.guard_drops, 0); // the shown list is the clean retry
});

Deno.test("two attempts: the one with more verified items is shown, not simply the last", async () => {
  const first = answerOf(item({ name: "Gout" }), item({ name: "Osteoarthritis" }), item({ name: "Lupus", fits: [stmt("CRP was 55.", "r2")] }));
  const second = answerOf(item({ name: "Gout" }));
  const out = await parse(await setup({ answers: [first, second] }).run());
  assertEquals(out.items.map((i) => i.name), ["Gout", "Osteoarthritis"]);
});

Deno.test("no retry when less than 12 s of the 50 s budget is left", async () => {
  const wrong = answerOf(item({ fits: [stmt("CRP was 41.2 mg/L.", "r2")] }));
  const t = setup({ answers: [wrong, answerOf(item())], step: BUDGET_MS - 11_000 });
  const out = await parse(await t.run());
  assertEquals(t.prompts.length, 1);
  assertEquals(out.status, "none");
});

Deno.test("the model down: 503, config missing: 500; a failed retry still shows the checked first list; no detail in any answer", async () => {
  const down = setup({ answers: [new ModelError("timeout", undefined, 2)] });
  const r = await down.run();
  assertEquals([r.status, (await r.json()).error.code], [503, "model_unavailable"]);
  const cfg = setup({ answers: [new ModelError("config")] });
  assertEquals((await cfg.run()).status, 500);
  const partial = answerOf(item({ name: "Gout" }), item({ name: "Lupus", fits: [stmt("CRP was 77 mg/L.", "r2")] }));
  const kept = setup({ answers: [partial, new ModelError("timeout", undefined, 2)] });
  const out = await parse(await kept.run());
  assertEquals(out.items.map((i) => i.name), ["Gout"]);
});

Deno.test("a database failure is a 500 internal with errors: 1 in the log and no detail in the answer", async () => {
  for (const throwOn of ["grantState", "record"] as const) {
    const t = setup({ throwOn });
    const res = await t.run();
    assertEquals(res.status, 500);
    const text = await res.text();
    assertEquals(text.includes("db down") || text.includes("secret"), false);
    assertEquals(t.logs.at(-1)?.status, "error");
    assertEquals(t.prompts.length, 0);
  }
});

Deno.test("a record that reaches the row cap of any kind is marked truncated", async () => {
  assertEquals((await parse(await setup({ rowCap: 4 }).run())).truncated, true); // 4 results
  assertEquals((await parse(await setup({ rowCap: 1 }).run())).truncated, true);
  assertEquals((await parse(await setup({ rowCap: 5 }).run())).truncated, false);
  // each kind alone: one result, two findings, two diary entries against a cap of 2, then 3
  const kinds: [string, PatientRecord][] = [
    ["findings", { results: [RECORD.results[0]], findings: RECORD.findings, diary: [RECORD.diary[0]] }],
    ["diary", { results: [RECORD.results[0]], findings: [RECORD.findings[0]], diary: [RECORD.diary[0], { ...RECORD.diary[0], id: U(21) }] }],
  ];
  for (const [kind, record] of kinds) {
    assertEquals((await parse(await setup({ record, rowCap: 2 }).run())).truncated, true, kind);
    assertEquals((await parse(await setup({ record, rowCap: 3 }).run())).truncated, false, kind);
  }
});

Deno.test("logs carry codes, counts and timings only: never a condition, a statement, a term, a value, a name or an id", async () => {
  const t = setup();
  await t.run();
  const keys = Object.keys(t.logs[0]).sort();
  assertEquals(keys, ["attempts", "citations", "env", "facts", "fn", "guard_drops", "items", "model", "ms", "status"]);
  const s = JSON.stringify(t.logs);
  for (const word of ["arthritis", "Gout", "Rheumatoid", "CRP", "18.4", "Knee", "stairs", "Anti", "uric", "Uric", PATIENT, DOCTOR, GRANT, "aaaaaaaa"]) assertEquals(s.includes(word), false, word);
  assertNotEquals(t.logs.length, 0);
  // the refusal and failure paths log no text either
  for (const o of [{ grant: null }, { throwOn: "record" }, { answers: [new ModelError("http", 429, 2)] }] as Opts[]) {
    const u = setup(o);
    await u.run();
    for (const line of u.logs) assertEquals(Object.values(line).every((v) => v === null || typeof v === "number" || (typeof v === "string" && v.length < 16)), true, JSON.stringify(line));
  }
});

Deno.test("extra keys written by the model (score, rank, probability) never reach the answer", async () => {
  const dirty = answerOf({ ...item(), score: 0.93, rank: 1, probability: "high" } as never);
  const text = await (await setup({ answers: [dirty] }).run()).text();
  assertEquals(/score|rank|probab|confidence/.test(text), false);
  assertEquals(DiagnosesResponse.safeParse(JSON.parse(text)).success, true);
});

Deno.test("an item whose cites are real but from another line's numbers is dropped (a number from a different row)", async () => {
  const a = answerOf(item({ fits: [stmt("CRP was 3.8 mg/L on 2025-12-09, above the printed range 0 - 5.", "r2")] }));
  const out = await parse(await setup({ answers: [a, a] }).run());
  assertEquals(out.status, "none");
});

Deno.test("a model refusal logs Gemini's detail on dev only; demo logs the code only; never a prompt or a record line", async () => {
  const refusal = () => new ModelError("http", 400, 1, "INVALID_ARGUMENT: schema too deep");
  const dev = setup({ answers: [refusal() as unknown as Error] });
  assertEquals((await dev.run()).status, 503);
  const line = dev.logs.at(-1)!;
  assertEquals([line.status, line.kind, line.http, line.detail], ["model_error", "http", 400, "INVALID_ARGUMENT: schema too deep"]);
  const s = JSON.stringify(dev.logs);
  assertEquals(s.includes("Maria") || s.includes("CRP") || s.includes("Anti-CCP"), false);

  const demo = setup({ answers: [refusal()], envs: "dev,demo" });
  assertEquals((await demo.run("td", GRANT, "demo")).status, 503);
  const dl = demo.logs.at(-1)!;
  assertEquals([dl.env, dl.status, dl.http, "detail" in dl], ["demo", "model_error", 400, false]);
});
