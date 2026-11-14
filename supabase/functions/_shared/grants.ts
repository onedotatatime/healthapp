// The handshake and grant functions' seams (MIN-4484): what a handler needs from the database, the
// session check every one of them starts with, and the pure token helpers. Handlers import this file
// only, so a test runs them against a fake store; pggrants.ts is the real one (Postgres over
// SUPABASE_DB_URL, so it works whether or not the schema is in the Data API's exposed list).
// Shapes are contract.ts (2026-11-14.1) and nothing else.
import {
  type ErrorCode,
  type GrantEnvelope,
  type GrantView,
  type HealthappEnv,
  SHORT_CODE_ALPHABET,
} from "./contract.ts";
import { readEnv } from "./env.ts";
import { fail } from "./http.ts";

export type Role = "patient" | "doctor";

/** Server values (settlement 13: the client cannot choose them). Env overrides are for tests. */
export const TOKEN_SECONDS = 120; // settlement 7
export const PENDING_SECONDS = 120; // a claimed request lapses after this
export const GRANT_SECONDS = 900; // 15 minutes
export const CLAIM_FAILURES_PER_MINUTE = 5;
export const CLAIM_WINDOW_SECONDS = 60;

export interface Config {
  pendingSeconds: number;
  grantSeconds: number;
}
export function readConfig(get: (name: string) => string | undefined = (n) => Deno.env.get(n)): Config {
  const num = (name: string, dflt: number) => {
    const v = Number(get(name));
    return Number.isFinite(v) && v >= 1 && v <= 86400 ? Math.floor(v) : dflt;
  };
  return {
    pendingSeconds: num("HEALTHAPP_PENDING_SECONDS", PENDING_SECONDS),
    grantSeconds: num("HEALTHAPP_GRANT_SECONDS", GRANT_SECONDS),
  };
}

export type ClaimKey = { jti: string } | { short_code: string };
export type ClaimResult =
  | { kind: "ok"; envelope: GrantEnvelope }
  | { kind: "invalid" | "used" | "expired" };
/** The grant as a caller may act on it. `ended`: it exists but is over (expired, revoked, refused). */
export type GrantResult =
  | { kind: "ok"; envelope: GrantEnvelope }
  | { kind: "not_found" | "ended" | "wrong_state" };

export interface GrantStore {
  roleOf(env: HealthappEnv, uid: string): Promise<Role | null>;
  /** Voids the patient's older unused tokens, then stores this one. "taken": the short code collided. */
  createToken(
    env: HealthappEnv,
    patientId: string,
    jti: string,
    shortCode: string,
    ttlSeconds: number,
  ): Promise<{ expires_at: string; server_now: string } | "taken">;
  failedClaims(env: HealthappEnv, doctorKey: string, windowSeconds: number): Promise<number>;
  recordFailedClaim(env: HealthappEnv, doctorKey: string): Promise<void>;
  claim(env: HealthappEnv, doctorId: string, key: ClaimKey, pendingSeconds: number): Promise<ClaimResult>;
  decide(
    env: HealthappEnv,
    patientId: string,
    grantId: string,
    approve: boolean,
    grantSeconds: number,
  ): Promise<GrantResult>;
  revoke(env: HealthappEnv, patientId: string, grantId: string): Promise<GrantResult>;
  /** Ends stale rows of this caller first (lazy expiry), then reads. Null grant: nothing open. */
  status(
    env: HealthappEnv,
    uid: string,
    grantId: string | null,
  ): Promise<{ kind: "ok"; grant: GrantView | null; server_now: string } | { kind: "not_found" }>;
}

export interface Auth {
  /** The user id behind a session access token (GoTrue), or null. */
  verify(token: string): Promise<string | null>;
}

/** Env header, bearer token, a profile in healthapp_<env> with an allowed role. "Signed in" proves
 *  nothing on Conductor's shared auth.users, so the profile is the gate. */
export async function authenticate(
  req: Request,
  deps: { auth: Auth; store: Pick<GrantStore, "roleOf"> },
  allowed: Role[],
): Promise<{ env: HealthappEnv; uid: string; role: Role } | Response> {
  const env = readEnv(req);
  if (!env) return fail(req, 400, "bad_request", "x-healthapp-env must be dev or demo");
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return fail(req, 401, "unauthenticated", "Sign in first.");
  const uid = await deps.auth.verify(token);
  if (!uid) return fail(req, 401, "unauthenticated", "Sign in first.");
  const role = await deps.store.roleOf(env, uid);
  if (!role) return fail(req, 403, "no_profile", "This account has no healthapp profile.");
  if (!allowed.includes(role)) return fail(req, 403, "wrong_role", "This action is not available for this role.");
  return { env, uid, role };
}

export async function readJson(req: Request): Promise<{ ok: true; body: unknown } | { ok: false }> {
  try {
    return { ok: true, body: await req.json() };
  } catch {
    return { ok: false };
  }
}

/** A typed grant refusal as the contract's error body. */
export function grantFailure(req: Request, kind: "not_found" | "ended" | "wrong_state"): Response {
  const map: Record<typeof kind, [number, ErrorCode, string]> = {
    not_found: [404, "not_found", "No such grant."],
    ended: [403, "grant_expired", "This grant has ended."],
    wrong_state: [400, "bad_request", "The grant is already approved. Use revoke to end it."],
  };
  const [status, code, message] = map[kind];
  return fail(req, status, code, message);
}

// ---------------------------------------------------------------------------------------------
// Tokens: hs1.<22 base64url> (16 random bytes) and an 8-character code from a 31-letter alphabet.
// ---------------------------------------------------------------------------------------------
const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");

/** The token's 22-character body, which is also its id (jti) in handshake_tokens. */
export function newJti(): string {
  return b64url(crypto.getRandomValues(new Uint8Array(16)));
}
export const tokenOf = (jti: string) => `hs1.${jti}`;

/** 8 characters, uniform over the alphabet: bytes that would bias the modulo are redrawn. */
export function newShortCode(): string {
  const n = SHORT_CODE_ALPHABET.length;
  const limit = 256 - (256 % n);
  let out = "";
  while (out.length < 8) {
    for (const b of crypto.getRandomValues(new Uint8Array(16))) {
      if (b < limit && out.length < 8) out += SHORT_CODE_ALPHABET[b % n];
    }
  }
  return out;
}

/** The typed code as people type it: any case, spaces or dashes in the middle. */
export const normaliseShortCode = (s: string) => s.toUpperCase().replace(/[\s-]/g, "");

/** Last line of defence for index.ts: an exception becomes the contract's 500, never a bare gateway
 *  page. Logs names and Postgres codes only (a message can carry a row's text). */
export function guarded(handle: (req: Request) => Promise<Response>, name: string) {
  return async (req: Request): Promise<Response> => {
    try {
      return await handle(req);
    } catch (e) {
      const pg = e as { code?: string; constraint_name?: string; routine?: string };
      console.log(JSON.stringify({
        fn: name, status: "exception", error: e instanceof Error ? e.name : "unknown",
        code: pg.code, constraint: pg.constraint_name, routine: pg.routine,
      }));
      return fail(req, 500, "internal", "Something went wrong. Try again.");
    }
  };
}
