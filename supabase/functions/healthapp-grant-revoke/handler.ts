// healthapp-grant-revoke (MIN-4484): the patient ends a grant at once. The RLS policies read
// `status = 'active' and revoked_at is null and expires_at > now()`, so the doctor reads 0 rows on
// the next query. Revoking twice answers the same view (idempotent).
import { GrantRevokeRequest } from "../_shared/contract.ts";
import { type Auth, authenticate, type GrantStore, grantFailure, readJson } from "../_shared/grants.ts";
import { fail, headersFor, json } from "../_shared/http.ts";

export interface Deps {
  auth: Auth;
  store: Pick<GrantStore, "roleOf" | "revoke">;
}

export function makeHandler(deps: Deps) {
  return async function handle(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headersFor(req) });
    if (req.method !== "POST") return fail(req, 400, "bad_request", "POST only");
    const who = await authenticate(req, deps, ["patient"]);
    if (who instanceof Response) return who;
    const body = await readJson(req);
    const parsed = body.ok ? GrantRevokeRequest.safeParse(body.body) : null;
    if (!parsed?.success) return fail(req, 400, "bad_request", "grant_id is required");

    const r = await deps.store.revoke(who.env, who.uid, parsed.data.grant_id);
    return r.kind === "ok" ? json(req, 200, r.envelope) : grantFailure(req, r.kind);
  };
}
