import type { ProductSlide } from '../types';
import { Headline, rich, Tag } from '../util';

// Abstract phone frames. Each frame is drawn, never captured, so it carries a tag from the card data.
const Icon = ({ kind }: { kind: ProductSlide['steps'][number]['icon'] }) => {
  const bar = (y: number, w = 100, c = '#C3CDCC') => <rect x="30" y={y} width={w} height="9" rx="4.5" fill={c} />;
  return (
    <svg viewBox="0 0 160 170" className="phone-svg" aria-hidden="true">
      <rect x="2" y="2" width="156" height="166" rx="26" fill="#F7FAFA" stroke="#0B3B3D" strokeWidth="5" />
      <rect x="62" y="14" width="36" height="7" rx="3.5" fill="#DCE8E7" />
      {kind === 'photo' && (<>
        <rect x="18" y="38" width="124" height="68" rx="8" fill="#fff" stroke="#7FE3CF" strokeWidth="4" />
        {bar(52, 100)}{bar(70, 100)}{bar(88, 100)}{bar(124, 100, '#DCE8E7')}
        <circle cx="80" cy="132" r="17" fill="#7FE3CF" />
      </>)}
      {kind === 'match' && (<>
        <rect x="20" y="40" width="120" height="44" rx="12" fill="#C9F0E8" />
        <rect x="34" y="58" width="50" height="9" rx="4.5" fill="#0B3B3D" />
        <circle cx="118" cy="62" r="14" fill="#0F766E" />
        <rect x="20" y="96" width="120" height="44" rx="12" fill="#FFD9C7" />
        <rect x="34" y="114" width="50" height="9" rx="4.5" fill="#9A3F2B" />
        <circle cx="118" cy="118" r="14" fill="#F4846B" />
      </>)}
      {kind === 'timeline' && (<>
        <line x1="40" y1="44" x2="40" y2="140" stroke="#0B3B3D" strokeWidth="3" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <circle cx="40" cy={52 + i * 30} r="9" fill={i % 2 ? '#7FE3CF' : '#F4846B'} />
            <rect x="62" y={48 + i * 30} width={i % 2 ? 40 : 60} height="8" rx="4" fill="#C3CDCC" />
          </g>
        ))}
      </>)}
      {kind === 'helix' && (<>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const y = 40 + i * 17;
          const dx = Math.sin(i * 0.9) * 30;
          return (
            <g key={i}>
              <circle cx={80 - dx} cy={y} r="7" fill={i % 2 ? '#F4846B' : '#0F766E'} />
              <circle cx={80 + dx} cy={y} r="7" fill={i % 2 ? '#0F766E' : '#F4846B'} />
            </g>
          );
        })}
      </>)}
      {kind === 'ask' && (<>
        <rect x="22" y="40" width="64" height="30" rx="15" fill="#7FE3CF" />
        <rect x="22" y="86" width="116" height="62" rx="12" fill="#fff" stroke="#DCE8E7" strokeWidth="3" />
        {bar(98, 70, '#C3CDCC')}
        <rect x="108" y="98" width="22" height="9" rx="4.5" fill="#0F766E" />
        <rect x="42" y="116" width="64" height="9" rx="4.5" fill="#7FE3CF" />
        <rect x="108" y="116" width="22" height="9" rx="4.5" fill="#0F766E" />
        {bar(132, 70, '#C3CDCC')}
        <rect x="108" y="132" width="22" height="9" rx="4.5" fill="#0F766E" />
      </>)}
    </svg>
  );
};

export function Product({ s }: { s: ProductSlide }) {
  return (
    <div className="t-product">
      <Headline text={s.headline} />
      <div className="pr-cards">
        {s.steps.map((st) => (
          <article key={st.n} className="pr-card">
            <header><i>{st.n}</i><h3>{st.title}</h3></header>
            <Icon kind={st.icon} />
            <Tag>{st.tag}</Tag>
            <p>{rich(st.text)}</p>
          </article>
        ))}
      </div>
      <div className="pr-under">
        {s.under.map((u) => (
          <section key={u.label} className="pr-note">
            <h4 className="caps">{u.label}</h4>
            {u.badges && (
              <span className="pr-badges">
                <b className="verified">{u.badges[0]}</b>
                <b className="uploaded">{u.badges[1]}</b>
              </span>
            )}
            {u.lines.map((l, i) => <p key={i}>{rich(l)}</p>)}
          </section>
        ))}
      </div>
    </div>
  );
}
