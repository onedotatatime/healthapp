import type { TwoColumnRevenueSlide } from '../types';
import { Headline, rich } from '../util';

/** Two equal columns of three points, then a full-width revenue strip. Text only, no images. Column 1 ends on the coral dot (the patient choosing). */
export function TwoColumnRevenue({ s }: { s: TwoColumnRevenueSlide }) {
  return (
    <div className="t-twocol">
      <Headline text={s.headline} />
      <div className="tc-cols">
        {s.columns.map((c, ci) => (
          <section key={c.title} className="tc-col">
            <h3 className="caps">{c.title}</h3>
            <ol>
              {c.points.map((p, i) => (
                <li key={i}>
                  <i>{i + 1}</i>
                  <p>{rich(p)}{ci === 0 && i === c.points.length - 1 && <b className="tc-dot" aria-hidden="true" />}</p>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
      <div className="tc-rev">
        {s.revenue.map((r, i) => (
          <div key={i} className="tc-cell">
            {r.lead && <p className="tc-lead">{rich(r.lead)}</p>}
            <div className="tc-figs">
              {r.figures.map((f) => (
                <span key={f.value} className="tc-fig">
                  <b>{f.value}</b>
                  {f.label && <em>{f.label}</em>}
                </span>
              ))}
              {r.tag && <span className="tc-tag">{r.tag}</span>}
            </div>
            {r.text && <p className="tc-text">{rich(r.text)}</p>}
            {r.source && <small className="tc-src">{r.source}</small>}
          </div>
        ))}
      </div>
    </div>
  );
}
