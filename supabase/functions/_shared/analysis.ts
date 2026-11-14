// The file analysis (MIN-4549, direction 3; CTO decision on MIN-4548 §4): a second pass over the stored original
// file, after the extraction, inside healthapp-extract-exam and under the uploader's own session. Two kinds of
// facts: the ones the server computes with no model (hash, type, size, upload time, hash verified after the run)
// and the ones the model reads off the page (document type, pages, legibility, quality flags, issuer, date,
// stamp or signature present, and the items printed on the file that the extracted record does not hold).
// The model's answer has ONE free string, items[].text_original: the document's own words. Everything else is an
// enum, a boolean or an integer, and a unit test fails if the schema gains another string field.
// Nothing here logs a word of the file: callers log codes and counts.
import { z } from "npm:zod@4.6.7";
import { bytesToBase64 } from "./b64.ts";
import {
  bucketFor,
  FILE_ITEM_CHARS,
  FILE_ITEMS_MAX,
  type FileAnalysisError,
  type FileAnalysisRow,
  FileDocType,
  type HealthappEnv,
} from "./contract.ts";
import type { Blobs, DocState, Store } from "./docs.ts";
import { type JsonCall, type JsonResult, ModelError } from "./model.ts";

// ---------------------------------------------------------------------------------------------
// What the model returns.
// ---------------------------------------------------------------------------------------------
export const ModelAnalysis = z.object({
  readable: z.boolean(),
  doc_type: FileDocType,
  pages: z.number().int().min(1).max(50),
  blurred: z.boolean(),
  cropped: z.boolean(),
  rotated: z.boolean(),
  handwriting_present: z.boolean(),
  issuer_present: z.boolean(),
  date_present: z.boolean(),
  stamp_or_signature_present: z.boolean(),
  items: z.array(z.object({ text_original: z.string(), page: z.number().int().min(1).max(50) })),
});
export type ModelAnalysis = z.infer<typeof ModelAnalysis>;

export const ANALYSIS_SYSTEM = `You look at one photographed medical document and describe the FILE, not the health of the patient.
Rules:
- Answer only with the schema. Every field is a fact about the page: what kind of document it is, how many pages the file shows, whether it can be read, whether it is blurred, cropped (text cut at an edge) or rotated, whether handwriting is present, whether the page prints an issuer (laboratory, clinic or doctor), a date, and a stamp or a signature.
- doc_type: blood_test (a table of laboratory results), imaging_report, doctor_letter, or other.
- readable: false when the text is not clearly legible. Then items is an empty list.
- items: the result rows and the clinical statements (conclusion, written diagnosis, medicines, notes) that are printed on the page and are NOT in the extracted record given below. Copy each one exactly as printed, in its own language, one table row or one statement per item, 200 characters at most, with the page it is on (1 for a single photo). Do not list the letterhead, the patient block, the date, page numbers, footers or boilerplate. If everything printed is in the record, items is an empty list.
- Never add an opinion, a cause, advice, a diagnosis of your own, a judgement of any value or a word such as "abnormal" or "normal".`;

// ---------------------------------------------------------------------------------------------
// Items "absent from the record": the model proposes, the server checks. An item is kept only when at least
// one of its words or numbers is missing from the record text. (One printed row the record already holds
// has all its tokens in the record and is dropped, so the list is not the model's guess at what matters.)
// ---------------------------------------------------------------------------------------------
export function tokens(s: string): string[] {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

/** All the words and numbers the record holds for this document. */
export function recordTokens(state: DocState): Set<string> {
  const parts: (string | number | null)[] = [
    state.document.issuer, state.document.exam_date, state.meta.printed_name, state.meta.printed_id,
  ];
  for (const r of state.results) parts.push(r.analyte, r.value_text, r.value_num, r.unit, r.ref_text);
  for (const f of state.findings) parts.push(f.text_original, f.finding_date, f.specialty);
  return new Set(parts.flatMap((p) => (p === null ? [] : tokens(String(p)))));
}

/** The record as the model sees it: plain lines, no ids. */
export function recordText(state: DocState): string {
  const lines: string[] = [];
  const d = state.document;
  lines.push(`Issuer: ${d.issuer ?? ""}`, `Date: ${d.exam_date ?? ""}`, `Kind: ${d.kind ?? ""}`);
  for (const r of state.results) {
    lines.push(`Result: ${r.analyte} | ${r.value_text ?? r.value_num ?? ""} | ${r.unit ?? ""} | ${r.ref_text ?? ""}`);
  }
  for (const f of state.findings) lines.push(`Finding (${f.kind}): ${f.text_original}`);
  return lines.join("\n");
}

export function itemsNotInRecord(
  items: { text_original: string; page: number }[],
  have: Set<string>,
): { text_original: string; page: number }[] {
  const out: { text_original: string; page: number }[] = [];
  const seen = new Set<string>();
  for (const it of items) {
    const text = it.text_original.trim().replace(/\s+/g, " ").slice(0, FILE_ITEM_CHARS);
    const t = tokens(text);
    if (t.length === 0 || t.every((w) => have.has(w))) continue; // empty, or the record already holds all of it
    const key = t.join(" ") + "|" + it.page;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ text_original: text, page: it.page });
    if (out.length === FILE_ITEMS_MAX) break;
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// The server's own facts.
// ---------------------------------------------------------------------------------------------
export async function sha256Hex(b: Uint8Array): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", b.slice());
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

/** Under this much budget left a model call cannot finish: the row says so instead of guessing. */
export const MIN_MODEL_MS = 6_000;

export interface AnalysisDeps {
  blobs: Pick<Blobs, "download">;
  store: Pick<Store, "objectMeta" | "saveAnalysis">;
  generate<T>(call: JsonCall<T>): Promise<JsonResult<T>>;
  log(line: Record<string, unknown>): void;
  now(): number;
}

export type AnalysisFields = Omit<FileAnalysisRow, "document_id" | "patient_id" | "analysed_at">;

const EMPTY: AnalysisFields = {
  status: "failed", error_code: null, doc_type: null, pages: null, readable: null, blurred: null, cropped: null,
  rotated: null, handwriting_present: null, issuer_present: null, date_present: null,
  stamp_or_signature_present: null, sha256: null, mime: null, bytes: null, uploaded_at: null, hash_verified: null,
  items_count: 0, items: [],
};

export interface AnalyseOutcome {
  status: "done" | "failed";
  error_code: FileAnalysisError | null;
  items_count: number;
}

/**
 * One analysis, one row. Never throws for a model or storage problem: those become a failed row with a code.
 * `bytes` is the object when the caller has just downloaded it (extract-exam); otherwise it is fetched here.
 * `budgetMs` is what the model may use; under MIN_MODEL_MS the model is not called (failed, budget).
 */
export async function analyseFile(
  deps: AnalysisDeps,
  ctx: { env: HealthappEnv; patientId: string; state: DocState; bytes?: Uint8Array | null; budgetMs: number },
): Promise<AnalyseOutcome> {
  const started = deps.now();
  const { env, patientId, state } = ctx;
  const bucket = bucketFor(env);
  const path = state.meta.storage_path;
  const finish = async (f: AnalysisFields): Promise<AnalyseOutcome> => {
    await deps.store.saveAnalysis(env, patientId, state.document.id, f);
    deps.log({
      fn: "extract-exam", pass: "analysis", status: f.status, error: f.error_code, items: f.items_count,
      ms: deps.now() - started,
    });
    return { status: f.status, error_code: f.error_code, items_count: f.items_count };
  };
  const failed = (code: FileAnalysisError, facts: Partial<AnalysisFields> = {}): Promise<AnalyseOutcome> =>
    finish({ ...EMPTY, ...facts, status: "failed", error_code: code, items_count: 0, items: [] });

  if (!path) return await failed("no_object");
  const bytes = ctx.bytes && ctx.bytes.length > 0 ? ctx.bytes : await deps.blobs.download(bucket, path);
  if (!bytes || bytes.length === 0) return await failed("no_object");

  const meta = await deps.store.objectMeta(env, path);
  const sha = await sha256Hex(bytes);
  // Hashed again after the run (a second download): the object the model saw is the object that is stored.
  const verify = async (): Promise<boolean> => {
    const again = await deps.blobs.download(bucket, path);
    if (!again) return false;
    return (await sha256Hex(again)) === sha &&
      (meta?.size == null || meta.size === bytes.length) &&
      (state.meta.sha256_file === null || state.meta.sha256_file === sha);
  };
  const facts = (verified: boolean): Pick<AnalysisFields, "sha256" | "mime" | "bytes" | "uploaded_at" | "hash_verified"> => ({
    sha256: sha,
    mime: meta?.mime ?? state.meta.content_type ?? null,
    bytes: bytes.length,
    uploaded_at: meta?.created_at ?? state.document.created_at,
    hash_verified: verified,
  });
  const mime = meta?.mime ?? state.meta.content_type;
  if (!mime || !mime.startsWith("image/")) return await failed("unsupported_type", facts(await verify()));
  if (ctx.budgetMs < MIN_MODEL_MS) return await failed("budget", facts(await verify()));

  let answer: JsonResult<ModelAnalysis>;
  try {
    answer = await deps.generate({
      system: ANALYSIS_SYSTEM,
      parts: [
        { inline_data: { mime_type: mime, data: bytesToBase64(bytes) } },
        { text: `Extracted record (what is already stored for this file):\n${recordText(state)}\n\nDescribe the file.` },
      ],
      schema: ModelAnalysis,
      timeoutMs: ctx.budgetMs,
      maxAttempts: 2,
    });
  } catch (e) {
    const code: FileAnalysisError = !(e instanceof ModelError) ? "error" : e.kind === "config"
      ? "config"
      : e.kind === "timeout"
      ? "model_timeout"
      : e.kind === "http"
      ? "model_http"
      : "model_invalid";
    return await failed(code, facts(await verify()));
  }

  const a = answer.data;
  const items = a.readable ? itemsNotInRecord(a.items, recordTokens(state)) : [];
  return await finish({
    status: "done", error_code: null, doc_type: a.doc_type, pages: a.pages, readable: a.readable, blurred: a.blurred,
    cropped: a.cropped, rotated: a.rotated, handwriting_present: a.handwriting_present,
    issuer_present: a.issuer_present, date_present: a.date_present,
    stamp_or_signature_present: a.stamp_or_signature_present, ...facts(await verify()),
    items_count: items.length, items,
  });
}
