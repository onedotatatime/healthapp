import type { CoverSlide } from '../types';
import { Lockup, typo } from '../util';

export function Cover({ s }: { s: CoverSlide }) {
  return (
    <div className="t-cover" style={{ backgroundImage: `url(${s.background})` }}>
      <p className="cover-eyebrow">{s.eyebrow}</p>
      <h1 className="cover-h1">{typo(s.headline)}</h1>
      <img className="cover-photo" src={s.photo.src} alt={s.photo.alt} />
      <div className="cover-foot">
        <Lockup theme="air" className="cover-lockup" />
        <p>{s.tagline}</p>
      </div>
    </div>
  );
}
