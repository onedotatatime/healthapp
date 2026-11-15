import type { StoryLiveSlide } from '../types';
import { STORY_FRAMES } from '../config';
import { LiveFrame } from '../LiveFrame';
import { Headline, typo } from '../../util';
import { ri, type FrameCtx } from './shared';

/** Slides 3 and 5: the app in a browser frame and a phone frame. Beats change the words and who has the mouse; the frames never remount. */
export function StoryLive({ s, beat, ctx }: { s: StoryLiveSlide; beat: number; ctx: FrameCtx }) {
  const hot = beat >= s.hotFromBeat;
  const allShown = s.frames.every((f) => ctx.isShown(f.frame));
  const duo = s.variant === 'duo';

  return (
    <div className={`ts-live v-${s.variant}`} data-beat={beat}>
      {duo ? <Headline text={s.headline} /> : <h2 className="slide-h sl-solo-h rise" style={ri(0)}>{typo(s.headline)}</h2>}

      {duo && (
        <div className="sl-support rise" style={ri(1)}>
          {s.beats.map((b, i) => (
            <p key={i} className={`sl-sup ${i === beat ? 'is-on' : ''}`} aria-hidden={i !== beat}>{typo(b.support)}</p>
          ))}
        </div>
      )}

      {s.frames.map((f, i) => {
        const cfg = STORY_FRAMES[f.frame];
        const label = ctx.isShown(f.frame) ? f.label : f.labelStatic;
        const pos = duo
          ? (cfg.kind === 'phone' ? { left: 1486, top: 276 } : { left: 120, top: 276 })
          : { left: 800, top: 150 };
        return (
          <div key={f.frame}>
            <p className={`sl-label sl-label-${duo ? (cfg.kind === 'phone' ? 'r' : 'l') : 'solo'} caps rise`} style={ri(2 + i)}>{typo(label)}</p>
            <div className="sl-frame-pos rise rise-frame" style={{ ...pos, ...ri(3 + i) }}>
              <LiveFrame
                cfg={cfg}
                live={ctx.isLive(f.frame)}
                hot={hot}
                armed={ctx.armed}
                onToggle={() => ctx.toggle(f.frame)}
                onReady={ctx.setReady}
                badgePlacement={cfg.kind === 'phone' ? 'below' : 'bar'}
              />
            </div>
          </div>
        );
      })}

      <p className={`sl-tag demo-tag rise ${duo ? 'sl-tag-duo' : 'sl-tag-solo'}`} style={ri(6)}>{typo(allShown ? s.tag : s.tagStatic)}</p>
    </div>
  );
}
