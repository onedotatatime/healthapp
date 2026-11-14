// healthapp-unconfirm-doc (MIN-4556; CTO addendum on MIN-4555 §3): the owner takes a saved exam back to a draft.
// confirmed -> draft, confirmed_at cleared, no longer marked unchecked. Values, file and file analysis stay.
// Nothing is written to a policy: every doctor policy, the matching and the file analysis already test
// status = 'confirmed', so the exam leaves them at the next read. Confirm again is healthapp-confirm-doc, which
// already takes the patient's edits; there is no edit on a confirmed row. No model. Owner only: a doctor is
// refused by role, another patient's upload answers 404 like one that does not exist.
import { DocumentRow, UnconfirmDocRequest, type UnconfirmDocResponse } from "../_shared/contract.ts";
import { type Auth, authenticate, readJson, type Store } from "../_shared/docs.ts";
import { fail, headersFor, json } from "../_shared/http.ts";

export interface Deps {
  auth: Auth;
  store: Pick<Store, "roleOf" | "unconfirm">;
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
    const parsed = UnconfirmDocRequest.safeParse(body.body);
    if (!parsed.success) return fail(req, 400, "bad_request", "doc_id is required");

    const r = await deps.store.unconfirm(who.env, who.uid, parsed.data.doc_id);
    if (r === null || r === "not_confirmed") {
      deps.log({ fn: "unconfirm-doc", status: r === null ? "not_found" : "not_confirmed" });
      return fail(req, 404, "not_found", "No saved exam to unconfirm.");
    }
    const out: UnconfirmDocResponse = { document: DocumentRow.parse(r.document) };
    deps.log({ fn: "unconfirm-doc", status: "draft", results: r.results.length, findings: r.findings.length });
    return json(req, 200, out);
  };
}
