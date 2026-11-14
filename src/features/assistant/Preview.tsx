/**
 * `/preview/doctor-analysis`: the doctor's workspace (overview, "Over time", "About this file" in the source viewer)
 * against the in-memory assistant, for review and the demo before the two backends are live. SYNTHETIC only: Maria
 * Papadopoulou is the stage persona. Nothing here reaches a server. A result on this screen does not count toward the goal.
 * `?over=empty | error | slow` steers the over-time read. `?file=error` makes the file analysis read fail.
 * The four file states, one per document: Blood test 30 Oct (analysed, 2 items), 12 Mar (analysed, none),
 * Imaging 2 Jun (not analysed yet), Doctor's letter 20 Jan (analysis failed).
 */
import { useMemo } from 'react';
import { ActiveGrantContext } from '../handshake/context';
import { MOCK_DOCTOR, MOCK_PATIENT } from '../handshake/mock';
import { MOCK_FILE_ANALYSIS, MOCK_SERIES_RECORD } from './analysis.mock';
import AssistantWorkspace from './AssistantWorkspace';
import { AssistantContext } from './context';
import { createMockAssistant } from './mock';

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
  const api = useMemo(() => {
    const fileAnalyses = file === 'error' ? Object.fromEntries(Object.keys(MOCK_FILE_ANALYSIS).map((k) => [k, new Error('read failed')])) : MOCK_FILE_ANALYSIS;
    return createMockAssistant({
      latencyMs: over === 'slow' ? 4000 : 400,
      record: MOCK_SERIES_RECORD,
      fileAnalyses,
      overTime: over === 'error' ? new Error('failed') : over === 'empty' ? { series: [], counts: { records_read: 4, values_with_series: 0, projections_computed: 0, series_excluded: 0, errors: 0 } } : undefined,
    });
  }, [over, file]);
  return (
    <AssistantContext.Provider value={api}>
      <ActiveGrantContext.Provider value={{ grant: GRANT, onEmptyRead: () => {} }}>
        <main className="page doctor" data-testid="doctor-analysis-preview">
          <h1>Doctor workspace, preview</h1>
          <p className="muted">Synthetic data: does not count toward the goal. Nothing here reaches a server.</p>
          <AssistantWorkspace />
        </main>
      </ActiveGrantContext.Provider>
    </AssistantContext.Provider>
  );
}
