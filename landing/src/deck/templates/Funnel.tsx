import type { FunnelSlide } from '../types';
import { Headline, rich } from '../util';

export function Funnel({ s }: { s: FunnelSlide }) {
  return (
    <div className="t-funnel">
      <Headline text={s.headline} />
      <div className="fn-left">
        <span className="fn-big">{s.big.number}</span>
        <span className="fn-big-label">{s.big.label}</span>
        {s.points.map((p, i) => <p key={i}>{rich(p)}</p>)}
        {s.muted && <p className="fn-muted">{rich(s.muted)}</p>}
      </div>
      <div className="fn-right">
        <h4 className="caps">{s.funnelTitle}</h4>
        {s.steps.map((st, i) => (
          <div key={i} className={`fn-step ${st.tone} i${i}`}>
            <b className="fn-val">{rich(st.value)}</b>
            <p>{rich(st.text)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
