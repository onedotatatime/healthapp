import type { StoryIntroSlide } from '../types';
import { Lockup, typo } from '../../util';
import { ri } from './shared';

/** Slide 1: the pitch deck's cover, with the founder's name, three facts and the portrait. */
export function StoryIntro({ s }: { s: StoryIntroSlide }) {
  return (
    <div className="t-cover ts-intro" style={{ backgroundImage: `url(${s.background})` }}>
      <p className="cover-eyebrow rise" style={ri(0)}>{s.eyebrow}</p>
      <h1 className="cover-h1 si-h1 rise" style={ri(1)}>{typo(s.headline)}</h1>
      <p className="si-sub rise" style={ri(2)}>{typo(s.support)}</p>
      <ul className="si-facts">
        {s.facts.map((f, i) => <li key={f} className="rise" style={ri(3 + i)}>{typo(f)}</li>)}
      </ul>
      <figure className="si-photo rise rise-photo" style={ri(2)}>
        <img src={s.photo.src} alt={s.photo.alt} />
        <figcaption className="chip">{s.photo.caption}</figcaption>
      </figure>
      <div className="cover-foot rise" style={ri(7)}>
        <Lockup theme="air" className="cover-lockup" />
      </div>
    </div>
  );
}
