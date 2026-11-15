/**
 * The 50,000 records as dots on ONE canvas (MIN-4736). A thin React shell round DotPainter (dotPaint.ts): it measures the width, starts
 * the fill-in, and tells the painter when the stage or the rings change. The canvas is an image with a text label; a dot is not
 * tappable. Under reduced motion the finished state of the stage is painted at once and no timer or frame loop runs.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { DotPainter, type FieldInput } from './dotPaint';
import { geometryFor, type StageId } from './dots';

interface Props {
  input: FieldInput;
  /** The canvas text: what the stage shows, in words. */
  label: string;
  /** The stage that should be on screen now. */
  stage: StageId;
  rings: boolean;
  reduced: boolean;
  /** Called once, when all the dots are in (at once under reduced motion). */
  onRevealed: () => void;
}

/** A width change smaller than this (a scrollbar appearing) does not rebuild the field. */
const RESIZE_STEP = 24;

export function DotCanvas({ input, label, stage, rings, reduced, onRevealed }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const painter = useRef<DotPainter | null>(null);
  const revealed = useRef(false);
  const [width, setWidth] = useState(0);
  const latest = useRef({ stage, rings, onRevealed });
  latest.current = { stage, rings, onRevealed };
  const height = useMemo(() => (width > 0 ? geometryFor(width, input.cls.length).height : 0), [width, input]);

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const read = () => {
      const w = Math.floor(el.clientWidth);
      setWidth((old) => (old === 0 || Math.abs(w - old) >= RESIZE_STEP ? w : old));
    };
    read();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = canvas.current;
    if (!el || width === 0) return;
    const p = new DotPainter(el, width, input);
    painter.current = p;
    let alive = true;
    if (reduced || revealed.current) {
      p.paintStatic(latest.current.stage, latest.current.rings);
      if (!revealed.current) {
        revealed.current = true;
        latest.current.onRevealed();
      }
    } else {
      void p.fill().then(() => {
        if (!alive) return;
        revealed.current = true;
        latest.current.onRevealed();
      });
    }
    return () => {
      alive = false;
      p.dispose();
      if (painter.current === p) painter.current = null;
    };
  }, [width, input, reduced]);

  // A new stage after the fill-in: the dots that leave fade. Under reduced motion the finished stage is painted at once.
  useEffect(() => {
    const p = painter.current;
    if (!p || !revealed.current) return;
    if (reduced) p.paintStatic(stage, rings);
    else void p.go(stage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  useEffect(() => {
    const p = painter.current;
    if (!p || !revealed.current) return;
    if (reduced) p.paintStatic(stage, rings);
    else if (rings) void p.rings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rings]);

  return (
    <div ref={wrap} className="sm-dots" data-testid="sim-dots">
      <canvas ref={canvas} role="img" aria-label={label} style={{ width: '100%', height }} data-testid="sim-canvas" />
    </div>
  );
}
