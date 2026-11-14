import type { HeroSlide } from '../types';
import { Headline, Lockup, rich, typo } from '../util';

/** [[accent]] renders teal and bold; the rest goes through rich(). */
const withAccent = (s: string) =>
  s.split(/\[\[|\]\]/).map((part, i) => (i % 2 ? <b key={i} className="hero-flag">{typo(part)}</b> : <span key={i}>{rich(part)}</span>));

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
      </div>
      {s.tag && <span className="demo-tag hero-tag">{s.tag}</span>}
      <div className="hero-lock">
        <Lockup theme={s.theme} className="hero-lockup" />
        {s.lockupSuffix && <span className="hero-suffix">{s.lockupSuffix}</span>}
      </div>
    </div>
  );
}
