import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { ExamRow } from './ExamRow';
import { mockApi } from './mock';
import type { ExamListItem } from './scanApi';
import { ExamListItem as ExamListItemSchema } from './scanApi';

const text = (m: string) => m.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ').trim();
const U = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const base: ExamListItem = {
  id: U(1), status: 'queued', reason: null, uploaded_at: '2026-11-14T09:30:00.000+00:00', status_at: '2026-11-14T09:30:00.000+00:00',
  kind: null, exam_date: null, values_read: null, can_retry: false, can_delete: true, unchecked: false, file_kept: false,
};
const render = (o: Partial<ExamListItem>, extra: Record<string, unknown> = {}) =>
  renderToStaticMarkup(h(MemoryRouter, null, h('ul', null, h(ExamRow, { item: { ...base, ...o }, base: '/patient/exams', onDelete: () => {}, onRetry: () => {}, ...extra }))));

describe('ExamRow renders the six statuses (MIN-4557)', () => {
  it('waiting and reading: chip and upload date, no link, no button', () => {
    for (const [status, chip] of [['queued', 'Waiting'], ['reading', 'Reading']] as const) {
      const m = render({ status });
      expect(text(m)).toContain(chip);
      expect(m).not.toContain('<a ');
      expect(m).not.toContain('<button');
      expect(text(m)).toContain('Uploaded 14 Nov 2026');
    }
  });
  it('ready to check: a link to the review with the exam type, date and "N values read"', () => {
    const m = render({ status: 'draft', kind: 'blood_test', exam_date: '2026-11-10', values_read: 2 });
    expect(m).toContain('href="/patient/exams/' + U(1) + '/review"');
    expect(text(m)).toContain('Ready to check');
    expect(text(m)).toContain('Blood test');
    expect(text(m)).toContain('10 Nov 2026');
    expect(text(m)).toContain('2 values read');
  });
  it('saved and not opened: "Saved" plus "Not checked", links to the saved exam', () => {
    const m = render({ status: 'confirmed', kind: 'blood_test', exam_date: '2026-11-10', values_read: 9, unchecked: true, can_delete: false });
    expect(m).toContain('href="/patient/exams/' + U(1) + '"');
    expect(text(m)).toContain('Saved');
    expect(text(m)).toContain('Not checked');
    expect(text(m)).toContain('9 values read');
    expect(m).not.toContain('<button');
  });
  it('saved and opened: no "Not checked", and the marks the list always had', () => {
    const m = render({ status: 'confirmed', kind: 'blood_test', exam_date: '2026-03-12', values_read: 3, unchecked: false, can_delete: false }, { extras: { marks: ['uploaded'], outOfRange: 2 } });
    expect(text(m)).not.toContain('Not checked');
    expect(text(m)).toContain('Uploaded by patient');
    expect(text(m)).toContain('2 outside the printed range');
  });
  it('not your exam: the reason in words and Delete, no Try again, no link, no printed name', () => {
    const m = render({ status: 'refused', reason: 'name_mismatch' });
    expect(text(m)).toContain('Not your exam');
    expect(text(m)).toContain("The name on it doesn't match your profile.");
    expect(m).toContain('data-testid="row-delete"');
    expect(m).not.toContain('data-testid="row-retry"');
    expect(m).not.toContain('<a ');
  });
  it('could not read: the reason, Try again and Delete; and no Try again once the server says no', () => {
    const m = render({ status: 'failed', reason: 'model_timeout', can_retry: true });
    expect(text(m)).toContain('Could not read');
    expect(text(m)).toContain('The reader took too long.');
    expect(m).toContain('data-testid="row-retry"');
    expect(m).toContain('data-testid="row-delete"');
    expect(render({ status: 'failed', reason: 'too_many_attempts' })).not.toContain('data-testid="row-retry"');
  });
  it('an unknown reason shows the fallback sentence', () => {
    expect(text(render({ status: 'failed', reason: 'brand_new_code' as never }))).toContain('We could not read this file.');
  });
  it('a failed call leaves its message on the row, and the buttons say what is happening', () => {
    expect(text(render({ status: 'failed', reason: 'stuck', can_retry: true }, { error: 'It was not deleted. Try again.' }))).toContain('It was not deleted. Try again.');
    const m = render({ status: 'failed', reason: 'stuck', can_retry: true }, { busy: 'retrying' });
    expect(text(m)).toContain('Trying again');
    expect(m).toContain('disabled');
  });
  it('no row shows a cause, a condition, advice, a score, a value or a flag', async () => {
    const rows = await mockApi.listExams();
    for (const i of rows) expect(text(render(i))).not.toMatch(/\b(cause|diagnos|condition|advice|score|risk|healthy|abnormal)\w*|\bhigh\b|\blow\b|mg\/L/i);
  });
});

describe('the mock list is a valid response of the posted shape', () => {
  it('parses with the posted ExamListItem schema and carries all six statuses', async () => {
    const rows = await mockApi.listExams();
    for (const r of rows) expect(ExamListItemSchema.safeParse(r).success, JSON.stringify(r)).toBe(true);
    expect(new Set(rows.map((r) => r.status))).toEqual(new Set(['queued', 'reading', 'draft', 'refused', 'failed', 'confirmed']));
  });
});
