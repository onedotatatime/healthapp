import { z } from 'zod';
import { GrantStatus, Timestamp, Uuid } from '../../api/contract';

/** The patient's own `grants` rows, read under RLS (`grants_parties`). Local to this screen: no wire shape is added. */
export const GRANT_LOG_COLUMNS = 'id,status,requested_at,approved_at,expires_at,revoked_at';
export const GrantLogRow = z.object({
  id: Uuid,
  status: GrantStatus,
  requested_at: Timestamp,
  approved_at: Timestamp.nullable(),
  expires_at: Timestamp.nullable(),
  revoked_at: Timestamp.nullable(),
});
export type GrantLogRow = z.infer<typeof GrantLogRow>;

export type Outcome = 'open' | 'ended_time' | 'ended_you' | 'declined' | 'asked' | 'asked_lapsed';

/** What happened to a request, as the patient would say it. Expiry is read lazily, as the server does. */
export function outcomeOf(r: GrantLogRow, nowMs: number): Outcome {
  const lapsed = r.expires_at !== null && Date.parse(r.expires_at) <= nowMs;
  if (r.status === 'refused') return 'declined';
  if (r.status === 'revoked') return 'ended_you';
  if (r.status === 'active') return lapsed ? 'ended_time' : 'open';
  if (r.status === 'expired') return r.approved_at ? 'ended_time' : 'asked_lapsed';
  return lapsed ? 'asked_lapsed' : 'asked';
}

const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** One plain sentence per row: approved when, ended how. No interpretation. */
export function describe(r: GrantLogRow, nowMs: number): string {
  const o = outcomeOf(r, nowMs);
  const approved = r.approved_at ? `Approved ${when(r.approved_at)}` : '';
  switch (o) {
    case 'open':
      return `${approved}. Open until ${when(r.expires_at!)}.`;
    case 'ended_time':
      return `${approved}. Ended ${r.expires_at ? when(r.expires_at) : ''} when the time ran out.`;
    case 'ended_you':
      return `${approved || `Asked ${when(r.requested_at)}`}. You ended access${r.revoked_at ? ` ${when(r.revoked_at)}` : ''}.`;
    case 'declined':
      return `Asked ${when(r.requested_at)}. You declined.`;
    case 'asked':
      return `Asked ${when(r.requested_at)}. Waiting for your answer.`;
    default:
      return `Asked ${when(r.requested_at)}. The request ended without an answer. Nothing was shared.`;
  }
}
