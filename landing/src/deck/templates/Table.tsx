import type { TableSlide } from '../types';
import { Headline, rich } from '../util';

export function Table({ s }: { s: TableSlide }) {
  return (
    <div className={`t-table ${s.bar ? 'has-bar' : ''}`}>
      <Headline text={s.headline} />
      {s.intro && <p className="tb-intro">{rich(s.intro)}</p>}
      <div className="tb" style={{ ['--cols' as string]: s.cols }}>
        <div className="tb-head tb-row">{s.head.map((h) => <span key={h}>{h}</span>)}</div>
        {s.rows.map((r, i) => (
          <div key={i} className={`tb-row tb-body ${r.emphasis ?? ''}`}>
            {r.cells.map((c, ci) => (
              <span key={ci} className={ci === s.accentCol ? 'accent' : ''}>{rich(c)}</span>
            ))}
          </div>
        ))}
      </div>
      {s.bar && (
        <div className="tb-bar-wrap">
          <h4 className="tb-bar-title">{s.bar.title}</h4>
          <div className="tb-bar">
            {s.bar.parts.map((p) => (
              <div key={p.value} className={`tb-part ${p.tone}`} style={{ flex: p.pct }}>
                <b>{p.value}</b>
                <span>{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
