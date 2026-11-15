/**
 * What the doctor sees inside the workspace shell while the grant runs (MIN-4488): the overview on the left, the ask box
 * and answers on the right, the source viewer as a side sheet. This whole module is loaded lazily from
 * `DoctorWorkspace` (handshake/DoctorConnect.tsx), so the patient bundle never contains it. When access ends the shell
 * unmounts and everything here, including the conversation and the photo URL, goes with it.
 */
import { ChartLineUp, ChatCircleText, Stethoscope } from '@phosphor-icons/react';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { EmptyState, ErrorNote, Spinner } from '../../components/Primitives';
import { useActiveGrant } from '../handshake/context';
import { PossibleMatchesPanel } from '../matches/PossibleMatchesPanel';
import { askErrorMessage, isGrantGone } from './api';
import { CARDS_SHOWN, orderSeries } from './analysis';
import { DiagnosesPanel } from './Diagnoses';
import { ExamsList } from './Exams';
import { AskPanel } from './Ask';
import { useAssistantApi } from './context';
import { OverviewPanel } from './Overview';
import { FlagsRow, OverTimeView } from './OverTime';
import { useOverTime } from './OverTimePanel';
import { buildExams, buildIndex, buildOverview, type RecordData, type Subject } from './record';
import { SourceViewer } from './SourceViewer';
import './assistant.css';

type Load = { status: 'loading' } | { status: 'ready'; data: RecordData } | { status: 'error'; message: string };
type Open = { subject: Subject; cite: string | null };

export default function AssistantWorkspace() {
  const active = useActiveGrant();
  const api = useAssistantApi();
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [open, setOpen] = useState<Open | null>(null);
  const opener = useRef<Element | null>(null);
  const onEmptyRead = active?.onEmptyRead;
  const patientId = active?.grant.patient.id;

  useEffect(() => {
    if (!patientId) return;
    let alive = true;
    setLoad({ status: 'loading' });
    api.loadRecord(patientId).then(
      (data) => alive && setLoad({ status: 'ready', data }),
      (e) => {
        if (!alive) return;
        setLoad({ status: 'error', message: askErrorMessage(e).replace('Your question is kept. ', '').replace('answer', 'read the record') });
        if (isGrantGone(e)) onEmptyRead?.();
      },
    );
    return () => {
      alive = false;
    };
  }, [api, patientId, attempt, onEmptyRead]);

  const model = useMemo(() => {
    if (load.status !== 'ready') return null;
    const index = buildIndex(load.data);
    return { data: load.data, index, overview: buildOverview(load.data, index) };
  }, [load]);

  const gone = useCallback(() => onEmptyRead?.(), [onEmptyRead]);
  const openSubject = useCallback((subject: Subject, cite: string | null = null) => {
    if (!open) opener.current = document.activeElement;
    setOpen({ subject, cite });
  }, [open]);
  const openCite = useCallback((cite: string) => {
    const s = model?.index.resolve(cite);
    if (s) openSubject(s.subject, cite);
  }, [model, openSubject]);
  const close = useCallback(() => {
    setOpen(null);
    (opener.current as HTMLElement | null)?.focus?.();
  }, []);

  if (!active) return null;
  if (load.status === 'loading') return <p><Spinner label="Loading the record" /></p>;
  if (load.status === 'error') {
    return (
      <div>
        <ErrorNote>{load.message}</ErrorNote>
        <p><button type="button" className="btn as-btn" onClick={() => setAttempt((n) => n + 1)} data-testid="record-retry">Try again</button></p>
      </div>
    );
  }
  if (!model) return <EmptyState>This record has nothing in it yet.</EmptyState>;
  const ctx = { index: model.index, openCite: open?.cite ?? null, onOpen: openCite };
  return (
    <>
      <Dashboard model={model} grantId={active.grant.grant_id} patientId={active.grant.patient.id} ctx={ctx} openCite={open?.cite ?? null} onOpenCite={openCite} onOpenSubject={(s) => openSubject(s)} onGone={gone} />
      {open && <SourceViewer subject={open.subject} record={model.data} index={model.index} api={api} grantId={active.grant.grant_id} onClose={close} onGone={gone} />}
    </>
  );
}

const WIDE = '(min-width: 900px)';
/** From 900 the nav switches between three views; under it the existing column stays (one stack, both views) and the nav scrolls to a section. */
function useWide(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia?.(WIDE);
      m?.addEventListener?.('change', cb);
      return () => m?.removeEventListener?.('change', cb);
    },
    () => window.matchMedia?.(WIDE).matches ?? false,
    () => false,
  );
}

type View = 'overview' | 'diagnoses' | 'ask';
interface DashProps {
  model: { data: RecordData; index: ReturnType<typeof buildIndex>; overview: ReturnType<typeof buildOverview> };
  grantId: string;
  patientId: string;
  ctx: { index: ReturnType<typeof buildIndex>; openCite: string | null; onOpen(c: string): void };
  openCite: string | null;
  onOpenCite(c: string): void;
  onOpenSubject(s: Subject): void;
  onGone(): void;
}

/** The doctor's dashboard (MIN-4664): left nav, then the overview (charts, flags, matches, exams, today's panels) and the ask panel. All three read one record and one over-time answer. */
function Dashboard({ model, grantId, patientId, ctx, openCite, onOpenCite, onOpenSubject, onGone }: DashProps) {
  const api = useAssistantApi();
  const wide = useWide();
  const [view, setView] = useState<View>('overview');
  const [otState, retry] = useOverTime(api, grantId, onGone);
  const [expanded, setExpanded] = useState(false);
  const [chipsOpen, setChipsOpen] = useState(false);
  const exams = useMemo(() => buildExams(model.data), [model.data]);

  const go = (v: View) => {
    setView(v);
    if (!wide) document.getElementById(`dash-${v}`)?.scrollIntoView?.({ block: 'start' });
  };
  const goToCard = (key: string) => {
    if (otState.status !== 'ready') return;
    const idx = orderSeries(otState.data.series).findIndex((s) => s.key === key);
    if (idx >= CARDS_SHOWN) setExpanded(true);
    setTimeout(() => document.getElementById(`chart-${key}`)?.scrollIntoView?.({ block: 'center' }), 0);
  };
  const nav: { v: View; label: string; icon: React.ReactNode }[] = [
    { v: 'overview', label: 'Overview', icon: <ChartLineUp size={22} weight="bold" aria-hidden="true" /> },
    { v: 'diagnoses', label: 'Possible diagnoses', icon: <Stethoscope size={22} weight="bold" aria-hidden="true" /> },
    { v: 'ask', label: 'Ask the assistant', icon: <ChatCircleText size={22} weight="bold" aria-hidden="true" /> },
  ];
  return (
    <div className="dash-shell" data-testid="assistant-workspace" data-view={view}>
      <nav className="dnav" aria-label="Doctor workspace" data-testid="doctor-nav">
        {nav.map((n) => (
          <button key={n.v} type="button" onClick={() => go(n.v)} aria-current={view === n.v ? 'page' : undefined} data-testid={`nav-${n.v}`}>{n.icon}<span>{n.label}</span></button>
        ))}
      </nav>
      <div className="dash-main">
        <div id="dash-overview" className="dash-view" hidden={wide && view !== 'overview'} aria-label="Overview">
          <OverTimeView state={otState} index={model.index} openCite={openCite} onOpenCite={onOpenCite} onRetry={retry} expanded={expanded} onToggleExpanded={() => setExpanded((x) => !x)} />
          <FlagsRow state={otState} expandedChips={chipsOpen} onToggleChips={() => setChipsOpen((x) => !x)} onGoTo={goToCard} />
          <PossibleMatchesPanel patientId={patientId} onGone={onGone} />
          <ExamsList exams={exams} onOpenSubject={onOpenSubject} />
          <OverviewPanel overview={model.overview} openCite={openCite} onOpenCite={onOpenCite} onOpenSubject={onOpenSubject} />
        </div>
        <div id="dash-diagnoses" className="dash-view" hidden={wide && view !== 'diagnoses'} aria-label="Possible diagnoses">
          <DiagnosesPanel api={api} grantId={grantId} index={model.index} openCite={openCite} onOpenCite={onOpenCite} onGone={onGone} />
        </div>
        <section id="dash-ask" className="dash-view card ask-main" hidden={wide && view !== 'ask'} aria-label="Assistant">
          <AskPanel api={api} grantId={grantId} ctx={ctx} onGone={onGone} />
        </section>
      </div>
    </div>
  );
}
