/**
 * F2 (MIN-4507) and "Run the matching" (MIN-4664): the doctor's possible-matches panel, in the view of a patient who
 * granted access. Nothing is called when the workspace opens: one call to `healthapp_possible_matches(patient_id)` per
 * press of "Run the matching". The permanent label is in every state. The empty text is one and the same for "not opted in",
 * "no match" and "fewer than 5": the server returns the same empty answer, and this screen has no other signal, so it
 * cannot say which case it is (the privacy rule of MIN-4505); it says all three and never which.
 */
import { Flask, Users } from '@phosphor-icons/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../../api/call';
import { Spinner } from '../../components/Primitives';
import { useMatchesApi } from './context';
import type { PossibleMatches } from './contract';
import { COPY } from './copy';
import { countryName, featureLabel } from './pattern';
import './matches.css';

export type PanelState = { status: 'idle' } | { status: 'loading' } | { status: 'error' } | { status: 'ended' } | { status: 'ready'; result: PossibleMatches };

const isGone = (e: unknown) => e instanceof ApiError && (e.code === 'grant_expired' || e.status === 403);

/** Empty means nothing to show. The server applies k = 5; this never shows a group it was not given. */
export const isEmpty = (r: PossibleMatches) => r.match_count === 0 || r.groups.length === 0;

/** Presentational and pure, so every state can be rendered in a test. */
export function MatchesView({ state, onRun, onRetry }: { state: PanelState; onRun?: () => void; onRetry?: () => void }) {
  const run = onRun ?? onRetry;
  const tag = state.status === 'ready' ? (isEmpty(state.result) ? 'empty' : 'populated') : state.status === 'loading' ? 'running' : state.status;
  return (
    <section className="mx-panel" aria-labelledby="mx-title" data-testid="matches-panel" data-state={tag}>
      <h2 id="mx-title">{COPY.panelTitle}</h2>
      <p className="mx-label" data-testid="matches-label">
        <Flask size={18} weight="bold" aria-hidden="true" />
        {COPY.panelLabel}
      </p>
      {state.status === 'idle' && (
        <div className="mx-run" data-testid="matches-idle">
          <p>{COPY.panelIdle}</p>
          <button type="button" className="btn primary as-btn" onClick={run} data-testid="matches-run"><Users size={20} weight="bold" aria-hidden="true" /> {COPY.panelRun}</button>
        </div>
      )}
      {state.status === 'loading' && (
        <div className="mx-run" data-testid="matches-loading">
          <p><Spinner label={COPY.panelLoading} /></p>
          <button type="button" className="btn primary as-btn" disabled aria-busy="true" data-testid="matches-run"><Users size={20} weight="bold" aria-hidden="true" /> {COPY.panelRun}</button>
        </div>
      )}
      {state.status === 'ended' && <p className="muted" role="status" data-testid="matches-ended">{COPY.panelEnded}</p>}
      {state.status === 'error' && (
        <div data-testid="matches-error">
          <p className="muted">{COPY.panelError}</p>
          <button type="button" className="btn" onClick={run} data-testid="matches-retry">{COPY.panelRetry}</button>
        </div>
      )}
      {state.status === 'ready' && isEmpty(state.result) && (
        <>
          <div className="empty" data-testid="matches-empty">{COPY.panelEmpty}</div>
          <div className="mx-foot">
            <p className="muted small" data-testid="matches-empty-why">{COPY.panelEmptyWhy}</p>
            <button type="button" className="btn as-btn" onClick={run} data-testid="matches-run">{COPY.panelRunAgain}</button>
          </div>
        </>
      )}
      {state.status === 'ready' && !isEmpty(state.result) && (
        <>
          <p className="mx-total" data-testid="matches-total">{COPY.matchTotal(state.result.match_count, state.result.groups.length)}</p>
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
          <div className="mx-foot">
            <p className="muted small">{COPY.panelHelper}</p>
            <button type="button" className="btn as-btn" onClick={run} data-testid="matches-run">{COPY.panelRunAgain}</button>
          </div>
        </>
      )}
    </section>
  );
}

/** `autoRun` is for the preview page only; the doctor's workspace waits for the button. */
export function PossibleMatchesPanel({ patientId, refreshKey = 0, autoRun = false, onGone }: { patientId: string; refreshKey?: number; autoRun?: boolean; onGone?: () => void }) {
  const api = useMatchesApi();
  const [state, setState] = useState<PanelState>(autoRun ? { status: 'loading' } : { status: 'idle' });
  const seq = useRef(0);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const run = useCallback(() => {
    const mine = ++seq.current;
    setState({ status: 'loading' });
    api.possibleMatches(patientId).then(
      (result) => alive.current && mine === seq.current && setState({ status: 'ready', result }),
      (e) => {
        if (!alive.current || mine !== seq.current) return;
        if (isGone(e)) {
          setState({ status: 'ended' });
          onGone?.();
        } else setState({ status: 'error' });
      },
    );
  }, [api, patientId, onGone]);

  useEffect(() => {
    if (autoRun) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun, refreshKey]);

  return <MatchesView state={state} onRun={run} />;
}
