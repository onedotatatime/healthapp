// Name and ID match (MIN-4478; PRD 10.14 B1). Pure, no I/O. It runs on the server on the model's output
// and the profile row; nothing a client sends reaches it.
//
// The rule (MIN-4478, widened 2026-11-14 for real Greek lab prints): the name parts of the profile are
// compared with the printed name after one fold (accents, case, Greek to Latin, common spelling variants).
//  - Same set of parts: the name matches on its own.
//  - Every profile part is among the printed parts, and the printed name has extra parts (a father's name,
//    an initial that counts): it matches ONLY when an ID is printed and equals the profile's ID exactly.
//  - Anything else, including a printed name that lacks a profile part, is refused.
// A name with no printed ID is accepted as "name_only" only on the strict set rule. No readable name is
// refused earlier (extract.ts `build`, reason name_missing). No fuzzy matching: a misspelt name is
// refused, which is the safe direction for a record that doctors will read.
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

/** The name parts that count: letters only, at least two long (a lone initial proves nothing). */
export function nameTokens(raw: string): string[] {
  return fold(raw).split(/[^A-Z]+/).filter((t) => t.length >= 2);
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
export type IdentityVerdict =
  | { ok: true; status: "match" | "name_only" }
  | { ok: false; reason: "name_mismatch" | "id_mismatch"; printed: string; profile: string };

/**
 * `printedName` is non-empty here (the caller refuses an empty one as name_missing first).
 * A printed ID against a profile that has none cannot be checked: name_only, never a guess.
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
  const idEqual = idPair && normalizeId(printed) === normalizeId(known);
  const strict = names.some((n) => sameName(printedName, n));
  // Extra printed words are safe only when the printed ID is present and exactly the profile's.
  const loose = idPair && names.some((n) => containsName(printedName, n));
  if (!strict && !loose) return { ok: false, reason: "name_mismatch", printed: printedName, profile: profile.full_name };
  if (!idPair) return { ok: true, status: "name_only" };
  if (!idEqual) return { ok: false, reason: "id_mismatch", printed: printed!, profile: known! };
  return { ok: true, status: "match" };
}

export function mismatchMessage(v: Extract<IdentityVerdict, { ok: false }>): string {
  return v.reason === "name_mismatch"
    ? `The name on it (${v.printed}) doesn't match your profile (${v.profile}). Nothing was saved.`
    : `The ID on it (${v.printed}) doesn't match your profile (${v.profile}). Nothing was saved.`;
}
