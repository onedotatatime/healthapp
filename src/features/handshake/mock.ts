/**
 * An in-memory handshake server for `/preview/handshake` and for building before Cron's functions are live.
 * Synthetic people only (Maria Papadopoulou, Dr. Eleni Raptis). It follows Cron's contract: single-use codes of
 * 120 s, typed errors, a grant length that only the server decides, `server_now` on every answer, and a
 * `skewMs` so the server's clock can disagree with the device's (the countdown must still be right).
 * Both sides share one world, so a claim on the doctor's screen shows up on the patient's.
 */
import { ApiError } from '../../api/call';
import type { HandshakeApi } from './api';
import { SHORT_CODE_ALPHABET, type GrantEnvelope, type GrantView, type HandshakeClaimRequest } from './contract';

const uid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
export const MOCK_PATIENT = { id: uid(1), full_name: 'Maria Papadopoulou', specialty: null };
export const MOCK_DOCTOR = { id: uid(2), full_name: 'Dr. Eleni Raptis', specialty: 'Rheumatology' };

const rand = (alphabet: string, n: number) => Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';

export interface MockOptions {
  /** Grant length once approved. The real one is an env value (15 min stage, 45 min role-play). */
  grantSeconds?: number;
  codeSeconds?: number;
  /** How long a request waits for the patient before it lapses. */
  requestSeconds?: number;
}

interface Tok { token: string; short: string; expiresAt: number; used: boolean }
interface MockGrant { id: string; status: GrantView['status']; requestedAt: number; approvedAt: number | null; expiresAt: number; revokedAt: number | null }

export function createMockWorld(opts: MockOptions = {}) {
  const w = {
    grantSeconds: opts.grantSeconds ?? 15 * 60,
    codeSeconds: opts.codeSeconds ?? 120,
    requestSeconds: opts.requestSeconds ?? 60,
    /** Server clock minus the device clock, ms. */
    skewMs: 0,
    /** false: Realtime is silent, so only the 2 s poll can carry changes. */
    realtime: true,
    tokens: [] as Tok[],
    grants: [] as MockGrant[],
    listeners: new Set<() => void>(),
    seq: 100,
    /** The code the patient screen shows now, for the preview's "simulate scan". */
    lastCode: null as { token: string; short: string } | null,
  };
  const now = () => Date.now() + w.skewMs;
  const iso = (ms: number) => new Date(ms).toISOString();
  const emit = () => {
    if (w.realtime) w.listeners.forEach((l) => setTimeout(l, 30));
  };

  /** The server decides expiry lazily, on read, the way a policy with `expires_at > now()` does. */
  const settle = (g: MockGrant) => {
    if ((g.status === 'active' || g.status === 'pending') && now() >= g.expiresAt) g.status = 'expired';
    return g;
  };
  const view = (g: MockGrant): GrantView => ({
    grant_id: g.id,
    status: settle(g).status,
    requested_at: iso(g.requestedAt),
    approved_at: g.approvedAt ? iso(g.approvedAt) : null,
    expires_at: iso(g.expiresAt),
    revoked_at: g.revokedAt ? iso(g.revokedAt) : null,
    patient: MOCK_PATIENT,
    doctor: MOCK_DOCTOR,
  });
  const env = (g: MockGrant): GrantEnvelope => ({ grant: view(g), server_now: iso(now()) });
  const find = (id: string) => {
    const g = w.grants.find((x) => x.id === id);
    if (!g) throw new ApiError(404, 'No such grant.', 'not_found');
    return g;
  };

  const api: HandshakeApi = {
    async create() {
      const t: Tok = { token: `hs1.${rand(B64, 22)}`, short: rand(SHORT_CODE_ALPHABET, 8), expiresAt: now() + w.codeSeconds * 1000, used: false };
      w.tokens.push(t);
      w.lastCode = { token: t.token, short: t.short };
      return { token: t.token, short_code: t.short, expires_at: iso(t.expiresAt), server_now: iso(now()) };
    },
    async claim(input: HandshakeClaimRequest) {
      const t = w.tokens.find((x) => ('token' in input ? x.token === input.token : x.short === input.short_code));
      if (!t) throw new ApiError(404, 'No such code.', 'token_invalid');
      if (t.used) throw new ApiError(409, 'This code was already used.', 'token_used');
      if (now() >= t.expiresAt) throw new ApiError(409, 'This code has expired.', 'token_expired');
      t.used = true;
      const g: MockGrant = { id: uid(w.seq++), status: 'pending', requestedAt: now(), approvedAt: null, expiresAt: now() + w.requestSeconds * 1000, revokedAt: null };
      w.grants.push(g);
      emit();
      return env(g);
    },
    async status(grantId) {
      if (grantId) return { grant: view(find(grantId)), server_now: iso(now()) };
      const live = [...w.grants].reverse().find((g) => ['pending', 'active'].includes(settle(g).status));
      return { grant: live ? view(live) : null, server_now: iso(now()) };
    },
    async decide(grantId, approve) {
      const g = settle(find(grantId));
      if (g.status !== 'pending') throw new ApiError(409, 'The request is closed.', 'grant_expired');
      if (approve) {
        g.status = 'active';
        g.approvedAt = now();
        g.expiresAt = now() + w.grantSeconds * 1000;
      } else g.status = 'refused';
      emit();
      return env(g);
    },
    async revoke(grantId) {
      const g = settle(find(grantId));
      if (g.status === 'active') {
        g.status = 'revoked';
        g.revokedAt = now();
      }
      emit();
      return env(g);
    },
    subscribe(onSignal) {
      w.listeners.add(onSignal);
      return () => w.listeners.delete(onSignal);
    },
  };
  return { world: w, api };
}
