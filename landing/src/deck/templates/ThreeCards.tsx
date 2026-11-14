import type { ThreeCardsSlide } from '../types';
import { Headline, withAccent } from '../util';

/** Three equal cards: a title, one big figure (with its honesty label at the same size), two or three short lines. The accented card gets a light teal band and a teal outline. */
export function ThreeCards({ s }: { s: ThreeCardsSlide }) {
  return (
    <div className="t-threecards">
      <Headline text={s.headline} />
      <div className="th-cards">
        {s.cards.map((c) => (
          <article key={c.title} className={`th-card${c.accent ? ' accent' : ''}`}>
            <h3 className="caps">{c.title}</h3>
            <div className="th-fig">
              <b>{c.figure.value}</b>
              {c.figure.tag && <span className="th-tag">{c.figure.tag}</span>}
            </div>
            {c.figure.unit && <p className="th-unit">{c.figure.unit}</p>}
            <ul>
              {c.lines.map((l, i) => <li key={i}>{withAccent(l, 'th-flag')}</li>)}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
