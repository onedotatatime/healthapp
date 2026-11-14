/** Small pure helpers of /doctor/simulate: words for codes, the recorded run's time, the machine replay offsets. */
import { featureLabel } from '../matches/pattern';
import { COPY } from './copy';
import type { LabRow, VmBlock } from './matcher';

export { countryName } from '../matches/pattern';

/** "img_hilar_lymphadenopathy" -> "Hilar lymphadenopathy"; everything else follows the matches screens. */
export const codeLabel = (code: string) => featureLabel(code.replace(/^img_/, ''));

/** The generator's seeded groups, as the How it works page names them. Not diagnoses. */
const GROUPS: Record<string, string> = {
  type2_diabetes_metabolic: 'Type 2 diabetes', inflammatory_back_pain: 'Inflammatory back pain', hypothyroid: 'Hypothyroid',
  rheumatoid_arthritis: 'Rheumatoid arthritis', iron_deficiency: 'Iron deficiency', low_bone_density: 'Low bone density',
  lupus_like: 'Lupus-like', gout: 'Gout', hyperthyroid: 'Hyperthyroid', reduced_kidney_function: 'Reduced kidney function',
  rare_myopathy: 'Rare: myopathy', rare_sarcoid_like: 'Rare: sarcoid-like', rare_copper_metabolism: 'Rare: copper metabolism', noise: 'Scattered',
};
export const groupName = (g: string) => GROUPS[g] ?? featureLabel(g);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** "2026-11-14T21:25:14Z" -> "14 Nov 2026, 21:25 UTC". Fixed zone, so the screen reads the same on any laptop. */
export function formatRunTime(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`;
}

/** Milliseconds from the recorded start to each phase, from the wrapper's own timestamps. */
export const vmOffsets = (vm: VmBlock): number[] => vm.phases.map((p) => Math.max(0, Date.parse(p.at) - Date.parse(vm.started_at)));

export function formatValue(l: LabRow): string {
  return l.unit === 'qual' ? (l.value ? COPY.positive : COPY.negative) : `${l.value} ${l.unit}`;
}
