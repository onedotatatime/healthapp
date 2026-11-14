import { useEffect, useRef, useState } from 'react';
import { extractToken } from './codes';

type Status = 'starting' | 'scanning' | 'denied' | 'unsupported';
const SCAN_WIDTH = 960; // frames are scaled down to this before decoding: enough for a phone screen at arm's length
const EVERY_MS = 100;

/**
 * Camera + jsQR (decoder loaded only when this screen opens). It reports a token once and stops reading; the camera
 * is released when the screen closes or `active` goes false. A QR that is not ours says so instead of failing silently.
 */
export function Scanner({ active, onToken, disabledNote }: { active: boolean; onToken(token: string): void; disabledNote?: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<Status>('starting');
  const [foreign, setForeign] = useState(false);
  const cb = useRef(onToken);
  cb.current = onToken;

  useEffect(() => {
    if (!active || disabledNote) return;
    let stop = false;
    let raf = 0;
    let stream: MediaStream | null = null;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) return setStatus('unsupported');
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false });
      } catch {
        return setStatus('denied');
      }
      const v = video.current;
      if (stop || !v) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      v.srcObject = stream;
      await v.play().catch(() => {});
      setStatus('scanning');
      const { default: jsQR } = await import('jsqr');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return setStatus('unsupported');
      let last = 0;
      let done = false;
      const loop = (t: number) => {
        if (stop || done) return;
        raf = requestAnimationFrame(loop);
        if (t - last < EVERY_MS || v.readyState < 2 || !v.videoWidth) return;
        last = t;
        const k = Math.min(1, SCAN_WIDTH / v.videoWidth);
        const w = Math.round(v.videoWidth * k);
        const h = Math.round(v.videoHeight * k);
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(v, 0, 0, w, h);
        const hit = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' });
        if (!hit) return;
        const token = extractToken(hit.data);
        if (token) {
          done = true;
          cb.current(token);
        } else setForeign(true);
      };
      raf = requestAnimationFrame(loop);
    })();
    return () => {
      stop = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [active, disabledNote]);

  const note =
    disabledNote ??
    (status === 'denied'
      ? 'The camera is blocked. Allow it in the browser, or type the code below.'
      : status === 'unsupported'
        ? 'This browser has no camera access. Type the code below.'
        : null);

  return (
    <div className="hs-scan" data-testid="scan-view" data-status={disabledNote ? 'off' : status}>
      <video ref={video} playsInline muted aria-label="Camera view" className={note ? 'hs-hidden' : ''} />
      {!note && <div className="hs-frame" aria-hidden="true" />}
      {note && <p className="hs-scan-note">{note}</p>}
      {!note && status === 'starting' && <p className="hs-scan-note">Starting the camera</p>}
      {foreign && !note && <p className="hs-scan-foreign" role="status">That is not a healthapp code.</p>}
    </div>
  );
}
