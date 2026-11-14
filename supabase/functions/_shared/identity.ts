// Name and ID match (MIN-4478; PRD 10.14 B1). Pure, no I/O. It runs on the server on the model's output
// and the profile row; nothing a client sends reaches it.
//
// The rule: the name must match; the ID must match exactly when one is printed. A name with no ID is
// accepted as "name_only". No readable name is refused earlier (extract.ts `build`, reason name_missing).
//
// Lean on purpose: ELOT-style Greek to Latin, accents and case folded, name parts compared as a set
// (order and a missing father's name do not matter; an initial does not count). No fuzzy matching: a
// misspelt name is refused, which is the safe direction for a record that doctors will read.
import { normalizeId } from "./extract.ts";

const GREEK: Record<string, string> = {
  Α: "A", Β: "V", Γ: "G", Δ: "D", Ε: "E", Ζ: "Z", Η: "I", Θ: "TH", Ι: "I", Κ: "K", Λ: "L", Μ: "M", Ν: "N",
  Ξ: "X", Ο: "O", Π: "P", Ρ: "R", Σ: "S", Τ: "T", Υ: "Y", Φ: "F", Χ: "CH", Ψ: "PS", Ω: "O",
};

/** Upper case, no accents, Greek letters to Latin (ΟΥ is OU), Latin spelling variants folded (Y to I, V to B). */
function fold(raw: string): string {
  return raw
    .normalize("NFD").replace(/\p{M}/gu, "").toUpperCase()
    .replace(/ΟΥ/g, "OU")
    .replace(/[Α-Ω]/gu, (c) => GREEK[c] ?? c)
    .replace(/Y/g, "I").replace(/V/g, "B");
}

/** The name parts that count: letters only, at least two long (a lone initial proves nothing). */
export function nameTokens(raw: string): string[] {
  return fold(raw).split(/[^A-Z]+/).filter((t) => t.length >= 2);
}

/** One name matches another when every part of the shorter one is in the longer one (two parts at least). */
export function sameName(printed: string, known: string): boolean {
  const a = new Set(nameTokens(printed)), b = new Set(nameTokens(known));
  if (a.size < 2 || b.size < 2) return false;
  const [small, big] = a.size <= b.size ? [a, b] : [b, a];
  for (const t of small) if (!big.has(t)) return false;
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
  const nameOk = sameName(printedName, profile.full_name) ||
    (profile.full_name_latin !== null && sameName(printedName, profile.full_name_latin));
  if (!nameOk) return { ok: false, reason: "name_mismatch", printed: printedName, profile: profile.full_name };
  const printed = printedId?.trim() ? printedId.trim() : null;
  if (!printed || !profile.national_id_norm) return { ok: true, status: "name_only" };
  if (normalizeId(printed) !== normalizeId(profile.national_id_norm)) {
    return { ok: false, reason: "id_mismatch", printed, profile: profile.national_id_norm };
  }
  return { ok: true, status: "match" };
}

export function mismatchMessage(v: Extract<IdentityVerdict, { ok: false }>): string {
  return v.reason === "name_mismatch"
    ? `The name on it (${v.printed}) doesn't match your profile (${v.profile}). Nothing was saved.`
    : `The ID on it (${v.printed}) doesn't match your profile (${v.profile}). Nothing was saved.`;
}
