// healthapp-grant-status (MIN-4484; settlements 8 and 10): either party asks where the grant stands.
// grant_id optional: without it, the caller's newest pending or active grant, or `grant: null`.
// Expiry is read lazily: past expires_at the answer is `expired` even if a stored status still says
// `active`, and the row is ended then (which also nudges Realtime for the other side).
// With a grant_id the view of an ended grant (refused, expired, revoked) is returned as is.
import { GrantStatusRequest, type GrantStatusResponse } from "../_shared/contract.ts";
import { type Auth, authenticate, type GrantStore, grantFailure, readJson } from "../_shared/grants.ts";
import { fail, headersFor, json } from "../_shared/http.ts";

export interface Deps {
  auth: Auth;
  store: Pick<GrantStore, "roleOf" | "status">;
}

export function makeHandler(deps: Deps) {
  return async function handle(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headersFor(req) });
    if (req.method !== "POST") return fail(req, 400, "bad_request", "POST only");
    const who = await authenticate(req, deps, ["patient", "doctor"]);
    if (who instanceof Response) return who;
    const body = await readJson(req);
    const parsed = body.ok ? GrantStatusRequest.safeParse(body.body) : null;
    if (!parsed?.success) return fail(req, 400, "bad_request", "grant_id, when sent, must be a uuid");

    const r = await deps.store.status(who.env, who.uid, parsed.data.grant_id ?? null);
    if (r.kind === "not_found") return grantFailure(req, "not_found");
    const out: GrantStatusResponse = { grant: r.grant, server_now: r.server_now };
    return json(req, 200, out);
  };
}
