// healthapp-extract-exam (MIN-4475; PRD 10.4): one synchronous call, 60 s at most. Reads the patient's
// uploaded photo, asks the model once (forced schema), then the server validates and decides. A refusal
// stores nothing and deletes the upload. Logs only a status, a reason code and timings.
import { bytesToBase64 } from "../_shared/b64.ts";
import { bucketFor, type DocumentDraft, DocumentRow, ExtractRequest, type ExtractResponse } from "../_shared/contract.ts";
import { type Auth, authenticate, type Blobs, readJson, type Store } from "../_shared/docs.ts";
import { build, EXTRACT_SYSTEM, ModelExtract } from "../_shared/extract.ts";
import { fail, headersFor, json } from "../_shared/http.ts";
import { type JsonCall, type JsonResult, ModelError } from "../_shared/model.ts";

/** The whole function stays under 60 s: the model gets what is left after the download. */
export const MODEL_BUDGET_MS = 52_000;

export interface Deps {
  auth: Auth;
  store: Pick<Store, "roleOf" | "getOwn" | "saveExtraction" | "discardDraft">;
  blobs: Pick<Blobs, "download" | "remove">;
  generate(call: JsonCall<ModelExtract>): Promise<JsonResult<ModelExtract>>;
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

    const cur = await deps.store.getOwn(who.env, who.uid, parsed.data.doc_id);
    if (!cur) return fail(req, 404, "not_found", "No such document.");
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

    const saved = await deps.store.saveExtraction(who.env, who.uid, cur.document.id, built.draft, sha);
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
    const out: ExtractResponse = { outcome: "draft", draft };
    return json(req, 200, out);
  };
}
