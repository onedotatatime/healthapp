import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import type { DocumentDraft } from '../../api/contract';
import { ErrorNote, Spinner } from '../../components/Primitives';
import { useExams } from './context';
import { ReviewPanel } from './ReviewPanel';

/** A draft opened from "My exams" (or an exam after Unconfirm): the existing review beside the stored photo. */
export function ReviewRoute() {
  const { api, base, home } = useExams();
  const { id = '' } = useParams();
  const nav = useNavigate();
  const [draft, setDraft] = useState<DocumentDraft | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    api.getDraft(id).then((d) => live && setDraft(d), () => live && setFailed(true));
    api.photoUrl(id).then((u) => live && setPhoto(u), () => live && setFailed(true));
    return () => { live = false; };
  }, [api, id]);

  if (failed) {
    return (
      <main className="page">
        <ErrorNote tone="caution">We could not open this exam. It may already be saved or deleted.</ErrorNote>
        <p style={{ marginTop: 'var(--space-4)' }}><Link to={home} className="btn block">Back to my exams</Link></p>
      </main>
    );
  }
  if (!draft || !photo) return <main className="page"><Spinner label="Loading" /></main>;
  return <ReviewPanel draft={draft} photoUrl={photo} backTo={home} onRetake={() => nav(`${base}/add`)} onSaved={(docId) => nav(`${base}/${docId}`, { state: { saved: true } })} />;
}
