import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { expect, mockSimulateLive, test } from './helpers/simulate-live';

// /simulation and /doctor/simulate on staging after MIN-4603 (MIN-4612). Synthetic data only.
// Expected values come from data/synthetic/simulation.json (the file the build serves), formatted here by the written rule,
// not by importing the app's formatter, so a wrong formatter or a wrong deployed file fails.
// The Run click on /doctor/simulate calls healthapp-simulate-live (a real boxd machine): every Run in this file mocks that POST
// (MIN-4677, helpers/simulate-live.ts), and the helper fails the test if a click ever reaches the real function.
// Run: see playwright.simulation.config.ts. Passcode comes from HEALTHAPP_DEMO_PASSCODE, is never logged.
const PASSCODE = process.env.HEALTHAPP_DEMO_PASSCODE ?? '';
const SIM = JSON.parse(readFileSync('data/synthetic/simulation.json', 'utf8'));
const last = <T,>(a: T[]) => a[a.length - 1];
const commas = (n: number) => Math.round(n).toLocaleString('en-US');

const euro = SIM.euro;
const dropLast: number = last(euro.drop_pts);
const amountLast = `€${(last(euro.drop_mio_eur) as number / 1000).toFixed(1)} billion`;
const pct = (v: number) => `${+(v * 100).toFixed(1)}%`;
const fmtAmount = (mio: number) => (mio === 0 ? '€0' : mio < 1 ? `€${commas(mio * 1e6)}` : mio < 1000 ? `€${commas(mio)} million` : `€${(mio / 1000).toFixed(1)} billion`);
const totalText = `€${commas(euro.total_mio_eur / 1000)} billion`;
const ASSUMPTION = `Assumption, not a finding: each match lowers the chance of a wrong or missed diagnosis by ${pct(SIM.assumption.start)}, rising to ${pct(SIM.assumption.ceiling)} as matches accumulate.`;
const END = {
  records: last(SIM.x.values as number[]),
  matches: last(SIM.matches.count as number[]),
  rate: (last(SIM.series[0].values) as number).toFixed(1),
  wrong: (last(SIM.series[1].values) as number).toFixed(2),
  cost: (last(SIM.series[2].values) as number).toFixed(2),
  perHab: `€${Math.round(last(euro.drop_eur_per_inhabitant) as number)} per inhabitant a year`,
  formula: `${dropLast.toFixed(2)} points of health spending × ${totalText} (${euro.geography}, ${euro.year}) = ${amountLast} a year`,
  effect: pct(last(SIM.assumption.effect) as number),
};

const T = (page: Page, id: string) => page.getByTestId(id);

/** The euro block is never on screen without its formula, source and the assumption; the fixed label is always there. */
async function expectEuroComplete(page: Page) {
  await expect(T(page, 'sim-label')).toHaveText(SIM.label);
  await expect(T(page, 'sim-euro-formula')).toBeVisible();
  await expect(T(page, 'sim-euro-source')).toContainText(euro.geography);
  await expect(T(page, 'sim-euro-source').getByRole('link')).toHaveAttribute('href', euro.source.url);
  await expect(T(page, 'sim-euro-source')).toContainText(String(euro.year));
  await expect(T(page, 'sim-assumption')).toHaveText(ASSUMPTION);
  await expect(T(page, 'sim-assumption-2')).toHaveText(ASSUMPTION);
  await expect(T(page, 'sim-assumption-3')).toHaveText(ASSUMPTION);
}

async function expectEnd(page: Page) {
  await expect(T(page, 'simulation')).toHaveAttribute('data-state', 'done');
  await expect(T(page, 'sim-euro-figure')).toHaveText(amountLast);
  await expect(T(page, 'sim-euro-hab')).toHaveText(END.perHab);
  await expect(T(page, 'sim-euro-formula')).toHaveText(END.formula);
  await expect(T(page, 'sim-matches')).toContainText(commas(END.matches));
  await expect(T(page, 'sim-x-hero')).toContainText(commas(END.records));
  // One canvas, no cell per dot (MIN-4682): the counts live in data-* and the aria-label, written at step edges.
  await expect(T(page, 'sim-field')).toHaveAttribute('data-visible', String(END.records));
  await expect(T(page, 'sim-field')).toHaveAttribute('data-matched', String(END.matches));
  await expect(T(page, 'sim-field').locator('canvas')).toHaveCount(1);
  await expect(T(page, 'sim-field').locator('i')).toHaveCount(0);
  const fieldLabel = T(page, 'sim-field').getByRole('img');
  await expect(fieldLabel).toHaveAttribute('aria-label', new RegExp(commas(END.matches) + ' of ' + commas(END.records)));
  await expect(T(page, 'sim-effect')).toContainText(END.effect);
  await expect(T(page, 'sim-value-1')).toHaveText(END.rate);
  await expect(T(page, 'sim-value-2')).toHaveText(END.wrong);
  await expect(T(page, 'sim-value-3')).toHaveText(END.cost);
  await expectEuroComplete(page);
}

const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.describe('/simulation (public)', () => {
  test('P1 plays to the end; label, assumption, formula and source on screen at start, mid-play and end; mid-run arithmetic holds', async ({ page, baseURL }) => {
    test.setTimeout(120_000);
    const bad: string[] = [];
    const origin = new URL(baseURL!).origin;
    page.on('request', (r) => {
      const u = new URL(r.url());
      if (u.protocol === 'data:' || u.protocol === 'blob:') return;
      if (u.origin !== origin || r.method() !== 'GET') bad.push(`${r.method()} ${u.origin}${u.pathname}`);
    });
    await page.goto('/simulation');
    const root = T(page, 'simulation');
    // start
    await expect(root).toHaveAttribute('data-state', 'playing');
    await expect(T(page, 'sim-label')).toHaveText(SIM.label);
    await expect(T(page, 'sim-assumption')).toHaveText(ASSUMPTION);
    if (await T(page, 'sim-euro-figure').isVisible()) await expectEuroComplete(page);

    // mid-play: still playing, the counter is between zero and the end, and the formula arithmetic checks out
    await expect.poll(async () => Number(await T(page, 'sim-matches').locator('.sim-stat-n').innerText()), { timeout: 30_000 }).toBeGreaterThan(0);
    await page.waitForTimeout(3_000);
    await expect(root).toHaveAttribute('data-state', 'playing');
    const midMatches = Number(await T(page, 'sim-matches').locator('.sim-stat-n').innerText());
    expect(midMatches).toBeGreaterThan(0);
    expect(midMatches).toBeLessThan(END.matches);
    await expectEuroComplete(page);
    // one read, so the three lines come from the same frame
    const mid = await page.evaluate(() => {
      const t = (id: string) => document.querySelector(`[data-testid="${id}"]`)?.textContent ?? '';
      return { formula: t('sim-euro-formula'), figure: t('sim-euro-figure') };
    });
    const m = /^(\d+\.\d{2}) points of health spending × (.+?) \(/.exec(mid.formula);
    expect(m, `formula line read: ${mid.formula}`).not.toBeNull();
    const drop = Number(m![1]);
    expect(drop).toBeGreaterThan(0);
    expect(drop).toBeLessThan(dropLast);
    expect(mid.formula).toContain(`= ${fmtAmount((drop / 100) * euro.total_mio_eur)} a year`);
    expect(mid.figure).toBe(fmtAmount((drop / 100) * euro.total_mio_eur));

    // end: holds
    await expect(root).toHaveAttribute('data-state', 'done', { timeout: 45_000 });
    await expectEnd(page);
    await page.waitForTimeout(2_000);
    await expectEnd(page);
    expect(bad, 'requests beyond the app GET assets').toEqual([]);
  });

  test('P2 the last frame equals the data file (its record count, its match count, the three end values, the euro figure)', async ({ page }) => {
    // Reduced motion reaches the finished state at once, so this check does not wait 30 s.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/simulation');
    await expectEnd(page);
    // The file itself is the source: a stale or truncated file fails here, not a number typed in this spec.
    expect(SIM.x.values.length).toBe(SIM.matches.count.length);
    expect(END.records).toBeGreaterThanOrEqual(5000);
    expect(END.matches).toBeGreaterThan(0);
    expect(END.matches).toBeLessThan(END.records);
  });

  test('P3 reduced motion: finished state at once, no replay, nothing moves on', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/simulation');
    await expect(T(page, 'simulation')).toHaveAttribute('data-state', 'done', { timeout: 3_000 });
    await expect(T(page, 'sim-replay')).toHaveCount(0);
    const before = await T(page, 'sim-euro-formula').innerText();
    await page.waitForTimeout(3_000);
    await expect(T(page, 'simulation')).toHaveAttribute('data-state', 'done');
    expect(await T(page, 'sim-euro-formula').innerText()).toBe(before);
    await expectEnd(page);
  });

  test('P4 Play again replays and lands on the same outcome', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop-1280', 'one viewport is enough for the replay');
    test.setTimeout(120_000);
    await page.goto('/simulation');
    await expect(T(page, 'simulation')).toHaveAttribute('data-state', 'done', { timeout: 45_000 });
    await expect(T(page, 'sim-replay')).toBeEnabled();
    await T(page, 'sim-replay').click();
    await expect(T(page, 'simulation')).toHaveAttribute('data-state', 'playing');
    await expect(T(page, 'sim-label')).toHaveText(SIM.label);
    await expect(T(page, 'simulation')).toHaveAttribute('data-state', 'done', { timeout: 45_000 });
    await expectEnd(page);
  });

  test('W1 at 390 px, no horizontal overflow at start, mid-play and end', async ({ page }, info) => {
    test.skip(info.project.name !== 'phone-390', 'phone project only');
    test.setTimeout(120_000);
    await page.goto('/simulation');
    await expect(T(page, 'simulation')).toHaveAttribute('data-state', 'playing');
    expect(await overflow(page), 'px of sideways scroll at start').toBeLessThanOrEqual(0);
    await page.waitForTimeout(12_000);
    expect(await overflow(page), 'px of sideways scroll mid-play').toBeLessThanOrEqual(0);
    await expect(T(page, 'simulation')).toHaveAttribute('data-state', 'done', { timeout: 45_000 });
    expect(await overflow(page), 'px of sideways scroll at end').toBeLessThanOrEqual(0);
    await expectEnd(page);
  });
});

// The timeline card under the hero (MIN-4696). MIN-4724 made it ONE animated plot, five lines (scenarios and Test result on MIN-4726; spec A14,
// copy section 8, contract MIN-4720). Its own clock: 500 ms a month, started once when 40% of the card is in view (or it fills 60% of the screen),
// with a Replay. Expected values come from the file's `timeline` block, formatted here by the written rule (counts with the comma, euros rounded to
// thousands in the heads and whole in the table, the data's own decimals), never from the app's formatter.
const TL = SIM.timeline;
const TL_MONTHS: number[] = TL.x.values;
const TL_LAST = last(TL_MONTHS);
const TL_SERIES: Record<string, number[]> = {
  patients: TL.patients.values,
  matches: TL.matches.count,
  income: TL.income_run_rate_eur.values,
  drop: TL.drop_eur.values,
  dx: TL.diagnoses.values,
};
const TL_IDS = Object.keys(TL_SERIES);
const dxDecimals = Math.min(2, Math.max(0, ...TL_SERIES.dx.map((v) => (String(v).split('.')[1] ?? '').length)));
const euroK = (v: number) => (Math.round(v) >= 1000 ? `€${commas(Math.round(v) / 1000)}k` : `€${Math.round(v)}`);
const tlKey = (id: string, v: number) => (id === 'income' || id === 'drop' ? euroK(v) : id === 'dx' ? v.toFixed(dxDecimals) : commas(v));
const tlExact = (id: string, v: number) => (id === 'income' || id === 'drop' ? `€${commas(v)}` : id === 'dx' ? v.toFixed(dxDecimals) : commas(v));
const TL_YEAR_ENDS = TL_MONTHS.filter((m) => m % 12 === 0);
/** What each line is: patients and income are the plan, matches are computed on the synthetic records, the drop and the diagnoses are the model. */
const TL_KIND: Record<string, string> = { patients: 'plan', income: 'plan', matches: 'computed', drop: 'model', dx: 'model' };
const TL_TAG: Record<string, string> = { plan: 'Plan', computed: 'Computed on synthetic records', model: 'Model' };
/** The free pilot: from the file's plan.pilot_from to the month before the first month with a patient. */
const TL_FIRST_PAID = TL_MONTHS[TL_SERIES.patients.findIndex((v) => v > 0)];
const TL_PILOT_FROM: number = TL.plan.pilot_from;
const TL_RUN_MS = TL_MONTHS.length * 500;

/** One read of the card: the month, the readout, the done flag, the five head values, the playhead and the leaders. */
const tlRead = (page: Page) =>
  T(page, 'sim-timeline').evaluate((card) => {
    const shown = (el: Element) => getComputedStyle(el).display !== 'none';
    const values: Record<string, string> = {};
    card.querySelectorAll('[data-testid^="sim-tl-value-"]').forEach((el) => { values[el.getAttribute('data-testid')!.slice('sim-tl-value-'.length)] = el.textContent ?? ''; });
    const replay = card.querySelector('[data-testid="sim-tl-replay"]') as HTMLButtonElement | null;
    return {
      month: Number(card.getAttribute('data-month')),
      done: card.getAttribute('data-done') === 'true',
      wide: card.getAttribute('data-wide') === 'true',
      readout: card.querySelector('[data-testid="sim-tl-month"]')?.textContent ?? '',
      values,
      play: [...card.querySelectorAll('line.play')].map(shown),
      leaders: [...card.querySelectorAll('path.lead')].map(shown),
      replay: replay ? (replay.disabled ? 'disabled' : 'enabled') : 'absent',
    };
  });

/** The numbers on screen are always the file's value for the month on screen (no tween), and the readout names that month. */
function expectMonthConsistent(r: Awaited<ReturnType<typeof tlRead>>) {
  expect(r.readout).toBe(`Month ${r.month} of ${TL_LAST}`);
  const i = TL_MONTHS.indexOf(r.month);
  expect(i, `data-month ${r.month} is a month of the file`).toBeGreaterThanOrEqual(0);
  expect(r.values).toEqual(Object.fromEntries(TL_IDS.map((id) => [id, tlKey(id, TL_SERIES[id][i])])));
}

/** The finished chart: month 24, the five month-24 values of the file, no playhead, every leader drawn (wide). */
async function expectTimelineEnd(page: Page) {
  const card = T(page, 'sim-timeline');
  await expect(card).toHaveAttribute('data-done', 'true');
  await expect(card).toHaveAttribute('data-month', String(TL_LAST));
  await expect(T(page, 'sim-tl-month')).toHaveText(`Month ${TL_LAST} of ${TL_LAST}`);
  for (const id of TL_IDS) await expect(T(page, `sim-tl-value-${id}`), `head ${id}`).toHaveText(tlKey(id, last(TL_SERIES[id])));
  const r = await tlRead(page);
  expectMonthConsistent(r);
  expect(r.play, 'the playhead is hidden on the finished chart').toEqual([false]);
  expect(r.leaders, 'every leader is drawn on the finished chart (wide only)').toEqual(r.wide ? [true, true, true, true, true] : []);
}

/** One plot, five lines, no lanes; the five heads and their labels; each line's tag; the pilot band from plan.pilot_from. */
async function expectOnePlot(page: Page) {
  const card = T(page, 'sim-timeline');
  await expect(card.getByTestId('sim-tl-plot')).toHaveCount(1);
  await expect(card.locator('svg:not(.tl-glyph)'), 'one chart svg in the card').toHaveCount(1);
  for (const gone of ['sim-tl-lane-', 'sim-tl-plot-', 'sim-tl-unit-', 'sim-tl-ytick', 'sim-tl-key-']) {
    await expect(card.locator(`[data-testid^="${gone}"]`), `no ${gone}* (the three-lane card)`).toHaveCount(0);
  }
  const lines = card.getByTestId('sim-tl-plot').locator('[data-testid="sim-tl-lines"] polyline[data-line]');
  await expect(lines).toHaveCount(TL_IDS.length);
  expect((await lines.evaluateAll((els) => els.map((e) => e.getAttribute('data-line')!))).sort()).toEqual([...TL_IDS].sort());
  // each line has all 24 monthly points, inside the same plot
  for (const n of await lines.evaluateAll((els) => els.map((e) => (e.getAttribute('points') ?? '').trim().split(/\s+/).length))) expect(n).toBe(TL_MONTHS.length);
  await expect(card.getByTestId('sim-tl-plot').locator('g[data-head]')).toHaveCount(TL_IDS.length);
  const wide = (await card.getAttribute('data-wide')) === 'true';
  expect(wide, 'wide layout at 1280, phone rows at 390').toBe((page.viewportSize()?.width ?? 0) >= 900);
  if (wide) await expect(card.locator('[data-testid^="sim-tl-head-"]')).toHaveCount(TL_IDS.length);
  else await expect(T(page, 'sim-tl-rows').locator('li')).toHaveCount(TL_IDS.length);
  for (const id of TL_IDS) {
    await expect(T(page, `sim-tl-tag-${id}`), `tag of ${id}`).toHaveText(TL_TAG[TL_KIND[id]]);
    await expect(card.locator(`[data-measure="${id}"][data-kind]`).first(), `kind of ${id}`).toHaveAttribute('data-kind', TL_KIND[id]);
  }

  // The free-pilot band runs from plan.pilot_from to the month before the first paid case; the first-paid line sits on that month.
  expect(TL_PILOT_FROM, 'the file names the pilot start').toBeGreaterThan(0);
  expect(TL_FIRST_PAID).toBeGreaterThan(TL_PILOT_FROM);
  await expect(T(page, 'sim-tl-ramp')).toContainText(`Months ${TL_PILOT_FROM} to ${TL_FIRST_PAID - 1} are a free pilot`);
  const geo = await card.evaluate((el) => {
    const labels = [...el.querySelectorAll('[data-testid="sim-tl-month-label"]')].map((t) => ({ m: Number(t.textContent), x: Number(t.getAttribute('x')) }));
    const band = el.querySelector('[data-testid="sim-tl-band-rect"]')!;
    const first = el.querySelector('[data-testid="sim-tl-first-line"]')!;
    return { labels, bx: Number(band.getAttribute('x')), bw: Number(band.getAttribute('width')), fx: Number(first.getAttribute('x1')) };
  });
  const [a, b] = geo.labels;
  const perMonth = (b.x - a.x) / (b.m - a.m);
  const xOf = (m: number) => a.x + (m - a.m) * perMonth;
  expect(Math.abs(geo.bx - xOf(TL_PILOT_FROM - 0.5)), 'band starts at plan.pilot_from').toBeLessThan(1);
  expect(Math.abs(geo.bw - (TL_FIRST_PAID - TL_PILOT_FROM) * perMonth), 'band ends before the first paid month').toBeLessThan(1);
  expect(Math.abs(geo.fx - xOf(TL_FIRST_PAID)), 'first-paid line on the first paid month').toBeLessThan(1);
}

/** Card position, the values table, the label, the assumption lines, no "saved", no overflow. Opens "Show the values": call once per page. */
async function expectTimeline(page: Page) {
  const card = T(page, 'sim-timeline');
  await expect(card).toBeVisible();

  // directly under the hero, directly above the three small charts.
  const place = await card.evaluate((el) => ({
    prev: el.previousElementSibling?.getAttribute('data-testid') ?? null,
    next: el.nextElementSibling?.className ?? null,
  }));
  expect(place.prev, 'the element right above the card').toBe('sim-hero');
  expect(place.next, 'the element right below the card').toContain('sim-grid');

  // "Show the values": months 12 and 24, each cell equals the file at that month.
  await card.getByText('Show the values').click();
  const table = T(page, 'sim-tl-values').locator('table');
  await expect(table).toBeVisible();
  await expect(table.locator('thead th')).toHaveText(['Measure', ...TL_YEAR_ENDS.map((m) => `Month ${m}`)]);
  for (const [id, values] of Object.entries(TL_SERIES)) {
    await expect(table.locator(`tr[data-measure="${id}"] td`), `table row ${id}`).toHaveText(
      TL_YEAR_ENDS.map((m) => tlExact(id, values[TL_MONTHS.indexOf(m)])),
    );
  }

  // the permanent "model, not a measurement" label is on screen and solid while the card is; the assumption lines are in the card.
  await card.scrollIntoViewIfNeeded();
  await expect(T(page, 'sim-label')).toHaveText(SIM.label);
  expect(SIM.label).toMatch(/a model, not a measurement/i);
  await expect(T(page, 'sim-label')).toBeInViewport();
  const faded = await T(page, 'sim-label').evaluate((el) => {
    const bad: string[] = [];
    for (let n: Element | null = el; n && n !== document.documentElement; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (Number(cs.opacity) < 1 || cs.visibility === 'hidden') bad.push(`${n.tagName}.${n.className} opacity ${cs.opacity}`);
    }
    return bad;
  });
  expect(faded, 'the label or an ancestor is faded').toEqual([]);
  await expect(card.getByTestId('sim-tl-curve').first()).toHaveText(ASSUMPTION);
  await expect(card.getByTestId('sim-tl-dx-assumption')).toBeVisible();

  // never "saved" (CTO banned list, MIN-4699), in the visible text or the screen-reader description.
  expect(await card.textContent()).not.toMatch(/\bsav(ed|es|ings?)\b/i);

  await expectNoOverflow(page);
}

async function expectNoOverflow(page: Page) {
  expect(await overflow(page), 'px of sideways scroll on the page').toBeLessThanOrEqual(0);
  expect(await T(page, 'sim-timeline').evaluate((el) => el.scrollWidth - el.clientWidth), 'px of sideways scroll in the card').toBeLessThanOrEqual(0);
}

/**
 * A recorder in the page, on its own 20 ms timer (not requestAnimationFrame, which is the clock under test): each change of the card's month or
 * done flag, and the first moment the card meets the start rule (40% of it in view, or it fills 60% of the screen), with performance.now().
 */
const RECORDER = () => {
  const w = window as unknown as { __tl: { inView: number | null; events: { t: number; month: number; done: boolean; readout: string }[] } };
  w.__tl = { inView: null, events: [] };
  let key = '';
  setInterval(() => {
    const el = document.querySelector('[data-testid="sim-timeline"]');
    if (!el) return;
    const t = performance.now();
    const r = el.getBoundingClientRect();
    const visible = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
    if (w.__tl.inView === null && r.height > 0 && (visible / r.height >= 0.4 || visible >= 0.6 * innerHeight)) w.__tl.inView = t;
    const month = Number(el.getAttribute('data-month'));
    const done = el.getAttribute('data-done') === 'true';
    const readout = el.querySelector('[data-testid="sim-tl-month"]')?.textContent ?? '';
    if (`${month}|${done}|${readout}` !== key) { key = `${month}|${done}|${readout}`; w.__tl.events.push({ t, month, done, readout }); }
  }, 20);
};
type Rec = { inView: number | null; events: { t: number; month: number; done: boolean; readout: string }[] };
const recorded = (page: Page) => page.evaluate(() => (window as unknown as { __tl: Rec }).__tl);

/** The months the readout passed through, in order, start to done; and how long it took. */
function checkRun(rec: Rec, from: number) {
  const evs = rec.events.filter((e) => e.t >= from);
  const months = evs.map((e) => e.month);
  for (const e of evs) expect(e.readout, 'readout names the month in data-month').toBe(`Month ${e.month} of ${TL_LAST}`);
  for (let i = 1; i < months.length; i++) expect(months[i], `month went back at sample ${i}: ${months.join(',')}`).toBeGreaterThanOrEqual(months[i - 1]);
  expect(months[0], 'the run starts at the first month').toBe(TL_MONTHS[0]);
  expect(last(months)).toBe(TL_LAST);
  const seen = new Set(months);
  const missing = TL_MONTHS.filter((m) => !seen.has(m));
  expect(missing.length, `months the readout skipped: ${missing.join(',')}`).toBeLessThanOrEqual(2);
  const doneAt = evs.find((e) => e.done)?.t;
  expect(doneAt, 'the run reached its end').toBeDefined();
  return { months: [...seen], doneAt: doneAt! };
}

test.describe('/simulation timeline card, one animated plot (MIN-4726)', () => {
  test('T1 first paint: one plot with five lines and no lanes, tags, the pilot band from plan.pilot_from, the table, label, no overflow', async ({ page }) => {
    await page.goto('/health');
    await expect(page.getByTestId('env'), 'target is not the dev environment').toHaveText('dev', { timeout: 15_000 });
    await page.goto('/simulation');
    await expect(T(page, 'simulation')).toHaveAttribute('data-state', 'playing');
    await expectOnePlot(page);
    expectMonthConsistent(await tlRead(page));
    await expectTimeline(page);
  });

  test('T2 the run: waits for the card, then month 1 to 24 in about 12 s through the months between; leaders hidden mid-run, shown at the end', async ({ page }) => {
    test.setTimeout(90_000);
    await page.addInitScript(RECORDER);
    await page.goto('/health');
    await expect(page.getByTestId('env'), 'target is not the dev environment').toHaveText('dev', { timeout: 15_000 });
    await page.goto('/simulation');
    const card = T(page, 'sim-timeline');
    await expect(card).toBeVisible();

    // Before the card is in view it holds month 1 (the hero plays above it).
    await page.waitForTimeout(2_500);
    const early = await recorded(page);
    test.info().annotations.push({ type: 'load', description: early.inView === null ? 'card below the 40% rule at load: held month 1 for 2.5 s' : 'card met the start rule at load' });
    if (early.inView === null) {
      const r = await tlRead(page);
      expect(r.month, 'month before the card is in view').toBe(TL_MONTHS[0]);
      expect(r.done).toBe(false);
      expect(r.replay, 'Replay waits for the end').toBe('disabled');
    }
    await card.scrollIntoViewIfNeeded();

    // Mid-run: a month between, its numbers are the file's for that month, the playhead moves, no leader, Replay off, no overflow.
    await expect.poll(async () => (await tlRead(page)).month, { timeout: 10_000 }).toBeGreaterThanOrEqual(6);
    const mid = await tlRead(page);
    expect(mid.month, `mid-run month ${mid.month}`).toBeLessThan(TL_LAST);
    expect(mid.done).toBe(false);
    expectMonthConsistent(mid);
    expect(mid.play, 'the playhead is drawn mid-run').toEqual([true]);
    expect(mid.leaders, 'no leader while the run plays').toEqual(mid.wide ? [false, false, false, false, false] : []);
    expect(mid.replay).toBe('disabled');
    await expectNoOverflow(page);

    await expect(card).toHaveAttribute('data-done', 'true', { timeout: 20_000 });
    const rec = await recorded(page);
    expect(rec.inView, 'the card met the start rule').not.toBeNull();
    const run = checkRun(rec, 0);
    const took = run.doneAt - rec.inView!;
    test.info().annotations.push({ type: 'run', description: `${took.toFixed(0)} ms from 40% in view to done; months seen ${run.months.length}/${TL_MONTHS.length}` });
    expect(took, 'ms from the card in view to the end of the run').toBeGreaterThanOrEqual(TL_RUN_MS - 600);
    expect(took).toBeLessThanOrEqual(TL_RUN_MS + 2_000);

    await expectTimelineEnd(page);
    expect((await tlRead(page)).replay).toBe('enabled');
    await page.waitForTimeout(1_500);
    await expectTimelineEnd(page);
    await expectNoOverflow(page);
  });

  test('T3 Replay starts the run again from month 1 and lands on the same month-24 values', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop-1280', 'one viewport is enough for the replay');
    test.setTimeout(90_000);
    await page.addInitScript(RECORDER);
    await page.goto('/simulation');
    const card = T(page, 'sim-timeline');
    await card.scrollIntoViewIfNeeded();
    await expect(card).toHaveAttribute('data-done', 'true', { timeout: 25_000 });
    await expectTimelineEnd(page);

    const clickedAt = await page.evaluate(() => performance.now());
    await T(page, 'sim-tl-replay').click();
    await expect(card).toHaveAttribute('data-done', 'false');
    const r = await tlRead(page);
    expect(r.month, 'Replay goes back to the start').toBeLessThanOrEqual(TL_MONTHS[1]);
    expect(r.replay).toBe('disabled');
    expect(r.leaders).toEqual([false, false, false, false, false]);
    await expect(card).toHaveAttribute('data-done', 'true', { timeout: 20_000 });
    const run = checkRun(await recorded(page), clickedAt);
    const took = run.doneAt - clickedAt;
    test.info().annotations.push({ type: 'replay', description: `${took.toFixed(0)} ms from the Replay click to done; months seen ${run.months.length}/${TL_MONTHS.length}` });
    expect(took).toBeGreaterThanOrEqual(TL_RUN_MS - 600);
    expect(took).toBeLessThanOrEqual(TL_RUN_MS + 2_000);
    await expectTimelineEnd(page);
  });

  test('T4 reduced motion: the finished chart at once, no Replay, nothing moves; the hero is finished too', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/simulation');
    await expect(T(page, 'simulation')).toHaveAttribute('data-state', 'done', { timeout: 3_000 });
    await expect(T(page, 'sim-timeline')).toHaveAttribute('data-done', 'true', { timeout: 3_000 });
    await expect(T(page, 'sim-tl-replay')).toHaveCount(0);
    await expectTimelineEnd(page);
    const before = await tlRead(page);
    await page.waitForTimeout(3_000);
    expect(await tlRead(page)).toEqual(before);
    await expectOnePlot(page);
    await expectTimeline(page);
    await expectEnd(page);
  });
});

async function signIn(page: Page) {
  await page.goto('/health');
  await expect(page.getByTestId('env'), 'target is not the dev environment').toHaveText('dev', { timeout: 15_000 });
  await page.goto('/login');
  const field = page.getByLabel('Demo passcode');
  const clear = () => field.fill('', { timeout: 2_000 }).catch(() => {});
  try {
    await field.fill(PASSCODE);
    await page.getByTestId('login-doctor').click();
    await clear();
    await page.waitForURL(/\/doctor$/, { timeout: 30_000 });
  } catch {
    await clear();
    throw new Error('sign-in as doctor did not land on /doctor');
  }
}

const FIXED = ['sim-page-label', 'sim-machine-label', 'sim-matching-label', 'sim-contact-label'];

/** Each fixed label that is in the DOM is fully opaque, with no faded or moving ancestor. */
const fixedLabelsSolid = (page: Page) =>
  page.evaluate((ids) => {
    const bad: string[] = [];
    for (const id of ids) {
      const el = document.querySelector(`[data-testid="${id}"]`);
      if (!el) continue;
      for (let n: Element | null = el; n && n !== document.documentElement; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (Number(cs.opacity) < 1 || cs.visibility === 'hidden' || cs.display === 'none') bad.push(`${id}: ${n.tagName}.${n.className} opacity ${cs.opacity}`);
      }
    }
    return bad;
  }, FIXED);

test.describe('/doctor/simulate (demo doctor)', () => {
  test.skip(!PASSCODE, 'HEALTHAPP_DEMO_PASSCODE not set');

  test('D1 one click runs machine, dots, filters, matches; the four fixed labels stay solid; a card unlocks', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop-1280', 'the full run is checked at desktop; W2 covers the phone');
    test.setTimeout(170_000);
    await signIn(page);
    await page.goto('/doctor/simulate');
    await mockSimulateLive(page);
    await expect(T(page, 'sim-page-label')).toBeVisible();
    expect(await fixedLabelsSolid(page)).toEqual([]);

    // sample the labels while the run plays, from the click to the matches
    const samples: string[] = [];
    let sampling = true;
    const sampler = (async () => {
      while (sampling) {
        samples.push(...(await fixedLabelsSolid(page).catch(() => [])));
        await page.waitForTimeout(250);
      }
    })();
    await T(page, 'sim-run').click();
    await expect(T(page, 'sim-machine-label')).toBeVisible();
    await expect(T(page, 'sim-dots')).toBeVisible({ timeout: 30_000 });
    await expect(T(page, 'sim-matching-label')).toBeVisible({ timeout: 60_000 });
    await expect(T(page, 'sim-step-5')).toContainText('5 is 5 or more', { timeout: 90_000 });
    await expect(T(page, 'sim-count-line')).toBeVisible({ timeout: 30_000 });
    await expect(T(page, 'sim-contact-label')).toBeVisible();
    sampling = false;
    await sampler;
    expect(samples, 'a fixed label was faded or hidden at some sample').toEqual([]);
    for (const id of FIXED) await expect(T(page, id)).toBeVisible();

    await expect(T(page, 'sim-growth-link')).toHaveAttribute('href', '/simulation');
    await expect(T(page, 'sim-unlocked-1')).toHaveCount(0);
    await T(page, 'sim-ask-1').click();
    await expect(T(page, 'sim-card-1')).toHaveAttribute('data-unlocked', 'true', { timeout: 30_000 });
    await expect(T(page, 'sim-unlocked-1')).toContainText('Dummy exams');
    expect(await fixedLabelsSolid(page)).toEqual([]);
  });

  test('D2 reduced motion: every stage shows its finished state and the card unlocks at once', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop-1280', 'desktop only');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await signIn(page);
    await page.goto('/doctor/simulate');
    await mockSimulateLive(page);
    await T(page, 'sim-run').click();
    await expect(T(page, 'sim-count-line')).toBeVisible({ timeout: 5_000 });
    for (let i = 1; i <= 5; i++) await expect(T(page, `sim-step-${i}`)).toBeVisible();
    for (const id of FIXED) await expect(T(page, id)).toBeVisible();
    expect(await fixedLabelsSolid(page)).toEqual([]);
    await T(page, 'sim-ask-1').click();
    await expect(T(page, 'sim-card-1')).toHaveAttribute('data-unlocked', 'true', { timeout: 2_000 });
  });

  test('W2 at 390 px, no horizontal overflow before, during and after the run', async ({ page }, info) => {
    test.skip(info.project.name !== 'phone-390', 'phone project only');
    test.setTimeout(170_000);
    await signIn(page);
    await page.goto('/doctor/simulate');
    await mockSimulateLive(page);
    expect(await overflow(page), 'px of sideways scroll before the run').toBeLessThanOrEqual(0);
    await T(page, 'sim-run').click();
    await expect(T(page, 'sim-dots')).toBeVisible({ timeout: 30_000 });
    expect(await overflow(page), 'px of sideways scroll during the run').toBeLessThanOrEqual(0);
    await expect(T(page, 'sim-count-line')).toBeVisible({ timeout: 120_000 });
    expect(await overflow(page), 'px of sideways scroll at the result').toBeLessThanOrEqual(0);
    await expect(T(page, 'sim-ask-1')).toBeVisible();
  });
});
