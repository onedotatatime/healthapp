/**
 * Related diagnoses (MIN-4665): the strings, the states and the one-call-per-press controller. No React, so every rule
 * is a unit test. The words are the CTO's (decision on MIN-4660, section 3) and are not reworded here, except one term: the view's name
 * changed from "Possible" to "Related" diagnoses on the founder's instruction (MIN-4778), overriding MIN-4660 section 3 for it. This module is
 * only imported by the doctor's lazy assistant chunk. Nothing in it can hold a number, a rank or a percentage: the
 * response has no field for one, and the view renders the strings it is given, in the order it is given.
 */
import { ApiError } from '../../api/call';
import type { DiagnosesResponse } from './analysis.contract';
import { isGrantGone, type AssistantApi } from './api';

export const DX = {
  title: 'Related diagnoses',
  /** Fixed, in the DOM in every state of the view. Word for word from the prototype. */
  banner: "For the doctor to evaluate. Not a diagnosis. Based on this patient's symptoms and exams only. Listed in alphabetical order; no ranking.",
  aiLine: 'This list comes from an AI reading this record. Check each line against its source.',
  run: 'List related diagnoses',
  runAgain: 'List again',
  loading: 'Reading the record. This can take up to a minute.',
  fits: 'Fits:',
  doesNotExplain: 'Does not fully explain:',
  notInRecord: 'Not in this record:',
  basedOn: 'Based on:',
  off: 'Related diagnoses is switched off in this environment.',
  none: 'No possibility could be listed from this record.',
  timeout: 'The list could not be made in time. Try again.',
  failed: 'Related diagnoses could not be loaded.',
  retry: 'Try again',
  ended: 'Access to this record has ended.',
  truncated: 'This record is larger than what the assistant reads. The list may miss the newest results.',
} as const;

export const guardLine = (n: number) =>
  n === 1 ? '1 statement was removed because it could not be checked against the record.' : `${n} statements were removed because they could not be checked against the record.`;

export const footerLine = (c: DiagnosesResponse['counts']) =>
  `Record lines read ${c.facts}, possibilities ${c.items}, citations ${c.citations}, removed ${c.guard_drops}, errors ${c.errors}.`;

export type DxState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; data: DiagnosesResponse }
  | { status: 'none'; data: DiagnosesResponse }
  | { status: 'off' }
  | { status: 'error'; kind: 'timeout' | 'failed' }
  | { status: 'ended' };

/** What the answer means for the screen. `ok` with no item is "none": there is nothing to draw. */
export function classify(data: DiagnosesResponse): DxState {
  if (data.status === 'off') return { status: 'off' };
  if (data.status === 'none' || data.items.length === 0) return { status: 'none', data };
  return { status: 'ok', data };
}

export function classifyError(e: unknown): DxState {
  if (isGrantGone(e)) return { status: 'ended' };
  if (e instanceof ApiError && (e.code === 'model_unavailable' || e.status === 503)) return { status: 'error', kind: 'timeout' };
  return { status: 'error', kind: 'failed' };
}

/**
 * One press is one call: nothing is called on creation, a press while a call is running does nothing, and a late answer of
 * a call that was replaced or abandoned is dropped. The answer lives only in the state the owner keeps; nothing is stored.
 */
export function createDiagnosesController(opts: { api: Pick<AssistantApi, 'diagnoses'>; grantId: string; onState(s: DxState): void; onGone?(): void }) {
  let seq = 0;
  let running = false;
  let alive = true;
  return {
    press(): boolean {
      if (running || !alive) return false;
      running = true;
      const mine = ++seq;
      opts.onState({ status: 'loading' });
      opts.api.diagnoses(opts.grantId).then(
        (data) => {
          running = false;
          if (alive && mine === seq) opts.onState(classify(data));
        },
        (e) => {
          running = false;
          if (!alive || mine !== seq) return;
          const next = classifyError(e);
          opts.onState(next);
          if (next.status === 'ended') opts.onGone?.();
        },
      );
      return true;
    },
    dispose() {
      alive = false;
    },
  };
}
