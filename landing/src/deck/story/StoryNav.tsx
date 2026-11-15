import type { MouseEvent } from 'react';

export interface Stop { index: number; beat: number; id: string }

/** The short name of each stop, shown on hover and focus of its dot and next to the counter. Keyed by the stop's hash id. */
export const STOP_LABEL: Record<string, string> = {
  '1': 'Intro', '2': '2019', '3': 'Today', '4': 'Brazil', '4b': 'Emergency', '5': 'Trial', '5b': 'Did you know', '5c': 'Simulation', '6': 'Find me',
};

const arrow = (dir: 'back' | 'next') => (
  <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    {dir === 'back' ? <path d="M19 12H5M11 6l-6 6 6 6" /> : <path d="M5 12h14M13 6l6 6-6 6" />}
  </svg>
);

// A mouse click hands the keyboard back to the deck: Space and Enter belong to a focused button, so a button that kept focus would swallow the clicker's next press.
const release = (e: MouseEvent<HTMLElement>) => { if (e.detail > 0) e.currentTarget.blur(); };

interface Props {
  stops: Stop[];
  at: number;
  idle: boolean;
  clean: boolean;
  /** The key hint, shown beside the bar while the controls are awake. */
  keys: string;
  onBack: () => void;
  onNext: () => void;
  onJump: (stop: number) => void;
}

/** The deck's controls: a dot per stop (click to jump), a "3 / 9" counter, and large back and forward buttons. Drawn inside the 1920x1080 frame, bottom right, in the strip no slide uses. */
export function StoryNav({ stops, at, idle, clean, keys, onBack, onNext, onJump }: Props) {
  const here = stops[at];
  return (
    <div className="sn-wrap">
    <nav className={`sn ${idle ? 'is-idle' : ''} ${clean ? 'is-clean' : ''}`} aria-label="Story navigation" onClick={(e) => e.stopPropagation()}>
      <ol className="sn-dots">
        {stops.map((s, i) => {
          const label = STOP_LABEL[s.id] ?? s.id;
          return (
            <li key={s.id}>
              <button
                type="button"
                className={`sn-dot ${i === at ? 'is-current' : ''}`}
                aria-label={`Go to ${i + 1} of ${stops.length}: ${label}`}
                aria-current={i === at ? 'step' : undefined}
                onClick={(e) => { release(e); onJump(i); }}
              >
                <i />
                <span className="sn-tip" aria-hidden="true">{label}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="sn-count" aria-live="polite">
        <b>{at + 1} / {stops.length}</b>
        <span>{STOP_LABEL[here.id] ?? here.id}</span>
      </p>
      <button type="button" className="sn-btn sn-back" aria-label="Back" title="Back (←)" disabled={at === 0} onClick={(e) => { release(e); onBack(); }}>{arrow('back')}</button>
      <button type="button" className="sn-btn sn-next" aria-label="Next" title="Next (→ or space)" disabled={at === stops.length - 1} onClick={(e) => { release(e); onNext(); }}>{arrow('next')}</button>
    </nav>
    <p className={`sn-keys ${idle || clean ? 'is-off' : ''}`} aria-hidden="true">{keys}</p>
    </div>
  );
}
