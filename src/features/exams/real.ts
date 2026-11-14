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
  ExtractResponse,
  FINDING_COLUMNS,
  FindingRow,
  RESULT_COLUMNS,
  ResultRow,
} from '../../api/contract';
import type { ExamsApi } from './logic';

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
  async extract(docId, signal) {
    const { callFunction: call } = need();
    return call('extract-exam', { doc_id: docId }, ExtractResponse, { accessToken: await token(), signal });
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
