// healthapp-doc-create (MIN-4475; cto-review settlement 5): a draft document row and a signed
// upload for the private bucket. The patient PUTs the photo there, then calls extract-exam.
import { bucketFor, DocCreateRequest, type DocCreateResponse } from "../_shared/contract.ts";
import { type Auth, authenticate, type Blobs, readJson, type Store } from "../_shared/docs.ts";
import { fail, headersFor, json } from "../_shared/http.ts";

export interface Deps {
  auth: Auth;
  store: Pick<Store, "roleOf" | "createDraft" | "discardDraft">;
  blobs: Pick<Blobs, "createSignedUpload">;
}

export function makeHandler(deps: Deps) {
  return async function handle(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headersFor(req) });
    if (req.method !== "POST") return fail(req, 400, "bad_request", "POST only");
    const who = await authenticate(req, deps, ["patient"]);
    if (who instanceof Response) return who;
    const body = await readJson(req);
    if (!body.ok) return fail(req, 400, "bad_request", "body must be JSON");
    const parsed = DocCreateRequest.safeParse(body.body);
    if (!parsed.success) return fail(req, 400, "bad_request", "content_type and size_bytes are required (max 20 MB)");
    if (parsed.data.content_type === "application/pdf") {
      return fail(req, 400, "bad_request", "PDF is not supported yet. Upload a photo (JPEG, PNG or WebP).");
    }

    const bucket = bucketFor(who.env);
    const doc = await deps.store.createDraft(who.env, who.uid, parsed.data.content_type);
    const up = await deps.blobs.createSignedUpload(bucket, doc.storage_path);
    if (!up) {
      await deps.store.discardDraft(who.env, who.uid, doc.id);
      return fail(req, 500, "internal", "Could not prepare the upload.");
    }
    const out: DocCreateResponse = {
      doc_id: doc.id,
      bucket,
      path: doc.storage_path,
      token: up.token,
      signed_url: up.signed_url,
    };
    return json(req, 200, out);
  };
}
