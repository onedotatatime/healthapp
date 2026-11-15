/**
 * MIN-4665 Possible diagnoses: the CTO's rules (MIN-4660 sections 3 and 4) as tests. Every state is rendered from mocks
 * (renderToStaticMarkup, so no jsdom: this suite has none). SYNTHETIC data only: MOCK_DIAGNOSES and the persona say
 * nothing about any real record and do not count toward the goal.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createElement as h, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ApiError, makeCall } from '../../api/call';
import { CitationChip } from '../../components/CitationChip';
import { DiagnosesResponse, DiagnosisItem, type DiagnosesResponse as Resp } from './analysis.contract';
import { AssistantContext } from './context';
import { classify, classifyError, createDiagnosesController, DX, footerLine, guardLine, type DxState } from './diagnoses.state';
import { DiagnosesPanel, DiagnosesView, DiagnosisCard, visibleCards } from './Diagnoses';
import { createMockAssistant, ID, MOCK_DIAGNOSES, MOCK_RECORD } from './mock';
import { buildIndex } from './record';

const index = buildIndex(MOCK_RECORD);
const GRANT = '00000000-0000-4000-8000-0000000000aa';
const text = (m: string) => m.replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const view = (state: DxState, openCite: string | null = null) => renderToStaticMarkup(h(DiagnosesView, { state, index, openCite, onOpenCite: () => {} }));
const count = (m: string, id: string) => m.match(new RegExp(`data-testid="${id}"`, 'g'))?.length ?? 0;
const response = (patch: Partial<Resp> = {}): Resp => ({ ...MOCK_DIAGNOSES, ...patch });

const STATES: [string, DxState][] = [
  ['idle', { status: 'idle' }],
  ['loading', { status: 'loading' }],
  ['ok', { status: 'ok', data: MOCK_DIAGNOSES }],
  ['none', { status: 'none', data: response({ status: 'none', items: [], counts: { facts: 3, items: 0, citations: 0, guard_drops: 2, errors: 0 } }) }],
  ['off', { status: 'off' }],
  ['error (timeout)', { status: 'error', kind: 'timeout' }],
  ['error (failed)', { status: 'error', kind: 'failed' }],
  ['ended', { status: 'ended' }],
];

describe('the fixed banner and the AI line are in the DOM in every state', () => {
  for (const [name, state] of STATES) {
    it(name, () => {
      const m = view(state);
      expect(text(m)).toContain(DX.banner);
      expect(m).toContain('data-testid="dx-banner"');
      expect(text(m)).toContain(DX.aiLine);
      expect(text(m)).toContain('Possible diagnoses'); // the title
    });
  }
  it('is the CTO\'s sentence, word for word', () => {
    expect(DX.banner).toBe("For the doctor to evaluate. Not a diagnosis. Based on this patient's symptoms and exams only. Listed in alphabetical order; no ranking.");
    expect(DX.aiLine).toBe('This list comes from an AI reading this record. Check each line against its source.');
  });
});

describe('every state of the view, from mocks', () => {
  it('before the request: the button, no card, no call text', () => {
    const m = view({ status: 'idle' });
    expect(text(m)).toContain('List possible diagnoses');
    expect(count(m, 'dx-card')).toBe(0);
    expect(m).toContain('data-state="idle"');
  });
  it('generating: the loading line, a disabled button, two skeleton cards that are hidden from assistive tech', () => {
    const m = view({ status: 'loading' });
    expect(text(m)).toContain('Reading the record. This can take up to a minute.');
    expect(m).toMatch(/<button[^>]*disabled[^>]*data-testid="dx-run"/);
    expect(m).toContain('data-testid="dx-skeleton"');
    expect(m).toMatch(/aria-hidden="true" data-testid="dx-skeleton"/);
    expect(count(m, 'dx-card')).toBe(0); // skeletons are not cards
  });
  it('the cards: name, Fits:, Does not fully explain:, Not in this record:, Based on:, and "List again"', () => {
    const m = view({ status: 'ok', data: MOCK_DIAGNOSES });
    expect(count(m, 'dx-card')).toBe(2);
    const t = text(m);
    for (const s of ['Inflammatory arthritis', 'Osteoarthritis', 'Fits:', 'Does not fully explain:', 'Not in this record:', 'Based on:', 'RF, anti-CCP', 'List again']) expect(t, s).toContain(s);
    expect(t).not.toContain('List possible diagnoses');
  });
  it('a label with nothing under it is not drawn (the second card has no "does not fully explain")', () => {
    const m = view({ status: 'ok', data: MOCK_DIAGNOSES });
    expect(count(m, 'dx-does-not-explain')).toBe(1);
    expect(count(m, 'dx-not-in-record')).toBe(2);
    const noNir = response({ items: [{ ...MOCK_DIAGNOSES.items[1], not_in_record: [] }] });
    expect(count(view({ status: 'ok', data: noNir }), 'dx-not-in-record')).toBe(0);
  });
  it('nothing to list: the plain sentence, the footer, and "List again"', () => {
    const m = view(STATES.find(([n]) => n === 'none')![1]);
    expect(text(m)).toContain('No possibility could be listed from this record.');
    expect(text(m)).toContain('List again');
    expect(count(m, 'dx-card')).toBe(0);
  });
  it('an "ok" answer with no item is the same state as "none"', () => {
    expect(classify(response({ items: [] })).status).toBe('none');
    expect(classify(response({ status: 'none', items: [] })).status).toBe('none');
  });
  it('switched off: the sentence, no button, no card', () => {
    const m = view({ status: 'off' });
    expect(text(m)).toContain('Possible diagnoses is switched off in this environment.');
    expect(count(m, 'dx-run')).toBe(0);
    expect(count(m, 'dx-card')).toBe(0);
    expect(classify(response({ status: 'off', items: [] })).status).toBe('off');
  });
  it('the model timed out: the sentence and a button (503 model_unavailable)', () => {
    const m = view({ status: 'error', kind: 'timeout' });
    expect(text(m)).toContain('The list could not be made in time. Try again.');
    expect(count(m, 'dx-retry')).toBe(1);
    expect(m).toContain('role="alert"');
  });
  it('not configured or an error: the sentence and a button (500, network, an answer that does not parse)', () => {
    const m = view({ status: 'error', kind: 'failed' });
    expect(text(m)).toContain('Possible diagnoses could not be loaded.');
    expect(count(m, 'dx-retry')).toBe(1);
  });
  it('the grant ended: no button, and the workspace is told', () => {
    const m = view({ status: 'ended' });
    expect(text(m)).toContain('Access to this record has ended.');
    expect(count(m, 'dx-run')).toBe(0);
    expect(count(m, 'dx-retry')).toBe(0);
  });
});

describe('how a failure is read (the CTO\'s table)', () => {
  it('503 model_unavailable is the timeout state', () => {
    expect(classifyError(new ApiError(503, 'x', 'model_unavailable'))).toEqual({ status: 'error', kind: 'timeout' });
  });
  it('500 internal, 0 (not reached) and a parse failure are the failed state', () => {
    for (const e of [new ApiError(500, 'x', 'internal'), new ApiError(0, 'Could not reach the server.'), new ApiError(200, 'Unexpected response from diagnoses.'), new Error('boom')]) {
      expect(classifyError(e)).toEqual({ status: 'error', kind: 'failed' });
    }
  });
  it('403 grant_expired (and any 403) ends the access', () => {
    expect(classifyError(new ApiError(403, 'x', 'grant_expired')).status).toBe('ended');
    expect(classifyError(new ApiError(403, 'x', 'wrong_role')).status).toBe('ended');
  });
});

describe('truncated, removed statements and the footer', () => {
  it('truncated: the notice, in the cards state and the empty state', () => {
    const ok = view({ status: 'ok', data: response({ truncated: true }) });
    expect(text(ok)).toContain('This record is larger than what the assistant reads. The list may miss the newest results.');
    const none = view({ status: 'none', data: response({ status: 'none', items: [], truncated: true }) });
    expect(text(none)).toContain(DX.truncated);
    expect(text(view({ status: 'ok', data: MOCK_DIAGNOSES }))).not.toContain(DX.truncated);
  });
  it('guard_drops above 0: the line with the number; none when 0', () => {
    const c = { ...MOCK_DIAGNOSES.counts, guard_drops: 3 };
    expect(text(view({ status: 'ok', data: response({ counts: c }) }))).toContain('3 statements were removed because they could not be checked against the record.');
    expect(guardLine(1)).toBe('1 statement was removed because it could not be checked against the record.');
    expect(count(view({ status: 'ok', data: MOCK_DIAGNOSES }), 'dx-guard')).toBe(0);
  });
  it('the footer prints the five integers the function logs, as the CTO wrote it', () => {
    expect(footerLine({ facts: 14, items: 2, citations: 7, guard_drops: 1, errors: 0 })).toBe('Record lines read 14, possibilities 2, citations 7, removed 1, errors 0.');
    expect(text(view({ status: 'ok', data: MOCK_DIAGNOSES }))).toContain('Record lines read 14, possibilities 2, citations 7, removed 0, errors 0.');
  });
});

describe('the cards keep the order received (the server sorts by name; the client never does)', () => {
  const mk = (name: string): Resp['items'][number] => ({ name, fits: [{ text: `${name} fits.`, cites: [`r:${ID.crpOct}`] }], does_not_explain: [], not_in_record: [] });
  const names = (m: string) => [...m.matchAll(/<h3>([^<]*)<\/h3>/g)].map((x) => x[1]);
  it('draws Zebra, Apple, Mango in that order, not alphabetically', () => {
    const data = response({ items: [mk('Zebra'), mk('Apple'), mk('Mango')], counts: { ...MOCK_DIAGNOSES.counts, items: 3 } });
    expect(names(view({ status: 'ok', data }))).toEqual(['Zebra', 'Apple', 'Mango']);
    expect(visibleCards(data.items, index).map((c) => c.name)).toEqual(['Zebra', 'Apple', 'Mango']);
  });
  it('does not mutate the response it was given', () => {
    const data = response({ items: [mk('Zebra'), mk('Apple')] });
    const before = data.items.map((i) => i.name).join();
    visibleCards(data.items, index);
    expect(data.items.map((i) => i.name).join()).toBe(before);
  });
});

describe('no number, rank, percentage or colour difference can be drawn', () => {
  it('the card has no field for one: the strict schema rejects score, rank, probability, likelihood, percent', () => {
    const item = MOCK_DIAGNOSES.items[0];
    for (const k of ['score', 'rank', 'probability', 'likelihood', 'percent', 'order', 'confidence']) {
      expect(DiagnosisItem.safeParse({ ...item, [k]: 1 }).success, k).toBe(false);
    }
  });
  it('the rendered cards carry no percent sign, no "#n", no leading number in a title, no likelihood or rank word', () => {
    const m = view({ status: 'ok', data: MOCK_DIAGNOSES });
    const titles = [...m.matchAll(/<h3>([^<]*)<\/h3>/g)].map((x) => x[1]);
    expect(titles.length).toBe(2);
    for (const t of titles) expect(t).not.toMatch(/^\s*[#\d]|%/);
    // the card's own words (labels and titles); statements are the record's numbers and are checked on the server
    expect(m).not.toMatch(/%|\b(likely|probable|most|least|leading|definite|confirmed|suspected|rank|score)\b/i);
  });
  it('every card has the same classes: nothing is sized or coloured by importance', () => {
    const m = view({ status: 'ok', data: MOCK_DIAGNOSES });
    const cls = [...m.matchAll(/<li class="(dx-card[^"]*)"/g)].map((x) => x[1]);
    expect(cls).toEqual(['dx-card', 'dx-card']);
    expect(m).not.toMatch(/<li class="dx-card"[^>]*style=/);
  });
});

describe('a payload with an extra key renders nothing', () => {
  const env = { status: 'ok' as const, env: 'dev' as const, schema: 'healthapp_dev', bucket: 'b', functionPrefix: 'healthapp-', supabaseUrl: 'https://x.supabase.co', anonKey: 'k' };
  const call = (body: unknown, status = 200) =>
    makeCall(env, (async () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })) as unknown as typeof fetch)('diagnoses', { grant_id: GRANT }, DiagnosesResponse);
  it('a response with a top-level extra key (rank) is an error, not a list', async () => {
    const e = await call({ ...MOCK_DIAGNOSES, rank: [1, 2] }).catch((x) => x);
    expect(e).toBeInstanceOf(ApiError);
    const m = view(classifyError(e));
    expect(text(m)).toContain(DX.failed);
    expect(count(m, 'dx-card')).toBe(0);
    expect(text(m)).not.toContain('Osteoarthritis');
  });
  it('an extra key inside an item (score) or a statement is an error too', async () => {
    const withScore = { ...MOCK_DIAGNOSES, items: [{ ...MOCK_DIAGNOSES.items[0], score: 0.9 }, MOCK_DIAGNOSES.items[1]] };
    expect(await call(withScore).catch((x) => x)).toBeInstanceOf(ApiError);
    const inStatement = { ...MOCK_DIAGNOSES, items: [{ ...MOCK_DIAGNOSES.items[0], fits: [{ ...MOCK_DIAGNOSES.items[0].fits[0], probability: 1 }] }] };
    expect(await call(inStatement).catch((x) => x)).toBeInstanceOf(ApiError);
  });
  it('the unchanged payload parses (so the test above fails for the key, not for something else)', async () => {
    expect((await call(MOCK_DIAGNOSES)).items.length).toBe(2);
  });
  it('a status the contract does not know is an error', async () => {
    expect(await call({ ...MOCK_DIAGNOSES, status: 'maybe' }).catch((x) => x)).toBeInstanceOf(ApiError);
  });
});

describe('a card with no citation is never drawn', () => {
  const stmt = (cites: string[]) => ({ text: 'A statement.', cites });
  it('drops a statement whose cite does not resolve, and a card that is left with no "Fits"', () => {
    const lost = `r:00000000-0000-4000-8000-00000000dead`;
    const items = [
      { name: 'Kept', fits: [stmt([`r:${ID.crpOct}`]), stmt([lost])], does_not_explain: [stmt([lost])], not_in_record: [] },
      { name: 'Dropped', fits: [stmt([lost])], does_not_explain: [], not_in_record: [] },
    ];
    const cards = visibleCards(items, index);
    expect(cards.map((c) => c.name)).toEqual(['Kept']);
    expect(cards[0].fits.length).toBe(1);
    expect(cards[0].doesNotExplain.length).toBe(0);
    expect(count(view({ status: 'ok', data: response({ items }) }), 'dx-card')).toBe(1);
  });
  it('a card whose every statement is lost leaves the "ok" answer as an empty list sentence, not a blank screen', () => {
    const items = [{ name: 'Dropped', fits: [stmt(['r:00000000-0000-4000-8000-00000000dead'])], does_not_explain: [], not_in_record: [] }];
    const m = view({ status: 'ok', data: response({ items }) });
    expect(m).toContain('data-state="none"');
    expect(text(m)).toContain(DX.none);
  });
  it('every card has at least one Based on chip, in the order of first use, once each', () => {
    const [a] = visibleCards(MOCK_DIAGNOSES.items, index);
    expect(a.cites).toEqual([`r:${ID.crpOct}`, `r:${ID.esrOct}`, `d:${ID.d2}`, `r:${ID.crpMar}`, `r:${ID.esrMar}`]);
    const m = view({ status: 'ok', data: MOCK_DIAGNOSES });
    expect(count(m, 'dx-source')).toBe(5 + 2);
    expect(count(m, 'dx-based')).toBe(2);
  });
});

describe('a citation chip opens the right source record', () => {
  /** Walks the element tree, expanding plain function components (the card and its statement list hold no hooks). */
  function find(node: ReactNode, pred: (e: ReactElement<Record<string, unknown>>) => boolean, out: ReactElement<Record<string, unknown>>[] = []): ReactElement<Record<string, unknown>>[] {
    if (Array.isArray(node)) node.forEach((n) => find(n, pred, out));
    else if (isValidElement(node)) {
      const e = node as ReactElement<Record<string, unknown>>;
      if (pred(e)) out.push(e);
      if (typeof e.type === 'function' && e.type !== CitationChip) find((e.type as (p: unknown) => ReactNode)(e.props), pred, out);
      else find(e.props.children as ReactNode, pred, out);
    }
    return out;
  }
  const [card] = visibleCards(MOCK_DIAGNOSES.items, index);
  it('the "Based on" chip for a result opens that result\'s document with the row marked', () => {
    const opened: string[] = [];
    const tree = h(DiagnosisCard, { card, index, openCite: null, onOpenCite: (c) => opened.push(c) });
    const chips = find(tree, (e) => e.props['data-testid'] === 'dx-source');
    expect(chips.length).toBe(card.cites.length);
    const crp = chips[0];
    (crp.props.onClick as () => void)();
    expect(opened).toEqual([`r:${ID.crpOct}`]);
    expect(index.resolve(opened[0])?.subject).toEqual({ kind: 'doc', docId: ID.docOct, focus: `r:${ID.crpOct}` });
    // the diary chip opens the diary entry
    (chips[2].props.onClick as () => void)();
    expect(index.resolve(opened[1])?.subject).toEqual({ kind: 'diary', id: ID.d2 });
  });
  it('the numbered chip at the end of a statement opens the same record as the Based on chip with that number', () => {
    const opened: string[] = [];
    const tree = h(DiagnosisCard, { card, index, openCite: null, onOpenCite: (c) => opened.push(c) });
    const numbered = find(tree, (e) => e.type === CitationChip);
    expect(numbered.length).toBe(card.fits.concat(card.doesNotExplain).flatMap((s) => s.cites).length);
    for (const chip of numbered) {
      (chip.props.onOpen as () => void)();
      expect(card.cites[(chip.props.n as number) - 1]).toBe(opened.at(-1));
    }
  });
});

describe('one call per press, none on open', () => {
  const settle = () => new Promise((r) => setTimeout(r, 5));
  it('opening the view (rendering the panel) calls nothing', () => {
    const api = createMockAssistant({ latencyMs: 0 });
    const m = renderToStaticMarkup(h(AssistantContext.Provider, { value: api }, h(DiagnosesPanel, { api, grantId: GRANT, index, openCite: null, onOpenCite: () => {}, onGone: () => {} })));
    expect(api.diagnosesCalls.length).toBe(0);
    expect(m).toContain('data-state="idle"');
  });
  it('a controller calls nothing when it is made; each press is one call; a press while it runs does nothing', async () => {
    const api = createMockAssistant({ latencyMs: 0 });
    const states: string[] = [];
    const ctl = createDiagnosesController({ api, grantId: GRANT, onState: (s) => states.push(s.status) });
    expect(api.diagnosesCalls.length).toBe(0);
    expect(ctl.press()).toBe(true);
    expect(ctl.press()).toBe(false); // still running
    expect(ctl.press()).toBe(false);
    expect(api.diagnosesCalls).toEqual([GRANT]);
    await settle();
    expect(states).toEqual(['loading', 'ok']);
    expect(ctl.press()).toBe(true); // "List again" is a new press
    await settle();
    expect(api.diagnosesCalls.length).toBe(2);
  });
  it('a late answer after the view closed is dropped, and a refused grant tells the workspace once', async () => {
    const api = createMockAssistant({ latencyMs: 0 });
    const seen: string[] = [];
    const ctl = createDiagnosesController({ api, grantId: GRANT, onState: (s) => seen.push(s.status) });
    ctl.press();
    ctl.dispose();
    await settle();
    expect(seen).toEqual(['loading']);
    let gone = 0;
    const refused = createMockAssistant({ latencyMs: 0, diagnoses: new ApiError(403, 'x', 'grant_expired') });
    const c2 = createDiagnosesController({ api: refused, grantId: GRANT, onState: (s) => seen.push(s.status), onGone: () => gone++ });
    c2.press();
    await settle();
    expect(seen.at(-1)).toBe('ended');
    expect(gone).toBe(1);
  });
  it('an error keeps the screen usable: the retry is another press', async () => {
    const api = createMockAssistant({ latencyMs: 0, diagnoses: new ApiError(503, 'x', 'model_unavailable') });
    const seen: DxState[] = [];
    const ctl = createDiagnosesController({ api, grantId: GRANT, onState: (s) => seen.push(s) });
    ctl.press();
    await settle();
    expect(seen.at(-1)).toEqual({ status: 'error', kind: 'timeout' });
    expect(ctl.press()).toBe(true);
    expect(api.diagnosesCalls.length).toBe(2);
  });
});

describe('the view exists only in the doctor workspace', () => {
  const root = join(__dirname, '..', '..');
  const files = (dir: string): string[] => readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f) ? [p] : [];
  });
  it('no file outside the assistant folder imports the view, its state module, or calls the function', () => {
    const offenders = files(root).filter((f) => !relative(root, f).startsWith(join('features', 'assistant'))).filter((f) => /assistant\/(Diagnoses|diagnoses\.state)['"]|callFunction\(\s*['"]diagnoses['"]/.test(readFileSync(f, 'utf8')));
    expect(offenders.map((f) => relative(root, f))).toEqual([]);
  });
  it('inside the assistant folder only the workspace imports the view', () => {
    const dir = join(root, 'features', 'assistant');
    const importers = files(dir).filter((f) => /from '\.\/Diagnoses'/.test(readFileSync(f, 'utf8'))).map((f) => relative(dir, f));
    expect(importers).toEqual(['AssistantWorkspace.tsx']);
  });
});

describe('the contract block', () => {
  it('parses the synthetic answer and bounds the list at 6 items', () => {
    expect(DiagnosesResponse.safeParse(MOCK_DIAGNOSES).success).toBe(true);
    const many = Array.from({ length: 7 }, (_, i) => ({ ...MOCK_DIAGNOSES.items[0], name: `N${i}` }));
    expect(DiagnosesResponse.safeParse({ ...MOCK_DIAGNOSES, items: many }).success).toBe(false);
  });
  it('a statement without a cite does not parse (every statement rests on a record line)', () => {
    const bad = { ...MOCK_DIAGNOSES.items[0], fits: [{ text: 't', cites: [] }] };
    expect(DiagnosisItem.safeParse(bad).success).toBe(false);
  });
});
