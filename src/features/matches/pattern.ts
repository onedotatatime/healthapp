/** Turns the RPC's coded features ("anti_CCP_positive") and country codes ("GR") into words for the panel. Pure, unit tested. */

/** "CRP_high" -> "CRP high"; "anti_CCP_positive" -> "Anti-CCP positive"; "spec_rheumatology" -> "Rheumatology". */
export function featureLabel(code: string): string {
  let c = code.trim();
  if (c.startsWith('spec_')) c = c.slice(5);
  c = c.replace(/^anti_/i, 'anti-').replace(/_/g, ' ');
  return c.charAt(0).toUpperCase() + c.slice(1);
}

/** "GR" -> "Greece" when the browser knows the code, the code itself otherwise. */
export function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}
