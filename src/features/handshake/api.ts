/**
 * The one seam the handshake screens talk through. `real.ts` calls Cron's functions and subscribes to Realtime;
 * `mock.ts` is an in-memory server a fixture can drive (tests). Nothing else in this folder
 * imports `callFunction` or `supabase`.
 */
import { ApiError } from '../../api/call';
import type { GrantEnvelope, GrantStatusResponse, HandshakeClaimRequest, HandshakeCreateResponse } from './contract';

export interface HandshakeApi {
  /** Patient: a new single-use code, 120 s. */
  create(): Promise<HandshakeCreateResponse>;
  /** Doctor: a scanned token or a typed code. Throws ApiError with `code` token_invalid | token_expired | token_used | rate_limited. */
  claim(input: HandshakeClaimRequest): Promise<GrantEnvelope>;
  /** Either side. Without an id: the caller's newest pending or active grant (`grant: null` when there is none). */
  status(grantId?: string): Promise<GrantStatusResponse>;
  /** Patient. */
  decide(grantId: string, approve: boolean): Promise<GrantEnvelope>;
  /** Patient: End access. */
  revoke(grantId: string): Promise<GrantEnvelope>;
  /** Realtime on `grants` (RLS applies). `onSignal` fires on any change to a row the caller can see; returns the stop function. */
  subscribe(onSignal: () => void): () => void;
}

/** Why a code did not open anything, in words for the doctor. Typed codes are Cron's (contract.ts ErrorCode). */
export function claimErrorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    switch (e.code) {
      case 'token_expired':
        return 'This code has expired. Ask the patient for a new one.';
      case 'token_used':
        return 'This code was already used. Ask the patient for a new one.';
      case 'token_invalid':
        return 'This code is not valid. Check it and try again.';
      case 'rate_limited':
        return 'Too many tries. Wait a minute, then try again.';
      case 'wrong_role':
        return 'Only a doctor account can connect to a patient.';
    }
    if (e.status === 0) return 'Could not reach the server. Check the connection and try again.';
  }
  return 'The code could not be checked. Try again.';
}
