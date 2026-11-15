import type { StepsSlide } from '../types';
import { Headline, rich } from '../util';

function Path({ s }: { s: StepsSlide }) {
  return (
    <>
      <div className="sp-line">
        {s.steps.map((_, i) => <i key={i} style={{ left: 16 + i * 428 }}>{i + 1}</i>)}
      </div>
      <div className="sp-cards">
        {s.steps.map((st) => (
          <article key={st.title} className="sp-card">
            <h3>{rich(st.title)}</h3>
            <p>{rich(st.text ?? '')}</p>
          </article>
        ))}
      </div>
      <div className="sp-map" aria-label="Pilot cities">
        <svg viewBox="0 0 1680 250" className="sp-svg">
          <defs>
            <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="2" fill="#DCE8E7" /></pattern>
          </defs>
          <rect width="1680" height="250" fill="url(#dots)" />
          {s.places?.map((p) => (
            <g key={p.name}>
              <line x1={p.x} y1={p.y} x2={p.cx} y2={p.cy - 24} stroke="#C3CDCC" strokeWidth="2" />
              <circle cx={p.x} cy={p.y} r="9" fill="#F4846B" />
              <rect x={p.cx - 80} y={p.cy - 24} width="160" height="48" rx="24" fill="#0B3B3D" />
              <text x={p.cx} y={p.cy + 8} textAnchor="middle" className="sp-city">{p.name}</text>
            </g>
          ))}
        </svg>
      </div>
      {s.order && (
        <div className="sp-order">
          <h4 className="caps">{s.order.label}</h4>
          <p>{rich(s.order.text)}</p>
        </div>
      )}
      {s.banner && <p className="sp-banner">{rich(s.banner)}</p>}
    </>
  );
}

function Ascend({ s }: { s: StepsSlide }) {
  return (
    <div className="sa-cards">
      {s.steps.map((st, i) => (
        <article key={st.title} className={`sa-card i${i}`}>
          <h3>{rich(st.title)}</h3>
          <h4 className="caps">What ships</h4>
          <p className="sa-ships">{rich(st.ships ?? '')}</p>
          {st.applies && (
            <>
              <h4 className="caps">What applies</h4>
              <p className="sa-applies">{rich(st.applies)}</p>
            </>
          )}
          {st.badges && <h4 className="caps sa-law">Law</h4>}
          <footer>
            {st.badges?.map((b) => <b key={b}>{b}</b>)}
            {st.seal && <span className="sa-seal">{st.seal}</span>}
          </footer>
        </article>
      ))}
    </div>
  );
}

/** Left-to-right flow: small teal numerals on a hairline, one line each, the last step ends on a coral dot. No images. */
function Flow({ s }: { s: StepsSlide }) {
  return (
    <>
      {s.body && <p className="sf-body">{rich(s.body)}</p>}
      <ol className="sf-flow">
        {s.steps.map((st, i) => (
          <li key={st.title} className="sf-step">
            <span className="sf-rail"><i>{i + 1}</i></span>
            <h3>{rich(st.title)}</h3>
            <p>{rich(st.text ?? '')}</p>
          </li>
        ))}
      </ol>
    </>
  );
}

export function Steps({ s }: { s: StepsSlide }) {
  return (
    <div className={`t-steps v-${s.variant}`}>
      <Headline text={s.headline} />
      {s.variant === 'path' ? <Path s={s} /> : s.variant === 'flow' ? <Flow s={s} /> : <Ascend s={s} />}
    </div>
  );
}
