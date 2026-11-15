// MIN-4674. Every boxd call is a fake: no test here creates a real machine, reads the network or holds a key.
// SYNTHETIC: the "run" below is a tiny stand-in for the 5,000-patient file; nothing here is a patient.
import { assertEquals, assertNotEquals } from "jsr:@std/assert@1";
import { sha256Hex } from "../_shared/http.ts";
import { SIMULATE_SCRIPTS } from "../_shared/simulate_scripts.ts";
import { call, DOCTOR, fakeAuth, PATIENT } from "../_shared/testkit_docs.ts";
import {
  type BoxdPort,
  DAY_KEY,
  DAY_MAX,
  DAY_SECONDS,
  type Deps,
  DIR,
  LOCK_TTL_SECONDS,
  makeHandler,
  parseSums,
  RUN_COMMAND,
  RUN_FILE,
  switchAllows,
} from "./handler.ts";

const RUN_TEXT = JSON.stringify({ synthetic: true, n: 5000, label: "Seeded synthetic data. Not real patients.", records: [{ id: "s-1" }] });
const RUN = JSON.parse(RUN_TEXT);
const T0 = Date.UTC(2026, 10, 15, 8, 15, 2);

type Hang = "create" | "ready" | "run" | "download" | "remove";
interface Opts {
  setting?: string | undefined;
  hang?: Hang;
  exitCode?: number; // of the run command
  mkdirExit?: number;
  badSums?: "script" | "run";
  runText?: string;
  throwOn?: "create" | "remove" | "run" | "lock" | "day" | "release";
  throwWith?: unknown;
  lockHeld?: boolean;
  dayFull?: boolean;
  noKey?: boolean;
  limitMs?: number;
}

async function setup(o: Opts = {}) {
  const calls: string[] = [];
  const created: Record<string, unknown>[] = [];
  const execs: string[][] = [];
  const uploads: Record<string, string> = {};
  const removed: string[] = [];
  const logs: Record<string, unknown>[] = [];
  const bg: Promise<unknown>[] = [];
  let clock = T0;
  let heldBy: number | null = o.lockHeld ? 999 : null;
  let nextLock = 1;
  const lockCalls: string[] = [];
  const dayCalls: [string, number, number][] = [];
  const gates = new Map<Hang, () => void>();
  const hung = new Set<Hang>();
  const maybeHang = (h: Hang) => {
    if (o.hang !== h || hung.has(h)) return Promise.resolve(); // only the first call of that kind hangs
    hung.add(h);
    return new Promise<void>((r) => gates.set(h, r));
  };
  const err = () => (o.throwWith ?? new Error("boxd failed"));
  const runText = o.runText ?? RUN_TEXT;
  const runSha = await sha256Hex(runText);
  const scriptSums = await Promise.all(Object.entries(SIMULATE_SCRIPTS).map(async ([n, c]) => `${await sha256Hex(c)}  ${n}`));
  const sumsFor = () =>
    ["cohort 5000 opted_in 3999", ...scriptSums.map((l, i) => (o.badSums === "script" && i === 0 ? "0".repeat(64) + l.slice(64) : l)),
      `${o.badSums === "run" ? "f".repeat(64) : runSha}  ${RUN_FILE}`].join("\n") + "\n";

  const port: BoxdPort = {
    async create(p) {
      calls.push("create");
      created.push(p);
      await maybeHang("create");
      if (o.throwOn === "create") throw err();
      return { id: "m-1", name: p.name, region: "fra", vcpu: 2, memoryBytes: 8 * 1024 ** 3 };
    },
    async waitUntilReady() {
      calls.push("ready");
      await maybeHang("ready");
    },
    async exec(_id, command) {
      execs.push(command);
      if (command[0] === "mkdir") {
        calls.push("mkdir");
        return { exitCode: o.mkdirExit ?? 0, stdout: "" };
      }
      calls.push("run");
      await maybeHang("run");
      if (o.throwOn === "run") throw err();
      return { exitCode: o.exitCode ?? 0, stdout: sumsFor() };
    },
    upload(_id, path, content) {
      calls.push("upload");
      uploads[path] = content;
      return Promise.resolve();
    },
    async download() {
      calls.push("download");
      await maybeHang("download");
      return new TextEncoder().encode(runText);
    },
    async remove(id) {
      calls.push("remove");
      removed.push(id);
      await maybeHang("remove");
      if (o.throwOn === "remove") throw err();
    },
  };
  const deps: Deps = {
    auth: fakeAuth,
    store: { roleOf: (_e, uid) => Promise.resolve(uid === DOCTOR ? "doctor" : uid === PATIENT ? "patient" : null) },
    setting: () => ("setting" in o ? o.setting : "on"),
    boxd: () => (o.noKey ? null : port),
    takeLock(ttl) {
      lockCalls.push(`take:${ttl}`);
      if (o.throwOn === "lock") return Promise.reject(new Error("db down"));
      if (heldBy !== null) return Promise.resolve(null); // check and set in one step, like the advisory lock
      heldBy = nextLock++;
      return Promise.resolve(heldBy);
    },
    releaseLock(id) {
      lockCalls.push(`release:${id}`);
      if (o.throwOn === "release") return Promise.reject(new Error("db down"));
      if (heldBy === id) heldBy = null;
      return Promise.resolve();
    },
    allowDay(key, max, seconds) {
      dayCalls.push([key, max, seconds]);
      if (o.throwOn === "day") return Promise.reject(new Error("db down"));
      return Promise.resolve(!o.dayFull);
    },
    now: () => (clock += 300),
    limitMs: o.limitMs ?? 5000,
    background: (w) => void bg.push(w),
    log: (l) => logs.push(l),
  };
  const handler = makeHandler(deps);
  const run = (token: string | null = "td", env: string | null = "dev", body: unknown = {}) => handler(call("healthapp-simulate-live", body, token, env));
  const settle = () => Promise.all(bg);
  const release = (h: Hang) => gates.get(h)?.();
  return { run, settle, release, calls, created, execs, uploads, removed, logs, lockCalls, dayCalls, deps, isHeld: () => heldBy !== null };
}

// deno-lint-ignore no-explicit-any
async function lines(res: Response): Promise<any[]> {
  const text = await res.text();
  return text.split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));
}

Deno.test("a live run: the lines in order, the real boxd sequence, the constants only, the lock and the cap", async () => {
  const t = await setup();
  // A request that tries to put its own words into a command. None of it may reach the machine.
  const res = await t.run("td", "dev", { n: 1, sarcoid: "; rm -rf /", command: "curl evil" });
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("content-type"), "application/x-ndjson");
  const l = await lines(res);
  await t.settle();
  assertEquals(l.map((x) => x.t === "phase" ? x.id : x.t), ["start", "created", "running", "done", "deleted", "end"]);
  assertEquals(l[0].machine, "healthapp-sim-20261115-081502"); // the first clock read, UTC
  assertEquals(l[0].at, "2026-11-15T08:15:02Z");
  const done = l[3];
  assertEquals(done.run, RUN);
  assertEquals(done.sha256, await sha256Hex(RUN_TEXT));
  assertEquals(typeof done.seconds, "number");
  const end = l[5];
  assertEquals(end.live, true);
  assertEquals(end.vm.provider, "boxd");
  assertEquals(end.vm.machine, l[0].machine);
  assertEquals(end.vm.size, "2 vCPU · 8 GiB");
  assertEquals(end.vm.region, "fra");
  assertEquals(end.vm.deleted, true);
  assertEquals(end.vm.phases.map((p: { id: string }) => p.id), ["created", "running", "done", "deleted"]);
  assertEquals(end.vm.script_sha256["generate.py"], await sha256Hex(SIMULATE_SCRIPTS["generate.py"]));
  assertEquals(Object.keys(end.vm.script_sha256).sort(), ["build_run.py", "generate.py", "match.py"]);

  assertEquals(t.calls, ["create", "ready", "mkdir", "upload", "upload", "upload", "run", "download", "remove"]);
  assertEquals(t.created.length, 1);
  assertEquals({ shared: t.created[0].shared, deleteAfter: t.created[0].deleteAfter }, { shared: true, deleteAfter: 120 });
  assertEquals(t.uploads, Object.fromEntries(Object.entries(SIMULATE_SCRIPTS).map(([n, c]) => [`${DIR}/${n}`, c])));
  assertEquals(t.execs, [["mkdir", "-p", DIR], ["sh", "-c", RUN_COMMAND]]);
  assertEquals(RUN_COMMAND.includes("--n 5000 --sarcoid 6"), true);
  assertEquals(t.execs.flat().join(" ").includes("rm -rf"), false);
  assertEquals(t.removed, ["m-1"]);
  assertEquals(t.lockCalls, [`take:${LOCK_TTL_SECONDS}`, "release:1"]);
  assertEquals(t.dayCalls, [[DAY_KEY, DAY_MAX, DAY_SECONDS]]);
  assertEquals([DAY_KEY, DAY_MAX, DAY_SECONDS, LOCK_TTL_SECONDS], ["simulate-live:day", 100, 86_400, 30]);
  assertEquals(t.logs.length, 1);
  assertEquals(t.logs[0].outcome, "live");
  assertEquals(t.logs[0].cleanup, "none");
});

Deno.test("kill switch: on = both, dev = dev callers only, anything else = off; off touches nothing", async () => {
  for (const [setting, env, live] of [
    ["on", "dev", true], ["on", "demo", true], ["dev", "dev", true], ["dev", "demo", false],
    [undefined, "dev", false], ["", "dev", false], ["off", "dev", false], ["ON", "dev", false], ["true", "demo", false], ["dev ", "dev", false],
  ] as const) {
    const t = await setup({ setting });
    const l = await lines(await t.run("td", env));
    await t.settle();
    assertEquals(l.at(-1).live, live, `${setting} ${env}`);
    if (!live) {
      assertEquals(l, [{ t: "end", live: false, reason: "off" }], `${setting} ${env}`);
      assertEquals([t.calls, t.lockCalls, t.dayCalls], [[], [], []], `${setting} ${env}: nothing touched`);
    }
  }
  assertEquals([switchAllows("dev", "dev"), switchAllows("dev", "demo"), switchAllows("on", "demo"), switchAllows(undefined, "dev")], [true, false, true, false]);
});

Deno.test("the switch is read at every request: changing it needs no deploy", async () => {
  let value: string | undefined = "on";
  const t = await setup();
  t.deps.setting = () => value;
  const h = makeHandler(t.deps);
  const a = await lines(await h(call("f", {}, "td", "dev")));
  value = "off";
  const b = await lines(await h(call("f", {}, "td", "dev")));
  await t.settle();
  assertEquals([a.at(-1).live, b.at(-1).reason], [true, "off"]);
});

Deno.test("sign-in: no token 401, a patient 403, no profile 403, a bad env 400, GET 400, OPTIONS 204; nothing is touched", async () => {
  const t = await setup();
  const cases: [Response, number, string?][] = [
    [await t.run(null), 401, "unauthenticated"],
    [await t.run("nope"), 401, "unauthenticated"],
    [await t.run("tp"), 403, "wrong_role"],
    [await t.run("to"), 403, "no_profile"],
    [await t.run("td", "staging"), 400, "bad_request"],
    [await t.run("td", null), 400, "bad_request"],
    [await makeHandler(t.deps)(new Request("https://x/", { method: "GET" })), 400, "bad_request"],
  ];
  for (const [res, status, code] of cases) {
    assertEquals(res.status, status);
    assertEquals((await res.json()).error.code, code);
  }
  const opt = await makeHandler(t.deps)(new Request("https://x/", { method: "OPTIONS" }));
  assertEquals(opt.status, 204);
  await t.settle();
  assertEquals([t.calls, t.lockCalls, t.dayCalls, t.logs], [[], [], [], []]);
});

Deno.test("busy: a held lock refuses the run before the cap and before boxd", async () => {
  const t = await setup({ lockHeld: true });
  const l = await lines(await t.run());
  await t.settle();
  assertEquals(l, [{ t: "end", live: false, reason: "busy" }]);
  assertEquals([t.calls, t.dayCalls], [[], []]); // a busy click does not count against the day
  assertEquals(t.lockCalls, [`take:${LOCK_TTL_SECONDS}`]); // and does not release a lock it never held
});

Deno.test("cap: the run after the cap is refused, nothing is created, the lock is given back", async () => {
  const t = await setup({ dayFull: true });
  const l = await lines(await t.run());
  await t.settle();
  assertEquals(l, [{ t: "end", live: false, reason: "cap" }]);
  assertEquals(t.calls, []);
  assertEquals(t.lockCalls, [`take:${LOCK_TTL_SECONDS}`, "release:1"]);
  assertEquals(t.isHeld(), false);
});

Deno.test("lock: two requests at the same moment give one machine; the next run after the first works", async () => {
  const t = await setup({ hang: "create" });
  const first = t.run();
  const firstRes = await first;
  const second = await lines(await t.run());
  assertEquals(second, [{ t: "end", live: false, reason: "busy" }]);
  assertEquals(t.created.length, 1);
  t.release("create");
  const l = await lines(firstRes);
  await t.settle();
  assertEquals(l.at(-1).live, true);
  assertEquals(t.created.length, 1);
  assertEquals(t.isHeld(), false);
  const third = await lines(await t.run());
  await t.settle();
  assertEquals(third.at(-1).live, true);
});

Deno.test("time limit: a slow create ends the stream with timeout inside the limit, then the machine is deleted anyway", async () => {
  const t = await setup({ hang: "create", limitMs: 40 });
  const res = await t.run();
  const l = await lines(res); // resolves only because the stream was ended at the limit, while create is still hanging
  assertEquals(l.map((x) => x.t), ["start", "end"]);
  assertEquals(l[1], { t: "end", live: false, reason: "timeout" });
  assertEquals(t.removed, []); // create has not answered yet: there is nothing to delete yet
  t.release("create");
  await t.settle();
  assertEquals(t.removed, ["m-1"]); // the late machine is deleted
  assertEquals(t.calls, ["create", "remove"]); // and nothing else ran on it
  assertEquals(t.isHeld(), false);
  assertEquals(t.logs.at(-1)?.outcome, "timeout");
  assertEquals(t.logs.at(-1)?.cleanup, "deleted");
});

Deno.test("time limit: a slow run on the machine ends with timeout, no run is sent, the machine is deleted", async () => {
  const t = await setup({ hang: "run", limitMs: 40 });
  const l = await lines(await t.run());
  assertEquals(l.map((x) => x.t === "phase" ? x.id : x.t), ["start", "created", "running", "end"]);
  assertEquals(l.at(-1), { t: "end", live: false, reason: "timeout" });
  t.release("run");
  await t.settle();
  assertEquals(t.removed, ["m-1"]);
  assertEquals(t.calls.includes("download"), false);
  assertEquals(t.isHeld(), false);
});

Deno.test("an SDK timeout (DEADLINE_EXCEEDED, or a TimeoutError) is a timeout; any other boxd failure is an error", async () => {
  const deadline = Object.assign(new Error("deadline"), { grpcCode: 4 });
  const named = Object.assign(new Error("slow"), { name: "TimeoutError" });
  for (const [thrown, reason] of [[deadline, "timeout"], [named, "timeout"], [new Error("boom"), "error"], [Object.assign(new Error("denied"), { grpcCode: 7 }), "error"]] as const) {
    const t = await setup({ throwOn: "run", throwWith: thrown });
    const l = await lines(await t.run());
    await t.settle();
    assertEquals(l.at(-1), { t: "end", live: false, reason }, String(thrown));
    assertEquals(t.removed, ["m-1"]);
    assertEquals(t.isHeld(), false);
  }
});

Deno.test("a failed run on the machine: error, no done line, the machine deleted, the lock released", async () => {
  const t = await setup({ exitCode: 1 });
  const l = await lines(await t.run());
  await t.settle();
  assertEquals(l.map((x) => x.t === "phase" ? x.id : x.t), ["start", "created", "running", "end"]);
  assertEquals(l.at(-1), { t: "end", live: false, reason: "error" });
  assertEquals(t.removed, ["m-1"]);
  assertEquals(t.isHeld(), false);
});

Deno.test("what the machine reports must match what was sent and what came back: a wrong script hash, a wrong run hash, a wrong run shape are errors", async () => {
  for (const o of [{ badSums: "script" }, { badSums: "run" }, { runText: JSON.stringify({ synthetic: false, n: 5000 }) }, { runText: JSON.stringify({ synthetic: true, n: 12 }) }, { runText: "not json" }] as Opts[]) {
    const t = await setup(o);
    const l = await lines(await t.run());
    await t.settle();
    assertEquals(l.map((x) => x.t === "phase" ? x.id : x.t).includes("done"), false, JSON.stringify(o));
    assertEquals(l.at(-1), { t: "end", live: false, reason: "error" }, JSON.stringify(o));
    assertEquals(t.removed, ["m-1"], JSON.stringify(o));
  }
});

Deno.test("a delete that fails after the run: the page is told it was not live, the delete is tried again, the lock is released", async () => {
  const t = await setup({ throwOn: "remove" });
  const l = await lines(await t.run());
  await t.settle();
  assertEquals(l.at(-1), { t: "end", live: false, reason: "error" });
  assertEquals(t.removed, ["m-1", "m-1"]);
  assertEquals(t.logs[0].cleanup, "delete_failed");
  assertEquals(t.isHeld(), false);
});

Deno.test("the delete does not depend on the browser: the stream is cancelled after the first line and the machine is still deleted", async () => {
  const t = await setup();
  const res = await t.run();
  const reader = res.body!.getReader();
  await reader.read(); // the start line
  await reader.cancel(); // the browser went away
  await t.settle();
  assertEquals(t.removed, ["m-1"]);
  assertEquals(t.isHeld(), false);
  assertEquals(t.calls.at(-1), "remove");
});

Deno.test("database trouble: a lock that cannot be taken or a cap that cannot be counted ends in error, creates nothing, frees the lock", async () => {
  const a = await setup({ throwOn: "lock" });
  assertEquals((await lines(await a.run())).at(-1), { t: "end", live: false, reason: "error" });
  await a.settle();
  assertEquals(a.calls, []);
  const b = await setup({ throwOn: "day" });
  assertEquals((await lines(await b.run())).at(-1), { t: "end", live: false, reason: "error" });
  await b.settle();
  assertEquals(b.calls, []);
  assertEquals(b.isHeld(), false);
  const c = await setup({ throwOn: "release" });
  assertEquals((await lines(await c.run())).at(-1).live, true); // a lock that cannot be released expires by itself (30 s)
  await c.settle();
  assertEquals(c.logs[0].cleanup, "none,lock_not_released");
});

Deno.test("no key configured: error, and neither the lock nor the cap is touched", async () => {
  const t = await setup({ noKey: true });
  assertEquals(await lines(await t.run()), [{ t: "end", live: false, reason: "error" }]);
  await t.settle();
  assertEquals([t.calls, t.lockCalls, t.dayCalls], [[], [], []]);
});

Deno.test("no key and no message in any line or log: a boxd error that carries a key-shaped string is reduced to a name and a code", async () => {
  const leaky = Object.assign(new Error(`401 for key ${["bxd", "SECRETSECRET123"].join("_")} on https://boxd.sh`), { name: "AuthenticationError", grpcCode: 16 });
  const t = await setup({ throwOn: "create", throwWith: leaky });
  const res = await t.run();
  const text = await res.text();
  await t.settle();
  const everything = text + JSON.stringify(t.logs);
  assertEquals(/bxd_|SECRETSECRET|boxd\.sh|401 for/.test(everything), false);
  assertEquals(t.logs.length, 1);
  assertEquals(Object.keys(t.logs[0]).sort(), ["cleanup", "env", "error", "fn", "grpc", "ms", "outcome"]);
  assertEquals([t.logs[0].error, t.logs[0].grpc, t.logs[0].outcome], ["AuthenticationError", 16, "error"]);
  const ok = await setup();
  const okText = await (await ok.run()).text();
  await ok.settle();
  assertNotEquals(okText.length, 0);
  assertEquals(/bxd_/.test(okText + JSON.stringify(ok.logs)), false);
});

Deno.test("a failed mkdir on the machine: error, nothing uploaded, no run, the machine deleted", async () => {
  const t = await setup({ mkdirExit: 1 });
  const l = await lines(await t.run());
  await t.settle();
  assertEquals(l.at(-1), { t: "end", live: false, reason: "error" });
  assertEquals(t.calls, ["create", "ready", "mkdir", "remove"]);
  assertEquals(t.isHeld(), false);
});

Deno.test("the limit hits during the final delete: the browser was told timeout, the log says the same, and the machine is still deleted once", async () => {
  const t = await setup({ hang: "remove", limitMs: 40 });
  const l = await lines(await t.run());
  assertEquals(l.map((x) => x.t === "phase" ? x.id : x.t), ["start", "created", "running", "done", "end"]);
  assertEquals(l.at(-1), { t: "end", live: false, reason: "timeout" });
  t.release("remove");
  await t.settle();
  assertEquals(t.removed, ["m-1"]); // the sequence's own delete finished: no second attempt
  assertEquals(t.logs.at(-1)?.outcome, "timeout");
  assertEquals(t.isHeld(), false);
});

Deno.test("the sources: the handler reads no environment and no database table; index.ts reads two names and logs no value", () => {
  const strip = (f: string) =>
    Deno.readTextFileSync(new URL(f, import.meta.url)).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\s\/\/.*$/gm, "");
  const h = strip("./handler.ts");
  assertEquals(/Deno\.env|console\.|\.rpc\(|\.from\(|healthapp_demo|unsafe\(/.test(h), false);
  // nothing of the request reaches a command, a name or a key: the handler passes `req` on to sign-in and reads only its method
  assertEquals(/req\.(headers|json|text|body|url|formData|arrayBuffer)|searchParams/.test(h), false);
  const idx = strip("./index.ts");
  assertEquals([...idx.matchAll(/Deno\.env\.get\("([A-Z_]+)"\)/g)].map((m) => m[1]).sort(), ["HEALTHAPP_BOXD_API_KEY", "HEALTHAPP_SIMULATE_LIVE"]);
  assertEquals(/Deno\.env\.(toObject|has|set)/.test(idx), false);
  assertEquals(idx.match(/console\./g)?.length, 1); // the one log line is the handler's own object, never the key
  assertEquals(idx.includes("log: (l) => console.log(JSON.stringify(l))"), true);
  // the SDK is the fetch-only entry: the default one needs Node's http2
  assertEquals(idx.includes('"npm:@boxd-sh/sdk@0.3.2/web"'), true);
  // every command passed to exec is a constant: no request value is interpolated
  assertEquals([...h.matchAll(/box\.exec\(([^)]*)\)/g)].map((m) => m[1]), ['m.id, ["mkdir", "-p", DIR]', 'm.id, ["sh", "-c", RUN_COMMAND]']);
});

Deno.test("sha256sum lines are parsed; the generator's own output and anything else on stdout is ignored", () => {
  const a = "a".repeat(64);
  assertEquals(parseSums(`cohort 5000 opted_in 3999\n${a}  generate.py\n${"b".repeat(64)} *run-5000.json\nnot a sum\n`), { "generate.py": a, "run-5000.json": "b".repeat(64) });
});
