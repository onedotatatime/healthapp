// healthapp-grant-decide (MIN-4484; settlement 13): the patient approves or refuses a pending grant.
// Approval starts the clock server-side: expires_at = now() + HEALTHAPP_GRANT_SECONDS (default 15 min).
// The client cannot choose the length. A request that has lapsed ends as expired (403 grant_expired).
import { GrantDecideRequest } from "../_shared/contract.ts";
import {
  type Auth,
  authenticate,
  type Config,
  type GrantStore,
  grantFailure,
  readJson,
} from "../_shared/grants.ts";
import { fail, headersFor, json } from "../_shared/http.ts";

export interface Deps {
  auth: Auth;
  store: Pick<GrantStore, "roleOf" | "decide">;
  config: Config;
}

export function makeHandler(deps: Deps) {
  return async function handle(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headersFor(req) });
    if (req.method !== "POST") return fail(req, 400, "bad_request", "POST only");
    const who = await authenticate(req, deps, ["patient"]);
    if (who instanceof Response) return who;
    const body = await readJson(req);
    const parsed = body.ok ? GrantDecideRequest.safeParse(body.body) : null;
    if (!parsed?.success) return fail(req, 400, "bad_request", "grant_id and approve are required");

    const r = await deps.store.decide(who.env, who.uid, parsed.data.grant_id, parsed.data.approve, deps.config.grantSeconds);
    return r.kind === "ok" ? json(req, 200, r.envelope) : grantFailure(req, r.kind);
  };
}
