/** The real calls: `healthapp_set_matches_opt_in` and `healthapp_possible_matches` (MIN-4505), plus one RLS read of the own profile. */
import { ApiError } from '../../api/call';
import { supabase } from '../../api/client';
import type { MatchesApi } from './api';
import { OptInRow, PossibleMatches } from './contract';

function need() {
  if (!supabase) throw new ApiError(0, 'Not configured.');
  return supabase;
}

export const realMatchesApi: MatchesApi = {
  async getOptIn() {
    const sb = need();
    const { data: u } = await sb.auth.getUser();
    if (!u.user) throw new ApiError(401, 'Not signed in.', 'unauthenticated');
    const { data, error } = await sb.from('profiles').select('matching_opt_in').eq('id', u.user.id).maybeSingle();
    if (error) throw new ApiError(500, error.message);
    const row = OptInRow.safeParse(data ?? {});
    if (!row.success) throw new ApiError(200, 'Unexpected row from profiles.');
    return row.data.matching_opt_in === true;
  },
  async setOptIn(optIn) {
    const { error } = await need().rpc('healthapp_set_matches_opt_in', { opt_in: optIn });
    if (error) throw new ApiError(500, error.message);
    return optIn;
  },
  async possibleMatches(patientId) {
    const { data, error, status } = await need().rpc('healthapp_possible_matches', { patient_id: patientId });
    if (error) throw new ApiError(status || 500, error.message, status === 403 ? 'grant_expired' : undefined);
    const parsed = PossibleMatches.safeParse(data);
    if (!parsed.success) throw new ApiError(200, 'Unexpected answer from healthapp_possible_matches.');
    return parsed.data;
  },
};
