/**
 * The one flow of /doctor/simulate (MIN-4736), as pure functions: what a click on "Search the records" decides, the numbers it
 * computes, and when each stage of the animation happens. No DOM, no timers, no network. The page (Simulate.tsx) only plays this.
 *
 * Every count comes from recruit() at the click: the funnel's four numbers, the rows that stay bright at each stage, the countries.
 * Nothing is typed, nothing is read from the file's `expected` block. Synthetic data only.
 */
import { vmOffsets } from './format';
import { PHASE_IDS, type PhaseId, type VmBlock } from './matcher';
import { ELIGIBLE, OPTED, RING_MAX, SELECTED, STAGE_IDS, type StageId } from './dots';
import { SM_FADE_MS, ringsTotal, stepAt } from './motion';
import { commonOf, type Common } from './profile';
import { parseRequest, recruit, type ParsedRequest, type RecruitFile, type RecruitResult } from './recruit';

export type OkRequest = Extract<ParsedRequest, { kind: 'ok' }>;

/** What the sentence decides at the click, before anything starts. Only `run` starts the machine, the dots and the narrowing. */
export type Answer = { kind: 'empty' } | { kind: 'no_condition' } | { kind: 'too_many' } | { kind: 'run'; parsed: OkRequest };

export function answerFor(file: RecruitFile, text: string): Answer {
  const p = parseRequest(text, file.conditions, file.n);
  if (p.kind === 'ok') return { kind: 'run', parsed: p };
  return { kind: p.kind };
}

/** The funnel's four numbers, as recruit() returned them at this click. */
export interface Counts { records: number; optedIn: number; eligible: number; selected: number }

export interface Prepared {
  /** recruit()'s answer for this sentence. `shown: false` is the rule of five: 0 to 4 fit, nothing else is known to the page. */
  res: RecruitResult;
  shown: boolean;
  counts: Counts | null;
  /** Records that opted in, counted from the records at this click (the opt-in says nothing about the criteria). */
  optedIn: number;
  /** One byte per record: OPTED, ELIGIBLE, SELECTED bits. Under 5 only OPTED is ever set: the fitting records are not held at all. */
  cls: Uint8Array;
  /** The selected rows, in file order (recruit()'s `rows`). */
  selected: number[];
  /** More than RING_MAX selected: enlarged, not ringed. */
  many: boolean;
  /** The stages the animation draws: all four, or only the first two under 5 (the "fit" stage is never drawn). */
  stages: StageId[];
  /** What the selected records share (MIN-4756), counted once here over every selected row. Null when nothing is shown or fewer than 2 are selected. */
  common: Common | null;
}

/** Step 1 of the click: the search itself. One recruit() call; cheap enough to run inside the click. */
export function search(file: RecruitFile, parsed: OkRequest): RecruitResult {
  return recruit(file, parsed.condition, parsed.asked);
}

/**
 * Step 2, right after: the class of every record. It needs the whole set of fitting rows, which recruit() hands back when no number is
 * asked, so that is one more call of the same function (not a second copy of the rule). The two answers must agree, or this throws and
 * the page shows no result rather than a wrong one.
 */
export function prepare(file: RecruitFile, parsed: OkRequest, res: RecruitResult): Prepared {
  const n = file.records.length;
  const cls = new Uint8Array(n);
  let optedIn = 0;
  for (let i = 0; i < n; i++) {
    if (file.records[i][2]) {
      cls[i] = OPTED;
      optedIn++;
    }
  }
  if (!res.shown) {
    return { res, shown: false, counts: null, optedIn, cls, selected: [], many: false, stages: STAGE_IDS.slice(0, 2), common: null };
  }
  const all = recruit(file, parsed.condition, null);
  if (!all.shown || all.eligible !== res.eligible || res.optedIn !== optedIn) throw new Error('flow: two recruit() calls disagree');
  for (const i of all.rows) cls[i] |= ELIGIBLE;
  res.rows.forEach((row, k) => {
    if (all.rows[k] !== row) throw new Error('flow: the selected rows are not the first fitting rows');
    cls[row] |= SELECTED;
  });
  return {
    res,
    shown: true,
    counts: { records: res.records, optedIn: res.optedIn, eligible: res.eligible, selected: res.selected },
    optedIn,
    cls,
    selected: res.rows,
    many: res.selected > RING_MAX,
    stages: [...STAGE_IDS],
    common: commonOf(file, parsed.condition, res.rows),
  };
}

// ---------------------------------------------------------------------------------------------------------------- the machine

/** The recorded run is replayed in at most this long, whatever the machine took. The offsets printed stay the recorded ones. */
export const REPLAY_MAX_MS = 2800;
/** The dots start this long after the last machine line. */
export const REPLAY_TO_DOTS_MS = 200;

export interface ReplayLine { id: PhaseId; offsetMs: number; log: string }
export interface ReplayPlan {
  startedAt: string;
  lines: ReplayLine[];
  /** When each line appears, ms after the click: the recorded offsets, compressed. */
  times: number[];
  /** When the dots start, ms after the click. */
  dotsAt: number;
  footer: string | null;
}

/** Reads the vm file (data/synthetic/recruit-50000.vm.json). A file that is not a finished, deleted run gives null: the card is then the label alone. */
export function replayPlan(json: unknown): ReplayPlan | null {
  const vm = json as Partial<VmBlock> | null;
  if (!vm || typeof vm !== 'object' || vm.deleted !== true || typeof vm.started_at !== 'string' || !Number.isFinite(Date.parse(vm.started_at))) return null;
  const phases = vm.phases;
  if (!Array.isArray(phases) || phases.length !== PHASE_IDS.length) return null;
  for (let i = 0; i < phases.length; i++) {
    const p = phases[i];
    if (!p || p.id !== PHASE_IDS[i] || typeof p.log !== 'string' || !Number.isFinite(Date.parse(p.at))) return null;
  }
  const offsets = vmOffsets(vm as VmBlock);
  if (offsets.some((o, i) => i > 0 && o < offsets[i - 1])) return null;
  const last = offsets[offsets.length - 1];
  const scale = last > REPLAY_MAX_MS ? REPLAY_MAX_MS / last : 1;
  const times = offsets.map((o) => Math.round(o * scale));
  const lines = phases.map((p, i) => ({ id: p.id, offsetMs: offsets[i], log: p.log }));
  const footer = typeof vm.size === 'string' && typeof vm.seconds === 'number' ? `${vm.size}, ${vm.seconds} s in total.` : null;
  return { startedAt: vm.started_at, lines, times, dotsAt: times[times.length - 1] + REPLAY_TO_DOTS_MS, footer };
}

// ---------------------------------------------------------------------------------------------------------------- the narrowing

/** Gap between the last thing that moves and the result appearing. */
export const SM_RESULT_GAP_MS = 200;

export interface AfterReveal {
  /** `stageAt[i]` is when stage i+1 is reached, ms after the dots finished filling in (motion.ts: 400, then 1,500 apart). */
  stageAt: number[];
  /** When the rings start, or null when nothing is ringed (above RING_MAX, or under 5). */
  ringsAt: number | null;
  /** When the result (or, under 5, the one sentence) appears. */
  doneAt: number;
}

export function afterReveal(p: Prepared): AfterReveal {
  const stageAt = p.stages.map((_, i) => stepAt(i + 1));
  const lastFade = stageAt[stageAt.length - 1] + SM_FADE_MS;
  if (!p.shown || p.many) return { stageAt, ringsAt: null, doneAt: lastFade + SM_RESULT_GAP_MS };
  return { stageAt, ringsAt: lastFade, doneAt: lastFade + ringsTotal(p.selected.length) + SM_RESULT_GAP_MS };
}
