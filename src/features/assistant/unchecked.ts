/**
 * MIN-4557 (CTO addendum of MIN-4555): `documents.unchecked`, set when a reading was saved automatically and cleared when
 * the patient opens the exam. `DocumentRow.unchecked` and `DOCUMENT_COLUMNS` carry it (contract 2026-11-14.5).
 */
export const isUnchecked = (d: object): boolean => (d as { unchecked?: unknown }).unchecked === true;

/** The fact the mark states, in words (not a verdict, not about health). */
export const UNCHECKED_LINE = 'Read automatically. The patient has not opened this exam yet.';
