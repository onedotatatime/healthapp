// healthapp-extract-exam (MIN-4475; PRD 10.4): one synchronous call, 60 s at most. Reads the patient's
// uploaded photo, asks the model once (forced schema), then the server validates and decides. A refusal
// stores nothing and deletes the upload. Logs only a status, a reason code and timings.
import { analyseFile } from "../_shared/analysis.ts";
import { bytesToBase64 } from "../_shared/b64.ts";
import {
  type AnalyseResponse,
  bucketFor,
  type DocumentDraft,
  DocumentRow,
  ExtractRequest,
  type ExtractResponse,
} from "../_shared/contract.ts";
import { type Auth, authenticate, type Blobs, readJson, type Store } from "../_shared/docs.ts";
import { build, EXTRACT_SYSTEM, ModelExtract } from "../_shared/extract.ts";
import { fail, headersFor, json } from "../_shared/http.ts";
import { matchIdentity, mismatchMessage } from "../_shared/identity.ts";
import { type JsonCall, type JsonResult, ModelError } from "../_shared/model.ts";

/** The whole function stays under 60 s: the model gets what is left after the download. */
export const MODEL_BUDGET_MS = 52_000;
/** The file analysis runs after the answer is sent, so it has its own, longer budget. */
export const ANALYSIS_BUDGET_MS = 45_000;

export interface Deps {
  auth: Auth;
  store: Pick<Store, "roleOf" | "getOwn" | "identityOf" | "saveExtraction" | "discardDraft" | "objectMeta" | "saveAnalysis">;
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
    const cur = await deps.store.getOwn(who.env, who.uid, parsed.data.doc_id);
    if (!cur) return fail(req, 404, "not_found", "No such document.");
    if (parsed.data.analyse_only) {
      // MIN-4549: only the file analysis, for this patient's own saved document (the dev backfill script).
      const o = await analyseFile(deps, { env: who.env, patientId: who.uid, state: cur, budgetMs: MODEL_BUDGET_MS });
      const done: AnalyseResponse = { outcome: "analysed", ...o };
      return json(req, 200, done);
    }
    if (cur.document.status !== "draft") return fail(req, 400, "bad_request", "This document is already saved.");
    const path = cur.meta.storage_path;
    const mime = cur.meta.content_type ?? null;
    if (!path || !mime || !mime.startsWith("image/")) return fail(req, 400, "bad_request", "Only photos can be read.");

    const bucket = bucketFor(who.env);
    const bytes = await deps.blobs.download(bucket, path);
    if (!bytes || bytes.length === 0) return fail(req, 400, "bad_request", "Upload the photo first, then read it.");
    const sha = await sha256Bytes(bytes);

    let result: JsonResult<ModelExtract>;
    try {
      result = await deps.generate({
        system: EXTRACT_SYSTEM,
        parts: [{ inline_data: { mime_type: mime, data: bytesToBase64(bytes) } }, { text: "Read this document." }],
        schema: ModelExtract,
        timeoutMs: Math.max(5_000, MODEL_BUDGET_MS - (deps.now() - started)),
      });
    } catch (e) {
      const kind = e instanceof ModelError ? e.kind : "unexpected";
      deps.log({
        fn: "extract-exam", status: "model_error", kind, http: e instanceof ModelError ? (e.status ?? null) : null,
        ms: deps.now() - started,
      });
      return kind === "config"
        ? fail(req, 500, "internal", "Reading is not configured.")
        : fail(req, 503, "model_unavailable", "The reader did not answer in time. Try again.");
    }

    const built = build(result.data);
    if (!built.ok) {
      await deps.store.discardDraft(who.env, who.uid, cur.document.id);
      await deps.blobs.remove(bucket, path);
      deps.log({
        fn: "extract-exam", status: "refused", reason: built.reason, model: result.model,
        attempts: result.attempts, ms: deps.now() - started,
      });
      const out: ExtractResponse = { outcome: "refused", reason: built.reason, message: built.message };
      return json(req, 200, out);
    }

    // B1 (MIN-4478): whose document is it? Decided here, on the model's output and the caller's own
    // profile row; the request carries nothing but doc_id. A refusal leaves no record, like any other.
    const profile = await deps.store.identityOf(who.env, who.uid);
    if (!profile) return fail(req, 403, "no_profile", "This account has no healthapp profile.");
    const who_ = matchIdentity(profile, built.draft.printed_name, built.draft.printed_id);
    if (!who_.ok) {
      await deps.store.discardDraft(who.env, who.uid, cur.document.id);
      await deps.blobs.remove(bucket, path);
      deps.log({
        fn: "extract-exam", status: "refused", reason: who_.reason, model: result.model,
        attempts: result.attempts, ms: deps.now() - started,
      });
      const out: ExtractResponse = {
        outcome: "refused", reason: who_.reason, message: mismatchMessage(who_),
        mismatch: { printed: who_.printed, profile: who_.profile },
      };
      return json(req, 200, out);
    }

    const saved = await deps.store.saveExtraction(who.env, who.uid, cur.document.id, built.draft, sha, who_.status);
    if (!saved) return fail(req, 400, "bad_request", "This document is already saved.");
    const draft: DocumentDraft = {
      document: DocumentRow.parse(saved.document), // kind is set by now; unknown keys are stripped
      printed_name: saved.meta.printed_name,
      printed_id: saved.meta.printed_id,
      header_confidence: built.draft.header_confidence,
      results: saved.results.map(({ patient_id: _p, ...r }) => r),
      findings: saved.findings.map(({ patient_id: _p, ...f }) => f),
    };
    deps.log({
      fn: "extract-exam", status: "draft", model: result.model, attempts: result.attempts,
      results: saved.results.length, findings: saved.findings.length, ms: deps.now() - started,
    });
    // Direction 3: the second pass, over the same stored file, after the answer is sent. A failure is a row with a
    // code, never an error for the patient, and a model that was slow cannot make the extraction slow.
    deps.background(
      analyseFile(deps, { env: who.env, patientId: who.uid, state: saved, bytes, budgetMs: ANALYSIS_BUDGET_MS })
        .catch((e) => deps.log({ fn: "extract-exam", pass: "analysis", status: "not_saved", err: (e as Error)?.name ?? "error" })),
    );
    const out: ExtractResponse = { outcome: "draft", draft };
    return json(req, 200, out);
  };
}
