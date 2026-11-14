/**
 * The static DNA helix behind the QR card (Pix, MIN-4473 section 5; the animation is cut, CTO). Ported from
 * `Helix.jsx` on branch claude/doctor-patient-demo-screens-b6a4e8 with Pix's numbers: two strands of 4 px with round
 * caps, amplitude 120, 2 turns, mirrored phase, rungs every 24 px at 16% opacity. Decorative: `aria-hidden`.
 */
const TURNS = 2;

export function Helix({ height, width = 390, amp = 120 }: { height: number; width?: number; amp?: number }) {
  const cx = width / 2;
  const a: string[] = [];
  const b: string[] = [];
  const rungs: Array<[number, number, number]> = [];
  for (let y = 0; y <= height; y += 4) {
    const th = (y / height) * Math.PI * 2 * TURNS;
    const x1 = cx + amp * Math.sin(th);
    const x2 = cx - amp * Math.sin(th);
    a.push(`${x1.toFixed(1)},${y}`);
    b.push(`${x2.toFixed(1)},${y}`);
    if (y % 24 === 0) rungs.push([x1, x2, y]);
  }
  return (
    <svg className="hs-helix" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
      {rungs.map(([x1, x2, y]) => (
        <line key={y} x1={x1} x2={x2} y1={y} y2={y} stroke="var(--night-ink)" strokeOpacity="0.16" strokeWidth="1.5" />
      ))}
      <polyline points={a.join(' ')} fill="none" stroke="var(--helix-patient)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={b.join(' ')} fill="none" stroke="var(--helix-doctor)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
