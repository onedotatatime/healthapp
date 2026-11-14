// Photo to structured data, the part that is code and not model (MIN-4475; PRD 10.4 steps 3 to 5).
// The model copies what is printed, as text. Everything that decides something is here: parsing
// comma decimals and dd/mm dates, the out-of-range flag (from the printed range, never the model),
// the analyte key, and the "never half-read" refusals. No I/O in this file.
import { z } from "npm:zod@4.6.7";
import type { RefusalReason } from "./contract.ts";

// ---------------------------------------------------------------------------------------------
// What the model returns. All text, empty string when absent: the server converts to null.
// ---------------------------------------------------------------------------------------------
const Conf = z.number().min(0).max(1);
export const ModelExtract = z.object({
  readable: z.boolean(),
  document_kind: z.enum(["blood_test", "imaging_report", "doctor_letter", "other"]),
  language: z.enum(["el", "en", "other"]),
  issuer: z.string(),
  exam_date: z.string(),
  printed_name: z.string(),
  printed_id: z.string(),
  header_confidence: z.object({ exam_date: Conf, issuer: Conf, printed_name: Conf, printed_id: Conf }),
  results: z.array(z.object({
    analyte: z.string(),
    value: z.string(),
    unit: z.string(),
    ref_text: z.string(),
    confidence: Conf,
  })),
  findings: z.array(z.object({
    kind: z.enum(["conclusion", "written_diagnosis", "medication", "note"]),
    text: z.string(),
    date: z.string(),
    specialty: z.string(),
    confidence: Conf,
  })),
});
export type ModelExtract = z.infer<typeof ModelExtract>;

export const EXTRACT_SYSTEM = `You read one photographed medical document and copy what is printed into the schema.
Rules:
- Copy text exactly as printed. Greek stays Greek. Keep decimal commas and the reference range exactly as printed ("0 - 5", "<14", "12,0 - 16,0"). Copy dates exactly as printed.
- readable: false when the page is blurred, cut off, too dark or its text is not clearly legible. Do not guess. Then return empty strings, a kind of "other" and empty lists.
- document_kind: blood_test (a table of laboratory results), imaging_report (X-ray, ultrasound, MRI, CT report), doctor_letter (a letter or note written by a physician), other (anything else, including anything not medical).
- issuer: the laboratory, clinic or doctor in the letterhead.
- printed_name and printed_id: the patient's name and ID number as printed in the patient block. Never infer them. If the page prints none, use an empty string.
- results: one entry per row of a results table, in the document's order. value is the number or text in the result column only, without units, arrows or asterisks. unit and ref_text as printed (empty string if none). Imaging reports and letters have no results: an empty list.
- findings: for imaging reports and doctor letters, each statement the document itself makes, one entry per paragraph or labelled section (every sentence of a Conclusion paragraph is one conclusion entry, not one entry per sentence), in the document's own words and language: conclusion (the report's conclusion or impression), written_diagnosis (a diagnosis written by the doctor), medication (medicines named), note (any other clinical statement). date is the date printed with it, or the document's date. specialty is the writing doctor's specialty if printed, else an empty string. A blood test has none unless the lab wrote a comment.
- Do not make a finding out of a heading, a referral line, a label or the patient block; findings are the clinical statements only.
- Never add an opinion, a cause, advice, a diagnosis of your own, or a word such as "abnormal".
- confidence is 0 to 1 for each field: how sure you are that you copied it correctly.`;

// ---------------------------------------------------------------------------------------------
// IDs: a Greek document may print the letters of an ID in Greek capitals that look exactly like Latin
// ones (measured on the synthetic set: the model returned "ΑΚ123456" for a page printing "AK123456").
// The match key folds them, so the identity check (B1) compares what a person sees, not code points.
// ---------------------------------------------------------------------------------------------
const LOOKALIKE: Record<string, string> = {
  Α: "A", Β: "B", Ε: "E", Ζ: "Z", Η: "H", Ι: "I", Κ: "K", Μ: "M", Ν: "N", Ο: "O", Ρ: "P", Τ: "T", Υ: "Y", Χ: "X",
};
/** Uppercase, no accents, no spaces, dashes or dots, Greek lookalike capitals folded to Latin. */
export function normalizeId(raw: string): string {
  return raw.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase().replace(/[\s.\-]/g, "")
    .replace(/[ΑΒΕΖΗΙΚΜΝΟΡΤΥΧ]/g, (c) => LOOKALIKE[c]);
}

// ---------------------------------------------------------------------------------------------
// Numbers and ranges
// ---------------------------------------------------------------------------------------------
/** "5,2" -> 5.2; Greek "1.250" -> 1250; English "1,250" -> 1250. null for anything that is not one plain number. */
export function parseNumber(raw: string, lang: "el" | "en" | null): number | null {
  let s = raw.trim().replace(/\s+/g, "").replace(/^\+/, "");
  if (!/^-?[\d.,]+$/.test(s)) return null;
  const dots = (s.match(/\./g) ?? []).length, commas = (s.match(/,/g) ?? []).length;
  if (dots && commas) {
    // the later separator is the decimal one
    const decimal = s.lastIndexOf(",") > s.lastIndexOf(".") ? "," : ".";
    s = decimal === "," ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (commas) {
    s = commas === 1 && !(/^-?\d{1,3},\d{3}$/.test(s) && lang === "en") ? s.replace(",", ".") : s.replace(/,/g, "");
  } else if (dots) {
    // "1.250" is a thousand in Greek, one and a quarter in English; "5.2" is a decimal in both
    if (dots > 1 || (/^-?\d{1,3}\.\d{3}$/.test(s) && lang === "el")) s = s.replace(/\./g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export interface Range {
  low: number | null;
  high: number | null;
}
const NUM = String.raw`(\d+(?:[.,]\d+)?)`;
/** "0 - 5", "12,0 - 16,0", "<14", "> 40", "έως 5", "up to 5". null when the printed range is not one of these. */
export function parseRange(raw: string, lang: "el" | "en" | null): Range | null {
  const s = raw.trim().toLowerCase().replace(/[–—]/g, "-");
  if (!s) return null;
  const n = (t: string) => parseNumber(t, lang);
  let m = s.match(new RegExp(`^${NUM}\\s*(?:-|έως|to)\\s*${NUM}$`));
  if (m) {
    const lo = n(m[1]), hi = n(m[2]);
    return lo !== null && hi !== null && lo <= hi ? { low: lo, high: hi } : null;
  }
  m = s.match(new RegExp(`^(?:<|≤|<=|έως|up to|μέχρι)\\s*${NUM}$`));
  if (m) {
    const hi = n(m[1]);
    return hi === null ? null : { low: null, high: hi };
  }
  m = s.match(new RegExp(`^(?:>|≥|>=|από|above|over)\\s*${NUM}$`));
  if (m) {
    const lo = n(m[1]);
    return lo === null ? null : { low: lo, high: null };
  }
  return null;
}

export type FlagValue = "low" | "high" | "normal" | "unknown";
/** The flag is computed from the printed range. No number or no parsable range: unknown, never a guess. */
export function flagOf(value: number | null, low: number | null, high: number | null): FlagValue {
  if (value === null || (low === null && high === null)) return "unknown";
  if (low !== null && value < low) return "low";
  if (high !== null && value > high) return "high";
  return "normal";
}

// ---------------------------------------------------------------------------------------------
// Dates: dd/mm/yyyy (never mm/dd), dd.mm.yyyy, dd-mm-yyyy, yyyy-mm-dd, "22 October 2026", Greek month names
// ---------------------------------------------------------------------------------------------
const MONTHS: Record<string, number> = {
  january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3, april: 4, apr: 4, may: 5, june: 6, jun: 6, july: 7, jul: 7,
  august: 8, aug: 8, september: 9, sep: 9, sept: 9, october: 10, oct: 10, november: 11, nov: 11, december: 12, dec: 12,
  ιανουαριου: 1, φεβρουαριου: 2, μαρτιου: 3, απριλιου: 4, μαιου: 5, ιουνιου: 6, ιουλιου: 7, αυγουστου: 8,
  σεπτεμβριου: 9, οκτωβριου: 10, νοεμβριου: 11, δεκεμβριου: 12,
};
const stripAccents = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "");

function iso(y: number, m: number, d: number): string | null {
  if (y < 1950 || y > 2100 || m < 1 || m > 12 || d < 1) return null;
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  if (d > last) return null;
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function parseDate(raw: string): string | null {
  const s = stripAccents(raw.trim().toLowerCase());
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4}|\d{2})\b/);
  if (m) return iso(m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[2], +m[1]);
  m = s.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-zα-ω]+)\.?,?\s+(\d{4})\b/);
  if (m && MONTHS[m[2]]) return iso(+m[3], MONTHS[m[2]], +m[1]);
  m = s.match(/^([a-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/);
  if (m && MONTHS[m[1]]) return iso(+m[3], MONTHS[m[1]], +m[2]);
  return null;
}

// ---------------------------------------------------------------------------------------------
// analyte_key: a hand-made synonym map so one analyte forms a series over time (A3).
// ---------------------------------------------------------------------------------------------
const KEYS: [string, RegExp][] = [
  ["crp", /\bcrp\b|c-?reactive|αντιδρωσα/],
  ["esr", /\besr\b|sedimentation|τκε|καθιζησ/],
  ["anti_ccp", /anti-?\s?ccp|αντι-?\s?ccp|\bccp\b/],
  ["rf", /rheumatoid|ρευματοειδ|\brf\b/],
  ["hemoglobin", /h(a)?emoglobin|αιμοσφαιριν|\bhb\b|\bhgb\b/],
  ["wbc", /white blood|λευκα αιμοσφαιρ|\bwbc\b|leuk/],
  ["rbc", /red blood|ερυθρα αιμοσφαιρ|\brbc\b/],
  ["hematocrit", /h(a)?ematocrit|αιματοκριτ|\bhct\b/],
  ["platelets", /platelet|αιμοπεταλ|\bplt\b/],
  ["glucose", /glucose|γλυκοζ|\bglu\b/],
  ["cholesterol_total", /total cholesterol|ολικη χοληστερ|^cholesterol$|^χοληστερολη$/],
  ["hdl", /\bhdl\b/],
  ["ldl", /\bldl\b/],
  ["triglycerides", /triglycerid|τριγλυκεριδ/],
  ["creatinine", /creatinin|κρεατινιν/],
  ["urea", /\burea\b|ουρια/],
  ["alt", /\balt\b|sgpt|αλανιν/],
  ["ast", /\bast\b|sgot|ασπαρτ/],
  ["uric_acid", /uric acid|ουρικο οξυ/],
  ["ferritin", /ferritin|φερριτιν/],
  ["iron", /\biron\b|σιδηρος/],
  ["tsh", /\btsh\b/],
  ["vitamin_d", /vitamin d|βιταμινη d|25-?oh/],
  ["sodium", /sodium|νατριο/],
  ["potassium", /potassium|καλιο/],
];
export function analyteKey(printed: string): string | null {
  const s = stripAccents(printed.toLowerCase());
  for (const [key, re] of KEYS) if (re.test(s)) return key;
  return null;
}

// ---------------------------------------------------------------------------------------------
// Model output -> a draft, or a typed refusal (PRD 10.4 step 5: never half-read)
// ---------------------------------------------------------------------------------------------
export interface DraftResultIn {
  analyte: string;
  analyte_key: string | null;
  value_num: number | null;
  value_text: string | null;
  unit: string | null;
  ref_low: number | null;
  ref_high: number | null;
  ref_text: string | null;
  flag: FlagValue;
  confidence: number | null;
}
export interface DraftFindingIn {
  kind: "conclusion" | "written_diagnosis" | "medication" | "note";
  text_original: string;
  text_lang: "el" | "en" | null;
  finding_date: string | null;
  specialty: string | null;
  confidence: number | null;
}
export interface DraftIn {
  kind: "blood_test" | "imaging_report" | "doctor_letter";
  language: "el" | "en" | null;
  exam_date: string;
  issuer: string | null;
  printed_name: string;
  printed_id: string | null;
  header_confidence: { exam_date: number | null; issuer: number | null; printed_name: number | null; printed_id: number | null };
  results: DraftResultIn[];
  findings: DraftFindingIn[];
}
export type Built = { ok: true; draft: DraftIn } | { ok: false; reason: RefusalReason; message: string };

export const REFUSAL_MESSAGE: Record<string, string> = {
  unreadable: "We could not read this photo. Retake it flat, in good light, with the whole page in view.",
  unsupported_kind: "This does not look like a blood test, an imaging report or a doctor's letter. Nothing was saved.",
  name_missing: "No patient name is readable on this document, so it cannot be saved. Nothing was saved.",
  incomplete: "We could not find an exam date, or any result or finding, on this document. Nothing was saved.",
};

const blank = (s: string) => (s.trim() === "" ? null : s.trim());

export function build(m: ModelExtract): Built {
  const no = (reason: RefusalReason): Built => ({ ok: false, reason, message: REFUSAL_MESSAGE[reason] });
  if (!m.readable) return no("unreadable");
  if (m.document_kind === "other") return no("unsupported_kind");
  const name = blank(m.printed_name);
  if (!name) return no("name_missing");
  const lang = m.language === "other" ? null : m.language;
  const exam_date = parseDate(m.exam_date);
  if (!exam_date) return no("incomplete");

  const results: DraftResultIn[] = [];
  for (const r of m.results) {
    const analyte = r.analyte.trim();
    const printed = r.value.trim();
    if (!analyte || !printed) continue;
    const value_num = parseNumber(printed, lang);
    const range = parseRange(r.ref_text, lang);
    results.push({
      analyte,
      analyte_key: analyteKey(analyte),
      value_num,
      value_text: value_num === null ? printed : null,
      unit: blank(r.unit),
      ref_low: range?.low ?? null,
      ref_high: range?.high ?? null,
      ref_text: blank(r.ref_text),
      flag: flagOf(value_num, range?.low ?? null, range?.high ?? null),
      confidence: r.confidence,
    });
  }
  const findings: DraftFindingIn[] = [];
  for (const f of m.findings) {
    const text = f.text.trim();
    if (!text) continue;
    findings.push({
      kind: f.kind,
      text_original: text,
      text_lang: lang,
      finding_date: parseDate(f.date) ?? exam_date,
      specialty: blank(f.specialty),
      confidence: f.confidence,
    });
  }
  if (results.length === 0 && findings.length === 0) return no("incomplete");

  return {
    ok: true,
    draft: {
      kind: m.document_kind,
      language: lang,
      exam_date,
      issuer: blank(m.issuer),
      printed_name: name,
      printed_id: blank(m.printed_id),
      header_confidence: {
        exam_date: m.header_confidence.exam_date,
        issuer: m.header_confidence.issuer,
        printed_name: m.header_confidence.printed_name,
        printed_id: blank(m.printed_id) ? m.header_confidence.printed_id : null,
      },
      results,
      findings,
    },
  };
}
