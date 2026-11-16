/**
 * `/preview/matches`: F1 and F2 against the in-memory server, for review and the demo before the RPCs are live. SYNTHETIC only.
 * Turn the switch on and the doctor's panel (same fake database) shows Maria's seeded result; off, it shows the empty text.
 * `?matches=empty | error | slow` steers the doctor's read (see mock.ts).
 */
import { useMemo, useState } from 'react';
import { MatchesContext } from './context';
import { MatchesOptIn } from './MatchesOptIn';
import { createMockMatchesApi } from './mock';
import { PossibleMatchesPanel } from './PossibleMatchesPanel';

const PREVIEW_PATIENT_ID = '00000000-0000-4000-8000-000000000001';

export default function MatchesPreview() {
  const api = useMemo(() => createMockMatchesApi(false), []);
  const [key, setKey] = useState(0);
  return (
    <MatchesContext.Provider value={api}>
      <main className="page doctor" data-testid="matches-preview">
        <h1>Possible matches, preview</h1>
        <p className="muted">Synthetic data. Nothing here reaches a server. The switch and the panel share one fake database.</p>
        <h2>What the patient sees</h2>
        <div style={{ maxWidth: 480 }}><MatchesOptIn onChange={() => setKey((k) => k + 1)} /></div>
        <h2>What the doctor sees, in a session with that patient</h2>
        <PossibleMatchesPanel patientId={PREVIEW_PATIENT_ID} refreshKey={key} autoRun />
      </main>
    </MatchesContext.Provider>
  );
}
