import type { ChartSlide } from '../types';
import { Headline, rich } from '../util';

// Bars drawn from data. Geometry is computed, never hand-placed.
// One series: conservative in teal, upside in mint, only the year totals as labels (the stack by revenue line is on A6).
// More than one series: stacked, with a legend (kept for other decks).
const W = 1060, H = 540, BASE = 440, MAXH = 290, BAR = 130, GAP = 16, GROUP_X = [64, 394, 724];
const FILL = ['#0F766E', '#7FE3CF', '#0B3B3D'];

export function Chart({ s }: { s: ChartSlide }) {
  const single = s.series.length === 1;
  const max = Math.max(...s.groups.flatMap((g) => g.bars.map((b) => b.values.reduce((a, v) => a + v, 0))));
  return (
    <div className="t-chart">
      <Headline text={s.headline} />
      <div className="ch-card">
        <h4 className="ch-title">{rich(s.chartTitle)}</h4>
        {!single && (
          <ul className="ch-legend">
            {s.series.map((x, i) => (
              <li key={x.key}><i style={{ background: FILL[i] }} />{x.key}<span>{x.label}</span></li>
            ))}
          </ul>
        )}
        <svg viewBox={`0 0 ${W} ${H}`} className="ch-svg" role="img" aria-label={s.chartTitle}>
          <line x1="40" y1={BASE} x2={W - 20} y2={BASE} stroke="#DCE8E7" strokeWidth="3" />
          {s.groups.map((g, gi) => (
            <g key={g.label}>
              {g.bars.map((b, bi) => {
                const x = GROUP_X[gi] + bi * (BAR + GAP);
                const total = b.values.reduce((a, v) => a + v, 0);
                let y = BASE;
                return (
                  <g key={b.label}>
                    {b.values.map((v, vi) => {
                      const h = (v / max) * MAXH;
                      y -= h;
                      return v > 0 ? <rect key={vi} x={x} y={y} width={BAR} height={Math.max(h, 2)} fill={FILL[single ? bi : vi]} /> : null;
                    })}
                    <text x={x + BAR / 2} y={BASE - (total / max) * MAXH - 14} textAnchor="middle" className="ch-total">{b.total}</text>
                    <text x={x + BAR / 2} y={BASE + 36} textAnchor="middle" className="ch-bar-label">{b.label}</text>
                  </g>
                );
              })}
              <text x={GROUP_X[gi] + BAR + GAP / 2} y={BASE + 76} textAnchor="middle" className="ch-group">{g.label}</text>
            </g>
          ))}
        </svg>
      </div>
      <aside className="ch-callout">
        <h4 className="caps">{rich(s.callout.title)}</h4>
        {s.callout.items.map((it) => (
          <div key={it.number} className="ch-item">
            <b>{rich(it.number)}</b>
            <span>{it.label}</span>
          </div>
        ))}
      </aside>
      <div className="ch-strip">
        <b className="ch-strip-num">{rich(s.strip.value)}</b>
        <p>{rich(s.strip.text)}</p>
      </div>
    </div>
  );
}
