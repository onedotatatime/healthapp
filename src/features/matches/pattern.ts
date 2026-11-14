/** Turns the RPC's coded features ("anti_CCP_positive") and country codes ("GR") into words for the panel. Pure, unit tested. */

/** "CRP_high" -> "CRP high"; "anti_CCP_positive" -> "Anti-CCP positive"; "spec_rheumatology" -> "Rheumatology". */
export function featureLabel(code: string): string {
  let c = code.trim();
  if (c.startsWith('spec_')) c = c.slice(5);
  c = c.replace(/^anti_/i, 'anti-').replace(/_/g, ' ');
  return c.charAt(0).toUpperCase() + c.slice(1);
}

/** The countries in the seeded cohort (a fixed small set), so the screen does not depend on the browser's Intl data. */
const COUNTRIES: Record<string, string> = { DE: 'Germany', FR: 'France', GR: 'Greece', IT: 'Italy', NL: 'Netherlands', SE: 'Sweden' };

/** "GR" -> "Greece". Unknown code: the browser's name when it has one, the code itself otherwise. */
export function countryName(code: string): string {
  const c = code.toUpperCase();
  if (COUNTRIES[c]) return COUNTRIES[c];
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(c) ?? code;
  } catch {
    return code;
  }
}
