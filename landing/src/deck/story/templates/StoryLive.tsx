import type { StoryLiveSlide } from '../types';
import { STORY_FRAMES } from '../config';
import { LiveFrame } from '../LiveFrame';
import { headlineSize, rich, typo } from '../../util';
import { ri, type FrameCtx } from './shared';

/**
 * The slides with the app in a frame: slide 3 (+4), slide 5 and slide 5c.
 * Beats change the words and who has the mouse; the frames never remount. A beat may have a header of its own (slide 4 is the third beat of
 * slide 3: the same two iframes, only the header swaps).
 */
export function StoryLive({ s, beat, ctx }: { s: StoryLiveSlide; beat: number; ctx: FrameCtx }) {
  const hot = beat >= s.hotFromBeat;
  const allShown = s.frames.every((f) => ctx.isLive(f.frame));
  const { variant } = s;
  const duo = variant === 'duo';

  const headOf = (i: number) => s.beats[i].headline ?? s.headline;
  const heads = [...new Set(s.beats.map((_, i) => headOf(i)))];

  return (
    <div className={`ts-live v-${variant}`} data-beat={beat}>
      {duo && (
        <div className="sl-heads">
          {heads.map((h) => (
            <h2 key={h} className={`slide-h ${headlineSize(h)} sl-h ${h === headOf(beat) ? 'is-on' : ''}`} aria-hidden={h !== headOf(beat)}>{rich(h)}</h2>
          ))}
        </div>
      )}
      {variant === 'solo' && <h2 className="slide-h sl-solo-h rise" style={ri(0)}>{typo(s.headline)}</h2>}

      {duo && s.beats.some((b) => b.support) && (
        <div className="sl-support rise" style={ri(1)}>
          {s.beats.map((b, i) => (
            <p key={i} className={`sl-sup ${i === beat ? 'is-on' : ''}`} aria-hidden={i !== beat}>{typo(b.support)}</p>
          ))}
        </div>
      )}

      {s.frames.map((f, i) => {
        const cfg = STORY_FRAMES[f.frame];
        const label = ctx.isLive(f.frame) ? f.label : f.labelStatic;
        const pos = duo
          ? (cfg.kind === 'phone' ? { left: 1800 - (cfg.viewW + 20), top: 262 } : { left: 120, top: 262 })
          : variant === 'solo' ? { left: 700, top: 120 } : { left: 160, top: 30 };
        return (
          <div key={f.frame}>
            {label && <p className={`sl-label sl-label-${cfg.kind === 'phone' ? 'r' : 'l'} caps rise`} style={ri(2 + i)}>{typo(label)}</p>}
            <div className="sl-frame-pos rise rise-frame" style={{ ...pos, ...ri(3 + i) }}>
              <LiveFrame
                cfg={cfg}
                armed={ctx.armed}
                live={ctx.isLive(f.frame)}
                hot={hot}
                onToggle={() => ctx.toggle(f.frame)}
                badgePlacement={cfg.kind === 'phone' ? 'side' : 'bar'}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
