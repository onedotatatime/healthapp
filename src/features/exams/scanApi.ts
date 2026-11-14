/**
 * MIN-4557: the shapes and call names of the background-scan backend (MIN-4556, CTO decision MIN-4555 and its addendum).
 *
 * THE GUESS FILE. Everything the screens assume about Cron's new calls lives here, so the swap is one change:
 * Cron's PR adds `ExamListItem`, `MyExamsResponse`, `ExamDraftResponse`, `ExamDeleteResponse` and the widened
 * `DocumentStatus` to `src/api/contract.ts`. When it merges, replace the schemas below with imports from there.
 * What is NOT posted yet and therefore guessed (MIN-4557 comment of Cron, 2026-11-14):
 *   - `unchecked` on a list row (the addendum: "documents.unchecked", set by auto-confirm, cleared on open);
 *   - the unconfirm call: `unconfirm-doc {doc_id}` (the addendum leaves "a new action on the confirm function or a small function" open);
 *   - the answer of `my-exams {doc_id}` for a CONFIRMED row (draft rows answer `{ draft }`); only its side effect is used.
 * Posted and built to as is: the six statuses, `my-exams {}`, `my-exams {doc_id}` for a draft, `exam-delete {doc_id}`,
 * the kick `extract-exam {doc_id}` answering 202 `{outcome:"queued"}`.
 */
import { z } from 'zod';
import { DocumentDraft, DocumentKind, IsoDate, Timestamp, Uuid } from '../../api/contract';

export const ExamStatus = z.enum(['queued', 'reading', 'draft', 'refused', 'failed', 'confirmed']);
export type ExamStatus = z.infer<typeof ExamStatus>;

export const ExamListItem = z.object({
  id: Uuid,
  status: ExamStatus,
  /** refused: unreadable | unsupported_kind | incomplete | name_missing | name_mismatch | id_mismatch. failed: model_timeout | model_http | model_invalid | config | too_many_attempts | stuck | no_file | delete_failed | unsupported_type | error | not_read. Otherwise null. */
  reason: z.string().nullable(),
  uploaded_at: Timestamp,
  status_at: Timestamp,
  kind: DocumentKind.nullable(),
  exam_date: IsoDate.nullable(),
  values_read: z.number().int().min(0).nullable(),
  can_retry: z.boolean(),
  can_delete: z.boolean(),
  /** GUESS (addendum of MIN-4555): a confirmed exam read automatically that the owner has not opened. Absent = false. */
  unchecked: z.boolean().optional(),
});
export type ExamListItem = z.infer<typeof ExamListItem>;

export const MyExamsResponse = z.object({ exams: z.array(ExamListItem), server_now: Timestamp });
export const ExamDraftResponse = z.object({ draft: DocumentDraft });
export const ExamDeleteResponse = z.object({ deleted: z.literal(true), doc_id: Uuid });
export const ExtractAccepted = z.object({ outcome: z.literal('queued') });
/** GUESS: the unconfirm answer is not read, only its status code. */
export const UnconfirmResponse = z.object({}).passthrough();
/** GUESS: the answer of `my-exams {doc_id}` on a confirmed row is not read either. */
export const AnyBody = z.unknown();

/** Function names, as called through `callFunction` (the prefix is added there). */
export const FN = {
  kick: 'extract-exam',
  list: 'my-exams',
  del: 'exam-delete',
  unconfirm: 'unconfirm-doc', // GUESS
} as const;
