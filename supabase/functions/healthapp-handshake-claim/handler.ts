// healthapp-handshake-claim (MIN-4484): a doctor presents the scanned token or the typed code and
// gets a PENDING grant. Nothing is readable until the patient approves (grant-decide).
// 404 token_invalid, 409 token_expired | token_used, 429 rate_limited after 5 failures a minute.
// A failure is recorded against the doctor, never the address. A success is not counted.
import { HANDSHAKE_TOKEN_RE, ShortCode } from "../_shared/contract.ts";
import {
  type Auth,
  authenticate,
  CLAIM_FAILURES_PER_MINUTE,
  CLAIM_WINDOW_SECONDS,
  type ClaimKey,
  type Config,
  type GrantStore,
  normaliseShortCode,
  readJson,
} from "../_shared/grants.ts";
import { fail, headersFor, json, sha256Hex } from "../_shared/http.ts";

export interface Deps {
  auth: Auth;
  store: Pick<GrantStore, "roleOf" | "claim" | "failedClaims" | "recordFailedClaim">;
  config: Config;
}

/** Exactly one of token or short_code. A malformed value is a token that does not exist (404), not a 400:
 *  people mistype codes, and the screen reads the code, not the status. */
function readKey(body: unknown): { key: ClaimKey | null } | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
  const b = body as Record<string, unknown>;
  const hasToken = "token" in b, hasCode = "short_code" in b;
  if (hasToken === hasCode) return null;
  if (hasToken) {
    const t = b.token;
    if (typeof t !== "string" || t.length > 100) return { key: null };
    return { key: HANDSHAKE_TOKEN_RE.test(t) ? { jti: t.slice(4) } : null };
  }
  const c = b.short_code;
  if (typeof c !== "string" || c.length > 40) return { key: null };
  const code = normaliseShortCode(c);
  return { key: ShortCode.safeParse(code).success ? { short_code: code } : null };
}

export function makeHandler(deps: Deps) {
  return async function handle(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headersFor(req) });
    if (req.method !== "POST") return fail(req, 400, "bad_request", "POST only");
    const who = await authenticate(req, deps, ["doctor"]);
    if (who instanceof Response) return who;
    const body = await readJson(req);
    const read = body.ok ? readKey(body.body) : null;
    if (!read) return fail(req, 400, "bad_request", "send exactly one of token or short_code");

    const doctorKey = (await sha256Hex(`handshake_claim:${who.uid}`)).slice(0, 32);
    const failures = await deps.store.failedClaims(who.env, doctorKey, CLAIM_WINDOW_SECONDS);
    if (failures >= CLAIM_FAILURES_PER_MINUTE) {
      return fail(req, 429, "rate_limited", "Too many wrong codes. Wait a minute.");
    }

    const result = read.key
      ? await deps.store.claim(who.env, who.uid, read.key, deps.config.pendingSeconds)
      : ({ kind: "invalid" } as const);
    if (result.kind === "ok") return json(req, 200, result.envelope);

    await deps.store.recordFailedClaim(who.env, doctorKey);
    if (result.kind === "used") return fail(req, 409, "token_used", "This code was already used. Ask for a new one.");
    if (result.kind === "expired") return fail(req, 409, "token_expired", "This code has expired. Ask for a new one.");
    return fail(req, 404, "token_invalid", "This code is not valid.");
  };
}
