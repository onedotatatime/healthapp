// healthapp-extract-exam (MIN-4475; PRD 10.4; background since MIN-4556, CTO decision on MIN-4555).
// The phone kicks it right after the upload and does not wait. The function takes the upload with one atomic
// update (queued/failed -> reading), answers 202 at once, and the whole reading runs after the answer
// (EdgeRuntime.waitUntil): the model reads the photo once with one retry, the server validates and decides whose
// document it is, saves the draft, saves it as confirmed with no tap (unchecked until its owner opens it, MIN-4555 addendum:
// the founder's choice), then runs the file analysis on what is left of the budget. A refusal keeps the reason code and
// the original photo for 14 days (MIN-4637), nothing of the reading; the photo can be read again ("Try again") or deleted
// by its owner, and my-exams deletes it once the 14 days have passed. Logs carry a status, a reason code and timings,
// never a word of the document. MIN-4689: the model also gets our LOINC list (lab_loinc) as one more text part and picks
// a code per result from it; build keeps only a code that is on the list, and the code is stored in results.loinc. A list
// that cannot be read never stops a reading: it goes on without one and every code is null.
import { analyseFile } from "../_shared/analysis.ts";
import { bytesToBase64 } from "../_shared/b64.ts";
import {
  type AnalyseResponse,
  bucketFor,
  ConfirmDocRequest,
  ExtractRequest,
  type ExtractResponse,
  type FailReason,
  type HealthappEnv,
  type RefusalReason,
} from "../_shared/contract.ts";
import { type Auth, authenticate, autoConfirmable, type Blobs, type DocState, planConfirm, readJson, type Store } from "../_shared/docs.ts";
import { build, EXTRACT_SYSTEM, type LoincRow, loincListText, ModelExtract } from "../_shared/extract.ts";
import { fail, headersFor, json } from "../_shared/http.ts";
import { matchIdentity } from "../_shared/identity.ts";
import { type JsonCall, type JsonResult, ModelError } from "../_shared/model.ts";

/** analyse_only takes a draft or a saved row only (MIN-4637); every other status, a kept refused photo included, is "no such document". */
const ANALYSABLE: readonly string[] = ["draft", "confirmed"];
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
    | "loincCodes"
  >;
  /** Read only (MIN-4637): a refusal keeps the original, so this function deletes no file. */
  blobs: Pick<Blobs, "download">;
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
      // MIN-4637 (CTO): a kept refused photo is read only for its owner's re-run, never here. Only a saved or draft row goes to the
      // model, the same rule doc-photo uses; any other status is "no such document" and writes no analysis row.
      if (!cur || !ANALYSABLE.includes(cur.document.status)) return fail(req, 404, "not_found", "No such document.");
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
  // A refusal writes the row only: the original stays where it is, with a 14-day end set by the store (MIN-4637).
  const refused = async (reason: RefusalReason, extra: Record<string, unknown>) => {
    await deps.store.markRefused(env, uid, id, reason);
    deps.log({ fn: "extract-exam", status: "refused", reason, ...extra, ms: deps.now() - started });
  };
  try {
    if (!path) return await failed("no_file");
    if (!mime || !mime.startsWith("image/")) return await failed("unsupported_type");
    const bytes = await deps.blobs.download(bucket, path);
    if (!bytes || bytes.length === 0) return await failed("no_file");
    const sha = await sha256Bytes(bytes);

    // The LOINC list (MIN-4689). Missing, empty or unreadable: the reading goes on without it, one log line says so.
    let list: LoincRow[] | null = null;
    let why = "empty";
    try {
      const rows = await deps.store.loincCodes(env);
      list = rows.length ? rows : null;
    } catch (e) {
      why = (e as { code?: string })?.code ?? (e as Error)?.name ?? "error"; // a Postgres code (42P01) or an error name, never a message
    }
    if (!list) deps.log({ fn: "extract-exam", loinc: "unavailable", why });

    let result: JsonResult<ModelExtract>;
    try {
      result = await deps.generate({
        system: EXTRACT_SYSTEM,
        parts: [
          { inline_data: { mime_type: mime, data: bytesToBase64(bytes) } },
          { text: "Read this document." },
          ...(list ? [{ text: loincListText(list) }] : []),
        ],
        schema: ModelExtract,
        timeoutMs: READ_BUDGET_MS,
        maxAttempts: 2, // the one automatic retry; then failed (CTO, MIN-4555 §3)
      });
    } catch (e) {
      const kind = e instanceof ModelError ? e.kind : "unexpected";
      return await failed(FAIL_OF[kind] ?? "error", { http: e instanceof ModelError ? (e.status ?? null) : null });
    }
    const info = { model: result.model, attempts: result.attempts };

    const built = build(result.data, list ? new Set(list.map((r) => r.loinc)) : null);
    if (!built.ok) return await refused(built.reason, info);

    // B1 (MIN-4478): whose document is it? Decided here, on the model's output and the caller's own profile row.
    // The reason code is all the row keeps: not the printed values, so no mismatch pair is stored or listed.
    const profile = await deps.store.identityOf(env, uid);
    if (!profile) return await failed("error");
    const who_ = matchIdentity(profile, built.draft.printed_name, built.draft.printed_id);
    // The log gets the counts the verdict carries (parts found, extra parts, whether an ID was printed and equal; MIN-4614), never a name or an ID.
    if (!who_.ok) return await refused(who_.reason, { ...info, ...who_.counts });

    // The founder's choice (2026-11-14, MIN-4555 addendum): a reading that got this far is saved with no tap. The store
    // confirms it in the same transaction that saves it, with the patient's own confirm plan (so the same record hash)
    // and the row marked unchecked until its owner opens it. It is the store's one confirm writer, not a second path.
    // A reading that fails the test, or a plan the shared code refuses, is saved as a draft for the patient to confirm.
    const auto = autoConfirmable(built.draft);
    const saved = await deps.store.saveExtraction(
      env, uid, id, built.draft, sha, who_.status,
      auto ? { plan: (s) => planConfirm(s, ConfirmDocRequest.parse({ doc_id: id })) } : undefined,
    );
    if (!saved) {
      deps.log({ fn: "extract-exam", status: "not_saved", ms: deps.now() - started }); // deleted or swept meanwhile
      return;
    }
    const kept = saved.document.status === "confirmed";
    if (!kept) deps.log({ fn: "extract-exam", pass: "auto_confirm", status: "skipped", why: auto ? "plan_refused" : "conditions" });
    deps.log({
      fn: "extract-exam", status: kept ? "confirmed" : "draft", ...info, results: saved.results.length,
      findings: saved.findings.length, loinc_coded: built.loinc.coded, loinc_dropped: built.loinc.dropped, ms: deps.now() - started,
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
