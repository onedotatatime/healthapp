// healthapp-demo-reset (MIN-4514): the /demo panel's Reset. Passcode in, the dev schema back to its seeded
// state: every grant and handshake token ended (deleted), assistant turns and live-added documents and
// diary entries removed. Seeded personas and seeded records stay. Dev only: any other env is refused
// before the passcode is looked at. Never touches healthapp_demo or any bucket (storage is not read here).
import type { HealthappEnv } from "../_shared/env.ts";
import { readEnv } from "../_shared/env.ts";
import { clientAddress, fail, headersFor, json, sameSecret, sha256Hex } from "../_shared/http.ts";

export interface ResetCounts {
  grants: number;
  handshake_tokens: number;
  assistant_turns: number;
  documents: number;
  diary_entries: number;
}

export interface Deps {
  /** HEALTHAPP_DEMO_PASSCODE only. */
  secret(name: "HEALTHAPP_DEMO_PASSCODE"): string | undefined;
  allowTry(env: HealthappEnv, key: string, max: number, windowSeconds: number): Promise<boolean>;
  reset(): Promise<ResetCounts>;
}

export const MAX_TRIES = 5;

export function makeHandler(deps: Deps) {
  return async function handle(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headersFor(req) });
    if (req.method !== "POST") return fail(req, 400, "bad_request", "POST only");
    const env = readEnv(req);
    if (env !== "dev") return fail(req, 400, "bad_request", "demo-reset runs on dev only");

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return fail(req, 400, "bad_request", "body must be JSON");
    }
    const passcode = (body as { passcode?: unknown } | null)?.passcode;
    if (typeof passcode !== "string" || passcode.length < 1 || passcode.length > 200) {
      return fail(req, 400, "bad_request", "passcode is required");
    }
    const secret = deps.secret("HEALTHAPP_DEMO_PASSCODE");
    if (!secret) return fail(req, 500, "internal", "demo reset is not configured");

    const key = (await sha256Hex(`demo_reset:${clientAddress(req)}`)).slice(0, 32);
    let allowed: boolean;
    try {
      allowed = await deps.allowTry(env, key, MAX_TRIES, 60);
    } catch {
      return fail(req, 503, "internal", "rate limit store unavailable");
    }
    if (!allowed) return fail(req, 429, "rate_limited", "Too many tries. Wait a minute.");
    if (!(await sameSecret(passcode, secret))) return fail(req, 401, "bad_passcode", "Wrong passcode.");

    return json(req, 200, { ok: true, removed: await deps.reset() });
  };
}
