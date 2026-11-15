import { useRef, type CSSProperties } from 'react';
import type { FrameConfig } from './config';

export interface LiveFrameProps {
  cfg: FrameConfig;
  /** The presenter key is in the address and ?static is not: the iframe is mounted (from deck start, never unmounted) and sits on top of the screenshot. */
  armed: boolean;
  /** The frame shows the app. false = the presenter switched this frame to its screenshot (L or the badge); the iframe stays mounted, so a sign-in survives. */
  live: boolean;
  /** The frame takes clicks and keys. With the key it is hot on every beat of its slide. */
  hot: boolean;
  onToggle: () => void;
  style?: CSSProperties;
  className?: string;
  /** Slide 3's phone sits on its own: the badge goes beside it (below it would run into the path rail). */
  badgePlacement: 'bar' | 'side';
}

const hostOf = (url: string) => {
  try { return new URL(url).hostname; } catch { return url; }
};

/**
 * One frame of the app: a screenshot with an optional iframe on top.
 * - The screenshot is always in the DOM. It shows only when there is no iframe (no presenter key, or ?static) or when the presenter pressed L.
 * - The iframe exists only with the presenter key. With ?static or without the key there is NO iframe in the DOM.
 * - There is no ready logic and no timeout. A live frame is visible and interactive as soon as its slide is showing; a slow app is a
 *   white frame for a second, never a frame that hides itself (MIN-4733: an 8 s timer that load never cleared marked every frame failed).
 * - The iframe renders at its logical size (iframeW x iframeH: 390 x 844 for the phone, 1280 wide for the desktop views) and is scaled
 *   to the frame with a CSS transform, so the app lays out at phone or desktop width whatever size the deck is shown at.
 */
export function LiveFrame({ cfg, armed, live, hot, onToggle, style, className = '', badgePlacement }: LiveFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const shown = armed && live;
  const interactive = shown && hot;

  const scale = cfg.viewW / cfg.iframeW;
  const state: 'live' | 'shot' = shown ? 'live' : 'shot';
  const word = shown ? 'Live' : 'Screenshot';

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
      {armed && (
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
        />
      )}
    </div>
  );

  const hotClass = interactive ? 'is-hot' : '';
  // While the mouse is over a live frame the keys go to the app; when it leaves they go back to the deck.
  const enter = () => { if (interactive) iframeRef.current?.focus({ preventScroll: true }); };
  const leave = () => {
    if (document.activeElement === iframeRef.current) iframeRef.current?.blur();
    window.focus();
  };

  if (cfg.kind === 'phone') {
    const bodyW = cfg.viewW + 20;
    const bodyH = cfg.viewH + 20;
    return (
      <div className={`live-frame lf-phone ${hotClass} ${className}`} style={{ width: bodyW, height: bodyH, ...style }} onMouseEnter={enter} onMouseLeave={leave} data-frame={cfg.id}>
        <div className="lf-phone-body" style={{ width: bodyW, height: bodyH }}>
          <span className="lf-notch" aria-hidden="true" />
          {viewport}
        </div>
        {badgePlacement === 'side' && <div className="lf-badge-row">{badge}</div>}
      </div>
    );
  }
  return (
    <div className={`live-frame lf-browser ${hotClass} ${className}`} style={style} onMouseEnter={enter} onMouseLeave={leave} data-frame={cfg.id}>
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
