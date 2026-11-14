import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Answer, FactBlock, GeneralBlock, NotInRecordBlock, type ChipCtx } from './Blocks';
import type { AssistantResponse, Segment } from './contract';
import { ID, MOCK_RECORD, answerFor } from './mock';
import { buildIndex } from './record';

const index = buildIndex(MOCK_RECORD);
const base = { index, openCite: null, onOpen: () => {} };
const ctx: ChipCtx = { ...base, numberFor: (c) => (c.endsWith(String(ID.crpOct)) ? 1 : 2) };
const fact = (text: string, cites: string[], verified = true): Segment => ({ kind: 'record_fact', text, cites, verified });
const html = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);

describe('citation chip inside a fact', () => {
  it('is a real button named with the number, the source, its date and its mark', () => {
    const out = html(h(FactBlock, { segment: fact('CRP was high.', [`r:${ID.crpOct}`]), ctx }));
    expect(out).toContain('<button type="button" class="chip" aria-label="Source 1: Blood test: CRP, 30 Oct 2026, uploaded by patient"');
    expect(out).toContain('CRP was high.');
    expect(out).toContain('aria-pressed="false"');
    expect(out).toContain('Uploaded by patient'); // the mark is in the chip card (hover and focus)
  });
  it('shows the chip as open when the viewer shows that cite', () => {
    const out = html(h(FactBlock, { segment: fact('x', [`r:${ID.crpOct}`]), ctx: { ...ctx, openCite: `r:${ID.crpOct}` } }));
    expect(out).toContain('aria-pressed="true"');
  });
  it('does not show a fact whose cite does not resolve, and says so', () => {
    const out = html(h(FactBlock, { segment: fact('Made-up claim.', ['r:00000000-0000-4000-8000-0000000fffff']), ctx }));
    expect(out).not.toContain('Made-up claim.');
    expect(out).toContain('Could not confirm a source for one statement.');
    expect(out).not.toContain('class="chip"');
  });
  it('does not show a fact with no cite', () => {
    expect(html(h(FactBlock, { segment: fact('Uncited claim.', []), ctx }))).not.toContain('Uncited claim.');
  });
  it('does not show an unverified fact as a fact', () => {
    const out = html(h(FactBlock, { segment: fact('Unchecked claim.', [`r:${ID.crpOct}`], false), ctx }));
    expect(out).not.toContain('Unchecked claim.');
    expect(out).toContain('could not be verified against the record');
  });
  it('renders text as text, never as markup', () => {
    const out = html(h(FactBlock, { segment: fact('<img src=x onerror=alert(1)> **bold**', [`r:${ID.crpOct}`]), ctx }));
    expect(out).toContain('&lt;img src=x onerror=alert(1)&gt; **bold**');
    expect(out).not.toContain('<img');
  });
});

describe('the three block kinds look different', () => {
  it('general knowledge: its own labelled container, no chips', () => {
    const out = html(h(GeneralBlock, { segment: { kind: 'general_knowledge', text: 'CRP marks inflammation.', cites: [], verified: true } }));
    expect(out).toContain('class="as-general"');
    expect(out).toContain('General medical knowledge, not from this record');
    expect(out).toContain('CRP marks inflammation.');
    expect(out).not.toContain('chip');
  });
  it('not in the record: one line and nothing else', () => {
    expect(html(h(NotInRecordBlock))).toBe('<p class="as-nir" data-testid="not-in-record">Not in this record.</p>');
  });
});

describe('a whole answer', () => {
  it('puts facts first, general knowledge after them, with one number per cite', () => {
    const out = html(h(Answer, { response: answerFor('crp'), ctx: base }));
    expect(out.indexOf('CRP was 14.2')).toBeLessThan(out.indexOf('On 12 Mar'));
    expect(out.indexOf('On 12 Mar')).toBeLessThan(out.indexOf('as-general'));
    expect(out).toContain('aria-label="Source 1: Blood test: CRP, 30 Oct 2026');
    expect(out).toContain('aria-label="Source 2: Blood test: CRP, 12 Mar 2026, verified by source');
  });
  it('interleaved general knowledge still renders after the facts', () => {
    const r: AssistantResponse = { ...answerFor('crp'), segments: [{ kind: 'general_knowledge', text: 'General first.', cites: [], verified: true }, fact('Fact second.', [`r:${ID.crpOct}`])] };
    const out = html(h(Answer, { response: r, ctx: base }));
    expect(out.indexOf('Fact second.')).toBeLessThan(out.indexOf('General first.'));
  });
  it('a not-in-record answer renders only that line, even if segments are present', () => {
    const r: AssistantResponse = { ...answerFor('crp'), not_in_record: true };
    const out = html(h(Answer, { response: r, ctx: base }));
    expect(out).toContain('Not in this record.');
    expect(out).not.toContain('CRP was 14.2');
    expect(out).not.toContain('chip');
  });
  it('an answer with nothing in it is "not in this record", never blank', () => {
    expect(html(h(Answer, { response: answerFor('smoking'), ctx: base }))).toContain('Not in this record.');
    expect(html(h(Answer, { response: { ...answerFor('crp'), segments: [] }, ctx: base }))).toContain('Not in this record.');
  });
});
