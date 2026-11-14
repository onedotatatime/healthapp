// healthapp-extract-exam (MIN-4475; PRD 10.4; background since MIN-4556, CTO decision on MIN-4555).
// The phone kicks it right after the upload and does not wait. The function takes the upload with one atomic
// update (queued/failed -> reading), answers 202 at once, and the whole reading runs after the answer
// (EdgeRuntime.waitUntil): the model reads the photo once with one retry, the server validates and decides whose
// document it is, saves the draft, then runs the file analysis on what is left of the budget. A refusal deletes the
// file and keeps the reason code only. Logs carry a status, a reason code and timings, never a word of the document.
import { analyseFile } from "../_shared/analysis.ts";
import { bytesToBase64 } from "../_shared/b64.ts";
import {
  type AnalyseResponse,
  bucketFor,
  ExtractRequest,
  type ExtractResponse,
  type FailReason,
  type HealthappEnv,
  type RefusalReason,
} from "../_shared/contract.ts";
import { type Auth, authenticate, type Blobs, type DocState, readJson, type Store } from "../_shared/docs.ts";
import { build, EXTRACT_SYSTEM, ModelExtract } from "../_shared/extract.ts";
import { fail, headersFor, json } from "../_shared/http.ts";
import { matchIdentity } from "../_shared/identity.ts";
import { type JsonCall, type JsonResult, ModelError } from "../_shared/model.ts";

/** The analyse_only dev backfill answers in one call, so it keeps the old single budget. */
export const MODEL_BUDGET_MS = 52_000;
/** Reading the photo: at most this long, with one retry inside it (the platform's background limit is assumed 150 s). */
export const READ_BUDGET_MS = 60_000;
/** The file analysis after the reading: at most this long, and never more than what is left of TOTAL_BUDGET_MS. */
export const ANALYSIS_BUDGET_MS = 45_000;
export const TOTAL_BUDGET_MS = 120_000;
/** Under this much left the analysis is not started: its row says failed / budget instead. */
export const MIN_ANALYSIS_MS = 15_000;

export interface Deps {
  auth: Auth;
  store: Pick<
    Store,
    | "roleOf"
    | "getOwn"
    | "claimForReading"
    | "identityOf"
    | "saveExtraction"
    | "markRefused"
    | "markFailed"
    | "objectMeta"
    | "saveAnalysis"
  >;
  blobs: Pick<Blobs, "download" | "remove">;
  generate<T>(call: JsonCall<T>): Promise<JsonResult<T>>;
  /** Keeps the work alive after the response is sent (EdgeRuntime.waitUntil on the platform). */
  background(work: Promise<unknown>): void;
  log(line: Record<string, unknown>): void;
  now(): number;
}

async function sha256Bytes(b: Uint8Array): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", b.slice());
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export function makeHandler(deps: Deps) {
  return async function handle(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headersFor(req) });
    if (req.method !== "POST") return fail(req, 400, "bad_request", "POST only");
    const started = deps.now();
    const who = await authenticate(req, deps, ["patient"]);
    if (who instanceof Response) return who;
    const body = await readJson(req);
    if (!body.ok) return fail(req, 400, "bad_request", "body must be JSON");
    const parsed = ExtractRequest.safeParse(body.body);
    if (!parsed.success) return fail(req, 400, "bad_request", "doc_id is required");

    // MIN-4549 (CTO): the second-pass-only mode is a dev backfill tool; demo and any other env refuse it.
    if (parsed.data.analyse_only && who.env !== "dev") return fail(req, 400, "bad_request", "analyse_only is dev only");
    if (parsed.data.analyse_only) {
      // MIN-4549: only the file analysis, for this patient's own saved document (the dev backfill script).
      const cur = await deps.store.getOwn(who.env, who.uid, parsed.data.doc_id);
      if (!cur) return fail(req, 404, "not_found", "No such document.");
      const o = await analyseFile(deps, { env: who.env, patientId: who.uid, state: cur, budgetMs: MODEL_BUDGET_MS });
      const done: AnalyseResponse = { outcome: "analysed", ...o };
      return json(req, 200, done);
    }

    // The claim is the whole decision: one atomic update. A second kick, a row that is already reading, saved or
    // refused, or one read too many times claims nothing, and the answer is the same 202: nothing happens.
    const claimed = await deps.store.claimForReading(who.env, who.uid, parsed.data.doc_id);
    if (!claimed) {
      const own = await deps.store.getOwn(who.env, who.uid, parsed.data.doc_id);
      if (!own) return fail(req, 404, "not_found", "No such document.");
      deps.log({ fn: "extract-exam", status: "not_claimed", row: own.document.status });
    } else {
      deps.log({ fn: "extract-exam", status: "reading", ms: deps.now() - started });
      deps.background(readInBackground(deps, { env: who.env, uid: who.uid, state: claimed, started }));
    }
    const out: ExtractResponse = { outcome: "queued" };
    return json(req, 202, out);
  };
}

const FAIL_OF: Record<string, FailReason> = {
  config: "config",
  timeout: "model_timeout",
  http: "model_http",
  invalid: "model_invalid",
};

/** Everything after the 202. It never throws: a failure is the row's status and reason code, never an error for
 *  a patient who is no longer connected. Defined after makeHandler so the session check is the first thing in the file. */
async function readInBackground(
  deps: Deps,
  ctx: { env: HealthappEnv; uid: string; state: DocState; started: number },
): Promise<void> {
  const { env, uid, state, started } = ctx;
  const id = state.document.id;
  const bucket = bucketFor(env);
  const path = state.meta.storage_path;
  const mime = state.meta.content_type ?? null;
  const left = () => TOTAL_BUDGET_MS - (deps.now() - started);
  const failed = async (reason: FailReason, extra: Record<string, unknown> = {}) => {
    await deps.store.markFailed(env, uid, id, reason);
    deps.log({ fn: "extract-exam", status: "failed", reason, ...extra, ms: deps.now() - started });
  };
  // A refusal deletes the file first and writes the row second: if the delete fails the row is failed, never
  // refused with a file still in the bucket.
  const refused = async (reason: RefusalReason, extra: Record<string, unknown>) => {
    if (path && !(await deps.blobs.remove(bucket, path))) return await failed("delete_failed", extra);
    await deps.store.markRefused(env, uid, id, reason);
    deps.log({ fn: "extract-exam", status: "refused", reason, ...extra, ms: deps.now() - started });
  };
  try {
    if (!path) return await failed("no_file");
    if (!mime || !mime.startsWith("image/")) return await failed("unsupported_type");
    const bytes = await deps.blobs.download(bucket, path);
    if (!bytes || bytes.length === 0) return await failed("no_file");
    const sha = await sha256Bytes(bytes);

    let result: JsonResult<ModelExtract>;
    try {
      result = await deps.generate({
        system: EXTRACT_SYSTEM,
        parts: [{ inline_data: { mime_type: mime, data: bytesToBase64(bytes) } }, { text: "Read this document." }],
        schema: ModelExtract,
        timeoutMs: READ_BUDGET_MS,
        maxAttempts: 2, // the one automatic retry; then failed (CTO, MIN-4555 §3)
      });
    } catch (e) {
      const kind = e instanceof ModelError ? e.kind : "unexpected";
      return await failed(FAIL_OF[kind] ?? "error", { http: e instanceof ModelError ? (e.status ?? null) : null });
    }
    const info = { model: result.model, attempts: result.attempts };

    const built = build(result.data);
    if (!built.ok) return await refused(built.reason, info);

    // B1 (MIN-4478): whose document is it? Decided here, on the model's output and the caller's own profile row.
    // The reason code is all the row keeps: not the printed values, so no mismatch pair is stored or listed.
    const profile = await deps.store.identityOf(env, uid);
    if (!profile) return await failed("error");
    const who_ = matchIdentity(profile, built.draft.printed_name, built.draft.printed_id);
    if (!who_.ok) return await refused(who_.reason, info);

    const saved = await deps.store.saveExtraction(env, uid, id, built.draft, sha, who_.status);
    if (!saved) {
      deps.log({ fn: "extract-exam", status: "not_saved", ms: deps.now() - started }); // deleted or swept meanwhile
      return;
    }
    deps.log({
      fn: "extract-exam", status: "draft", ...info, results: saved.results.length, findings: saved.findings.length,
      ms: deps.now() - started,
    });
    // Direction 3: the second pass over the same stored file, in the same background run, on what is left of the
    // budget. Under MIN_ANALYSIS_MS left its row says failed / budget (a budget of 0 is the code's own signal).
    // A failure is a row with a code, never a reason to fail the reading.
    const room = left();
    await analyseFile(deps, {
      env, patientId: uid, state: saved, bytes,
      budgetMs: room < MIN_ANALYSIS_MS ? 0 : Math.min(ANALYSIS_BUDGET_MS, room),
    }).catch((e) => deps.log({ fn: "extract-exam", pass: "analysis", status: "not_saved", err: (e as Error)?.name ?? "error" }));
  } catch (e) {
    deps.log({ fn: "extract-exam", status: "exception", err: (e as Error)?.name ?? "error", ms: deps.now() - started });
    try {
      await deps.store.markFailed(env, uid, id, "error");
    } catch { /* the sweep marks it stuck */ }
  }
}
