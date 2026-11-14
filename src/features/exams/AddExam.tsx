import { Camera, CheckCircle, Image as ImageIcon } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ErrorNote, Spinner } from '../../components/Primitives';
import { useExams } from './context';
import { preparePhoto } from './photo';
import { scanPhoto, type Failure, type ScanCtx } from './logic';

type Phase = { name: 'idle'; error?: string } | { name: 'saving' } | { name: 'failed'; failure: Failure };

/**
 * The scan screen (MIN-4557). Take or pick a photo, it uploads, the screen says "Saved. Scan the next one" and the camera is
 * ready again. No analysis here: the reading runs on the server and its result is a row in "My exams".
 */
export function AddExam() {
  const { api, home } = useExams();
  const [phase, setPhase] = useState<Phase>({ name: 'idle' });
  const [count, setCount] = useState(0);
  const ctx = useRef<ScanCtx | null>(null);
  const [thumb, setThumb] = useState<string | null>(null);

  useEffect(() => () => { if (thumb) URL.revokeObjectURL(thumb); }, [thumb]);

  async function run() {
    if (!ctx.current) return;
    setPhase({ name: 'saving' });
    const r = await scanPhoto(api, ctx.current);
    if (r.phase === 'saved') {
      ctx.current = null;
      setThumb(null);
      setCount((n) => n + 1);
      setPhase({ name: 'idle' });
    } else {
      setPhase({ name: 'failed', failure: r.failure });
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setPhase({ name: 'saving' });
    let blob: Blob;
    try {
      blob = await preparePhoto(file);
    } catch {
      return setPhase({ name: 'idle', error: "We couldn't open that photo. Take it again, or choose another one." });
    }
    setThumb(URL.createObjectURL(blob));
    ctx.current = { blob };
    await run();
  }

  function discard() {
    ctx.current = null;
    setThumb(null);
    setPhase({ name: 'idle' });
  }

  const idle = phase.name === 'idle';
  return (
    <main className="page" data-testid="add-exam">
      <h1>Scan an exam</h1>

      {idle && count > 0 && (
        <div className="saved scan-saved" role="status" data-testid="scan-saved">
          <CheckCircle size={22} weight="bold" aria-hidden="true" />
          <span><strong>Saved.</strong> Scan the next one.</span>
          <span className="scan-count" data-testid="scan-count">{count} scanned</span>
        </div>
      )}

      {idle && (
        <>
          <p className="muted">{count > 0 ? 'Reading happens in the background. Check the results in My exams.' : 'Photograph the whole page, flat and in good light. Reading happens in the background.'}</p>
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
            <Link to={home} className="btn block" data-testid="see-my-exams">See my exams</Link>
          </p>
        </>
      )}

      {phase.name === 'saving' && (
        <div role="status" data-testid="saving">
          <p className="reading-label"><Spinner label="Saving the photo" /></p>
          {thumb && <img className="thumb" src={thumb} alt="Your photo of the exam" />}
        </div>
      )}

      {phase.name === 'failed' && (
        <div data-testid="failed">
          <ErrorNote tone="caution">
            <span><strong>{phase.failure.title}</strong> {phase.failure.body}</span>
          </ErrorNote>
          <div className="btn-stack" style={{ marginTop: 'var(--space-4)' }}>
            {phase.failure.kind !== 'session' && ctx.current && <button type="button" className="btn primary block" data-testid="scan-retry" onClick={() => void run()}>Try again</button>}
            {phase.failure.kind === 'session'
              ? <Link to="/login" className="btn primary block">Sign in</Link>
              : <button type="button" className="btn block" onClick={discard}>Choose another photo</button>}
          </div>
          {thumb && <img className="thumb" src={thumb} alt="Your photo of the exam, kept for the retry" />}
        </div>
      )}
    </main>
  );
}
