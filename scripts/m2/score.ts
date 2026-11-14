// M2 scoring (MIN-4475): fields correct / fields, per document, against tests/synthetic/ground-truth.json.
// Pure, no I/O. A "field" is one thing a patient would otherwise have to check:
//   header: kind, exam_date, issuer, printed_name, printed_id (5)
//   per result: analyte, value, unit, range+flag (4);  per finding: kind, text, date (3)
// A result the document has and the draft lacks counts all its fields wrong; an extra draft row counts 1 wrong.
import { normalizeId } from "../../supabase/functions/_shared/extract.ts";

export interface GtResult { analyte: string; value_num: number; unit: string; ref_low: number | null; ref_high: number | null; flag: string }
export interface GtFinding { kind: string; text: string; date: string }
export interface Gt {
  n: number; file: string; kind: string; exam_date: string; issuer: string; printed_name: string | null; printed_id: string | null;
  results: GtResult[]; findings: GtFinding[]; expected: { outcome: "draft" | "refused"; reason?: string };
}
export interface DraftOut {
  document: { kind: string; exam_date: string | null; issuer: string | null };
  printed_name: string | null; printed_id: string | null;
  results: { analyte: string; value_num: number | null; unit: string | null; ref_low: number | null; ref_high: number | null; flag: string }[];
  findings: { kind: string; text_original: string; finding_date: string | null }[];
}
export interface Score { correct: number; total: number; nameOk: boolean; idOk: boolean; idExact: boolean; dateOk: boolean; wrong: string[] }

const strip = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const words = (s: string) => strip(s).replace(/[^\p{L}\p{N}]+/gu, " ").trim();
export const sameName = (a: string | null, b: string | null) => {
  if (!a || !b) return !a && !b;
  const t = (s: string) => words(s).split(" ").sort().join(" ");
  return t(a) === t(b);
};
export const sameId = (a: string | null, b: string | null) => normalizeId(a ?? "") === normalizeId(b ?? "");
/** Byte-for-byte after trimming spaces: what a naive comparison would see. */
export const exactId = (a: string | null, b: string | null) => (a ?? "").replace(/[\s-]/g, "").toUpperCase() === (b ?? "").replace(/[\s-]/g, "").toUpperCase();
const unit = (s: string | null) => strip(s ?? "").replace(/[µμ]/g, "u").replace(/\s+/g, "");
export function dice(a: string, b: string): number {
  const x = words(a), y = words(b);
  if (x === y) return 1;
  const bg = (s: string) => { const m = new Map<string, number>(); for (let i = 0; i < s.length - 1; i++) m.set(s.slice(i, i + 2), (m.get(s.slice(i, i + 2)) ?? 0) + 1); return m; };
  const A = bg(x), B = bg(y);
  let hit = 0;
  for (const [k, v] of A) hit += Math.min(v, B.get(k) ?? 0);
  return (2 * hit) / Math.max(1, x.length - 1 + y.length - 1);
}

export function score(gt: Gt, d: DraftOut): Score {
  let correct = 0, total = 0;
  const wrong: string[] = [];
  const check = (ok: boolean, what: string) => { total++; if (ok) correct++; else wrong.push(what); return ok; };

  check(d.document.kind === gt.kind, "kind");
  const dateOk = check(d.document.exam_date === gt.exam_date, "exam_date");
  const iss = strip(d.document.issuer ?? ""), want = strip(gt.issuer);
  check(iss !== "" && (iss.includes(want) || want.includes(iss) || dice(iss, want) >= 0.85), "issuer");
  const nameOk = check(sameName(d.printed_name, gt.printed_name), "printed_name");
  const idOk = check(sameId(d.printed_id, gt.printed_id), "printed_id");

  const used = new Set<number>();
  for (const g of gt.results) {
    const i = d.results.findIndex((r, k) => !used.has(k) && strip(r.analyte) === strip(g.analyte));
    if (i < 0) { for (const f of ["analyte", "value", "unit", "range"]) check(false, `${g.analyte}: ${f} (missing)`); continue; }
    used.add(i);
    const r = d.results[i];
    check(true, "analyte");
    check(r.value_num === g.value_num, `${g.analyte}: value ${r.value_num} != ${g.value_num}`);
    check(unit(r.unit) === unit(g.unit), `${g.analyte}: unit ${r.unit}`);
    check(r.ref_low === g.ref_low && r.ref_high === g.ref_high && r.flag === g.flag, `${g.analyte}: range/flag ${r.ref_low}-${r.ref_high} ${r.flag}`);
  }
  d.results.forEach((r, k) => { if (!used.has(k)) check(false, `extra result ${r.analyte}`); });

  const usedF = new Set<number>();
  for (const g of gt.findings) {
    // matched by the closest text (at least half alike); the text field is right only at 90% alike
    let i = -1, best = 0.5;
    d.findings.forEach((f, k) => { const v = dice(f.text_original, g.text); if (!usedF.has(k) && v >= best) { best = v; i = k; } });
    if (i < 0) { for (const f of ["kind", "text", "date"]) check(false, `finding ${g.kind}: ${f} (missing)`); continue; }
    usedF.add(i);
    check(d.findings[i].kind === g.kind, `finding ${g.kind}: kind ${d.findings[i].kind}`);
    check(best >= 0.9, `finding ${g.kind}: text only ${Math.round(best * 100)}% alike`);
    check(d.findings[i].finding_date === g.date, `finding ${g.kind}: date ${d.findings[i].finding_date}`);
  }
  d.findings.forEach((f, k) => { if (!usedF.has(k)) check(false, `extra finding ${f.kind}`); });
  return { correct, total, nameOk, idOk, idExact: exactId(d.printed_id, gt.printed_id), dateOk, wrong };
}
