/**
 * LOCAL shapes of the two matching RPCs (MIN-4505, Cron). Cron adds them to `contract.ts`; until then they live here,
 * not in `src/api/contract.ts` (not edited from this issue). Swap = delete this file, import his, fix the names.
 *   healthapp_possible_matches(patient_id uuid) -> { match_count, groups: [{ n, pattern[], countries[], label }] }
 *   healthapp_set_matches_opt_in(opt_in boolean)
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

/** `profiles.matching_opt_in`, read under RLS (own row). Missing means off. */
export const OptInRow = z.object({ matching_opt_in: z.boolean().nullish() });
