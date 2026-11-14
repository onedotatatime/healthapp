/** The one seam the matches screens talk through (same idea as assistant/api.ts). `real.ts` calls the RPCs; `mock.ts` is in memory. */
import type { PossibleMatches } from './contract';

export interface MatchesApi {
  /** F1: the signed-in patient's current `matching_opt_in`. */
  getOptIn(): Promise<boolean>;
  /** F1: set it; resolves to the value the server now holds. */
  setOptIn(optIn: boolean): Promise<boolean>;
  /** F2: the doctor's call under a grant. Not opted in, no match and fewer than 5 all come back as the same empty answer. */
  possibleMatches(patientId: string): Promise<PossibleMatches>;
}
