// healthapp-diagnoses (MIN-4662; CTO decision on MIN-4660 §3): possible diagnoses for the doctor to evaluate.
// One JSON answer, on request only, never stored. A doctor with a live grant only: a patient gets 403 wrong_role,
// an ended, refused, revoked or somebody else's grant gets 403 grant_expired. Off by default per environment
// (secret HEALTHAPP_DIAGNOSES_ENVS): an environment that is not listed gets 200 status "off", with no grant read,
// no record read and no model call. The model answers against a forced schema with short ids; the server then
// checks every statement against the lines it cites, sorts by name and drops what it cannot verify
// (_shared/diagnoses.ts). Logs carry codes, counts and timings only: never a condition, a statement or a term.
import { DiagnosesRequest, type DiagnosesResponse } from "../_shared/contract.ts";
import { type Auth, authenticate, readJson, type Store } from "../_shared/docs.ts";
import { fail, headersFor, json } from "../_shared/http.ts";
import { type JsonCall, type JsonResult, ModelError } from "../_shared/model.ts";
import { type AssistantStore } from "../_shared/assistant_pg.ts";
import { buildFacts, type PatientRecord } from "../_shared/assistant.ts";
import { better, citationCount, DIAGNOSES_SYSTEM, diagnosesParts, ModelDiagnoses, verify, type Verified } from "../_shared/diagnoses.ts";

/** The whole function stays well under the platform limit: two model calls at most, 50 s together. */
export const BUDGET_MS = 50_000;
/** A second call is made only if this much of the budget is left. */
export const RETRY_MIN_LEFT_MS = 12_000;

export interface Deps {
  auth: Auth;
  store: Pick<Store, "roleOf"> & AssistantStore;
  generate(call: JsonCall<ModelDiagnoses>): Promise<JsonResult<ModelDiagnoses>>;
  log(line: Record<string, unknown>): void;
  now(): number;
  /** The value of HEALTHAPP_DIAGNOSES_ENVS, read on every request so the switch needs no deploy. */
  enabledEnvs(): string | undefined;
  /** The record reader's row cap per kind (ROW_CAP): a record that reaches it is marked truncated. */
  rowCap: number;
}

const ended = (req: Request) => fail(req, 403, "grant_expired", "Access to this patient's record has ended.");
const ZERO = { facts: 0, items: 0, citations: 0, guard_drops: 0, errors: 0 };

export function makeHandler(deps: Deps) {
  return async function handle(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headersFor(req) });
    if (req.method !== "POST") return fail(req, 400, "bad_request", "POST only");
    const started = deps.now();
    const who = await authenticate(req, deps, ["doctor"]);
    if (who instanceof Response) return who;
    const body = await readJson(req);
    if (!body.ok) return fail(req, 400, "bad_request", "body must be JSON");
    const parsed = DiagnosesRequest.safeParse(body.body);
    if (!parsed.success) return fail(req, 400, "bad_request", "grant_id is required");
    const { grant_id } = parsed.data;

    const log = (status: string, c: typeof ZERO, attempts: number, model: string | null, extra: Record<string, unknown> = {}) =>
      deps.log({
        fn: "diagnoses", env: who.env, status, facts: c.facts, items: c.items, citations: c.citations,
        guard_drops: c.guard_drops, attempts, model, ...extra, ms: deps.now() - started,
      });
    const answer = (status: "ok" | "none" | "off", items: DiagnosesResponse["items"], truncated: boolean, counts: DiagnosesResponse["counts"]) => {
      const out: DiagnosesResponse = {
        run_id: crypto.randomUUID(), status, items, truncated, counts, created_at: new Date(deps.now()).toISOString(),
      };
      return out;
    };

    // Off by default, per environment. Decided here, before any read and before any model call.
    const enabled = (deps.enabledEnvs() ?? "").split(",").map((s) => s.trim().toLowerCase());
    if (!enabled.includes(who.env)) {
      log("off", ZERO, 0, null);
      return json(req, 200, answer("off", [], false, ZERO));
    }

    let rec: PatientRecord | null;
    try {
      const grant = await deps.store.grantState(who.env, grant_id, who.uid);
      if (!grant || !grant.live) {
        log("ended", ZERO, 0, null);
        return ended(req);
      }
      rec = await deps.store.record(who.env, grant_id, who.uid);
    } catch {
      log("error", { ...ZERO, errors: 1 }, 0, null);
      return fail(req, 500, "internal", "Possible diagnoses could not be loaded.");
    }
    if (!rec) {
      log("ended", ZERO, 0, null); // the grant ended between the two reads
      return ended(req);
    }
    const facts = buildFacts(rec);
    const cap = deps.rowCap;
    const truncated = rec.results.length >= cap || rec.findings.length >= cap || rec.diary.length >= cap;

    let best: Verified | null = null;
    let attempts = 0;
    let model: string | null = null;
    if (facts.size > 0) {
      let failures: string[] = [];
      try {
        for (let attempt = 1; attempt <= 2; attempt++) {
          const left = BUDGET_MS - (deps.now() - started);
          if (attempt > 1 && left < RETRY_MIN_LEFT_MS) break;
          const r = await deps.generate({
            system: DIAGNOSES_SYSTEM,
            parts: diagnosesParts(facts, failures),
            schema: ModelDiagnoses,
            timeoutMs: Math.max(5_000, left - 1_000),
            maxAttempts: 2,
          });
          attempts = attempt;
          model = r.model;
          const cur = verify(r.data, facts, rec);
          best = best ? better(best, cur) : cur;
          failures = cur.failures;
          if (failures.length === 0) break;
        }
      } catch (e) {
        const kind = e instanceof ModelError ? e.kind : "unexpected";
        log("model_error", { ...ZERO, facts: facts.size, errors: 1 }, attempts, model, {
          kind, http: e instanceof ModelError ? (e.status ?? null) : null,
          // Gemini's reason, on dev only (synthetic data); demo logs the code only (MIN-4662, MIN-4526).
          ...(who.env === "dev" && e instanceof ModelError && e.detail ? { detail: e.detail } : {}),
        });
        if (!best) {
          return kind === "config"
            ? fail(req, 500, "internal", "Possible diagnoses is not configured.")
            : fail(req, 503, "model_unavailable", "The list could not be made in time. Try again.");
        }
        // the retry failed but a first, checked list exists: show that one
      }
    }

    const items = best?.items ?? [];
    const counts = {
      facts: facts.size, items: items.length, citations: citationCount(items), guard_drops: best?.drops ?? 0, errors: 0,
    };
    const status = items.length > 0 ? "ok" : "none";
    log(status, counts, attempts, model);
    return json(req, 200, answer(status, items, truncated, counts));
  };
}
