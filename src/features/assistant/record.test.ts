import { describe, expect, it } from 'vitest';
import type { Segment } from './contract';
import { ID, MOCK_RECORD, answerFor } from './mock';
import { buildIndex, buildOverview, factStatus, formatDate, rangeText } from './record';

const index = buildIndex(MOCK_RECORD);
const overview = buildOverview(MOCK_RECORD, index);

describe('E1 overview (a read, no model)', () => {
  it('lists only the values outside the printed range, newest first, with their dates', () => {
    expect(overview.outOfRange.map((i) => [i.date, i.text])).toEqual([
      ['30 Oct 2026', 'CRP 14.2 mg/L, above range (printed: below 5)'],
      ['30 Oct 2026', 'ESR 28 mm/h, above range (printed: 0 to 20)'],
    ]);
  });

  it('lists the conditions the documents write, in the document words, and not conclusions', () => {
    expect(overview.conditions.map((i) => i.text)).toEqual(['Mild osteoarthritis of the left knee.']);
  });

  it('puts the diary entries between the exams on one timeline (C1)', () => {
    expect(overview.timeline.map((r) => `${r.kind}:${r.date.split(',')[0]}`)).toEqual([
      'diary:10 Nov 2026',
      'diary:2 Nov 2026',
      'exam:30 Oct 2026',
      'diary:28 Oct 2026',
      'exam:2 Jun 2026',
      'exam:12 Mar 2026',
      'exam:20 Jan 2026',
    ]);
  });

  it('gives every item its marks and a source that opens the right document', () => {
    const crp = overview.outOfRange[0].source;
    expect(crp.marks).toEqual(['uploaded']);
    expect(crp.subject).toEqual({ kind: 'doc', docId: ID.docOct, focus: `r:${ID.crpOct}` });
    const mri = overview.timeline.find((r) => r.title === 'Imaging report')!;
    expect(mri.marks).toEqual(['uploaded', 'name-match']);
    expect(overview.timeline.find((r) => r.date.startsWith('12 Mar'))!.marks).toEqual(['verified']);
  });

  it('counts values and out-of-range values on an exam row', () => {
    expect(overview.timeline.find((r) => r.key === `doc-${ID.docOct}`)!.detail).toBe('Synthetic Diagnostic Lab, Athens. 3 values, 2 outside range');
  });
});

describe('cite resolution', () => {
  it('resolves full ids of each kind and nothing else', () => {
    expect(index.resolve(`r:${ID.crpOct}`)?.name).toBe('Blood test: CRP');
    expect(index.resolve(`f:${ID.fLetter}`)?.date).toBe('20 Jan 2026');
    expect(index.resolve(`d:${ID.d1}`)?.subject).toEqual({ kind: 'diary', id: ID.d1 });
    expect(index.resolve(`r:${ID.fLetter}`)).toBeNull(); // right uuid, wrong kind letter
    expect(index.resolve(ID.crpOct)).toBeNull(); // short or bare ids do not resolve
    expect(index.resolve('r:00000000-0000-4000-8000-0000000fffff')).toBeNull();
  });

  it('does not cite a result whose document the doctor cannot read', () => {
    const idx = buildIndex({ ...MOCK_RECORD, documents: MOCK_RECORD.documents.filter((d) => d.id !== ID.docOct) });
    expect(idx.resolve(`r:${ID.crpOct}`)).toBeNull();
    expect(idx.resolve(`r:${ID.crpMar}`)).not.toBeNull();
  });

  it('every cite in the canned answers resolves (the mock and the index agree)', () => {
    for (const q of ['crp', 'conditions', 'knee pain']) {
      const r = answerFor(q);
      for (const s of r.segments) for (const c of s.cites) expect(index.resolve(c), `${q}: ${c}`).not.toBeNull();
    }
  });
});

describe('factStatus (PRD 12.5 client guard)', () => {
  const seg = (cites: string[], verified = true): Pick<Segment, 'cites' | 'verified'> => ({ cites, verified });
  it('is ok only with cites that all resolve and a verified flag', () => {
    expect(factStatus(seg([`r:${ID.crpOct}`]), index)).toBe('ok');
    expect(factStatus(seg([`r:${ID.crpOct}`], false), index)).toBe('unverified');
  });
  it('refuses a fact with no cite, or with one cite that does not resolve', () => {
    expect(factStatus(seg([]), index)).toBe('unresolved');
    expect(factStatus(seg([`r:${ID.crpOct}`, 'r:00000000-0000-4000-8000-0000000fffff']), index)).toBe('unresolved');
  });
});

describe('formatting', () => {
  it('formats calendar dates without a time zone shift', () => {
    expect(formatDate('2026-03-12')).toBe('12 Mar 2026');
    expect(formatDate(null)).toBe('No date');
  });
  it('prints the range the document printed', () => {
    const r = MOCK_RECORD.results[0];
    expect(rangeText(r)).toBe('below 5');
    expect(rangeText({ ...r, ref_low: 1, ref_high: 2 })).toBe('1 to 2');
    expect(rangeText({ ...r, ref_low: null, ref_high: null, ref_text: 'negative' })).toBe('negative');
    expect(rangeText({ ...r, ref_low: null, ref_high: null })).toBeNull();
  });
});
