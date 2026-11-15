import type { CompareSlide } from '../types';
import { Headline, Lockup, rich } from '../util';

export function Compare({ s }: { s: CompareSlide }) {
  const m = s.map;
  return (
    <div className="t-compare">
      <Headline text={s.headline} />
      <div className="cp-map">
        <h4 className="caps cp-top">{m.top}</h4>
        <i className="cp-vline" />
        <i className="cp-hline" />
        {m.boxes.map((b) => (
          <div key={b.name} className={`cp-box ${b.hero ? 'hero' : ''}`} style={{ left: b.x, top: b.y, width: b.w, minHeight: b.h }}>
            {b.hero ? <Lockup theme="night" className="cp-lockup" /> : <b>{b.name}</b>}
            <span>{rich(b.sub)}</span>
          </div>
        ))}
        <span className="cp-axis-y">↓ {m.axisY}</span>
        <span className="cp-axis-x">{m.axisX} →</span>
        <span className="cp-low">{m.low}</span>
        <span className="cp-high">{m.high}</span>
      </div>
      <div className="cp-rows">
        {s.rows.map((r) => (
          <article key={r.name} className={`cp-row ${r.hero ? 'hero' : ''}`}>
            <h3>{rich(r.name)}</h3>
            {r.line ? <p className="cp-line">{rich(r.line)}</p> : <p><b>Does well:</b> {rich(r.well ?? '')} <b>Does not:</b> {rich(r.not ?? '')}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
