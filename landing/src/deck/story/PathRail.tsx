import { useEffect, useRef } from 'react';
import type { Theme } from '../types';

/** The teal path: the logo's own gesture (a line that ends in one dot) as a timeline. One persistent SVG, outside the slides. */
export const WAYPOINTS: Record<string, number> = { '1': 120, '2': 520, '3': 960, '4': 1280, '5': 1480, '5b': 1640, '6': 1800 };
const Y = 1008;
const START = 120;
const TODAY = 960;
const WHAT_IF_END = 1640;
const END = 1800;

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 5); // the expo-out feel of --ease-out, without a library
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

type Label = { text: string; x: number; anchor: 'middle' | 'end'; ids: string[] };
const LABELS: Label[] = [
  { text: '2019', x: 520, anchor: 'middle', ids: ['2'] },
  { text: 'Today', x: 960, anchor: 'middle', ids: ['3'] },
  { text: 'What if', x: 1280, anchor: 'middle', ids: ['4', '5', '5b'] },
  { text: 'Live', x: 1800, anchor: 'end', ids: ['6'] },
];

export function PathRail({ slideId, theme, pulse }: { slideId: string; theme: Theme; pulse: number }) {
  const solid1 = useRef<SVGLineElement>(null);
  const dotted = useRef<SVGLineElement>(null);
  const solid2 = useRef<SVGLineElement>(null);
  const dot = useRef<SVGCircleElement>(null);
  const x = useRef<number | null>(null);
  const raf = useRef(0);
  const live = slideId === '6';

  const draw = (v: number) => {
    x.current = v;
    solid1.current?.setAttribute('x2', String(clamp(v, START, TODAY)));
    dotted.current?.setAttribute('x2', String(clamp(v, TODAY, WHAT_IF_END)));
    solid2.current?.setAttribute('x2', String(clamp(v, TODAY, END)));
    dot.current?.setAttribute('cx', String(v));
    // a zero-length line with round caps still paints a dot: hide the segments the path has not reached
    const beyond = v > TODAY + 0.5 ? 'visible' : 'hidden';
    if (dotted.current) dotted.current.style.visibility = beyond;
    if (solid2.current) solid2.current.style.visibility = beyond;
  };

  useEffect(() => {
    const target = WAYPOINTS[slideId] ?? START;
    cancelAnimationFrame(raf.current);
    const from = x.current ?? target;
    if (x.current === null || reduced() || from === target) { draw(target); return; }
    const t0 = performance.now();
    const step = (now: number) => {
      const t = clamp((now - t0) / 800, 0, 1);
      draw(from + (target - from) * easeOut(t));
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [slideId]);

  // One pulse (scale 1 to 1.6 to 1, once). Never a loop.
  useEffect(() => {
    if (!pulse || reduced()) return;
    dot.current?.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.6)', offset: 0.4 }, { transform: 'scale(1)' }],
      { duration: 800, easing: 'cubic-bezier(.22,1,.36,1)' },
    );
  }, [pulse]);

  return (
    <svg className={`rail ${theme === 'night' ? 'is-night' : ''} ${live ? 'is-live' : ''} ${slideId === '1' ? 'is-first' : ''}`} viewBox="0 0 1920 1080" aria-hidden="true" focusable="false">
      <line ref={solid1} className="rail-solid" x1={START} y1={Y} x2={START} y2={Y} />
      <line ref={dotted} className="rail-dotted" x1={TODAY} y1={Y} x2={TODAY} y2={Y} />
      <line ref={solid2} className="rail-solid rail-solid-live" x1={TODAY} y1={Y} x2={TODAY} y2={Y} />
      {LABELS.map((l) => {
        const on = l.ids.includes(slideId);
        return (
          <g key={l.text} className={`rail-label ${on ? 'is-on' : ''}`}>
            <rect className="rail-tick" x={l.anchor === 'end' ? l.x - 2 : l.x - 1} y={1016} width={2} height={14} />
            <text x={l.x} y={1048} textAnchor={l.anchor}>{l.text}</text>
          </g>
        );
      })}
      <circle ref={dot} className="rail-dot" cx={START} cy={Y} r={11} />
    </svg>
  );
}
