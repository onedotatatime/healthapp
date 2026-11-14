/**
 * In-memory answers for `/preview/matches` and for building before the RPCs are in `dev`. SYNTHETIC only: Maria's result
 * is the output of the seeded test (data/synthetic/test-output.txt, TEST 1): 9 seeded records, six coded features, six
 * countries. Steer the doctor's read with the URL: `?matches=empty | error | slow`.
 */
import { ApiError } from '../../api/call';
import type { MatchesApi } from './api';
import type { PossibleMatches } from './contract';

export const MARIA_RESULT: PossibleMatches = {
  match_count: 9,
  groups: [
    {
      n: 9,
      pattern: ['CRP_high', 'RF_positive', 'anti_CCP_positive', 'joint_pain', 'morning_stiffness', 'spec_rheumatology'],
      countries: ['DE', 'FR', 'GR', 'IT', 'NL', 'SE'],
      label: 'seeded, synthetic',
    },
  ],
};
export const EMPTY_RESULT: PossibleMatches = { match_count: 0, groups: [] };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const steer = () => new URLSearchParams(typeof location === 'undefined' ? '' : location.search).get('matches');

/** `createMockMatchesApi()` gives each page its own switch state (off by default, like the database). */
export function createMockMatchesApi(initialOptIn = false): MatchesApi {
  let optIn = initialOptIn;
  return {
    async getOptIn() {
      await wait(150);
      return optIn;
    },
    async setOptIn(v) {
      await wait(250);
      optIn = v;
      return optIn;
    },
    async possibleMatches() {
      const s = steer();
      await wait(s === 'slow' ? 4000 : 400);
      if (s === 'error') throw new ApiError(500, 'The mock was asked to fail.');
      // Same rule as the server: only an opted-in patient with a group of 5 or more gets matches, everyone else the empty answer.
      return s === 'empty' || !optIn ? EMPTY_RESULT : MARIA_RESULT;
    },
  };
}
