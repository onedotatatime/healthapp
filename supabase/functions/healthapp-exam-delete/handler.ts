// healthapp-exam-delete (MIN-4556; CTO decision on MIN-4555): the patient deletes an upload that is not saved,
// file included. A refused upload has no file left; a failed one still has its photo. The file goes first and the
// row second, so a failed delete leaves the row to try again instead of a file nobody can see. No model.
import { bucketFor, ExamDeleteRequest, type ExamDeleteResponse } from "../_shared/contract.ts";
import { type Auth, authenticate, type Blobs, readJson, type Store } from "../_shared/docs.ts";
import { fail, headersFor, json } from "../_shared/http.ts";

export interface Deps {
  auth: Auth;
  store: Pick<Store, "roleOf" | "getOwn" | "deleteUnsaved">;
  blobs: Pick<Blobs, "remove">;
  log(line: Record<string, unknown>): void;
}

export function makeHandler(deps: Deps) {
  return async function handle(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headersFor(req) });
    if (req.method !== "POST") return fail(req, 400, "bad_request", "POST only");
    const who = await authenticate(req, deps, ["patient"]);
    if (who instanceof Response) return who;
    const body = await readJson(req);
    if (!body.ok) return fail(req, 400, "bad_request", "body must be JSON");
    const parsed = ExamDeleteRequest.safeParse(body.body);
    if (!parsed.success) return fail(req, 400, "bad_request", "doc_id is required");

    const cur = await deps.store.getOwn(who.env, who.uid, parsed.data.doc_id);
    if (!cur || cur.document.status === "confirmed") return fail(req, 404, "not_found", "No such upload.");
    const path = cur.meta.storage_path;
    if (path && !(await deps.blobs.remove(bucketFor(who.env), path))) {
      deps.log({ fn: "exam-delete", status: "file_not_deleted" });
      return fail(req, 500, "internal", "Could not delete the file. Try again.");
    }
    if (!(await deps.store.deleteUnsaved(who.env, who.uid, cur.document.id))) return fail(req, 404, "not_found", "No such upload.");
    deps.log({ fn: "exam-delete", status: "deleted", was: cur.document.status });
    const out: ExamDeleteResponse = { deleted: true, doc_id: cur.document.id };
    return json(req, 200, out);
  };
}
