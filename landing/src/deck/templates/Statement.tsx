import type { StatementSlide, StatementSide } from '../types';
import { Headline, rich, Tag } from '../util';

function Side({ side, callout }: { side: StatementSide; callout?: StatementSlide['callout'] }) {
  switch (side.kind) {
    case 'compare':
      return (
        <aside className={`side-card${side.clock ? '' : ' slim'}`}>
          <h4 className="caps">{side.title}</h4>
          {side.bars.map((b) => (
            <div key={b.label} className="cmp-row">
              <span>{b.label}</span>
              <div className="cmp-bars">
                <b className={`cmp-bar ${b.tone}`} style={{ flex: b.gap ? '0 0 34.4%' : '1 1 auto' }}>
                  {b.value}
                </b>
                {b.gap && <b className="cmp-gap">{b.gap}</b>}
              </div>
            </div>
          ))}
          {side.clock && (
            <>
              <hr />
              <h4 className="caps">{side.clockTitle}</h4>
              <ol className="clock">
                {side.clock.map((c) => (
                  <li key={c.when}>
                    <i />
                    <b>{c.when}</b>
                    <span>{c.what}</span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </aside>
      );
    case 'notice':
      return (
        <aside className="side-notice">
          {side.blocks.map((b) => (
            <div key={b.label}>
              <h4 className="caps">{b.label}</h4>
              <p>{rich(b.text)}</p>
            </div>
          ))}
          <Tag>{side.tag}</Tag>
        </aside>
      );
    case 'phone':
      return (
        <aside className="side-phone">
          <div className="phone-frame">
            <span className="phone-notch" />
            <svg viewBox="0 0 120 220" className="key-svg" aria-hidden="true">
              <circle cx="60" cy="14" r="9" fill="#F4846B" />
              <circle cx="60" cy="68" r="34" fill="none" stroke="#0F766E" strokeWidth="18" />
              <rect x="55" y="104" width="10" height="100" rx="5" fill="#0F766E" />
              <rect x="65" y="170" width="26" height="10" rx="3" fill="#0F766E" />
              <rect x="65" y="188" width="18" height="10" rx="3" fill="#0F766E" />
            </svg>
            <p>{rich(side.caption)}</p>
          </div>
          <Tag>{side.tag}</Tag>
          {side.crossed && <span className="crossed-chip">{side.crossed}</span>}
        </aside>
      );
    case 'matches': {
      const spokes = [
        [270, 40, 'deep'], [114, 100, 'deep'], [420, 76, 'mint'], [90, 316, 'mint'],
        [228, 460, 'mint'], [380, 450, 'mint'], [460, 370, 'deep'],
      ] as const;
      return (
        <aside className="side-matches">
          <svg viewBox="0 0 770 620" className="matches-svg" role="img" aria-label="Possible matches around one pattern">
            <circle cx="270" cy="260" r="258" fill="#fff" stroke="#DCE8E7" strokeWidth="2" />
            <circle cx="270" cy="260" r="190" fill="none" stroke="#DCE8E7" strokeWidth="2" />
            <circle cx="270" cy="260" r="110" fill="none" stroke="#DCE8E7" strokeWidth="2" />
            {spokes.map(([x, y, tone], i) => (
              <g key={i}>
                <line x1="270" y1="260" x2={x} y2={y} stroke={tone === 'deep' ? '#0F766E' : '#7FE3CF'} strokeWidth="3" />
                <circle cx={x} cy={y} r="9" fill={tone === 'deep' ? '#0F766E' : '#7FE3CF'} />
              </g>
            ))}
            <rect x="130" y="200" width="278" height="118" rx="18" fill="#fff" stroke="#0F766E" strokeWidth="4" />
            <text x="150" y="242" className="svg-t1">{typoSvg(side.pattern.title)}</text>
            <text x="150" y="274" className="svg-t2">{side.pattern.sub}</text>
            {[0, 1, 2].map((i) => <circle key={i} cx={160 + i * 30} cy="298" r="9" fill="#0F766E" />)}
            {[3, 4].map((i) => <circle key={i} cx={160 + i * 30} cy="298" r="9" fill="#F4846B" />)}
            <line x1="665" y1="130" x2="665" y2="270" stroke="#F4846B" strokeWidth="4" />
            <circle cx="665" cy="85" r="45" fill="#0F766E" />
            <text x="665" y="95" textAnchor="middle" className="svg-dr">Dr</text>
            <circle cx="665" cy="315" r="45" fill="#0B3B3D" />
            <text x="665" y="325" textAnchor="middle" className="svg-dr">Dr</text>
            <text x="665" y="410" textAnchor="middle" className="svg-t3">{side.contact.split(' ')[0]}</text>
            <text x="665" y="448" textAnchor="middle" className="svg-t3">{side.contact.split(' ').slice(1).join(' ')}</text>
            <rect x="10" y="560" width="104" height="56" rx="28" fill="#0F766E" />
            <circle cx="86" cy="588" r="22" fill="#fff" />
            <text x="134" y="598" className="svg-t3">{side.optIn}</text>
          </svg>
          <span className="matches-tag"><Tag>{side.tag}</Tag></span>
          {callout && null}
        </aside>
      );
    }
  }
}

const typoSvg = (s: string) => s.replace(/(\w)'(\w)/g, '$1’$2');

export function Statement({ s }: { s: StatementSlide }) {
  const hasSide = !!s.side;
  return (
    <div className={`t-statement ps-${s.pointStyle} ${s.side ? `with-${s.side.kind}` : 'no-side'}`}>
      <Headline text={s.headline} />
      <div className="st-main">
        <ol className="points">
          {s.points.map((p, i) => (
            <li key={i}>
              {s.pointStyle === 'numbered' && <span className="pt-n">{i + 1}</span>}
              <div>
                <p>{rich(p.text)}</p>
                {p.source && <small>{rich(p.source)}</small>}
              </div>
            </li>
          ))}
        </ol>
        {s.callout && (
          <div className="callout">
            <span className="callout-num">{s.callout.number}</span>
            <p>{rich(s.callout.text)}</p>
            <small>{s.callout.source}</small>
          </div>
        )}
      </div>
      {hasSide && <Side side={s.side!} callout={s.callout} />}
    </div>
  );
}
