/**
 * `/preview/doctor-analysis`: the doctor's workspace (overview, "Over time", "About this file" in the source viewer)
 * against the in-memory assistant, for review and the demo before the two backends are live. SYNTHETIC only: Maria
 * Papadopoulou is the stage persona. Nothing here reaches a server. A result on this screen does not count toward the goal.
 * `?over=empty | error | slow | many` steers the over-time read. `?dx=none | off | timeout | failed | ended | truncated | drops | slow | many` steers the Possible diagnoses answer (MIN-4665). `?file=error` makes the file analysis read fail.
 * The four file states, one per document: Blood test 30 Oct (analysed, 2 items), 12 Mar (analysed, none),
 * Imaging 2 Jun (not analysed yet), Doctor's letter 20 Jan (analysis failed).
 */
import { useMemo } from 'react';
import { ActiveGrantContext } from '../handshake/context';
import { MOCK_DOCTOR, MOCK_PATIENT } from '../handshake/mock';
import { MOCK_FILE_ANALYSIS, MOCK_SERIES_RECORD } from './analysis.mock';
import AssistantWorkspace from './AssistantWorkspace';
import { MatchesContext } from '../matches/context';
import { createMockMatchesApi } from '../matches/mock';
import { computeOverTime } from './analysis.calc';
import { ApiError } from '../../api/call';
import type { DiagnosesResponse, OverTimeSeries } from './analysis.contract';
import { AssistantContext } from './context';
import { createMockAssistant, MOCK_DIAGNOSES } from './mock';

/** `?over=many`: six more made-up series (synthetic) so the dashboard shows "Show all N values". Their cites do not resolve: those points open nothing. */
const extra = (key: string, analyte: string, unit: string, values: number[], lo: number | null, hi: number | null): OverTimeSeries => {
  const points = values.map((value, i) => ({ cite: `r:00000000-0000-4000-8000-${String(990000 + i + key.length * 10).padStart(12, '0')}`, date: `2026-0${i + 2}-1${i}`, value, ref_low: lo, ref_high: hi, out_of_range: lo === null && hi === null ? null : (hi !== null && value > hi) || (lo !== null && value < lo) }));
  const outs = points.filter((p) => p.out_of_range === true);
  return { key, analyte, unit, points, out_of_range: { count: outs.length, first_date: outs[0]?.date ?? null, latest_date: outs.at(-1)?.date ?? null }, projection: values.length >= 3 ? { n: values.length, slope_per_day: 0.02, first_date: points[0].date, last_date: points.at(-1)!.date, horizon_days: 60, horizon_date: '2026-09-20', value_at_horizon: values.at(-1)! + 1 } : null };
};
const MANY = [extra('glucose', 'Glucose', 'mg/dL', [88, 92, 97], 70, 100), extra('ferritin', 'Ferritin', 'ng/mL', [60, 40, 20, 9], 15, 150), extra('hb', 'Haemoglobin', 'g/dL', [12.4, 11.9], 12, 16), extra('vitd', 'Vitamin D', 'ng/mL', [31, 28, 24], null, null), extra('alb', 'Albumin', 'g/L', [42, 43, 41], 35, 50), extra('tsh', 'TSH', 'mIU/L', [2.1, 2.4], 0.4, 4)];

/** `?dx=`: the Possible diagnoses answers the view can get (synthetic). `many` is six items with long names, in the server's order (by name). */
function diagnosesFor(dx: string | null): { diagnoses?: DiagnosesResponse | Error; diagnosesLatencyMs?: number } {
  const counts = MOCK_DIAGNOSES.counts;
  switch (dx) {
    case 'none': return { diagnoses: { ...MOCK_DIAGNOSES, status: 'none', items: [], counts: { ...counts, items: 0, citations: 0, guard_drops: 2 } } };
    case 'off': return { diagnoses: { ...MOCK_DIAGNOSES, status: 'off', items: [], counts: { facts: 0, items: 0, citations: 0, guard_drops: 0, errors: 0 } } };
    case 'timeout': return { diagnoses: new ApiError(503, 'The model timed out.', 'model_unavailable') };
    case 'failed': return { diagnoses: new ApiError(500, 'Internal error.', 'internal') };
    case 'ended': return { diagnoses: new ApiError(403, 'The grant ended.', 'grant_expired') };
    case 'truncated': return { diagnoses: { ...MOCK_DIAGNOSES, truncated: true } };
    case 'drops': return { diagnoses: { ...MOCK_DIAGNOSES, counts: { ...counts, guard_drops: 3 } } };
    case 'slow': return { diagnosesLatencyMs: 60_000 };
    case 'many': {
      const names = ['Ankylosing spondylitis', 'Gout', 'Inflammatory arthritis', 'Osteoarthritis', 'Psoriatic arthritis', 'Reactive arthritis'];
      const items = names.map((name, i) => ({ ...MOCK_DIAGNOSES.items[i % 2], name }));
      return { diagnoses: { ...MOCK_DIAGNOSES, items, counts: { ...counts, items: 6, citations: 21 } } };
    }
    default: return {};
  }
}

const GRANT = {
  grant_id: '00000000-0000-4000-8000-000000000a01',
  status: 'active' as const,
  requested_at: '2026-11-14T10:00:00+02:00',
  approved_at: '2026-11-14T10:01:00+02:00',
  expires_at: '2026-11-14T11:01:00+02:00',
  revoked_at: null,
  patient: MOCK_PATIENT,
  doctor: MOCK_DOCTOR,
};

export default function DoctorAnalysisPreview() {
  const q = new URLSearchParams(window.location.search);
  const over = q.get('over');
  const file = q.get('file');
  const dx = q.get('dx');
  const api = useMemo(() => {
    const fileAnalyses = file === 'error' ? Object.fromEntries(Object.keys(MOCK_FILE_ANALYSIS).map((k) => [k, new Error('read failed')])) : MOCK_FILE_ANALYSIS;
    return createMockAssistant({
      latencyMs: over === 'slow' ? 4000 : 400,
      record: MOCK_SERIES_RECORD,
      fileAnalyses,
      ...diagnosesFor(dx),
      overTime: over === 'many' ? (r) => { const o = computeOverTime(r); return { series: [...o.series, ...MANY], counts: { ...o.counts, values_with_series: o.series.length + MANY.length } }; } : over === 'error' ? new Error('failed') : over === 'empty' ? { series: [], counts: { records_read: 4, values_with_series: 0, projections_computed: 0, series_excluded: 0, errors: 0 } } : undefined,
    });
  }, [over, file, dx]);
  const matches = useMemo(() => createMockMatchesApi(true), []);
  return (
    <AssistantContext.Provider value={api}>
      <MatchesContext.Provider value={matches}>
      <ActiveGrantContext.Provider value={{ grant: GRANT, onEmptyRead: () => {} }}>
        <main className="page doctor dash" data-testid="doctor-analysis-preview">
          <h1>Doctor workspace, preview</h1>
          <p className="muted">Synthetic data: does not count toward the goal. Nothing here reaches a server.</p>
          <AssistantWorkspace />
        </main>
      </ActiveGrantContext.Provider>
      </MatchesContext.Provider>
    </AssistantContext.Provider>
  );
}
