/**
 * F2 (MIN-4507): the doctor's possible-matches panel, in the view of a patient who granted access. One call to
 * `healthapp_possible_matches(patient_id)`. The permanent label is in every state. The empty text is one and the same
 * for "not opted in", "no match" and "fewer than 5": the server returns the same empty answer, and this screen has no
 * other signal, so it cannot hint which case it is.
 */
import { Flask } from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';
import { Spinner } from '../../components/Primitives';
import { useMatchesApi } from './context';
import type { PossibleMatches } from './contract';
import { COPY } from './copy';
import { countryName, featureLabel } from './pattern';
import './matches.css';

export type PanelState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; result: PossibleMatches };

/** Empty means nothing to show. The server applies k = 5; this never shows a group it was not given. */
export const isEmpty = (r: PossibleMatches) => r.match_count === 0 || r.groups.length === 0;

/** Presentational and pure, so every state can be rendered in a test. */
export function MatchesView({ state, onRetry }: { state: PanelState; onRetry?: () => void }) {
  return (
    <section className="mx-panel" aria-labelledby="mx-title" data-testid="matches-panel" data-state={state.status === 'ready' ? (isEmpty(state.result) ? 'empty' : 'populated') : state.status}>
      <h2 id="mx-title">{COPY.panelTitle}</h2>
      <p className="mx-label" data-testid="matches-label">
        <Flask size={18} weight="bold" aria-hidden="true" />
        {COPY.panelLabel}
      </p>
      {state.status === 'loading' && <p data-testid="matches-loading"><Spinner label={COPY.panelLoading} /></p>}
      {state.status === 'error' && (
        <div data-testid="matches-error">
          <p className="muted">{COPY.panelError}</p>
          {onRetry && <button type="button" className="btn" onClick={onRetry} data-testid="matches-retry">{COPY.panelRetry}</button>}
        </div>
      )}
      {state.status === 'ready' && isEmpty(state.result) && <div className="empty" data-testid="matches-empty">{COPY.panelEmpty}</div>}
      {state.status === 'ready' && !isEmpty(state.result) && (
        <>
          <ul className="mx-groups">
            {state.result.groups.map((g, i) => (
              <li key={i} className="mx-group" data-testid="match-group">
                <p className="mx-count">{COPY.matchLine(g.n)}</p>
                <p className="mx-kicker">{COPY.patternLabel}</p>
                <ul className="mx-chips" data-testid="match-pattern">
                  {g.pattern.map((f) => <li key={f} className="mx-chip">{featureLabel(f)}</li>)}
                </ul>
                <p className="mx-kicker">{COPY.countriesLabel}</p>
                <ul className="mx-chips" data-testid="match-countries">
                  {g.countries.map((c) => <li key={c} className="mx-chip plain">{countryName(c)}</li>)}
                </ul>
              </li>
            ))}
          </ul>
          <p className="muted small">{COPY.panelHelper}</p>
        </>
      )}
    </section>
  );
}

export function PossibleMatchesPanel({ patientId, refreshKey = 0 }: { patientId: string; refreshKey?: number }) {
  const api = useMatchesApi();
  const [state, setState] = useState<PanelState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setState({ status: 'loading' });
    api.possibleMatches(patientId).then(
      (result) => alive && setState({ status: 'ready', result }),
      () => alive && setState({ status: 'error' }),
    );
    return () => {
      alive = false;
    };
  }, [api, patientId, attempt, refreshKey]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return <MatchesView state={state} onRetry={retry} />;
}
