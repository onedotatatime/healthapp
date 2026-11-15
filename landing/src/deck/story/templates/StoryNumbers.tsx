import { useEffect, useRef } from 'react';
import type { StoryNumbersSlide } from '../types';
import { rich, typo } from '../../util';
import { ri } from './shared';

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const fmt = (v: number, d: number) => v.toFixed(d);

/** A figure that counts up from 0 over 1.2 s, expo-out, once per visit. The final text is always in the DOM (sr-only copy). */
function CountUp({ value, decimals, active, delay }: { value: number; decimals: number; active: boolean; delay: number }) {
  const el = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    const final = fmt(value, decimals);
    if (!active || reduced()) { node.textContent = final; return; }
    node.textContent = fmt(0, decimals);
    let raf = 0;
    const timer = window.setTimeout(() => {
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min((now - t0) / 1200, 1);
        node.textContent = fmt(value * (1 - Math.pow(1 - t, 5)), decimals);
        if (t < 1) raf = requestAnimationFrame(step); else node.textContent = final;
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => { window.clearTimeout(timer); cancelAnimationFrame(raf); node.textContent = final; };
  }, [value, decimals, active, delay]);
  return <span ref={el} aria-hidden="true">{fmt(value, decimals)}</span>;
}

/** "Did you know": two huge figures on night, mint on night. */
export function StoryNumbers({ s, current }: { s: StoryNumbersSlide; current: boolean }) {
  const l = s.left;
  const r = s.right;
  return (
    <div className="ts-numbers">
      <span className="sn-rule" aria-hidden="true" />
      <div className="sn-col sn-left">
        <p className="sn-fig rise" style={ri(1)}>
          <b className="sn-num"><CountUp value={l.value} decimals={l.decimals} active={current} delay={500} /></b>
          {l.unit && <span className="sn-unit" aria-hidden="true">{l.unit}</span>}
          <span className="sr-only">{fmt(l.value, l.decimals)}{l.suffix ?? ''}{l.unit ? ` ${l.unit}` : ''}</span>
        </p>
        <p className="sn-label rise" style={ri(3)}>{typo(l.label)}</p>
        <p className="sn-source rise" style={ri(4)}>{l.source}</p>
      </div>
      <div className="sn-col sn-right">
        <p className="sn-fig rise" style={ri(2)}>
          <b className="sn-num"><CountUp value={r.value} decimals={r.decimals} active={current} delay={800} /><span aria-hidden="true">{r.suffix}</span></b>
          <span className="sr-only">{fmt(r.value, r.decimals)}{r.suffix ?? ''}</span>
        </p>
        <p className="sn-label rise" style={ri(3)}>{typo(r.label)}</p>
        <p className="sn-climax rise" style={ri(4)}>{r.climaxBefore}<span className="sn-mint">{rich(r.climax)}</span>{r.climaxAfter}</p>
        <p className="sn-source rise" style={ri(5)}>{r.source}</p>
      </div>
      <p className="sn-note rise" style={ri(6)}>{rich(s.note)}</p>
    </div>
  );
}
