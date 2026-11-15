import type { StoryMatchesSlide } from '../types';
import { Headline } from '../../util';

const SPOKES = [
  [270, 40, 'deep'], [114, 100, 'deep'], [420, 76, 'mint'], [90, 316, 'mint'],
  [228, 460, 'mint'], [380, 450, 'mint'], [460, 370, 'deep'],
] as const;

/** Slide 4: one question, drawn. A similar case, my doctor in Athens, another doctor in Brazil. No app frame, no numbers, no "connected" state. */
export function StoryMatches({ s }: { s: StoryMatchesSlide }) {
  return (
    <div className="ts-matches">
      <Headline text={s.headline} />
      <svg viewBox="0 0 920 620" className="sx-svg" role="img" aria-label={`${s.labels.doctorHere}, ${s.labels.pattern}, ${s.labels.doctorThere}`}>
        <circle cx="270" cy="260" r="258" fill="#fff" stroke="#DCE8E7" strokeWidth="2" />
        <circle cx="270" cy="260" r="190" fill="none" stroke="#DCE8E7" strokeWidth="2" />
        <circle cx="270" cy="260" r="110" fill="none" stroke="#DCE8E7" strokeWidth="2" />
        {SPOKES.map(([x, y, tone], i) => (
          <g key={i} className="sx-spoke" style={{ ['--i' as string]: i }}>
            <line pathLength={1} x1="270" y1="260" x2={x} y2={y} stroke={tone === 'deep' ? '#0F766E' : '#7FE3CF'} strokeWidth="3" />
            <circle cx={x} cy={y} r="9" fill={tone === 'deep' ? '#0F766E' : '#7FE3CF'} />
          </g>
        ))}
        <rect x="130" y="200" width="278" height="118" rx="18" fill="#fff" stroke="#0F766E" strokeWidth="4" />
        <text x="150" y="268" className="svg-t1">{s.labels.pattern}</text>
        {[0, 1, 2].map((i) => <circle key={i} cx={160 + i * 30} cy="298" r="9" fill="#0F766E" />)}
        {[3, 4].map((i) => <circle key={i} cx={160 + i * 30} cy="298" r="9" fill="#F4846B" />)}
        <line className="sx-link" pathLength={1} x1="408" y1="259" x2="656" y2="92" stroke="#0F766E" strokeWidth="3" />
        <g className="sx-doctors">
          <line x1="700" y1="215" x2="700" y2="352" stroke="#F4846B" strokeWidth="4" />
          <circle cx="700" cy="90" r="45" fill="#0F766E" />
          <text x="700" y="100" textAnchor="middle" className="svg-dr">Dr</text>
          <text x="700" y="180" textAnchor="middle" className="svg-t3 sx-t">{s.labels.doctorHere}</text>
          <circle cx="700" cy="400" r="45" fill="#0B3B3D" />
          <text x="700" y="410" textAnchor="middle" className="svg-dr">Dr</text>
          <text x="700" y="490" textAnchor="middle" className="svg-t3 sx-t">{s.labels.doctorThere}</text>
        </g>
      </svg>
    </div>
  );
}
