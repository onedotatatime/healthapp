/**
 * MIN-4557 (CTO addendum of MIN-4555): `documents.unchecked`, set when a reading was saved automatically and cleared when
 * the patient opens the exam. GUESS FILE for the doctor side: Cron's contract.ts (MIN-4556) does not carry the field yet,
 * and the zod copy strips an unknown key, so until it does the read is always false and the mark never shows on real data.
 * The swap, when `DocumentRow` has `unchecked: z.boolean()` and `DOCUMENT_COLUMNS` lists it: `d.unchecked`.
 */
export const isUnchecked = (d: object): boolean => (d as { unchecked?: unknown }).unchecked === true;

/** The fact the mark states, in words (not a verdict, not about health). */
export const UNCHECKED_LINE = 'Read automatically. The patient has not opened this exam yet.';
