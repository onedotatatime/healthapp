// healthapp-handshake-create (MIN-4484; cto-review settlements 6 and 7): a single-use token that
// lives 120 s, as the QR fragment `hs1.<jti>` and as a typed 8-character code. A new one voids the
// patient's older unused ones ("New code" on the screen).
import { HandshakeCreateRequest, type HandshakeCreateResponse } from "../_shared/contract.ts";
import {
  type Auth,
  authenticate,
  type GrantStore,
  newJti,
  newShortCode,
  readJson,
  TOKEN_SECONDS,
  tokenOf,
} from "../_shared/grants.ts";
import { fail, headersFor, json } from "../_shared/http.ts";

export interface Deps {
  auth: Auth;
  store: Pick<GrantStore, "roleOf" | "createToken">;
}

export function makeHandler(deps: Deps) {
  return async function handle(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headersFor(req) });
    if (req.method !== "POST") return fail(req, 400, "bad_request", "POST only");
    const who = await authenticate(req, deps, ["patient"]);
    if (who instanceof Response) return who;
    const body = await readJson(req);
    if (!body.ok || !HandshakeCreateRequest.safeParse(body.body).success) {
      return fail(req, 400, "bad_request", "body must be a JSON object");
    }

    for (let attempt = 0; attempt < 5; attempt++) {
      const jti = newJti();
      const short_code = newShortCode();
      const made = await deps.store.createToken(who.env, who.uid, jti, short_code, TOKEN_SECONDS);
      if (made === "taken") continue;
      const out: HandshakeCreateResponse = { token: tokenOf(jti), short_code, ...made };
      return json(req, 200, out);
    }
    return fail(req, 500, "internal", "Could not make a code. Try again.");
  };
}
