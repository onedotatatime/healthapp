import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { FrameConfig, FrameId } from './config';

export interface LiveFrameProps {
  cfg: FrameConfig;
  /** Live frames may load (the presenter key is in the address, ?static is not, and the frame was not switched off). */
  live: boolean;
  /** The frame takes clicks and keys (slide 3 from its second beat, slide 5 from the start). */
  hot: boolean;
  /** The address was opened with the presenter key: the badge becomes a button that switches this frame. */
  armed: boolean;
  onToggle: () => void;
  onReady: (id: FrameId, ready: boolean) => void;
  style?: CSSProperties;
  className?: string;
  /** Slide 3's phone sits on its own, the badge goes under it. */
  badgePlacement: 'bar' | 'below';
}

const SETTLE_MS = 1200;
const LOAD_TIMEOUT_MS = 8000;

const hostOf = (url: string) => {
  try { return new URL(url).hostname; } catch { return url; }
};

const useOnline = () => {
  const [on, setOn] = useState(() => navigator.onLine !== false);
  useEffect(() => {
    const up = () => setOn(true);
    const down = () => setOn(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);
  return on;
};

/**
 * One frame of the app: a screenshot under an optional iframe.
 * - The screenshot is always in the DOM and is what shows until the iframe reports it is ready.
 * - The iframe is mounted only when `live` is true. With ?static or without the presenter key there is NO iframe in the DOM.
 * - Ready = the iframe's load event plus 1.2 s; no load within 8 s keeps the screenshot.
 *   A frame the host refuses to embed cannot be detected from here, so the presenter has the L key and this badge to switch back.
 */
export function LiveFrame({ cfg, live, hot, armed, onToggle, onReady, style, className = '', badgePlacement }: LiveFrameProps) {
  const online = useOnline();
  const mount = live && online;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const shown = mount && ready && !failed;
  const interactive = shown && hot;

  useEffect(() => { onReady(cfg.id, shown); }, [shown, onReady, cfg.id]);
  useEffect(() => { if (!mount) { setReady(false); setFailed(false); setLoaded(false); } }, [mount]);

  // Ready = the iframe's load event plus SETTLE_MS (the app paints after load). No load within LOAD_TIMEOUT_MS: stay on the screenshot.
  useEffect(() => {
    if (!mount) return;
    const t = window.setTimeout(() => setFailed(true), LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [mount]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!loaded || failed) return;
    const t = window.setTimeout(() => setReady(true), SETTLE_MS);
    return () => window.clearTimeout(t);
  }, [loaded, failed]);


  const scale = cfg.viewW / cfg.iframeW;
  const state: 'live' | 'ready' | 'shot' = shown ? (hot ? 'live' : 'ready') : 'shot';
  const word = state === 'live' ? 'Live' : state === 'ready' ? 'Ready' : 'Screenshot';

  const badge = armed ? (
    <button
      type="button"
      className={`lf-badge is-${state} is-button`}
      onClick={onToggle}
      aria-label={`${word}. Switch ${cfg.title.replace(', live', '')} between live and screenshot (L)`}
    >
      <i aria-hidden="true" />{word}
    </button>
  ) : (
    <span className={`lf-badge is-${state}`} role="status"><i aria-hidden="true" />{word}</span>
  );

  const viewport = (
    <div className="lf-viewport" style={{ width: cfg.viewW, height: cfg.viewH }}>
      <img className="lf-shot" src={cfg.fallback} alt={cfg.fallbackAlt} draggable={false} />
      {mount && (
        <iframe
          ref={iframeRef}
          className={`lf-iframe ${shown ? 'is-shown' : ''}`}
          title={cfg.title}
          src={cfg.url}
          width={cfg.iframeW}
          height={cfg.iframeH}
          style={{ transform: `scale(${scale})`, pointerEvents: interactive ? 'auto' : 'none' }}
          allow={cfg.allowCamera ? 'camera' : undefined}
          referrerPolicy="no-referrer"
          tabIndex={interactive ? 0 : -1}
          onLoad={() => setLoaded(true)}
        />
      )}
    </div>
  );

  const hotClass = interactive ? 'is-hot' : '';
  const stop = () => {
    // After a click inside the app the arrow keys go to the app. When the pointer leaves, hand the keyboard back to the deck.
    if (document.activeElement === iframeRef.current) iframeRef.current?.blur();
    window.focus();
  };

  if (cfg.kind === 'phone') {
    return (
      <div className={`live-frame lf-phone ${hotClass} ${className}`} style={style} onMouseLeave={stop} data-frame={cfg.id}>
        <div className="lf-phone-body">
          <span className="lf-notch" aria-hidden="true" />
          {viewport}
        </div>
        {badgePlacement === 'below' && <div className="lf-badge-row">{badge}</div>}
      </div>
    );
  }
  return (
    <div className={`live-frame lf-browser ${hotClass} ${className}`} style={style} onMouseLeave={stop} data-frame={cfg.id}>
      <div className="lf-bar">
        <span className="lf-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="lf-address">{hostOf(cfg.url)}</span>
        {badgePlacement === 'bar' && badge}
      </div>
      {viewport}
      <span className="lf-edge" aria-hidden="true" />
    </div>
  );
}
