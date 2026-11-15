/** Small pure helpers of /doctor/simulate: words for codes, the recorded run's time, the machine replay offsets. */
import { featureLabel } from '../matches/pattern';
import type { VmBlock } from './matcher';

export { countryName } from '../matches/pattern';

/** "img_hilar_lymphadenopathy" -> "Hilar lymphadenopathy"; everything else follows the matches screens. */
export const codeLabel = (code: string) => featureLabel(code.replace(/^img_/, ''));

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** "2026-11-14T21:25:14Z" -> "14 Nov 2026, 21:25 UTC". Fixed zone, so the screen reads the same on any laptop. */
export function formatRunTime(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`;
}

/** Milliseconds from the recorded start to each phase, from the wrapper's own timestamps. */
export const vmOffsets = (vm: VmBlock): number[] => vm.phases.map((p) => Math.max(0, Date.parse(p.at) - Date.parse(vm.started_at)));

/** Milliseconds from the live run's `start` line to one of its `phase` lines. 0 when either time cannot be read. */
export const offsetMs = (startIso: string, atIso: string): number => {
  const d = Date.parse(atIso) - Date.parse(startIso);
  return Number.isFinite(d) ? Math.max(0, d) : 0;
};
