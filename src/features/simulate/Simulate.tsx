/**
 * /doctor/simulate, one flow (MIN-4736, replacing the two flows of MIN-4706 and MIN-4594). A doctor writes one sentence and presses
 * "Search the records" (or Enter): that is the only control that starts anything. The click reads the sentence (a number and one
 * condition from a fixed list of 13), then plays the simulation: the machine card replays the recorded 50,000 run (data/synthetic/
 * recruit-50000.vm.json), the 50,000 records appear as dots, and four stages narrow them: all records, opted in to matching, fit the
 * criteria, selected. Every count and every bright dot is what recruit() returned at this click (flow.ts); the animation only reveals it.
 *
 * Synthetic data only. Doctor-only (RequireRole in App.tsx). No network call, no model, nothing stored: the sentence lives in this
 * component's state. The records are one file loaded with import() after the first paint (recruit-data.ts).
 */
import { Flask } from '@phosphor-icons/react';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type RefObject } from 'react';
import { Link } from 'react-router';
import vmJson from '../../../data/synthetic/recruit-50000.vm.json';
import { COPY, RECRUIT_CONDITION_NAMES, RECRUIT_COPY as T, recruitFill } from './copy';
import { DotCanvas } from './DotCanvas';
import type { FieldInput } from './dotPaint';
import { RING_MAX, brightFraction, stageOfStep, STAGE_IDS, type StageId } from './dots';
import { afterReveal, answerFor, prepare, replayPlan, search, type Answer, type OkRequest, type Prepared } from './flow';
import { codeLabel, countryName } from './format';
import { MachineCard, type MachineView } from './MachineCard';
import { parseRecruitFile, type RecruitCondition, type RecruitFile, type RecruitResult } from './recruit';
import './recruit.css';
import './simulate.css';

type Phase = 'idle' | 'machine' | 'dots' | 'stages' | 'done';
type Loaded = { state: 'loading' } | { state: 'error' } | { state: 'ready'; file: RecruitFile };
interface Shown { id: number; ans: Answer }

const nf = (n: number) => n.toLocaleString('en-US');
const nameOf = (c: RecruitCondition) => RECRUIT_CONDITION_NAMES[c.id as keyof typeof RECRUIT_CONDITION_NAMES] ?? c.name;
const prefersReduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const defaultLoad = () => import('./recruit-data').then((m) => m.default);
const stageText = (stage: StageId, many: boolean) => (stage === 'selected' && many ? COPY.canvasStage.selectedMany(nf(RING_MAX)) : COPY.canvasStage[stage]);
const FUNNEL_KEYS = ['records', 'optedIn', 'eligible', 'selected'] as const;

export default function Simulate() {
  return <SimulateView />;
}

/** `load` is the records' loader and `vm` the recorded run; tests and the review harness may pass others, the page passes none. */
export function SimulateView({ load = defaultLoad, vm = vmJson }: { load?: () => Promise<unknown>; vm?: unknown }) {
  const [text, setText] = useState('');
  const [data, setData] = useState<Loaded>({ state: 'loading' });
  const [queued, setQueued] = useState<string | null>(null); // a click that came before the records were in
  const [shown, setShown] = useState<Shown | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [machine, setMachine] = useState<MachineView | null>(null);
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [step, setStep] = useState(0); // stages reached: 0 = the dots are in, nothing lit yet
  const [rings, setRings] = useState(false);
  const [reduced, setReduced] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const main = useRef<HTMLElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const recordsRef = useRef<HTMLElement>(null);
  const clickScroll = useRef(0);
  const timers = useRef<number[]>([]);
  const preparedRef = useRef<Prepared | null>(null);
  const reducedRef = useRef(false);
  const runId = useRef(0);
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  useEffect(() => clear, []);

  // After the first paint: the timer runs once the first commit is on screen, so the 50,000 records are never on the first paint's path.
  useEffect(() => {
    let alive = true;
    const t = window.setTimeout(() => {
      load()
        .then((json) => { if (alive) setData({ state: 'ready', file: parseRecruitFile(json) }); })
        .catch(() => { if (alive) setData({ state: 'error' }); });
    }, 0);
    return () => { alive = false; window.clearTimeout(t); };
  }, [load]);
  const file = data.state === 'ready' ? data.file : null;
  const plan = useMemo(() => replayPlan(vm), [vm]);

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

  // On the dots phase the records come to just under the label, only if the page was not scrolled since the click and motion is allowed.
  useEffect(() => {
    if (phase !== 'dots' || reduced || Math.abs(window.scrollY - clickScroll.current) > 2) return;
    const el = recordsRef.current;
    if (!el || typeof window.scrollTo !== 'function') return;
    const anchor = el.querySelector('.sm-strip') ?? el;
    const top = anchor.getBoundingClientRect().top + window.scrollY - (labelRef.current?.offsetHeight ?? 0);
    window.scrollTo({ top, behavior: 'smooth' });
  }, [phase, reduced]);

  const machineView = (lines: number, footer: boolean): MachineView => ({
    mode: 'replay',
    notice: null,
    startedAt: plan?.startedAt ?? null,
    states: plan !== null,
    lines: plan ? plan.lines.slice(0, lines) : [],
    footer: footer && plan ? plan.footer : null,
  });

  /** The click, after the sentence is in: parse it, clear what an earlier search left, and start the run only when the sentence says something to search for. */
  const begin = (f: RecruitFile, sentence: string) => {
    clear();
    const red = prefersReduced();
    reducedRef.current = red;
    const ans = answerFor(f, sentence);
    runId.current += 1;
    preparedRef.current = null;
    setReduced(red);
    setShown({ id: runId.current, ans });
    setPrepared(null);
    setStep(0);
    setRings(false);
    if (ans.kind !== 'run') {
      setMachine(null);
      setPhase('idle');
      return;
    }
    clickScroll.current = window.scrollY;
    const parsed = ans.parsed;
    if (red) {
      // Reduced motion: the finished state of every stage at once. No timer.
      const p = prepare(f, parsed, search(f, parsed));
      preparedRef.current = p;
      setPrepared(p);
      setMachine(machineView(plan ? plan.lines.length : 0, true));
      setStep(p.stages.length);
      setRings(p.shown && !p.many);
      setPhase('done');
      return;
    }
    setMachine(machineView(0, false));
    setPhase('machine');
    // The two recruit() calls run in their own short tasks while the machine card plays, so the click itself stays light.
    let res: RecruitResult | null = null;
    later(() => { res = search(f, parsed); }, 20);
    later(() => {
      const p = prepare(f, parsed, res ?? search(f, parsed));
      preparedRef.current = p;
      setPrepared(p);
    }, 60);
    if (plan) {
      plan.times.forEach((ms, i) => later(() => setMachine(machineView(i + 1, i === plan.times.length - 1)), ms));
    }
    later(() => setPhase('dots'), Math.max(plan ? plan.dotsAt : 0, 150));
  };

  const running = phase === 'machine' || phase === 'dots' || phase === 'stages' || queued !== null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (running) return; // one simulation at a time
    if (file) begin(file, text);
    else if (data.state === 'loading') setQueued(text); // the flow waits for the records
  };
  useEffect(() => {
    if (file && queued !== null) {
      const q = queued;
      setQueued(null);
      begin(file, q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, queued]);

  const fill = (c: RecruitCondition) => {
    const asked = shown?.ans.kind === 'run' ? shown.ans.parsed.asked : null;
    setText(recruitFill(asked ?? 40, c.name));
    input.current?.focus();
  };

  /** All the dots are in: the four stages follow, each a fixed time after (motion.ts), then the rings, then the result. */
  const revealed = useCallback(() => {
    const p = preparedRef.current;
    if (!p || reducedRef.current) return;
    setPhase('stages');
    const tl = afterReveal(p);
    tl.stageAt.forEach((ms, i) => later(() => setStep(i + 1), ms));
    if (tl.ringsAt !== null) later(() => setRings(true), tl.ringsAt);
    later(() => setPhase('done'), tl.doneAt);
  }, []);

  const field = useMemo<FieldInput | null>(
    () => (prepared && file ? { seed: file.seed, cls: prepared.cls, selected: prepared.selected, many: prepared.many, stages: prepared.stages } : null),
    [prepared, file],
  );
  const showDots = phase === 'dots' || phase === 'stages' || phase === 'done';

  return (
    <main ref={main} className="page doctor sm" data-testid="doctor-simulate">
      <p ref={labelRef} className="sm-label" data-testid="sim-page-label"><Flask size={18} aria-hidden="true" />{COPY.pageLabel}</p>
      <h1>{T.title}</h1>
      {file && <p className="sm-intro" data-testid="recruit-intro">{T.intro(nf(file.n))}</p>}

      <div className="sm-card" data-testid="recruit">
        <form className="rc-form" onSubmit={submit} data-testid="recruit-form">
          <div className="rc-field">
            <label htmlFor="rc-input">{T.inputLabel}</label>
            <input
              ref={input}
              id="rc-input"
              className="rc-input"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={T.placeholder}
              maxLength={300}
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="search"
              data-testid="recruit-input"
            />
          </div>
          <button type="submit" className="btn primary" data-testid="recruit-submit" disabled={running}>{T.button}</button>
        </form>
        <div className="rc-out" aria-live="polite" data-testid="recruit-out">
          {data.state === 'loading' && <p className="muted" data-testid="recruit-loading">{T.loading}</p>}
          {data.state === 'error' && <p role="alert" data-testid="recruit-load-error">{T.loadError}</p>}
          {file && shown && <Said file={file} ans={shown.ans} onPick={fill} />}
        </div>
      </div>

      {machine && file && <MachineCard view={machine} total={nf(file.n)} />}

      {showDots && file && prepared && field && shown?.ans.kind === 'run' && (
        <Records
          sectionRef={recordsRef}
          id={shown.id}
          file={file}
          request={shown.ans.parsed}
          prepared={prepared}
          field={field}
          step={step}
          rings={rings}
          reduced={reduced}
          done={phase === 'done'}
          onRevealed={revealed}
        />
      )}

      <p className="sm-links">
        <Link to="/simulation" data-testid="sim-growth-link">{COPY.growthLink}</Link>
      </p>
    </main>
  );
}

/** The records card: the dots, the strip, the four step rows and, last, the result. A pure view of the run so far (`step`, `rings`, `done`). */
export function Records({ sectionRef, id, file, request, prepared, field, step, rings, reduced, done, onRevealed }: {
  sectionRef?: RefObject<HTMLElement | null>;
  id: number;
  file: RecruitFile;
  request: OkRequest;
  prepared: Prepared;
  field: FieldInput;
  step: number;
  rings: boolean;
  reduced: boolean;
  done: boolean;
  onRevealed: () => void;
}) {
  const stage = stageOfStep(step);
  return (
    <section ref={sectionRef} className="sm-card" aria-labelledby="sm-h2" data-testid="sim-records">
      <h2 id="sm-h2"><b>2</b> {COPY.recordsTitle(nf(file.n))}</h2>
      <p className="muted">{COPY.recordsBody}</p>
      <Strip stage={stage} step={step} prepared={prepared} records={file.n} />
      <DotCanvas
        key={id}
        input={field}
        label={COPY.canvasLabel(nf(file.n), stageText(stage, prepared.many))}
        stage={stage}
        rings={rings}
        reduced={reduced}
        onRevealed={onRevealed}
      />
      {prepared.shown && <Steps prepared={prepared} step={step} />}
      <Ending file={file} cond={request.condition} asked={request.asked} prepared={prepared} step={step} done={done} />
    </section>
  );
}

/** What the sentence said, at once at the click: the sentence that stops a search, or what was read from it. */
export function Said({ file, ans, onPick }: { file: RecruitFile; ans: Answer; onPick: (c: RecruitCondition) => void }) {
  if (ans.kind === 'empty') return <p data-testid="recruit-empty">{T.emptyBox}</p>;
  if (ans.kind === 'too_many') return <p data-testid="recruit-too-many">{T.tooMany(nf(file.n))}</p>;
  if (ans.kind === 'no_condition') {
    return (
      <>
        <p id="rc-unknown" data-testid="recruit-unknown">{T.unknownCondition}</p>
        <ul className="rc-picks" aria-labelledby="rc-unknown">
          {file.conditions.map((c) => (
            <li key={c.id}><button type="button" className="rc-pick" data-testid={`recruit-pick-${c.id}`} onClick={() => onPick(c)}>{nameOf(c)}</button></li>
          ))}
        </ul>
        <p className="muted sm-small">{T.groupNote}</p>
      </>
    );
  }
  const { condition: c, asked, others } = ans.parsed;
  const name = nameOf(c);
  return (
    <div className="rc-out" data-testid="recruit-result" data-condition={c.id}>
      {others.length > 0 && <p className="rc-notice" data-testid="recruit-two">{T.twoConditions(name)}</p>}
      <p className="rc-read" data-testid="recruit-read">{asked ? T.read(nf(asked), name) : T.readNoNumber(name)}</p>
    </div>
  );
}

/** Under the records card's text: the sentence of the stage that just ran and a bar of how much is still bright. A mirror of the canvas label, so aria-hidden. */
function Strip({ stage, step, prepared, records }: { stage: StageId; step: number; prepared: Prepared; records: number }) {
  const pct = brightFraction(stage, prepared.counts, prepared.optedIn, records) * 100;
  return (
    <div className="sm-strip" data-on={step >= 1} aria-hidden="true" data-testid="sim-strip">
      <p key={stage} className="sm-strip-text" data-testid="sim-strip-text">{stageText(stage, prepared.many)}</p>
      <div className="sm-bar"><i style={{ width: `${pct}%` }} data-testid="sim-strip-bar" /></div>
    </div>
  );
}

/** The four step rows. A row shows its count only once its stage is reached. The counts are recruit()'s, computed at this click. */
function Steps({ prepared, step }: { prepared: Prepared; step: number }) {
  const counts = prepared.counts;
  if (!counts) return null;
  return (
    <ol className="rc-funnel" aria-live="polite" data-testid="recruit-funnel">
      {FUNNEL_KEYS.map((key, i) => {
        const lit = step >= i + 1;
        return (
          <li key={key} className={lit ? 'show' : ''} data-testid={`recruit-funnel-${key}`}>
            <span className="rc-num mono">{lit ? nf(counts[key]) : ''}</span>
            <div>
              <strong>{T.funnel[key].label}</strong>
              <span className="rc-line">{T.funnel[key].line}</span>
              <div className="sm-bar" aria-hidden="true"><i style={{ width: lit ? `${(counts[key] / counts.records) * 100}%` : 0 }} /></div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** The "Compared" line from the fit stage on; after the last stage the result. Under 5 only the one sentence: no count, no countries. */
function Ending({ file, cond, asked, prepared, step, done }: { file: RecruitFile; cond: RecruitCondition; asked: number | null; prepared: Prepared; step: number; done: boolean }) {
  const must = cond.must.map(codeLabel).join(', ');
  const some = cond.some.map(codeLabel).join(', ');
  const compared = cond.some.length === 0 ? T.comparedOnlyMust(must) : T.compared(must, some, String(cond.min_some));
  const res = prepared.res;
  const comparedOn = prepared.shown ? step >= STAGE_IDS.indexOf('fit') + 1 : done;
  return (
    <>
      {comparedOn && <p className="rc-read sm-enter" data-testid="recruit-compared">{compared}</p>}
      {done && !res.shown && <p className="sm-big sm-enter" data-testid="recruit-few">{T.fewerThanK(String(file.k))}</p>}
      {done && res.shown && (
        <div className="rc-end sm-enter" data-testid="recruit-found">
          {asked === null ? (
            <>
              <p className="sm-big" data-testid="recruit-line">{T.resultNoNumber(nf(res.selected))}</p>
              <p className="muted" data-testid="recruit-no-number">{T.noNumberNote}</p>
            </>
          ) : res.short > 0 ? (
            <p className="sm-big" data-testid="recruit-line">{T.resultShort(nf(res.eligible), nf(asked))}</p>
          ) : (
            <>
              <p className="sm-big" data-testid="recruit-line">{T.resultEqual(nf(asked), nf(res.selected))}</p>
              {res.eligible > asked && <p className="muted" data-testid="recruit-more">{T.resultMore(nf(res.eligible - asked))}</p>}
            </>
          )}
          <p data-testid="recruit-countries">{T.countries(res.countries.map(countryName).sort((a, b) => a.localeCompare(b)).join(', '))}</p>
          <p className="muted sm-small">{T.groupNote}</p>
        </div>
      )}
    </>
  );
}
