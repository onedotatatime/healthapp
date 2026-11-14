/**
 * The real calls (MIN-4505): `healthapp_get_matches_opt_in`, `healthapp_set_matches_opt_in`, `healthapp_possible_matches`,
 * all schema-qualified (`healthapp_<env>`). Errors arrive in PostgREST's format `{ code, message }`, not the app's ErrorBody.
 */
import { ApiError } from '../../api/call';
import { supabase } from '../../api/client';
import { envState } from '../../lib/env';
import type { MatchesApi } from './api';
import { OptInState, PossibleMatches } from './contract';

function rpc() {
  if (!supabase || envState.status !== 'ok') throw new ApiError(0, 'Not configured.');
  return supabase.schema(envState.schema);
}

/** PostgREST: `42501` (insufficient privilege) is "no live grant" for the doctor and "not you" for the patient. */
export function toApiError(error: { code?: string; message: string }, status?: number): ApiError {
  const denied = error.code === '42501' || status === 403;
  return new ApiError(denied ? 403 : status || 500, error.message, denied ? 'grant_expired' : undefined);
}

async function optInCall(fn: 'healthapp_get_matches_opt_in' | 'healthapp_set_matches_opt_in', args?: { opt_in: boolean }): Promise<boolean> {
  const { data, error, status } = await rpc().rpc(fn, args);
  if (error) throw toApiError(error, status);
  const parsed = OptInState.safeParse(Array.isArray(data) ? data[0] : data);
  if (!parsed.success) throw new ApiError(200, `Unexpected answer from ${fn}.`);
  return parsed.data.matching_opt_in;
}

export const realMatchesApi: MatchesApi = {
  getOptIn: () => optInCall('healthapp_get_matches_opt_in'),
  setOptIn: (optIn) => optInCall('healthapp_set_matches_opt_in', { opt_in: optIn }),
  async possibleMatches(patientId) {
    const { data, error, status } = await rpc().rpc('healthapp_possible_matches', { patient_id: patientId });
    if (error) throw toApiError(error, status);
    const parsed = PossibleMatches.safeParse(data);
    if (!parsed.success) throw new ApiError(200, 'Unexpected answer from healthapp_possible_matches.');
    return parsed.data;
  },
};
