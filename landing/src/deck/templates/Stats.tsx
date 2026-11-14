import type { StatsSlide } from '../types';
import { Headline, rich } from '../util';

export function Stats({ s }: { s: StatsSlide }) {
  return (
    <div className="t-stats">
      <Headline text={s.headline} />
      <div className="stats-groups">
        {s.groups.map((g) => (
          <section key={g.label} className={`stats-group ${g.tone}`} style={{ flex: g.cards.length }}>
            <h3>{rich(g.label)}</h3>
            <div className="stats-cards">
              {g.cards.map((c) => (
                <article key={c.number} className="stat-card">
                  <span className="stat-pre">{c.pre}</span>
                  <span className="stat-num" data-long={c.number.length > 5}>{c.number}</span>
                  <p>{rich(c.text)}</p>
                  <small>{rich(c.source)}</small>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
      <ul className="stats-chips">{s.chips.map((c) => <li key={c}>{c}</li>)}</ul>
      <p className="stats-closing">{rich(s.closing)}</p>
    </div>
  );
}
