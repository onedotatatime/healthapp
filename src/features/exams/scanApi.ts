/**
 * MIN-4557: the call names the scan screens use. The shapes are Cron's, final (MIN-4556, contract 2026-11-14.5),
 * copied verbatim into `src/api/contract.ts` and guarded by `contract.drift.test.ts`. Nothing here is a guess any more.
 *   extract-exam {doc_id}   -> 202 {outcome:"queued"}            (ExtractAccepted)
 *   my-exams {}             -> {exams, server_now}               (MyExamsResponse)
 *   my-exams {doc_id}       -> {draft}, draft or confirmed; a confirmed one is opened read-only and clears `unchecked`
 *   exam-delete {doc_id}    -> {deleted, doc_id}
 *   unconfirm-doc {doc_id}  -> {document}                        (UnconfirmDocResponse), confirmed -> draft
 */
import { z } from 'zod';
export {
  ExamDeleteResponse,
  ExamDraftResponse,
  ExamListItem,
  ExtractAccepted,
  MyExamsResponse,
  UnconfirmDocResponse as UnconfirmResponse,
} from '../../api/contract';
/** The body of `my-exams {doc_id}` on a confirmed row is the same draft shape; only the side effect is wanted there. */
export const AnyBody = z.unknown();

/** Function names, as called through `callFunction` (the prefix is added there). */
export const FN = {
  kick: 'extract-exam',
  list: 'my-exams',
  del: 'exam-delete',
  unconfirm: 'unconfirm-doc',
} as const;
