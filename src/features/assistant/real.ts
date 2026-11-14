/** The real E1 + E2 calls. Every answer is parsed against contract.ts (a shape that does not match is an error, not a guess). */
import { z } from 'zod';
import { ApiError } from '../../api/call';
import { callFunction, supabase } from '../../api/client';
import type { AssistantApi } from './api';
import { FILE_ANALYSIS_COLUMNS, FileAnalysisRow, OverTimeResponse } from './analysis.contract';
import { AssistantResponse, DIARY_COLUMNS, DOCUMENT_COLUMNS, DiaryRow, DocPhotoResponse, DocumentRow, FINDING_COLUMNS, FindingRow, RESULT_COLUMNS, ResultRow } from './contract';

function need() {
  if (!supabase || !callFunction) throw new ApiError(0, 'Not configured.');
  return { supabase, callFunction };
}

async function token(): Promise<string> {
  const { data } = await need().supabase.auth.getSession();
  if (!data.session) throw new ApiError(401, 'Not signed in.', 'unauthenticated');
  return data.session.access_token;
}

/** One RLS read: rows of `table` for this patient. RLS decides what the doctor may see; an error is an ApiError. */
async function rows<T>(table: string, columns: string, patientId: string, schema: z.ZodType<T>): Promise<T[]> {
  const { data, error, status } = await need().supabase.from(table).select(columns).eq('patient_id', patientId);
  if (error) throw new ApiError(status || 0, error.message, status === 401 || status === 403 ? 'grant_expired' : undefined);
  const parsed = z.array(schema).safeParse(data ?? []);
  if (!parsed.success) throw new ApiError(status, `Unexpected rows from ${table}.`);
  return parsed.data;
}

export const realAssistantApi: AssistantApi = {
  async loadRecord(patientId) {
    const [documents, results, findings, diary] = await Promise.all([
      rows('documents', DOCUMENT_COLUMNS, patientId, DocumentRow),
      rows('results', RESULT_COLUMNS, patientId, ResultRow),
      rows('findings', FINDING_COLUMNS, patientId, FindingRow),
      rows('diary_entries', DIARY_COLUMNS, patientId, DiaryRow),
    ]);
    return { documents: documents.filter((d) => d.status === 'confirmed'), results, findings, diary };
  },
  async ask(grantId, question) {
    return need().callFunction('assistant', { grant_id: grantId, mode: 'ask', question }, AssistantResponse, { accessToken: await token() });
  },
  async photo(docId, grantId) {
    return need().callFunction('doc-photo', { doc_id: docId, grant_id: grantId }, DocPhotoResponse, { accessToken: await token() });
  },
  async fileAnalysis(docId) {
    const { data, error, status } = await need().supabase.from('file_analysis').select(FILE_ANALYSIS_COLUMNS).eq('document_id', docId).maybeSingle();
    if (error) throw new ApiError(status || 0, error.message, status === 401 || status === 403 ? 'grant_expired' : undefined);
    if (!data) return null; // no row: not analysed yet (or the grant ended: the record read reports that)
    const parsed = FileAnalysisRow.safeParse(data);
    if (!parsed.success) throw new ApiError(status, 'Unexpected row from file_analysis.');
    return parsed.data;
  },
  async overTime(grantId) {
    return need().callFunction('over-time', { grant_id: grantId }, OverTimeResponse, { accessToken: await token() });
  },
};
