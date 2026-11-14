import type { HeroSlide } from '../types';
import { Headline, Lockup, typo, withAccent } from '../util';

export function Hero({ s }: { s: HeroSlide }) {
  return (
    <div className="t-hero">
      <img className="hero-img" src={s.image.src} alt={s.image.alt} />
      <div className="hero-col">
        <Headline text={s.headline} />
        <p className="hero-body">{typo(s.body)}</p>
        <ul className="hero-points">
          {s.points.map((p, i) => <li key={i}>{withAccent(p)}</li>)}
        </ul>
        {s.steps && (
          <div className="hero-steps">
            {s.stepsTitle && <h3>{s.stepsTitle}</h3>}
            <ol>{s.steps.map((t, i) => <li key={i}>{typo(t)}</li>)}</ol>
          </div>
        )}
      </div>
      {s.tag && <span className="demo-tag hero-tag">{s.tag}</span>}
      <div className="hero-lock">
        <Lockup theme={s.theme} className="hero-lockup" />
        {s.lockupSuffix && <span className="hero-suffix">{s.lockupSuffix}</span>}
      </div>
    </div>
  );
}
