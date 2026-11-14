import type { TwoColumnSlide } from '../types';
import { Headline, rich } from '../util';

/** Two equal columns of short numbered lines, then an optional small pointer line. Text only, no images. Column 1 ends on the coral dot (the patient choosing). */
export function TwoColumn({ s }: { s: TwoColumnSlide }) {
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
      {s.pointer && <p className="tc-pointer">{rich(s.pointer)}</p>}
    </div>
  );
}
