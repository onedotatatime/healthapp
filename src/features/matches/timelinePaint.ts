/**
 * The only code that runs in the timeline's frame loop (MIN-4724; CTO, MIN-4720 section 3): it writes the clip width, the playhead, the five head
 * transforms and, on a wide screen, the five label transforms and leader paths, through refs. React is not involved per frame (its state changes at month
 * edges only), and nothing here reads layout: the label height is a constant and the width is measured on resize only, elsewhere.
 */
import type { TlFrame, TlMeasureId } from './timeline';

export type TlEls = {
  clip: SVGRectElement | null;
  play: SVGLineElement | null;
  heads: Partial<Record<TlMeasureId, SVGGElement | null>>;
  labels: Partial<Record<TlMeasureId, HTMLElement | null>>;
  leaders: Partial<Record<TlMeasureId, SVGPathElement | null>>;
};

export const emptyEls = (): TlEls => ({ clip: null, play: null, heads: {}, labels: {}, leaders: {} });

export function paintFrame(els: TlEls, f: TlFrame): void {
  els.clip?.setAttribute('width', f.clipW.toFixed(2));
  if (els.play) {
    els.play.setAttribute('x1', f.playX.toFixed(2));
    els.play.setAttribute('x2', f.playX.toFixed(2));
    els.play.style.display = f.showPlay ? '' : 'none';
  }
  f.heads.forEach((h, i) => {
    els.heads[h.id]?.setAttribute('transform', `translate(${h.x.toFixed(2)} ${h.y.toFixed(2)})`);
    if (f.tops && f.leaders) {
      const label = els.labels[h.id];
      if (label) label.style.transform = `translateY(${f.tops[i].toFixed(1)}px)`;
      const lead = els.leaders[h.id];
      if (lead) {
        lead.setAttribute('d', f.leaders[i]);
        lead.style.display = f.showPlay ? 'none' : '';   // no leader while the run plays: it would cross months the chart has not reached
      }
    }
  });
}
