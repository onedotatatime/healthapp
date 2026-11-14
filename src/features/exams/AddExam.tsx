import { Camera, Image as ImageIcon } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ErrorNote } from '../../components/Primitives';
import { useExams } from './context';
import { preparePhoto } from './photo';
import { RefusalNote } from './Marks';
import { readExam, type Failure, type ReadCtx, type RefusalView } from './logic';
import { ReviewPanel } from './ReviewPanel';
import type { DocumentDraft } from '../../api/contract';

const SLOW_MS = 40_000;

type Phase =
  | { name: 'idle'; error?: string }
  | { name: 'reading' }
  | { name: 'review'; draft: DocumentDraft }
  | { name: 'refused'; view: RefusalView }
  | { name: 'failed'; failure: Failure };

/** Screen 1: capture, reading, check beside the photo, could not read. Saving navigates to the record. */
export function AddExam() {
  const { api, base, home } = useExams();
  const nav = useNavigate();
  const [phase, setPhase] = useState<Phase>({ name: 'idle' });
  const [slow, setSlow] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const ctx = useRef<ReadCtx | null>(null);

  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl); }, [photoUrl]);

  useEffect(() => {
    if (phase.name !== 'reading') return;
    setSlow(false);
    const t = setTimeout(() => setSlow(true), SLOW_MS);
    return () => clearTimeout(t);
  }, [phase.name]);

  async function run() {
    if (!ctx.current) return;
    setPhase({ name: 'reading' });
    const r = await readExam(api, ctx.current);
    if (r.phase === 'review') setPhase({ name: 'review', draft: r.draft });
    else if (r.phase === 'refused') setPhase({ name: 'refused', view: r.view });
    else setPhase({ name: 'failed', failure: r.failure });
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setPhase({ name: 'reading' });
    let blob: Blob;
    try {
      blob = await preparePhoto(file);
    } catch {
      return setPhase({ name: 'idle', error: "We couldn't open that photo. Take it again, or choose another one." });
    }
    setPhotoUrl(URL.createObjectURL(blob));
    ctx.current = { blob };
    await run();
  }

  function reset() {
    ctx.current = null;
    setPhotoUrl(null);
    setPhase({ name: 'idle' });
  }

  if (phase.name === 'review' && photoUrl) {
    return (
      <ReviewPanel
        draft={phase.draft}
        photoUrl={photoUrl}
        onRetake={reset}
        onSaved={(id) => nav(`${base}/${id}`, { state: { saved: true } })}
      />
    );
  }

  return (
    <main className="page" data-testid="add-exam">
      <h1>Add an exam</h1>

      {phase.name === 'idle' && (
        <>
          <p className="muted">Photograph the whole page, flat and in good light.</p>
          {phase.error && <ErrorNote tone="caution">{phase.error}</ErrorNote>}
          <div className="btn-stack" style={{ marginTop: 'var(--space-4)' }}>
            <label className="btn primary block pick">
              <Camera size={22} weight="bold" aria-hidden="true" />
              Take a photo
              <input type="file" accept="image/*" capture="environment" className="sr-only" data-testid="input-camera" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ''; }} />
            </label>
            <label className="btn block pick">
              <ImageIcon size={22} weight="bold" aria-hidden="true" />
              Choose from gallery
              <input type="file" accept="image/*" className="sr-only" data-testid="input-gallery" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ''; }} />
            </label>
          </div>
          <p style={{ marginTop: 'var(--space-6)' }}>
            <Link to={home} className="btn block">Back to your record</Link>
          </p>
        </>
      )}

      {phase.name === 'reading' && (
        <div role="status" data-testid="reading">
          <p className="reading-label">{slow ? 'Still reading. This one is taking longer.' : 'Reading your exam'}</p>
          <div className="bar" aria-hidden="true"><i /></div>
          {photoUrl && <img className="thumb" src={photoUrl} alt="Your photo of the exam" />}
        </div>
      )}

      {phase.name === 'failed' && (
        <div data-testid="failed">
          <ErrorNote tone="caution">
            <span><strong>{phase.failure.title}</strong> {phase.failure.body}</span>
          </ErrorNote>
          <div className="btn-stack" style={{ marginTop: 'var(--space-4)' }}>
            {phase.failure.kind !== 'session' && ctx.current && <button type="button" className="btn primary block" onClick={() => void run()}>Try again</button>}
            {phase.failure.kind === 'session'
              ? <Link to="/login" className="btn primary block">Sign in</Link>
              : <button type="button" className="btn block" onClick={reset}>Choose another photo</button>}
          </div>
        </div>
      )}

      {phase.name === 'refused' && (
        <div data-testid={`refused-${phase.view.kind}`}>
          <RefusalNote view={phase.view} />
          <div className="btn-stack" style={{ marginTop: 'var(--space-4)' }}>
            <button type="button" className="btn primary block" data-testid="retake" onClick={reset}>Take another photo</button>
            <Link to={home} className="btn block">Close</Link>
          </div>
        </div>
      )}
    </main>
  );
}
