import type { ReactNode } from 'react';
import { captions, labels, qrCells, screensCopy } from './screensData';

/** One frame for all four screens: 320x640 phone, 8px bezel. No status bar, tab bar or laptop. */
function Phone({ children }: { children: ReactNode }) {
  return (
    <div className="ph-wrap" aria-hidden="true">
      <div className="phone"><div className="ph-in">{children}</div></div>
    </div>
  );
}

const Sk = ({ w, className = '' }: { w: 4 | 6 | 8; className?: string }) => <span className={`sk sk${w} ${className}`} />;

function History() {
  return (
    <ul className="s-tl">
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className={i === 1 ? 'on' : ''}>
          <span className="dot" />
          <div className={`s-card${i === 1 ? ' hl' : ''}`}>
            {i === 1 ? <strong>{labels.history}</strong> : <Sk w={8} />}
            <Sk w={i === 1 ? 6 : 4} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Scan() {
  return (
    <>
      <div className="paper"><Sk w={8} /><Sk w={6} /><Sk w={8} /><Sk w={4} /></div>
      <span className="dotbtn">{'↓'}</span>
      <div className="s-row flag hl">
        <div className="rbars"><Sk w={8} /><Sk w={6} /></div><Sk w={4} className="rs" />
        <span className="fchip"><i />{labels.flag}</span>
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="s-row"><div className="rbars"><Sk w={8} /><Sk w={6} /></div><Sk w={4} className="rs" /></div>
      ))}
    </>
  );
}

const R = 52, C = 2 * Math.PI * R;
function Share() {
  return (
    <>
      <h4 className="s-label">{labels.share}</h4>
      <div className="qr">
        {qrCells.map((c, i) => <i key={i} className={c} />)}
      </div>
      <div className="ring hl-ring">
        <svg viewBox="0 0 120 120" width="120" height="120">
          <circle cx="60" cy="60" r={R} fill="none" stroke="#EAF3F2" strokeWidth="8" />
          <circle className="ring-arc" cx="60" cy="60" r={R} fill="none" stroke="#7FE3CF" strokeWidth="8" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * 0.03} transform="rotate(-90 60 60)" data-c={C} />
        </svg>
        <span>{labels.countdown}</span>
      </div>
    </>
  );
}

function Ask() {
  return (
    <>
      <div className="bub q">{labels.question}</div>
      <div className="bub a"><Sk w={8} /><Sk w={6} /></div>
      <span className="schip hl">{labels.source}</span>
    </>
  );
}

const screens = [History, Scan, Share, Ask];

export function Screens({ staticMode }: { staticMode: boolean }) {
  return (
    <section id="screens" className="screens" aria-labelledby="screens-h">
      <div className="sc-head">
        <span className="sc-chip"><i />{screensCopy.chip}</span>
        <h2 id="screens-h" className="sc-h2">{screensCopy.title}</h2>
        <p className="sc-sub">{screensCopy.sub}</p>
      </div>
      <div className="sc-stage">
        {captions.map((c, i) => {
          const S = screens[i];
          return (
            <figure key={c.id} id={c.id} aria-label={c.label} className={`sc-item${staticMode ? ' fade' : ''}`}>
              <figcaption className="sc-cap">
                <span className="num">0{i + 1}</span>
                <h3>{c.title}</h3>
                <p>{c.line}</p>
              </figcaption>
              <Phone><div className={`scr ${c.id}`}><S /></div></Phone>
            </figure>
          );
        })}
      </div>
      <nav className="sc-prog" aria-label="Demo screens">
        {captions.map((c, i) => (
          <button key={c.id} type="button" className={i === 0 ? 'on' : ''} aria-current={i === 0 ? 'step' : undefined} data-step={i}>
            0{i + 1}<span className="sr"> {c.title}</span>
          </button>
        ))}
      </nav>
    </section>
  );
}
