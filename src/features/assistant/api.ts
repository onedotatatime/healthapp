/**
 * The one seam the doctor's workspace talks through (same idea as handshake/api.ts). `real.ts` reads the record under
 * RLS and calls Cron's `healthapp-assistant` and `healthapp-doc-photo`; `mock.ts` is an in-memory record for the preview
 * and the tests. Nothing else in this folder imports `callFunction` or `supabase`.
 */
import { ApiError } from '../../api/call';
import type { AssistantResponse, DocPhotoResponse } from './contract';
import type { RecordData } from './record';

export interface AssistantApi {
  /** E1: the four RLS reads for the patient in the grant. Throws ApiError (403 / `grant_expired` when the grant ended). */
  loadRecord(patientId: string): Promise<RecordData>;
  /** E2: one whole answer, never streamed. */
  ask(grantId: string, question: string): Promise<AssistantResponse>;
  /** The original photo as a 60 s signed URL. */
  photo(docId: string, grantId: string): Promise<DocPhotoResponse>;
}

/** The grant is over (or never was): the caller should ask `grant-status` and close. */
export const isGrantGone = (e: unknown) => e instanceof ApiError && (e.code === 'grant_expired' || e.code === 'unauthenticated' || e.status === 403);

export function askErrorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.code === 'model_unavailable') return 'The assistant could not answer just now. Your question is kept. Try again.';
    if (e.code === 'rate_limited') return 'Too many questions in a short time. Wait a moment, then try again.';
    if (e.status === 0) return 'Could not reach the server. Your question is kept. Check the connection and try again.';
  }
  return 'The assistant could not answer. Your question is kept. Try again.';
}
