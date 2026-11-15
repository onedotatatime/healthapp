/** The real E1 + E2 calls. Every answer is parsed against contract.ts (a shape that does not match is an error, not a guess). */
import { z } from 'zod';
import { ApiError } from '../../api/call';
import { authedCall } from '../../api/authed';
import { callFunction, supabase } from '../../api/client';
import type { AssistantApi } from './api';
import { FILE_ANALYSIS_COLUMNS, FileAnalysisRow, OverTimeResponse } from './analysis.contract';
import { AssistantResponse, DIARY_COLUMNS, DOCUMENT_COLUMNS, DiaryRow, DocPhotoResponse, DocumentRow, FINDING_COLUMNS, FindingRow, RESULT_COLUMNS, ResultRow } from './contract';

function need() {
  if (!supabase || !callFunction) throw new ApiError(0, 'Not configured.');
  return { supabase, callFunction };
}

/** One RLS read: rows of `table` for this patient. RLS decides what the doctor may see; an error is an ApiError. */
async function rows<T>(table: string, columns: string, patientId: string, schema: z.ZodType<T>): Promise<T[]> {
  const { data, error, status } = await need().supabase.from(table).select(columns).eq('patient_id', patientId);
  if (error) throw new ApiError(status || 0, error.message, status === 403 ? 'grant_expired' : undefined);
  const parsed = z.array(schema).safeParse(data ?? []);
  if (!parsed.success) throw new ApiError(status, `Unexpected rows from ${table}.`);
  return parsed.data;
}

export const realAssistantApi: AssistantApi = {
  async loadRecord(patientId) {
    const [documents, results, findings, diary] = await Promise.all([
      authedCall(() => rows('documents', DOCUMENT_COLUMNS, patientId, DocumentRow)),
      authedCall(() => rows('results', RESULT_COLUMNS, patientId, ResultRow)),
      authedCall(() => rows('findings', FINDING_COLUMNS, patientId, FindingRow)),
      authedCall(() => rows('diary_entries', DIARY_COLUMNS, patientId, DiaryRow)),
    ]);
    return { documents: documents.filter((d) => d.status === 'confirmed'), results, findings, diary };
  },
  async ask(grantId, question) {
    return authedCall((accessToken) => need().callFunction('assistant', { grant_id: grantId, mode: 'ask', question }, AssistantResponse, { accessToken }));
  },
  async photo(docId, grantId) {
    return authedCall((accessToken) => need().callFunction('doc-photo', { doc_id: docId, grant_id: grantId }, DocPhotoResponse, { accessToken }));
  },
  async fileAnalysis(docId) {
    // The throw is inside the callback: supabase.from() returns errors, and authedCall retries only what the callback throws.
    // A 401 is a dead token (refreshed and retried by authedCall), never "grant ended": that is a 403.
    const { data, status } = await authedCall(async () => {
      const r = await need().supabase.from('file_analysis').select(FILE_ANALYSIS_COLUMNS).eq('document_id', docId).maybeSingle();
      if (r.error) throw new ApiError(r.status || 0, r.error.message, r.status === 403 ? 'grant_expired' : undefined);
      return r;
    });
    if (!data) return null; // no row: not analysed yet (or the grant ended: the record read reports that)
    const parsed = FileAnalysisRow.safeParse(data);
    if (!parsed.success) throw new ApiError(status, 'Unexpected row from file_analysis.');
    return parsed.data;
  },
  async overTime(grantId) {
    return authedCall((accessToken) => need().callFunction('over-time', { grant_id: grantId }, OverTimeResponse, { accessToken }));
  },
};
