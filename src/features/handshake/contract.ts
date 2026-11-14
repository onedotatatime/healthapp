/**
 * D1 + D2 wire shapes (MIN-4485): copied VERBATIM from Cron's `contract.ts` (MIN-4471, CONTRACT_VERSION
 * 2026-11-14.1, supabase/functions/_shared/contract.ts), sections "healthapp-handshake-create" to
 * "healthapp-grant-decide, healthapp-grant-revoke", plus the primitives they use. It lives in this folder, not in
 * `src/api/contract.ts`, because the capture and diary branches both append to that file. Swap = delete this file
 * and import Cron's. Do not edit the shapes here; change them in his file and note it on MIN-4484.
 * Only change from the original: `npm:zod@4.6.7` is `zod`.
 */
import { z } from 'zod';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const Uuid = z.string().regex(UUID_RE, 'uuid');
/** ISO 8601 timestamp with offset, as Postgres timestamptz serialises it. */
export const Timestamp = z.string().min(20);
export const GrantStatus = z.enum(['pending', 'active', 'refused', 'expired', 'revoked']);
export type GrantStatus = z.infer<typeof GrantStatus>;

export const GrantRow = z.object({
  id: Uuid,
  patient_id: Uuid,
  doctor_id: Uuid,
  status: GrantStatus,
  requested_at: Timestamp,
  approved_at: Timestamp.nullable(),
  expires_at: Timestamp.nullable(),
  revoked_at: Timestamp.nullable(),
});
export type GrantRow = z.infer<typeof GrantRow>;
/** Realtime: postgres_changes on healthapp_<env>.grants only (RLS applies to the subscriber). */
export const GRANT_COLUMNS = 'id,patient_id,doctor_id,status,requested_at,approved_at,expires_at,revoked_at';
export const REALTIME_TABLES = ['grants'] as const;

// healthapp-handshake-create (patient) ----------------------------------------------------------
// The QR text is `${origin}/s#${token}` (fragment, settlement 6). The typed code is shown 4 + 4.
// 120 s life, no auto-refresh: the screen has a "New code" button (settlement 7).
export const HANDSHAKE_TOKEN_RE = /^hs1\.[A-Za-z0-9_-]{22}$/;
export const SHORT_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; // no 0/O, 1/I/L
export const HandshakeToken = z.string().regex(HANDSHAKE_TOKEN_RE, 'hs1.<22 base64url>');
export const ShortCode = z.string().regex(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/, '8 characters');
export const HandshakeCreateRequest = z.object({});
export const HandshakeCreateResponse = z.object({
  token: HandshakeToken,
  short_code: ShortCode,
  expires_at: Timestamp,
  server_now: Timestamp,
});
export type HandshakeCreateResponse = z.infer<typeof HandshakeCreateResponse>;
export const qrText = (origin: string, token: string) => `${origin.replace(/\/$/, '')}/s#${token}`;

// healthapp-handshake-claim (doctor) ------------------------------------------------------------
// Exactly one of token (scanned) or short_code (typed). 5 failed claims per doctor per minute.
// Errors: 404 token_invalid, 409 token_expired | token_used, 429 rate_limited.
export const HandshakeClaimRequest = z.union([z.object({ token: HandshakeToken }), z.object({ short_code: ShortCode })]);
export type HandshakeClaimRequest = z.infer<typeof HandshakeClaimRequest>;

// The grant as both screens see it, with the other party's display fields (read by the server).
export const Party = z.object({ id: Uuid, full_name: z.string(), specialty: z.string().nullable() });
export const GrantView = z.object({
  grant_id: Uuid,
  status: GrantStatus,
  requested_at: Timestamp,
  approved_at: Timestamp.nullable(),
  expires_at: Timestamp.nullable(), // pending: when the request lapses; active: when access ends
  revoked_at: Timestamp.nullable(),
  patient: Party,
  doctor: Party,
});
export type GrantView = z.infer<typeof GrantView>;
/** Every grant answer carries the server's clock: countdowns use expires_at - server_now. */
export const GrantEnvelope = z.object({ grant: GrantView, server_now: Timestamp });
export type GrantEnvelope = z.infer<typeof GrantEnvelope>;

export const HandshakeClaimResponse = GrantEnvelope;

// healthapp-grant-status (patient or doctor) ----------------------------------------------------
// Settlement 8: grant_id optional; without it, the caller's newest pending or active grant.
// Realtime on grants first; poll every 2 s when the channel is silent for 3 s.
// Settlement 10: an empty RLS read after data was shown means "call grant-status and close".
export const GrantStatusRequest = z.object({ grant_id: Uuid.optional() });
export const GrantStatusResponse = z.object({ grant: GrantView.nullable(), server_now: Timestamp });
export type GrantStatusResponse = z.infer<typeof GrantStatusResponse>;

// healthapp-grant-decide, healthapp-grant-revoke (patient) --------------------------------------
// The grant length is a server value (settlement 13); the client cannot choose it.
export const GrantDecideRequest = z.object({ grant_id: Uuid, approve: z.boolean() });
export const GrantDecideResponse = GrantEnvelope;
export const GrantRevokeRequest = z.object({ grant_id: Uuid });
export const GrantRevokeResponse = GrantEnvelope;
