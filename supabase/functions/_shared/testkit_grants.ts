// Test helpers only (never imported by a function): a scripted GrantStore and Auth for the handshake
// and grant handlers. The store returns what a test tells it to and records its calls; the real
// transitions are proved against Postgres by supabase/sql/checks and scripts/handshake-live.ts.
import type { GrantEnvelope } from "./contract.ts";
import { type Auth, type ClaimKey, type ClaimResult, type GrantResult, type GrantStore, type Role } from "./grants.ts";

export const PATIENT = "11111111-1111-4111-8111-111111111111";
export const DOCTOR = "33333333-3333-4333-8333-333333333333";
export const DOCTOR2 = "55555555-5555-4555-8555-555555555555";
export const OUTSIDER = "44444444-4444-4444-8444-444444444444";
export const GRANT = "99999999-9999-4999-8999-999999999999";
export const TOKENS: Record<string, string> = { tp: PATIENT, td: DOCTOR, td2: DOCTOR2, to: OUTSIDER };
const ROLES: Record<string, Role> = { [PATIENT]: "patient", [DOCTOR]: "doctor", [DOCTOR2]: "doctor" };

export const fakeAuth: Auth = { verify: (t) => Promise.resolve(TOKENS[t] ?? null) };

export const ENVELOPE: GrantEnvelope = {
  server_now: "2026-11-14T15:00:00.000Z",
  grant: {
    grant_id: GRANT,
    status: "pending",
    requested_at: "2026-11-14T15:00:00.000Z",
    approved_at: null,
    expires_at: "2026-11-14T15:02:00.000Z",
    revoked_at: null,
    patient: { id: PATIENT, full_name: "Maria Papadopoulou", specialty: null },
    doctor: { id: DOCTOR, full_name: "Dr. Eleni Raptis", specialty: "Rheumatology" },
  },
};

export function fakeStore(over: Partial<GrantStore> = {}) {
  const calls: string[] = [];
  let failures = 0;
  const store: GrantStore = {
    roleOf: (_e, uid) => Promise.resolve(ROLES[uid] ?? null),
    createToken: (_e, _p, jti, short_code) => {
      calls.push(`createToken:${jti}:${short_code}`);
      return Promise.resolve({ expires_at: "2026-11-14T15:02:00.000Z", server_now: "2026-11-14T15:00:00.000Z" });
    },
    failedClaims: () => Promise.resolve(failures),
    recordFailedClaim: () => {
      failures++;
      calls.push("recordFailedClaim");
      return Promise.resolve();
    },
    claim: (_e, _d, key: ClaimKey): Promise<ClaimResult> => {
      calls.push(`claim:${JSON.stringify(key)}`);
      return Promise.resolve({ kind: "ok", envelope: ENVELOPE });
    },
    decide: (_e, _p, _g, approve, secs): Promise<GrantResult> => {
      calls.push(`decide:${approve}:${secs}`);
      return Promise.resolve({ kind: "ok", envelope: ENVELOPE });
    },
    revoke: (): Promise<GrantResult> => {
      calls.push("revoke");
      return Promise.resolve({ kind: "ok", envelope: ENVELOPE });
    },
    status: (_e, _u, id) => {
      calls.push(`status:${id}`);
      return Promise.resolve({ kind: "ok", grant: ENVELOPE.grant, server_now: ENVELOPE.server_now });
    },
    ...over,
  };
  return { store, calls, failures: () => failures };
}

export function post(name: string, body: unknown, token: string | null, env: string | null = "dev") {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  if (env) headers["x-healthapp-env"] = env;
  return new Request(`https://x/functions/v1/healthapp-${name}`, {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

export async function errorCode(r: Response): Promise<string> {
  return (await r.json()).error.code;
}
