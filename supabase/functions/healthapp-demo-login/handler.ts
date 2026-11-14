// healthapp-demo-login (MIN-4471; MIN-4449 decision 1.5): the /demo panel signs a synthetic persona
// in on the server. The browser sends a persona and the panel passcode, never a password.
// 5 tries a minute per caller address; the sixth is refused before the passcode is checked.
import { DemoLoginRequest, type DemoLoginResponse } from "../_shared/contract.ts";
import { type HealthappEnv, readEnv } from "../_shared/env.ts";
import { clientAddress, fail, headersFor, json, sameSecret, sha256Hex } from "../_shared/http.ts";

export const MAX_TRIES = 5;
export const WINDOW_SECONDS = 60;
/** A ceiling across every caller (MIN-4492 fix 2): the per-address limit trusts the first
 *  x-forwarded-for hop, which a caller can set, so on its own it limits nobody. */
export const GLOBAL_MAX_TRIES = 30;
export const GLOBAL_KEY = "global";

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: { id: string; app_metadata: Record<string, unknown> };
}

export type SecretName = "HEALTHAPP_DEMO_PASSCODE" | "HEALTHAPP_DEMO_PASSCODE_DEMO" | "HEALTHAPP_PERSONA_PASSWORD";

export interface Deps {
  /** The two passcodes (one per deployment, MIN-4541) and HEALTHAPP_PERSONA_PASSWORD only. */
  secret(name: SecretName): string | undefined;
  /** Records one try for `key` and says whether it is within the limit. */
  allowTry(env: HealthappEnv, key: string, max: number, windowSeconds: number): Promise<boolean>;
  signIn(email: string, password: string): Promise<Session | null>;
  /** A session for one existing user with no password (the founder's demo account has none anyone holds). */
  signInUser(email: string): Promise<Session | null>;
}

export function makeHandler(deps: Deps) {
  return async function handle(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: headersFor(req) });
    if (req.method !== "POST") return fail(req, 400, "bad_request", "POST only");
    const env = readEnv(req);
    if (!env) return fail(req, 400, "bad_request", "x-healthapp-env must be dev or demo");

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return fail(req, 400, "bad_request", "body must be JSON");
    }
    const parsed = DemoLoginRequest.safeParse(body);
    if (!parsed.success) return fail(req, 400, "bad_request", "persona and passcode are required");

    const { persona } = parsed.data;
    // The founder's own account exists only in the demo deployment; dev never reaches it.
    if (persona === "founder" && env !== "demo") return fail(req, 400, "bad_request", "founder sign-in is for demo only");

    // One passcode per deployment: the dev one never opens demo, so the shared panel code cannot reach his account.
    const passcode = deps.secret(env === "demo" ? "HEALTHAPP_DEMO_PASSCODE_DEMO" : "HEALTHAPP_DEMO_PASSCODE");
    // On demo every persona signs in through the link path (MIN-4541 F1): their stored passwords are random
    // and held by nobody, so the dev persona password never opens a demo account. Only dev uses the password.
    const viaLink = persona === "founder" || env === "demo";
    const password = deps.secret("HEALTHAPP_PERSONA_PASSWORD");
    if (!passcode || (!viaLink && !password)) return fail(req, 500, "internal", "demo login is not configured");

    const key = (await sha256Hex(`demo_login:${clientAddress(req)}`)).slice(0, 32);
    let allowed: boolean;
    try {
      allowed = await deps.allowTry(env, key, MAX_TRIES, WINDOW_SECONDS);
    } catch {
      return fail(req, 503, "internal", "rate limit store unavailable");
    }
    if (!allowed) return fail(req, 429, "rate_limited", "Too many tries. Wait a minute.");
    // Then the shared ceiling. Tries refused above are not counted here, so one noisy address cannot
    // eat the ceiling alone, but a caller who rotates addresses reaches it and everyone waits a minute.
    let globalAllowed: boolean;
    try {
      globalAllowed = await deps.allowTry(env, GLOBAL_KEY, GLOBAL_MAX_TRIES, WINDOW_SECONDS);
    } catch {
      return fail(req, 503, "internal", "rate limit store unavailable");
    }
    if (!globalAllowed) return fail(req, 429, "rate_limited", "Too many tries. Wait a minute.");

    if (!(await sameSecret(parsed.data.passcode, passcode))) {
      return fail(req, 401, "bad_passcode", "Wrong passcode.");
    }

    const email = `${persona}.${env}@healthapp.invalid`;
    const session = viaLink ? await deps.signInUser(email) : await deps.signIn(email, password!);
    if (!session) return fail(req, 500, "internal", "persona sign-in failed");
    const m = session.user.app_metadata ?? {};
    if (m.app !== "healthapp" || m.env !== env) return fail(req, 403, "no_profile", "not a healthapp persona");

    const out: DemoLoginResponse = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      user_id: session.user.id,
      persona,
      // his profile row says patient until his real profile is read; the client reads the row anyway
      role: persona === "founder" ? "patient" : persona,
    };
    return json(req, 200, out);
  };
}
