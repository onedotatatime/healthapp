/** The real exam calls: Cron's functions (MIN-4475) and RLS reads. Every shape is parsed against `contract.ts`. */
import { z } from 'zod';
import { ApiError } from '../../api/call';
import { callFunction, supabase } from '../../api/client';
import {
  ConfirmDocResponse,
  DOCUMENT_COLUMNS,
  DocCreateResponse,
  DocPhotoResponse,
  DocumentRow,
  FINDING_COLUMNS,
  FindingRow,
  RESULT_COLUMNS,
  ResultRow,
} from '../../api/contract';
import type { ExamsApi } from './logic';
import { AnyBody, ExamDeleteResponse, ExamDraftResponse, ExtractAccepted, FN, MyExamsResponse, UnconfirmResponse } from './scanApi';

function need() {
  if (!supabase || !callFunction) throw new ApiError(0, 'Not configured.');
  return { supabase, callFunction };
}

async function token(): Promise<string> {
  const { supabase: sb } = need();
  const { data } = await sb.auth.getSession();
  if (!data.session) throw new ApiError(401, 'Not signed in.', 'unauthenticated');
  return data.session.access_token;
}

async function read<T>(q: PromiseLike<{ data: unknown; error: { message: string; code?: string } | null }>, schema: z.ZodType<T>): Promise<T> {
  const { data, error } = await q;
  if (error) throw new ApiError(error.code === 'PGRST301' ? 401 : 500, error.message);
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new ApiError(200, 'Unexpected rows from the database.');
  return parsed.data;
}

export const realApi: ExamsApi = {
  async createDoc(sizeBytes) {
    const { callFunction: call } = need();
    return call('doc-create', { content_type: 'image/jpeg', size_bytes: sizeBytes }, DocCreateResponse, { accessToken: await token() });
  },
  async upload(doc, blob) {
    const { supabase: sb } = need();
    const { error } = await sb.storage.from(doc.bucket).uploadToSignedUrl(doc.path, doc.token, blob, { contentType: 'image/jpeg' });
    if (error) throw new ApiError(0, 'The upload did not finish.');
  },
  async kick(docId) {
    try {
      const { callFunction: call } = need();
      // keepalive: once the request has left the phone, closing the tab changes nothing. The answer is ignored.
      await call(FN.kick, { doc_id: docId }, ExtractAccepted, { accessToken: await token(), keepalive: true });
    } catch {
      /* the row stays waiting; the list offers Try again once the server's sweep marks it */
    }
  },
  async listExams() {
    const { callFunction: call } = need();
    return (await call(FN.list, {}, MyExamsResponse, { accessToken: await token() })).exams;
  },
  async getDraft(docId) {
    const { callFunction: call } = need();
    return (await call(FN.list, { doc_id: docId }, ExamDraftResponse, { accessToken: await token() })).draft;
  },
  async openExam(docId) {
    try {
      const { callFunction: call } = need();
      await call(FN.list, { doc_id: docId }, AnyBody, { accessToken: await token() });
    } catch {
      /* the mark stays until the next open */
    }
  },
  async deleteExam(docId) {
    const { callFunction: call } = need();
    await call(FN.del, { doc_id: docId }, ExamDeleteResponse, { accessToken: await token() });
  },
  async unconfirm(docId) {
    const { callFunction: call } = need();
    await call(FN.unconfirm, { doc_id: docId }, UnconfirmResponse, { accessToken: await token() });
  },
  async confirm(req) {
    const { callFunction: call } = need();
    return call('confirm-doc', req, ConfirmDocResponse, { accessToken: await token() });
  },
  async listRecords() {
    const { supabase: sb } = need();
    const docs = await read(
      sb.from('documents').select(DOCUMENT_COLUMNS).eq('status', 'confirmed').order('exam_date', { ascending: false, nullsFirst: false }),
      z.array(DocumentRow),
    );
    const flags = await read(sb.from('results').select('document_id,flag'), z.array(z.object({ document_id: z.string(), flag: z.string() })));
    return docs.map((document) => ({
      document,
      outOfRange: flags.filter((f) => f.document_id === document.id && (f.flag === 'high' || f.flag === 'low')).length,
    }));
  },
  async getRecord(id) {
    const { supabase: sb } = need();
    const document = await read(sb.from('documents').select(DOCUMENT_COLUMNS).eq('id', id).single(), DocumentRow);
    const results = await read(sb.from('results').select(RESULT_COLUMNS).eq('document_id', id), z.array(ResultRow));
    const findings = await read(sb.from('findings').select(FINDING_COLUMNS).eq('document_id', id), z.array(FindingRow));
    return { document, results, findings };
  },
  async photoUrl(docId) {
    const { callFunction: call } = need();
    const r = await call('doc-photo', { doc_id: docId }, DocPhotoResponse, { accessToken: await token() });
    return r.signed_url;
  },
};
