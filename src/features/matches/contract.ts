/**
 * LOCAL shapes of the three matching RPCs as built (MIN-4505, Cron; his `_shared/contract.ts` is Deno-side, not importable here).
 *   healthapp_possible_matches({patient_id}) -> { match_count, groups: [{ n, pattern[], countries[], label }] }  (doctor with a live grant; else 42501)
 *   healthapp_set_matches_opt_in({opt_in}) / healthapp_get_matches_opt_in() -> { matching_opt_in, matching_opt_in_at }
 * The server already applies k = 5 and the opt-in check and answers with the same empty shape for every "no".
 */
import { z } from 'zod';

export const MatchGroup = z.object({
  n: z.number().int().nonnegative(),
  pattern: z.array(z.string()),
  countries: z.array(z.string()),
  label: z.string(),
});
export type MatchGroup = z.infer<typeof MatchGroup>;

export const PossibleMatches = z.object({
  match_count: z.number().int().nonnegative(),
  groups: z.array(MatchGroup),
});
export type PossibleMatches = z.infer<typeof PossibleMatches>;

/**
 * `healthapp_get_matches_opt_in()` and `healthapp_set_matches_opt_in({opt_in})` both answer this (MIN-4505). Since 010
 * (MIN-4484) no client can read `profiles.matching_opt_in`, so the switch is loaded through the get function.
 * A table-returning RPC may come back as a one-element array; `real.ts` unwraps that.
 */
export const OptInState = z.object({
  matching_opt_in: z.boolean(),
  matching_opt_in_at: z.string().nullable(),
});
export type OptInState = z.infer<typeof OptInState>;
