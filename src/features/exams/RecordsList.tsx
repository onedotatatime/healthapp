import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { EmptyState, Spinner } from '../../components/Primitives';
import { ExamRow, type SavedExtras } from './ExamRow';
import { useExams } from './context';
import { POLL_MS, docMarks, shouldPoll, type ExamsApi } from './logic';
import type { ExamListItem } from './scanApi';

type Busy = Record<string, 'deleting' | 'retrying'>;

/** The list asks again every POLL_MS while any row is waiting or reading, and stops otherwise and while the tab is hidden. */
function useExamList(api: ExamsApi) {
  const [items, setItems] = useState<ExamListItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [extras, setExtras] = useState<Record<string, SavedExtras>>({});
  const known = useRef(new Set<string>());
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const live = useRef(true);
  const itemsRef = useRef<ExamListItem[] | null>(null);

  const refresh = useCallback(async () => {
    clearTimeout(timer.current);
    try {
      const list = await api.listExams();
      if (!live.current) return;
      itemsRef.current = list;
      setItems(list);
      setFailed(false);
      // Saved rows keep what the list showed before: provenance marks and the count outside the printed range.
      if (list.some((i) => i.status === 'confirmed' && !known.current.has(i.id))) {
        const recs = await api.listRecords().catch(() => []);
        if (!live.current) return;
        const next: Record<string, SavedExtras> = {};
        for (const r of recs) {
          known.current.add(r.document.id);
          next[r.document.id] = { marks: docMarks(r.document), outOfRange: r.outOfRange };
        }
        setExtras((prev) => ({ ...prev, ...next }));
      }
      if (shouldPoll(list) && !document.hidden) timer.current = setTimeout(() => void refresh(), POLL_MS);
    } catch {
      if (!live.current) return;
      if (itemsRef.current === null) setFailed(true);
      else if (!document.hidden) timer.current = setTimeout(() => void refresh(), POLL_MS); // keep what is on screen, try again
    }
  }, [api]);

  useEffect(() => {
    live.current = true;
    void refresh();
    const onVisible = () => { if (!document.hidden) void refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      live.current = false;
      clearTimeout(timer.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  return { items, setItems, failed, extras, refresh };
}

/** "My exams": one row per upload, newest first. Saved and not-yet-saved exams share this one list. */
export function RecordsList() {
  const { api, base } = useExams();
  const { items, setItems, failed, extras, refresh } = useExamList(api);
  const [busy, setBusy] = useState<Busy>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mark = (id: string, b?: Busy[string], err?: string) => {
    setBusy((p) => { const n = { ...p }; if (b) n[id] = b; else delete n[id]; return n; });
    setErrors((p) => { const n = { ...p }; if (err) n[id] = err; else delete n[id]; return n; });
  };

  async function onDelete(id: string) {
    mark(id, 'deleting');
    try {
      await api.deleteExam(id);
      setItems((cur) => cur && cur.filter((i) => i.id !== id));
      mark(id);
    } catch {
      mark(id, undefined, 'It was not deleted. Try again.');
    }
  }

  async function onRetry(id: string) {
    mark(id, 'retrying');
    await api.kick(id);
    // The row is waiting again as far as the screen knows; the next answer of the list is the truth.
    setItems((cur) => cur && cur.map((i) => (i.id === id ? { ...i, status: 'queued', reason: null, can_retry: false } : i)));
    mark(id);
    void refresh();
  }

  return (
    <section data-testid="records">
      <Link to={`${base}/add`} className="btn primary block" data-testid="add-exam-link">Scan an exam</Link>
      <h2 style={{ marginTop: 'var(--space-6)' }}>My exams</h2>
      <div style={{ marginTop: 'var(--space-3)' }}>
        {failed && <div className="note caution" data-testid="records-error">We could not load your exams. Reload the page to try again.</div>}
        {!failed && items === null && <Spinner label="Loading your exams" />}
        {items && items.length === 0 && <EmptyState>No exams yet. Scan your first one.</EmptyState>}
        {items && items.length > 0 && (
          <ul className="records" data-testid="exam-list">
            {items.map((item) => (
              <ExamRow key={item.id} item={item} base={base} extras={extras[item.id]} busy={busy[item.id]} error={errors[item.id]} onDelete={(id) => void onDelete(id)} onRetry={(id) => void onRetry(id)} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
