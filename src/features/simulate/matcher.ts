/**
 * The matching of /doctor/simulate (MIN-4594): a TypeScript port of scripts/synthetic/match.py, run in the browser over the
 * 5,000 coded records of data/synthetic/run-5000.json. Exact shared set, at least `minShared` shared codes, k = 5, opt-in checked.
 * Synthetic data only. Pure: no network, no import from src/api or matches/real. It never reads a record's group index
 * (that column only colours the dots) and never a name: records carry a country and an age band, nothing else.
 */

export type RunRecord = [country: string, ageBand: number, optIn: 0 | 1, groupIdx: number, codes: number[]];

export interface LabRow { marker: string; value: number; unit: string; ref_low: number; ref_high: number; date: string }
export interface RecordDetail { country: string; age_band: string; labs: LabRow[]; imaging: { code: string; date: string }[]; symptoms: string[]; specialties: string[] }
export interface VmPhase { id: 'created' | 'running' | 'done' | 'deleted'; at: string; log: string; seconds: number }
export interface VmBlock { provider: string; started_at: string; phases: VmPhase[]; seconds: number; deleted: boolean; size?: string }
export interface ShownGroup { n: number; pattern: string[]; countries: string[]; label: string }

export interface RunFile {
  synthetic: true;
  label: string;
  seed: number;
  n: number;
  k: number;
  min_shared: number;
  seeded: Record<string, number>;
  codes: string[];
  age_bands: string[];
  groups: string[];
  records: RunRecord[];
  persona: { id: string; country: string; age_band: string; codes: string[]; opt_in: boolean };
  result: { match_count: number; groups: ShownGroup[]; matched: number[]; funnel: Funnel };
  detail: Record<string, RecordDetail>;
  vm: VmBlock | null;
}

export interface Funnel { opted_in: number; share_min: number; exact: number; shown: number }

export interface MatchOutcome {
  match_count: number;
  groups: ShownGroup[];
  /** Row numbers of the records in the shown groups, ascending. Empty when nothing may be shown. */
  matched: number[];
  funnel: Funnel;
  /** Row numbers of the opted-in records that share at least `minShared` of the persona's codes (the step before exact sets). */
  shareRows: number[];
}

export const LABEL = 'seeded, synthetic';

/** Guard for the one file the page imports. It is written by build_run.py; this only refuses a file that is not that. */
export function parseRun(x: unknown): RunFile {
  const r = x as Partial<RunFile> | null;
  if (!r || r.synthetic !== true || !Array.isArray(r.records) || r.records.length !== r.n || !r.persona || !Array.isArray(r.codes)) {
    throw new Error('Not a synthetic run file.');
  }
  return r as RunFile;
}

/**
 * Returns the shown groups, or an empty answer (match_count 0, no groups) when the persona has not opted in or no exact group
 * reaches k. The funnel counts are filled in either way, so the page can show where the search stopped.
 */
export function findMatches(run: RunFile, opts: { k?: number; minShared?: number; persona?: RunFile['persona'] } = {}): MatchOutcome {
  const k = opts.k ?? run.k;
  const minShared = opts.minShared ?? run.min_shared;
  const persona = opts.persona ?? run.persona;
  const empty: MatchOutcome = { match_count: 0, groups: [], matched: [], funnel: { opted_in: 0, share_min: 0, exact: 0, shown: 0 }, shareRows: [] };
  if (!persona.opt_in) return empty;

  const idx = new Map(run.codes.map((c, i) => [c, i]));
  const mine = new Set(persona.codes.map((c) => idx.get(c)).filter((i): i is number => i !== undefined));
  const bySet = new Map<string, number[]>();
  let optedIn = 0;
  for (let row = 0; row < run.records.length; row++) {
    const [, , optIn, , codes] = run.records[row];
    if (!optIn) continue;
    optedIn++;
    const shared = codes.filter((c) => mine.has(c)); // codes are ascending, so `shared` is too
    if (shared.length < minShared) continue;
    const key = shared.join(',');
    const rows = bySet.get(key);
    if (rows) rows.push(row);
    else bySet.set(key, [row]);
  }

  const shareRows = [...bySet.values()].flat().sort((a, b) => a - b);
  const exact = Math.max(0, ...[...bySet.values()].map((r) => r.length));
  const groups: (ShownGroup & { rows: number[] })[] = [];
  for (const [key, rows] of bySet) {
    if (rows.length < k) continue;
    const pattern = key.split(',').map((i) => run.codes[Number(i)]).sort();
    const countries = [...new Set(rows.map((r) => run.records[r][0]))].sort();
    groups.push({ n: rows.length, pattern, countries, label: LABEL, rows });
  }
  const funnel = { opted_in: optedIn, share_min: shareRows.length, exact, shown: 0 };
  if (groups.length === 0) return { ...empty, funnel, shareRows };

  groups.sort((a, b) => b.n - a.n || (a.pattern.join('\0') < b.pattern.join('\0') ? -1 : 1));
  const match_count = groups.reduce((s, g) => s + g.n, 0);
  const matched = groups.flatMap((g) => g.rows).sort((a, b) => a - b);
  return {
    match_count,
    groups: groups.map(({ rows: _rows, ...g }) => g),
    matched,
    funnel: { ...funnel, shown: match_count },
    shareRows,
  };
}
