// healthapp-simulate-live (MIN-4674; CTO decision on MIN-4670, founder 2026-11-15: "you must do it"): at the doctor's click
// a real boxd machine is created, generates the 5,000 SYNTHETIC patients, sends the run back and is deleted, while the
// response streams one JSON line per thing that happened (NDJSON). Synthetic in, synthetic out: the input is three
// embedded scripts, a size and a seed; no patient row is read or written (the role check on sign-in is the only read).
//
// Guards, in order: a signed-in doctor (401/403/400 before the stream); the kill switch HEALTHAPP_SIMULATE_LIVE
// (`on`, `dev` for dev callers only, anything else off); one run at a time; 100 runs per rolling 24 h; 20 s for the
// whole run. From the stream on the answer is always 200 and a run that is not live ends with
// {"t":"end","live":false,"reason":"off"|"busy"|"cap"|"timeout"|"error"}.
//
// The boxd sequence runs apart from the response: `delete` happens in `finally` whether or not the browser is still
// connected, and `deleteAfter: 120` on the machine is the backstop. The key is never read here (index.ts builds the
// client); nothing from the request reaches a command; logs carry codes and timings only.
import { type Auth, authenticate, type Store } from "../_shared/docs.ts";
import { fail, headersFor, sha256Hex } from "../_shared/http.ts";
import { SIMULATE_SCRIPTS } from "../_shared/simulate_scripts.ts";

/** Same size, sarcoid pattern and seed as the recorded run (data/synthetic/run-5000.json: n 5000, rare_sarcoid_like 6, seed 20261114). */
export const N = 5000;
export const SARCOID = 6;
export const LIMIT_MS = 20_000;
export const LOCK_TTL_SECONDS = 30;
export const DAY_KEY = "simulate-live:day";
export const DAY_MAX = 100;
export const DAY_SECONDS = 86_400;
export const DELETE_AFTER_SECONDS = 120;
/** boxd's default machine image: the user is `boxd`, home `/home/boxd`, python3 3.12 is installed. */
export const DIR = "/home/boxd/sim";
export const RUN_FILE = "run-5000.json";
/** Constants only. Nothing from the request is ever put in a command. */
export const RUN_COMMAND =
  `cd ${DIR} && python3 generate.py out --n ${N} --sarcoid ${SARCOID} && python3 build_run.py out ${RUN_FILE} && sha256sum generate.py match.py build_run.py ${RUN_FILE}`;

export type Reason = "off" | "busy" | "cap" | "timeout" | "error";

export interface MachineInfo {
  id: string;
  name: string;
  region: string | null;
  vcpu: number;
  memoryBytes: number;
}

/** The boxd calls the run needs. index.ts adapts the SDK to it; the tests use a fake. Every call has its own deadline. */
export interface BoxdPort {
  create(p: { name: string; shared: true; deleteAfter: number }): Promise<MachineInfo>;
  waitUntilReady(id: string): Promise<void>;
  exec(id: string, command: string[]): Promise<{ exitCode: number; stdout: string }>;
  upload(id: string, path: string, content: string): Promise<void>;
  download(id: string, path: string): Promise<Uint8Array>;
  remove(id: string): Promise<void>;
}

export interface Deps {
  auth: Auth;
  store: Pick<Store, "roleOf">;
  /** The value of HEALTHAPP_SIMULATE_LIVE, read at every request so `supabase secrets set` applies at once. */
  setting(): string | undefined;
  /** The boxd client, or null when the key is not set. */
  boxd(): BoxdPort | null;
  /** The one-run-at-a-time lock. Null = a run holds it. The row stops counting after `ttlSeconds` on its own. */
  takeLock(ttlSeconds: number): Promise<number | null>;
  releaseLock(id: number): Promise<void>;
  /** Records one live run in the rolling window and says whether it is within the cap. */
  allowDay(key: string, max: number, windowSeconds: number): Promise<boolean>;
  now(): number;
  /** Overrides LIMIT_MS (tests only). */
  limitMs?: number;
  /** Keeps the boxd sequence alive after the response is sent (EdgeRuntime.waitUntil on the platform). */
  background(work: Promise<unknown>): void;
  log(line: Record<string, unknown>): void;
}

/** `on`: both environments. `dev`: callers with x-healthapp-env: dev only. Anything else, or unset: off. */
export function switchAllows(setting: string | undefined, env: "dev" | "demo"): boolean {
  return setting === "on" || (setting === "dev" && env === "dev");
}

class Stop extends Error {}

const iso = (ms: number) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");
const stamp = (ms: number) => iso(ms).replace(/[-:]/g, "").replace("T", "-").replace("Z", ""); // 20261115-081502
const secs = (ms: number) => Math.round(ms / 100) / 10;
const GIB = 1024 ** 3;

/** An SDK timeout, a gRPC DEADLINE_EXCEEDED (4) or our own 20 s stop is a timeout; every other failure is an error. */
function reasonOf(e: unknown): Reason {
  if (e instanceof Stop) return "timeout";
  const x = e as { name?: string; grpcCode?: number };
  if (x.grpcCode === 4 || /timeout|deadline/i.test(x.name ?? "")) return "timeout";
  return "error";
}

/** `sha256sum` lines: "<64 hex>  <name>". Anything else on the machine's stdout is ignored. */
export function parseSums(stdout: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const l of stdout.split("\n")) {
    const m = /^([0-9a-f]{64})\s+\*?(\S+)\s*$/.exec(l);
    if (m) out[m[2]] = m[1];
  }
  return out;
}

export function makeHandler(deps: Deps) {
  const limitMs = deps.limitMs ?? LIMIT_MS;
  return async function handle(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headersFor(req) });
    if (req.method !== "POST") return fail(req, 400, "bad_request", "POST only");
    const who = await authenticate(req, deps, ["doctor"]);
    if (who instanceof Response) return who;
    const env = who.env;
    const on = switchAllows(deps.setting(), env);

    const enc = new TextEncoder();
    let controller: ReadableStreamDefaultController<Uint8Array> | null = null;
    let closed = false;
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        controller = c;
      },
      // The browser went away. The run does not depend on it: it carries on to the delete.
      cancel() {
        closed = true;
      },
    });
    const emit = (line: Record<string, unknown>) => {
      if (closed || !controller) return;
      try {
        controller.enqueue(enc.encode(JSON.stringify(line) + "\n"));
      } catch {
        closed = true;
      }
    };
    let ended = false;
    const end = (line: Record<string, unknown>) => {
      if (ended) return;
      ended = true;
      emit(line);
      if (!closed && controller) {
        try {
          controller.close();
        } catch { /* already closed */ }
      }
      closed = true;
    };

    const t0 = deps.now();
    let timedOut = false;
    const step = () => {
      if (timedOut) throw new Stop();
    };

    async function work(): Promise<void> {
      let box: BoxdPort | null = null;
      let machineId: string | null = null;
      let deleted = false;
      let lock: number | null = null;
      let outcome: Record<string, unknown> = { t: "end", live: false, reason: "error" satisfies Reason };
      let errName: string | undefined;
      let errCode: number | undefined;
      const timer = setTimeout(() => {
        timedOut = true;
        end({ t: "end", live: false, reason: "timeout" satisfies Reason });
      }, limitMs);
      try {
        if (!on) {
          outcome = { t: "end", live: false, reason: "off" satisfies Reason };
          return;
        }
        box = deps.boxd();
        if (!box) return; // no key: reason "error", nothing to touch
        lock = await deps.takeLock(LOCK_TTL_SECONDS);
        if (lock === null) {
          outcome = { t: "end", live: false, reason: "busy" satisfies Reason };
          return;
        }
        step();
        if (!(await deps.allowDay(DAY_KEY, DAY_MAX, DAY_SECONDS))) {
          outcome = { t: "end", live: false, reason: "cap" satisfies Reason };
          return;
        }
        step();

        const name = `healthapp-sim-${stamp(t0)}`;
        emit({ t: "start", machine: name, at: iso(t0) });
        const m = await box.create({ name, shared: true, deleteAfter: DELETE_AFTER_SECONDS });
        machineId = m.id;
        step();
        await box.waitUntilReady(m.id);
        step();
        const t1 = deps.now();
        emit({ t: "phase", id: "created", at: iso(t1), seconds: secs(t1 - t0) });

        const mk = await box.exec(m.id, ["mkdir", "-p", DIR]);
        if (mk.exitCode !== 0) throw new Error("mkdir");
        for (const [file, content] of Object.entries(SIMULATE_SCRIPTS)) {
          step();
          await box.upload(m.id, `${DIR}/${file}`, content);
        }
        step();
        const t2 = deps.now();
        emit({ t: "phase", id: "running", at: iso(t2) });
        const ran = await box.exec(m.id, ["sh", "-c", RUN_COMMAND]);
        if (ran.exitCode !== 0) throw new Error("run");
        step();
        const bytes = await box.download(m.id, `${DIR}/${RUN_FILE}`);
        step();
        const t3 = deps.now();

        // The machine says what it holds (sha256sum); the function checks it against what it sent and what it got.
        const sums = parseSums(ran.stdout);
        const script_sha256: Record<string, string> = {};
        for (const [file, content] of Object.entries(SIMULATE_SCRIPTS)) {
          const want = await sha256Hex(content);
          if (sums[file] !== want) throw new Error("script hash");
          script_sha256[file] = want;
        }
        const text = new TextDecoder().decode(bytes);
        const runSha = await sha256Hex(text);
        if (sums[RUN_FILE] !== runSha) throw new Error("run hash");
        const run = JSON.parse(text);
        if (!run || run.synthetic !== true || run.n !== N) throw new Error("run shape");
        emit({ t: "phase", id: "done", at: iso(t3), seconds: secs(t3 - t2), sha256: runSha, run });

        await box.remove(m.id);
        deleted = true;
        const t4 = deps.now();
        emit({ t: "phase", id: "deleted", at: iso(t4), seconds: secs(t4 - t3) });
        const vm = {
          provider: "boxd",
          machine: name,
          region: m.region ?? "unknown",
          size: `${m.vcpu} vCPU · ${Math.round(m.memoryBytes / GIB)} GiB`,
          started_at: iso(t0),
          seconds: secs(t4 - t0),
          phases: [
            { id: "created", at: iso(t1), seconds: secs(t1 - t0), log: "machine ready" },
            { id: "running", at: iso(t2), seconds: secs(t3 - t2), log: `generate.py --n ${N}, build_run.py` },
            { id: "done", at: iso(t3), seconds: 0.0, log: `${RUN_FILE} written` },
            { id: "deleted", at: iso(t4), seconds: secs(t4 - t3), log: "machine deleted" },
          ],
          script_sha256,
          deleted: true,
        };
        outcome = { t: "end", live: true, vm };
      } catch (e) {
        outcome = { t: "end", live: false, reason: reasonOf(e) };
        errName = e instanceof Error ? e.name : "unknown";
        errCode = (e as { grpcCode?: number }).grpcCode;
      } finally {
        clearTimeout(timer);
        // The delete does not wait for, or depend on, the browser. One attempt: deleteAfter is the backstop.
        let cleanup = "none";
        if (box && machineId && !deleted) {
          try {
            await box.remove(machineId);
            cleanup = "deleted";
          } catch {
            cleanup = "delete_failed";
          }
        }
        if (lock !== null) {
          try {
            await deps.releaseLock(lock);
          } catch {
            cleanup += ",lock_not_released";
          }
        }
        if (timedOut) outcome = { t: "end", live: false, reason: "timeout" satisfies Reason }; // what the browser was told
        const reason = outcome.live === true ? "live" : String(outcome.reason);
        deps.log({ fn: "simulate-live", outcome: reason, ms: deps.now() - t0, cleanup, error: errName, grpc: errCode, env });
        end(outcome);
      }
    }

    deps.background(work().catch((e) => deps.log({ fn: "simulate-live", outcome: "exception", error: e instanceof Error ? e.name : "unknown" })));
    return new Response(stream, {
      status: 200,
      headers: { ...headersFor(req), "Content-Type": "application/x-ndjson", "X-Accel-Buffering": "no" },
    });
  };
}
