import type { SpendSlide } from '../types';
import { Headline, rich } from '../util';
import { Contact } from './Contact';

/** The money slide: one line, then one big horizontal bar in four parts. Under each part, its one-word label. The bar is the slide. */
export function Spend({ s }: { s: SpendSlide }) {
  return (
    <div className="t-spend">
      <Headline text={s.headline} size="md" />
      <p className="sd-line">{rich(s.line)}</p>
      <div className="sd-bar">
        {s.parts.map((p) => (
          <div key={p.label} className={`sd-part${p.accent ? ' accent' : ''}`} style={{ flex: p.pct }}>
            <b>{p.value.split(' · ')[0]}<span>{p.value.split(' · ')[1]}</span></b>
          </div>
        ))}
      </div>
      <div className="sd-labels">
        {s.parts.map((p) => <span key={p.label} style={{ flex: p.pct }}>{p.label}</span>)}
      </div>
      <Contact c={s.contact} />
    </div>
  );
}
