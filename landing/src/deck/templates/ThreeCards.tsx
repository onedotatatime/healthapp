import type { ThreeCardsSlide } from '../types';
import { Headline, rich, withAccent } from '../util';

/** Three equal cards: a title, one big figure with a small "*" on it, one explanation line (the footnote is the slide's `note`). The accented card gets a light teal band and a teal outline. */
export function ThreeCards({ s }: { s: ThreeCardsSlide }) {
  return (
    <div className="t-threecards">
      <Headline text={s.headline} />
      <div className="th-cards">
        {s.cards.map((c) => (
          <article key={c.title} className={`th-card${c.accent ? ' accent' : ''}`}>
            <h3 className="caps">{c.title}</h3>
            <div className="th-fig">
              <b>{c.figure.value}{c.figure.mark && <sup className="est">{c.figure.mark}</sup>}</b>
            </div>
            {c.figure.unit && <p className="th-unit">{rich(c.figure.unit)}</p>}
            {c.lines && (
              <ul>
                {c.lines.map((l, i) => <li key={i}>{withAccent(l, 'th-flag')}</li>)}
              </ul>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
