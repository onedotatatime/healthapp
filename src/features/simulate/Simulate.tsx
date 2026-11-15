/**
 * /doctor/simulate (MIN-4594, parent MIN-4592). The doctor clicks once: the recorded boxd run is replayed with its real times,
 * the 5,000 synthetic records appear as dots, and the matching runs in this browser over them (matcher.ts). The count on screen
 * is the matcher's return value. The "contact" is simulated: nothing is written or sent. Doctor-only (RequireRole in App.tsx).
 * No Supabase, no Edge Function, no RPC, no Gemini, no network call: the data is one file in this chunk.
 */
import { Flask } from '@phosphor-icons/react';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router';
import runJson from '../../../data/synthetic/run-5000.json';
import { COPY as MATCHES_COPY } from '../matches/copy';
import { COPY } from './copy';
import { DotCanvas, colorOfGroup, type Stage } from './DotCanvas';
import { findMatches, parseRun, type MatchOutcome, type RecordDetail, type RunFile, type VmBlock } from './matcher';
import { codeLabel, countryName, formatRunTime, formatValue, groupName, vmOffsets } from './format';
import { SM_CARD_AT, SM_CONTACT_STEP_MS, SM_RINGS_AT, barFraction, stepAt } from './motion';
import './simulate.css';

type Phase = 'idle' | 'machine' | 'dots' | 'matching' | 'done';
const STAGES: Stage[] = ['all', 'all', 'opted', 'share', 'exact', 'exact']; // index = steps revealed; the rings (stage 'shown') come after step 5
const nf = (n: number) => n.toLocaleString('en-US');
const prefersReduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Simulate() {
  const run = useMemo(() => { try { return parseRun(runJson); } catch { return null; } }, []);
  if (!run) {
    // Data error: the page label stays, one card says it. The sentence is the existing one from the matches panel (no new copy until Anna's runError).
    return (
      <main className="page doctor sm" data-testid="doctor-simulate">
        <p className="sm-label" data-testid="sim-page-label"><Flask size={18} aria-hidden="true" />{COPY.pageLabel}</p>
        <h1>{COPY.title}</h1>
        <section className="sm-card"><p role="alert" data-testid="sim-run-error">{MATCHES_COPY.panelError}</p></section>
      </main>
    );
  }
  return <SimulateView run={run} />;
}

export function SimulateView({ run }: { run: RunFile }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [vmIdx, setVmIdx] = useState(-1);
  const [step, setStep] = useState(0);
  const [outcome, setOutcome] = useState<MatchOutcome | null>(null);
  const [runId, setRunId] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [rings, setRings] = useState(false);
  const main = useRef<HTMLElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const recordsRef = useRef<HTMLElement>(null);
  const clickScroll = useRef(0);
  const timers = useRef<number[]>([]);
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  useEffect(() => clear, []);

  // The strip sticks under the page label, which wraps to one or two lines: its height is measured, not guessed.
  useEffect(() => {
    const el = labelRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const set = () => main.current?.style.setProperty('--label-h', `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Spec B3 step 2: on the dots phase the records come to just under the label, only if the page was not scrolled since the click.
  useEffect(() => {
    if (phase !== 'dots' || reduced || Math.abs(window.scrollY - clickScroll.current) > 2) return;
    const el = recordsRef.current;
    if (!el || typeof window.scrollTo !== 'function') return;
    // The strip is the anchor, not the card top: with it just under the label, the strip and the whole canvas are in one viewport.
    const anchor = el.querySelector('.sm-strip') ?? el;
    const top = anchor.getBoundingClientRect().top + window.scrollY - (labelRef.current?.offsetHeight ?? 0);
    window.scrollTo({ top, behavior: 'smooth' });
  }, [phase, reduced]);

  const start = () => {
    clear();
    const red = prefersReduced();
    setReduced(red);
    setOutcome(findMatches(run)); // the matching runs here, at the click
    setRunId((n) => n + 1);
    setStep(0);
    setRings(false);
    clickScroll.current = window.scrollY;
    const vm = run.vm;
    if (vm && !red) {
      setVmIdx(-1);
      setPhase('machine');
      const at = vmOffsets(vm);
      at.forEach((ms, i) => later(() => setVmIdx(i), ms));
      later(() => setPhase('dots'), at[at.length - 1] + 700);
    } else {
      setVmIdx(vm ? vm.phases.length - 1 : -1);
      setPhase('dots');
    }
  };

  const revealed = useCallback(() => {
    setPhase('matching');
    if (prefersReduced()) {
      setStep(5);
      setRings(true);
      setPhase('done');
      return;
    }
    // Spec B3 steps 4 to 10, ms after the dots finished filling in: five narrowings 1,500 apart, then the rings, then the matches card.
    for (let s = 1; s <= 5; s++) later(() => setStep(s), stepAt(s));
    later(() => setRings(true), SM_RINGS_AT);
    later(() => setPhase('done'), SM_CARD_AT);
  }, []);

  const stage: Stage = rings ? 'shown' : STAGES[step];
  const started = phase !== 'idle';
  const showDots = phase === 'dots' || phase === 'matching' || phase === 'done';

  return (
    <main ref={main} className="page doctor sm" data-testid="doctor-simulate">
      <p ref={labelRef} className="sm-label" data-testid="sim-page-label"><Flask size={18} aria-hidden="true" />{COPY.pageLabel}</p>
      <h1>{COPY.title}</h1>
      <p className="sm-intro">{COPY.intro}</p>
      <p>
        <button type="button" className="btn primary" data-testid="sim-run" onClick={start} disabled={phase === 'machine' || phase === 'dots' || phase === 'matching'}>
          {phase === 'done' ? COPY.runAgain : COPY.run}
        </button>
      </p>

      {started && <MachineCard vm={run.vm} vmIdx={vmIdx} />}

      {showDots && outcome && (
        <section ref={recordsRef} className="sm-card" aria-labelledby="sm-h2" data-testid="sim-records">
          <h2 id="sm-h2"><b>2</b> {COPY.recordsTitle}</h2>
          <p className="muted">{COPY.recordsBody}</p>
          <Strip run={run} outcome={outcome} step={step} />
          <DotCanvas key={runId} run={run} stage={stage} reveal={showDots} reduced={reduced} shareRows={outcome.shareRows} matched={outcome.matched} onRevealed={revealed} />
          <ul className="sm-legend" aria-label="Seeded groups">
            {run.groups.map((g) => (
              <li key={g}><i style={{ background: colorOfGroup(g) }} aria-hidden="true" />{groupName(g)} <span className="mono">{nf(run.seeded[g] ?? 0)}</span></li>
            ))}
          </ul>
          <p className="muted sm-small">{COPY.groupNote}</p>
        </section>
      )}

      {(phase === 'matching' || phase === 'done') && outcome && <MatchingCard run={run} outcome={outcome} step={step} />}
      {phase === 'done' && outcome && <Matches run={run} outcome={outcome} key={runId} />}
    </main>
  );
}

function MachineCard({ vm, vmIdx }: { vm: VmBlock | null; vmIdx: number }) {
  return (
    <section className="sm-card" aria-labelledby="sm-h1" data-testid="sim-machine">
      <h2 id="sm-h1"><b>1</b> {COPY.machineTitle}</h2>
      <p className="muted">{COPY.machineBody}</p>
      <p className="sm-fixed" data-testid="sim-machine-label">{vm ? COPY.machineLabel(formatRunTime(vm.started_at)) : COPY.machineFallback}</p>
      {vm && (
        <>
          <ol className="sm-states" aria-label="Machine states">
            {vm.phases.map((p, n) => (
              <li key={p.id} className={n < vmIdx ? 'past' : n === vmIdx ? 'now' : ''} aria-current={n === vmIdx ? 'step' : undefined}>
                <span className="sm-box" data-s={p.id} />
                <strong>{COPY.machineStates[p.id]}</strong>
              </li>
            ))}
          </ol>
          <ul className="sm-log mono" aria-live="polite">
            {vmIdx < 0 && <li>{COPY.machineWaiting}</li>}
            {vm.phases.slice(0, vmIdx + 1).map((p, i) => (
              <li key={p.id}><span>+{(vmOffsets(vm)[i] / 1000).toFixed(1)} s</span> {p.log}</li>
            ))}
          </ul>
          {vm.size && <p className="muted sm-small">{vm.size}, {vm.seconds} s in total.</p>}
        </>
      )}
    </section>
  );
}

function matchingSteps(run: RunFile, outcome: MatchOutcome): [string, string][] {
  const f = outcome.funnel;
  return [
    [COPY.stepFeatures, run.persona.codes.map(codeLabel).join(', ')],
    [COPY.stepOptIn, COPY.optedIn(nf(f.opted_in), nf(run.n))],
    [COPY.stepShared, COPY.shared(f.share_min, run.persona.codes.length)],
    [COPY.stepExact, COPY.exact(f.exact)],
    [COPY.stepK, f.exact >= run.k ? COPY.kShown(f.exact) : COPY.kHidden(f.exact)],
  ];
}

/** Under the records card's text: the sentence of the step that just ran and a bar of how many records are still bright. A mirror of the matching card, so aria-hidden. */
function Strip({ run, outcome, step }: { run: RunFile; outcome: MatchOutcome; step: number }) {
  const steps = matchingSteps(run, outcome);
  const [title, text] = steps[Math.max(step, 1) - 1];
  const pct = barFraction(step, run.n, outcome.funnel) * 100;
  return (
    <div className="sm-strip" data-on={step >= 1} aria-hidden="true" data-testid="sim-strip">
      <p key={step} className="sm-strip-text" data-testid="sim-strip-text">{step <= 1 ? `${title}: ${text}` : text}</p>
      <div className="sm-bar"><i style={{ width: `${pct}%` }} data-testid="sim-strip-bar" /></div>
    </div>
  );
}

function MatchingCard({ run, outcome, step }: { run: RunFile; outcome: MatchOutcome; step: number }) {
  const steps = matchingSteps(run, outcome);
  return (
    <section className="sm-card" aria-labelledby="sm-h3" data-testid="sim-matching">
      <h2 id="sm-h3"><b>3</b> {COPY.matchingTitle}</h2>
      <p className="sm-fixed" data-testid="sim-matching-label">{COPY.matchingLabel}</p>
      <p className="muted">{COPY.matchingBody}</p>
      <ol className="sm-steps" aria-live="polite">
        {steps.map(([title, text], i) => (
          <li key={title} className={i < step ? 'show' : ''} data-testid={`sim-step-${i + 1}`}>
            <strong>{title}</strong>
            <span>{i < step ? text : ''}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Matches({ run, outcome }: { run: RunFile; outcome: MatchOutcome }) {
  const seeded = run.seeded['rare_sarcoid_like'];
  return (
    <section className="sm-card" aria-labelledby="sm-h4" data-testid="sim-matches">
      <h2 id="sm-h4"><b>4</b> {COPY.matchesTitle}</h2>
      {outcome.match_count === 0 ? (
        <p className="sm-big sm-enter" data-testid="sim-empty">{COPY.empty}</p>
      ) : (
        <>
          <p className="sm-big sm-enter" data-testid="sim-count-line">{COPY.matchLine(outcome.match_count)}</p>
          {outcome.groups.map((g) => (
            <div key={g.pattern.join()} className="sm-group">
              <p className="sm-kicker">{COPY.patternLabel}</p>
              <ul className="sm-chips">{g.pattern.map((c) => <li key={c} className="sm-chip sm-enter" style={{ '--i': g.pattern.indexOf(c) } as CSSProperties}>{codeLabel(c)}</li>)}</ul>
              <p className="sm-kicker">{COPY.countriesLabel}</p>
              <ul className="sm-chips">{g.countries.map((c) => <li key={c} className="sm-chip plain">{countryName(c)}</li>)}</ul>
            </div>
          ))}
          {seeded !== undefined && <p className="muted" data-testid="sim-seeded-line">{COPY.seededLine(seeded)}</p>}
          <h3 className="sm-h3">{COPY.contactTitle}</h3>
          <p className="sm-fixed" data-testid="sim-contact-label">{COPY.contactLabel}</p>
          <p className="muted sm-small">{COPY.contactNote}</p>
          <ul className="sm-cards">
            {outcome.matched.map((row, k) => (
              <MatchCard key={row} i={k} n={k + 1} country={run.records[row][0]} detail={run.detail[String(row)]} />
            ))}
          </ul>
        </>
      )}
      <p className="sm-links">
        <Link to="/simulation" data-testid="sim-growth-link">{COPY.growthLink}</Link>
      </p>
    </section>
  );
}

/** Before consent: pattern (above) and country only. The four simulated steps run on timers; nothing is stored or sent. */
function MatchCard({ i, n, country, detail }: { i: number; n: number; country: string; detail?: RecordDetail }) {
  const [at, setAt] = useState(0); // 0 not asked, 1..4 = the step reached
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const ask = () => {
    if (prefersReduced()) return setAt(4);
    setAt(1);
    [2, 3, 4].forEach((s, i) => timers.current.push(window.setTimeout(() => setAt(s), (i + 1) * SM_CONTACT_STEP_MS)));
  };
  const name = countryName(country);
  return (
    <li className="sm-match sm-enter" style={{ '--i': Math.min(i, 3) } as CSSProperties} data-testid={`sim-card-${n}`} data-unlocked={at === 4}>
      <h4>{COPY.cardTitle(n)}</h4>
      <p><span className="muted">{COPY.cardCountry}</span> <strong>{name}</strong></p>
      {at === 0 && (
        <>
          <p className="muted sm-small">{COPY.cardBefore}</p>
          <button type="button" className="btn" data-testid={`sim-ask-${n}`} onClick={ask}>{COPY.ask}</button>
        </>
      )}
      {at > 0 && (
        <ol className="sm-asks" aria-live="polite">
          {COPY.contactSteps.map((s, i) => <li key={s} className={i < at ? 'show' : ''}>{s}</li>)}
        </ol>
      )}
      {at === 4 && detail && <Unlocked n={n} detail={detail} country={name} />}
    </li>
  );
}

function Unlocked({ n, detail, country }: { n: number; detail: RecordDetail; country: string }) {
  const labs = [...detail.labs].sort((a, b) => a.marker.localeCompare(b.marker) || b.date.localeCompare(a.date));
  const list = (xs: string[]) => (xs.length ? xs.join(', ') : COPY.none);
  const spec = detail.specialties[0] ? codeLabel(detail.specialties[0]) : COPY.none;
  return (
    <div className="sm-unlocked" data-testid={`sim-unlocked-${n}`}>
      <h5>{COPY.examsTitle}</h5>
      <div className="sm-tablewrap">
        <table className="sm-table">
          <thead><tr><th>{COPY.colMarker}</th><th>{COPY.colValue}</th><th>{COPY.colRange}</th><th>{COPY.colMonth}</th></tr></thead>
          <tbody>
            {labs.map((l, i) => {
              const q = l.unit === 'qual';
              const dir = !q && l.value > l.ref_high ? COPY.high : !q && l.value < l.ref_low ? COPY.low : null;
              return (
                <tr key={i} className={dir ? 'out' : ''}>
                  <td>{l.marker.replace(/_/g, ' ')}</td>
                  <td className="mono">{formatValue(l)}{dir ? ` (${dir})` : ''}</td>
                  <td className="mono">{q ? '-' : `${l.ref_low}-${l.ref_high}`}</td>
                  <td className="mono">{l.date}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <dl className="sm-facts">
        <dt>{COPY.imaging}</dt><dd>{list(detail.imaging.map((i) => `${codeLabel(i.code).toLowerCase()} (${i.date})`))}</dd>
        <dt>{COPY.symptoms}</dt><dd>{list(detail.symptoms.map(codeLabel))}</dd>
        <dt>{COPY.specialties}</dt><dd>{list(detail.specialties.map(codeLabel))}</dd>
        <dt>{COPY.country}</dt><dd>{country}</dd>
        <dt>{COPY.ageBand}</dt><dd>{detail.age_band}</dd>
      </dl>
      <p className="sm-other" data-testid={`sim-other-doctor-${n}`}>{COPY.otherDoctor(spec, country)}</p>
      <p className="sm-sent" role="status" data-testid={`sim-sent-${n}`}>{COPY.sent}</p>
      <ul className="sm-logs mono">
        <li>{COPY.logDemo}</li>
        <li>{COPY.logMatch(n, country)}</li>
      </ul>
    </div>
  );
}
