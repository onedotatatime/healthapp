// Name and ID match (MIN-4478; PRD 10.14 B1). Pure, no I/O. It runs on the server on the model's output
// and the profile row; nothing a client sends reaches it.
//
// The rule (MIN-4478, widened 2026-11-14 and again for MIN-4614, real Greek lab prints): the name parts of the
// profile are compared with the printed name after one fold (accents, case, Greek to Latin, common spelling
// variants), with the patronymic markers ("του", "της", "of") dropped from both sides so they never count as a part.
//  - Every profile part must be among the printed parts, and both names need two parts at least. Otherwise: refused.
//  - extra = printed parts - profile parts (a father's name, an initial that counts).
//  - MIN-4630 (founder, 2026-11-15: his exams carry no ΑΜΚΑ or ΑΔΤ; the model read a lab code into printed_id and the
//    right name was refused): a printed number NEVER refuses. A different number is ignored, so the name decides alone.
//  - An ID is printed and the profile has one and they are equal: a match, at any extra count. It only helps.
//  - Otherwise: up to ONE extra part is accepted as "name_only", the same standing a bare two-part name with no ID
//    always had. Two extra parts or more need the equal ID to prove it is the same person: name_mismatch.
//  - Accepted risk, on the record: a namesake's paper with another person's real ID is saved as name_only. The
//    record carries the "name only" mark and its owner can delete it. `id_mismatch` is never returned now; the code
//    stays in the contract, the DB check and the UI copy because old rows hold it.
// No readable name is refused earlier (extract.ts `build`, reason name_missing). No fuzzy matching: a misspelt
// name is refused, which is the safe direction for a record that doctors will read.
import { normalizeId } from "./extract.ts";

const GREEK: Record<string, string> = {
  Α: "A", Β: "V", Γ: "G", Δ: "D", Ε: "E", Ζ: "Z", Η: "I", Θ: "TH", Ι: "I", Κ: "K", Λ: "L", Μ: "M", Ν: "N",
  Ξ: "KS", Ο: "O", Π: "P", Ρ: "R", Σ: "S", Τ: "T", Υ: "Y", Φ: "F", Χ: "CH", Ψ: "PS", Ω: "O",
};

// Spellings that mean the same sound in Greek and in the Latin a lab prints. Digraphs first, then letters.
// Both sides go through the same chain, so the fold is symmetric.
const DIGRAPHS: [RegExp, string][] = [
  [/OU/g, "U"], [/EI/g, "I"], [/AI/g, "E"], [/MP/g, "B"], [/NT/g, "D"], [/PH/g, "F"], [/KS/g, "X"], [/CH/g, "X"],
];

/** Upper case, no accents, Greek to Latin (ΟΥ is OU), then the spelling variants above folded together. */
function fold(raw: string): string {
  let t = raw
    .normalize("NFD").replace(/\p{M}/gu, "").toUpperCase()
    .replace(/ΟΥ/g, "OU")
    .replace(/[Α-Ω]/gu, (c) => GREEK[c] ?? c);
  for (const [re, to] of DIGRAPHS) t = t.replace(re, to);
  return t.replace(/C/g, "K").replace(/H/g, "I").replace(/Y/g, "I").replace(/V/g, "B");
}

/** The folded forms of "του", "της" and "of": they introduce a father's or mother's name and are not a name part. */
const MARKERS = new Set(["TU", "TIS", "OF"]);

/** The name parts that count: letters only, at least two long (a lone initial proves nothing), no marker. */
export function nameTokens(raw: string): string[] {
  return fold(raw).split(/[^A-Z]+/).filter((t) => t.length >= 2 && !MARKERS.has(t));
}

/** Strict: the two names have the same set of parts (two at least on each side). */
export function sameName(printed: string, known: string): boolean {
  const a = new Set(nameTokens(printed)), b = new Set(nameTokens(known));
  if (a.size < 2 || b.size < 2 || a.size !== b.size) return false;
  for (const t of b) if (!a.has(t)) return false;
  return true;
}

/** Loose: every part of the known name is among the printed parts (extra printed parts are allowed). */
export function containsName(printed: string, known: string): boolean {
  const a = new Set(nameTokens(printed)), b = new Set(nameTokens(known));
  if (a.size < 2 || b.size < 2) return false;
  for (const t of b) if (!a.has(t)) return false;
  return true;
}

export interface IdentityProfile {
  full_name: string;
  full_name_latin: string | null;
  national_id_norm: string | null;
}
/** What a refusal reports to the log: counts and flags only, never a name, an ID or a word of the document (MIN-4614). */
export interface IdentityCounts {
  profile_parts: number;
  profile_parts_found: number;
  printed_parts: number;
  extra_parts: number;
  id_printed: boolean;
  id_equal: boolean;
}
export type IdentityVerdict =
  | { ok: true; status: "match" | "name_only" }
  | { ok: false; reason: "name_mismatch"; printed: string; profile: string; counts: IdentityCounts };

/** How one profile name sits in the printed name: part counts, with the printed parts the profile does not have as extra. */
function compare(printedName: string, known: string) {
  const p = new Set(nameTokens(printedName)), k = new Set(nameTokens(known));
  let found = 0;
  for (const t of k) if (p.has(t)) found++;
  return { k: k.size, p: p.size, found, extra: p.size - found, whole: k.size >= 2 && p.size >= 2 && found === k.size };
}

/**
 * `printedName` is non-empty here (the caller refuses an empty one as name_missing first).
 * The name decides. A printed ID can only upgrade to `match` (equal to the profile's); it never refuses (MIN-4630).
 */
export function matchIdentity(
  profile: IdentityProfile,
  printedName: string,
  printedId: string | null,
): IdentityVerdict {
  const names = [profile.full_name, ...(profile.full_name_latin !== null ? [profile.full_name_latin] : [])];
  const printed = printedId?.trim() ? printedId.trim() : null;
  const known = profile.national_id_norm;
  const idPair = printed !== null && !!known;
  // The profile name (Greek or Latin) that fits best: a whole one first, then the most parts found, then the fewest extra.
  const fits = names.map((n) => compare(printedName, n)).sort((x, y) =>
    Number(y.whole) - Number(x.whole) || y.found - x.found || x.extra - y.extra
  );
  const best = fits[0];
  const idEqual = idPair && normalizeId(printed) === normalizeId(known);
  const counts: IdentityCounts = {
    profile_parts: best.k, profile_parts_found: best.found, printed_parts: best.p, extra_parts: best.extra,
    id_printed: printed !== null, id_equal: idEqual,
  };
  const refuse = (): IdentityVerdict => ({ ok: false, reason: "name_mismatch", counts, printed: printedName, profile: profile.full_name });
  if (!best.whole) return refuse();
  if (idEqual) return { ok: true, status: "match" };
  // No equal ID (none printed, a different number, or none on the profile): one extra part is a father's name;
  // two or more need an equal ID to prove it is the same person.
  return best.extra <= 1 ? { ok: true, status: "name_only" } : refuse();
}

export function mismatchMessage(v: Extract<IdentityVerdict, { ok: false }>): string {
  return `The name on it (${v.printed}) doesn't match your profile (${v.profile}). Nothing was saved.`;
}
