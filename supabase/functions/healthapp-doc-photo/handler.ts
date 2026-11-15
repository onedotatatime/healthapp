// healthapp-doc-photo (MIN-4475): a signed link to the original photo, valid 60 seconds. The patient
// opens their own (draft or confirmed, nothing else; MIN-4637); a doctor opens a confirmed one only inside a live grant on
// that patient, and the link never outlives the grant. The fingerprint check is out of scope (unchecked).
import { bucketFor, DocPhotoRequest, type DocPhotoResponse, UploadMime } from "../_shared/contract.ts";
import { type Auth, authenticate, type Blobs, readJson, type Store } from "../_shared/docs.ts";
import { fail, headersFor, json } from "../_shared/http.ts";

export const LINK_SECONDS = 60;

export interface Deps {
  auth: Auth;
  store: Pick<Store, "roleOf" | "getOwn" | "getAny" | "liveGrantEnd">;
  blobs: Pick<Blobs, "signedUrl">;
  now(): number;
}

export function makeHandler(deps: Deps) {
  return async function handle(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headersFor(req) });
    if (req.method !== "POST") return fail(req, 400, "bad_request", "POST only");
    const who = await authenticate(req, deps, ["patient", "doctor"]);
    if (who instanceof Response) return who;
    const body = await readJson(req);
    if (!body.ok) return fail(req, 400, "bad_request", "body must be JSON");
    const parsed = DocPhotoRequest.safeParse(body.body);
    if (!parsed.success) return fail(req, 400, "bad_request", "doc_id is required");

    let ttl = LINK_SECONDS;
    let st;
    if (who.role === "patient") {
      st = await deps.store.getOwn(who.env, who.uid, parsed.data.doc_id);
      // The owner sees the photo of a draft or a saved exam only. A refused row keeps its original for 14 days so it can
      // be read again (MIN-4637), and that photo is never shown, to the owner or anyone: it may be someone else's paper.
      if (!st || !(st.document.status === "draft" || st.document.status === "confirmed")) return fail(req, 404, "not_found", "No such document.");
    } else {
      st = await deps.store.getAny(who.env, parsed.data.doc_id);
      if (!st || st.document.status !== "confirmed") return fail(req, 404, "not_found", "No such document.");
      const end = parsed.data.grant_id
        ? await deps.store.liveGrantEnd(who.env, parsed.data.grant_id, who.uid, st.document.patient_id)
        : null;
      if (!end) return fail(req, 403, "grant_expired", "Access to this patient's record has ended.");
      ttl = Math.min(LINK_SECONDS, Math.floor((Date.parse(end) - deps.now()) / 1000));
      if (ttl < 1) return fail(req, 403, "grant_expired", "Access to this patient's record has ended.");
    }
    const path = st.meta.storage_path;
    const mime = UploadMime.safeParse(st.meta.content_type);
    if (!path || !mime.success) return fail(req, 404, "not_found", "This document has no photo.");
    const url = await deps.blobs.signedUrl(bucketFor(who.env), path, ttl);
    if (!url) return fail(req, 404, "not_found", "This document has no photo.");
    const out: DocPhotoResponse = {
      signed_url: url,
      expires_at: new Date(deps.now() + ttl * 1000).toISOString(),
      content_type: mime.data,
      fingerprint: "unchecked",
    };
    return json(req, 200, out);
  };
}
