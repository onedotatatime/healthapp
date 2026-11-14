// healthapp-assistant (MIN-4487; PRD 10.9; cto-review §3 rows 1 to 4): the doctor's cited answers.
// One JSON answer, never streamed. A doctor with a live grant only: a patient gets 403 wrong_role, an
// ended, refused, revoked or somebody else's grant gets 403 grant_expired and no row is read.
// The model answers against a forced schema using short ids; the server then checks every cited id
// and every number and date against the cited rows before anything is shown (_shared/assistant.ts).
// Logs carry codes, counts and timings only, never the question, the record or the answer.
import { AssistantRequest, type AssistantResponse } from "../_shared/contract.ts";
import { type Auth, authenticate, readJson, type Store } from "../_shared/docs.ts";
import { fail, headersFor, json } from "../_shared/http.ts";
import { type JsonCall, type JsonResult, ModelError } from "../_shared/model.ts";
import { type AssistantStore } from "../_shared/assistant_pg.ts";
import { ASK_SYSTEM, askParts, better, buildFacts, check, type Checked, type Final, finalize, ModelAnswer } from "../_shared/assistant.ts";

/** The whole function stays well under the platform limit: two model calls at most, 50 s together. */
export const BUDGET_MS = 50_000;
/** A second call is made only if this much of the budget is left. */
export const RETRY_MIN_LEFT_MS = 12_000;

export interface Deps {
  auth: Auth;
  store: Pick<Store, "roleOf"> & AssistantStore;
  generate(call: JsonCall<ModelAnswer>): Promise<JsonResult<ModelAnswer>>;
  log(line: Record<string, unknown>): void;
  now(): number;
}

const ended = (req: Request) => fail(req, 403, "grant_expired", "Access to this patient's record has ended.");

export function makeHandler(deps: Deps) {
  return async function handle(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headersFor(req) });
    if (req.method !== "POST") return fail(req, 400, "bad_request", "POST only");
    const started = deps.now();
    const who = await authenticate(req, deps, ["doctor"]);
    if (who instanceof Response) return who;
    const body = await readJson(req);
    if (!body.ok) return fail(req, 400, "bad_request", "body must be JSON");
    const parsed = AssistantRequest.safeParse(body.body);
    if (!parsed.success) return fail(req, 400, "bad_request", "grant_id and mode are required");
    const { grant_id, mode } = parsed.data;
    const question = parsed.data.question?.trim() ?? "";
    if (mode !== "ask") return fail(req, 400, "bad_request", "This mode is not available yet.");
    if (!question) return fail(req, 400, "bad_request", "A question is required.");

    const grant = await deps.store.grantState(who.env, grant_id, who.uid);
    if (!grant || !grant.live) return ended(req);
    const rec = await deps.store.record(who.env, grant_id, who.uid);
    if (!rec) return ended(req); // the grant ended between the two reads
    const facts = buildFacts(rec);

    let final: Final = { not_in_record: true, segments: [] };
    let attempts = 0;
    let dropped = 0;
    let model: string | null = null;
    if (facts.size > 0) {
      let failures: string[] = [];
      let best: { final: Final; checked: Checked } | null = null;
      try {
        for (let attempt = 1; attempt <= 2; attempt++) {
          const left = BUDGET_MS - (deps.now() - started);
          if (attempt > 1 && left < RETRY_MIN_LEFT_MS) break;
          const r = await deps.generate({
            system: ASK_SYSTEM,
            parts: askParts(facts, question, failures),
            schema: ModelAnswer,
            timeoutMs: Math.max(5_000, left - 1_000),
            maxAttempts: 2,
          });
          attempts = attempt;
          model = r.model;
          const checked = check(r.data, facts);
          const cur = { final: finalize(r.data, checked), checked };
          best = best ? better(best, cur) : cur;
          failures = checked.failures;
          if (failures.length === 0) break;
        }
      } catch (e) {
        const kind = e instanceof ModelError ? e.kind : "unexpected";
        deps.log({ fn: "assistant", status: "model_error", kind, http: e instanceof ModelError ? (e.status ?? null) : null, ms: deps.now() - started });
        if (!best) {
          return kind === "config"
            ? fail(req, 500, "internal", "The assistant is not configured.")
            : fail(req, 503, "model_unavailable", "The assistant did not answer in time. Try again.");
        }
        // the retry failed but a first, checked answer exists: show that one
      }
      if (best) {
        final = best.final;
        dropped = best.checked.dropped;
      }
    }

    const out: AssistantResponse = {
      turn_id: crypto.randomUUID(),
      mode: "ask",
      not_in_record: final.not_in_record,
      segments: final.segments,
      possibilities: [],
      created_at: new Date(deps.now()).toISOString(),
    };
    deps.log({
      fn: "assistant", status: "ok", facts: facts.size, segments: out.segments.length, dropped, attempts,
      not_in_record: out.not_in_record, model, ms: deps.now() - started,
    });
    return json(req, 200, out);
  };
}
