// healthapp-confirm-doc (MIN-4475; PRD 10.4 step 6): the patient confirms what was read.
// Edits to values, units and dates are accepted and marked edited_by_patient. A name or ID in the
// request, or any key this function does not know, is refused with 400 before anything is read.
// Confirming twice is safe: the second call returns the saved record.
import { ConfirmDocRequest, type ConfirmDocResponse, DocumentRow } from "../_shared/contract.ts";
import {
  type Auth,
  authenticate,
  type DocState,
  forbiddenConfirmKey,
  planConfirm,
  readJson,
  type Store,
} from "../_shared/docs.ts";
import { fail, headersFor, json } from "../_shared/http.ts";

export interface Deps {
  auth: Auth;
  store: Pick<Store, "roleOf" | "confirm">;
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
    const bad = forbiddenConfirmKey(body.body);
    if (bad) {
      deps.log({ fn: "confirm-doc", status: "rejected", reason: "forbidden_field" });
      return fail(req, 400, "bad_request", "The patient name and ID cannot be edited, and no other field is accepted.");
    }
    const parsed = ConfirmDocRequest.safeParse(body.body);
    if (!parsed.success) return fail(req, 400, "bad_request", "doc_id is required; edits must be well formed");

    const r = await deps.store.confirm(who.env, who.uid, parsed.data.doc_id, (s) => planConfirm(s, parsed.data));
    if (!r) return fail(req, 404, "not_found", "No such document.");
    if ("error" in r) return fail(req, r.error.status, r.error.code, r.error.message);
    const st: DocState = r.state;
    const out: ConfirmDocResponse = {
      document: DocumentRow.parse(st.document),
      results: st.results,
      findings: st.findings,
      sha256_record: st.meta.sha256_record ?? "",
    };
    deps.log({ fn: "confirm-doc", status: "confirmed", results: st.results.length, findings: st.findings.length });
    return json(req, 200, out);
  };
}
