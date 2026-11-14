import type { AppendixSlide } from '../types';
import { Headline, rich } from '../util';

export function Appendix({ s }: { s: AppendixSlide }) {
  return (
    <div className="t-appendix">
      <Headline text={s.headline} />
      <div className="ap-circles" aria-label="TAM and SAM">
        <div className="ap-tam">
          <small>{s.tam.label}</small>
          <b>{s.tam.value}</b>
          <span className="ap-pill">{s.tam.tag}</span>
        </div>
        <div className="ap-sam">
          <small>{s.sam.label}</small>
          <b>{s.sam.value}</b>
          <span className="ap-pill">{s.sam.tag}</span>
        </div>
      </div>
      <div className="ap-table">
        <div className="ap-row ap-head">{s.head.map((h, i) => <span key={i}>{h}</span>)}</div>
        {s.rows.map((r, i) => (
          <div key={i} className={`ap-row ${r.total ? 'total' : ''}`}>
            {r.cells.map((c, ci) => <span key={ci}>{rich(c)}</span>)}
          </div>
        ))}
        {s.lines.map((l, i) => <p key={i}>{rich(l)}</p>)}
      </div>
    </div>
  );
}
