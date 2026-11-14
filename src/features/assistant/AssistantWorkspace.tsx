/**
 * What the doctor sees inside the workspace shell while the grant runs (MIN-4488): the overview on the left, the ask box
 * and answers on the right, the source viewer as a side sheet. This whole module is loaded lazily from
 * `DoctorWorkspace` (handshake/DoctorConnect.tsx), so the patient bundle never contains it. When access ends the shell
 * unmounts and everything here, including the conversation and the photo URL, goes with it.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EmptyState, ErrorNote, Spinner } from '../../components/Primitives';
import { useActiveGrant } from '../handshake/context';
import { askErrorMessage, isGrantGone } from './api';
import { AskPanel } from './Ask';
import { useAssistantApi } from './context';
import { OverviewPanel } from './Overview';
import { buildIndex, buildOverview, type RecordData, type Subject } from './record';
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
    <div className="as-grid" data-testid="assistant-workspace">
      <section className="as-col as-left" aria-label="Overview">
        <OverviewPanel overview={model.overview} openCite={open?.cite ?? null} onOpenCite={openCite} onOpenSubject={(s) => openSubject(s)} />
      </section>
      <section className="as-col as-right" aria-label="Assistant">
        <AskPanel api={api} grantId={active.grant.grant_id} ctx={ctx} onGone={gone} />
      </section>
      {open && <SourceViewer subject={open.subject} record={model.data} index={model.index} api={api} grantId={active.grant.grant_id} onClose={close} onGone={gone} />}
    </div>
  );
}
