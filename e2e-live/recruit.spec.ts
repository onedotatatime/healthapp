import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Page } from '@playwright/test';
import { expect, test, watchNoPost } from './helpers/no-post';

// One-flow /doctor/simulate (MIN-4736, scenarios and rewrite MIN-4743; first built as MIN-4706/4711/4712). Synthetic data only.
// "Search the records" is the only call to action: it replays the recorded 50,000 boxd run (data/synthetic/recruit-50000.vm.json),
// draws 50,000 dots, lights four stages, then says "Asked XX. Found XX.". recruit() runs in the browser; the page makes no POST.
// Every number below is read from data/synthetic/recruit-50000.json (`expected`, `n`, `opted_in`) or the vm file, never typed.
// R1 to R6 run with reduced motion, which shows the end state of a run at once; R7 is the one full-motion run (about 11 s).
// Target: staging-dev / dev. Sign-in: the dev demo passcode from HEALTHAPP_DEMO_PASSCODE, never logged, no trace/video.
// Run: set -a; . ~/.config/healthapp/demo-login.env; set +a; npx playwright test -c playwright.simulation.config.ts e2e-live/recruit.spec.ts
const PASSCODE = process.env.HEALTHAPP_DEMO_PASSCODE ?? '';

type Expected = { shown: true; eligible: number; countries: string[] } | { shown: false };
const file = JSON.parse(readFileSync(path.resolve('data/synthetic/recruit-50000.json'), 'utf8')) as {
  n: number;
  opted_in: number;
  codes: string[];
  age_bands: string[];
  conditions: { id: string; must: string[]; some: string[]; min_some: number }[];
  records: [string, number, number, number[]][];
  expected: Record<string, Expected>;
};
const vm = JSON.parse(readFileSync(path.resolve('data/synthetic/recruit-50000.vm.json'), 'utf8')) as {
  started_at: string;
  phases: { id: string; log: string }[];
};
const nf = (n: number) => n.toLocaleString('en-US');
const exp = (id: string) => file.expected[id] as { shown: true; eligible: number; countries: string[] };
const region = new Intl.DisplayNames(['en'], { type: 'region' });
const FOUNDER = 'i want to recruit 40 people matching the rheumatoid arthritis desease for a trial';
/** "15 Nov 2026, 08:04 UTC", written by the rule, not by the app's formatter. */
const runTime = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()]} ${d.getUTCFullYear()}, ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`;
};

/**
 * The rows the search selects, worked out here from the file by the CTO's rule (MIN-4706): opted in, every must, at least min_some of
 * the some codes; the first min(asked, eligible) in file order. Never read from the app. Its eligible count is held to `expected`.
 */
function selectRows(id: string, asked: number | null) {
  const c = file.conditions.find((x) => x.id === id)!;
  const idx = (code: string) => file.codes.indexOf(code);
  const must = c.must.map(idx);
  const some = c.some.map(idx);
  const eligible = file.records
    .map((r, row) => ({ r, row }))
    .filter(({ r }) => r[2] === 1 && must.every((m) => r[3].includes(m)) && some.filter((m) => r[3].includes(m)).length >= c.min_some)
    .map(({ row }) => row);
  return asked ? eligible.slice(0, asked) : eligible;
}
/** What the selected rows share, counted again here: the count of each code, and of each age band. */
function commonOfRows(rows: number[]) {
  const count = new Map<string, number>();
  const bands = new Map<string, number>();
  for (const row of rows) {
    const r = file.records[row];
    bands.set(file.age_bands[r[1]], (bands.get(file.age_bands[r[1]]) ?? 0) + 1);
    for (const i of r[3]) count.set(file.codes[i], (count.get(file.codes[i]) ?? 0) + 1);
  }
  const n = rows.length;
  return {
    n,
    all: [...count].filter(([, c]) => c === n).map(([code]) => code),
    half: [...count].filter(([, c]) => c < n && c * 2 >= n).map(([code, c]) => ({ code, count: c })),
    bands: file.age_bands.filter((b) => bands.has(b)).map((b) => `${b}: ${bands.get(b)}`),
  };
}
const ATTRS_ALLOWED = new Set(['class', 'data-testid', 'data-record', 'data-code', 'data-count', 'id', 'aria-labelledby', 'aria-live', 'role', 'tabindex', 'type', 'style']);

async function signInDoctor(page: Page) {
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

async function search(page: Page, sentence: string) {
  await page.getByTestId('recruit-input').fill(sentence);
  await page.getByTestId('recruit-submit').click();
}
const funnel = async (page: Page) => {
  const out: number[] = [];
  for (const k of ['records', 'optedIn', 'eligible', 'selected']) {
    const t = await page.getByTestId(`recruit-funnel-${k}`).locator('.rc-num').innerText();
    out.push(Number(t.replace(/,/g, '')));
  }
  return out;
};

test.describe('one-flow simulate (doctor, staging-dev)', () => {
  test.skip(!PASSCODE, 'HEALTHAPP_DEMO_PASSCODE not set');
  test.use({ viewport: { width: 1280, height: 900 }, hasTouch: false, isMobile: false });

  let bad: string[];
  /** Signed in, on the page, the records loaded (the intro names their count), and the no-POST watch armed. */
  async function open(page: Page, baseURL: string | undefined) {
    await signInDoctor(page);
    await page.goto('/doctor/simulate');
    await expect(page.getByTestId('recruit-intro')).toContainText(nf(file.n), { timeout: 30_000 });
    bad = watchNoPost(page, new URL(baseURL!).origin);
  }
  test.afterEach(() => {
    expect(bad, 'any POST or request beyond the app GET assets: the page must call no backend').toEqual([]);
  });

  test.describe('end states (reduced motion)', () => {
    test.use({ reducedMotion: 'reduce' });
    test.beforeEach(async ({ page, baseURL }) => open(page, baseURL));

    test('R1 the founder sentence: read 40 + RA, Asked 40 Found 40, funnel and countries from the file, one CTA, nothing moves after', async ({ page }) => {
      await expect(page.getByTestId('sim-page-label')).toHaveText('Seeded synthetic data. Not real patients.');
      expect(file.records.length, 'the file holds exactly 50,000 records').toBe(50_000);
      // one flow: the old Run / Run again button and the demo-patient flow are not in the DOM, and no string says 5,000
      await expect(page.getByTestId('sim-run')).toHaveCount(0);
      await expect(page.getByRole('button', { name: /run the simulation|run again/i })).toHaveCount(0);
      expect(await page.locator('body').innerText(), 'no string says 5,000').not.toMatch(/(?<![\d,])5,000(?!\d)/);

      await search(page, FOUNDER);
      const e = exp('rheumatoid_arthritis');
      await expect(page.getByTestId('recruit-result')).toHaveAttribute('data-condition', 'rheumatoid_arthritis');
      await expect(page.getByTestId('recruit-read')).toContainText('40 records, Rheumatoid arthritis');
      await expect(page.getByTestId('recruit-line')).toHaveText('Asked 40. Found 40.');
      await expect(page.getByTestId('recruit-more')).toContainText(`${nf(e.eligible - 40)} more records`);
      expect(await funnel(page)).toEqual([50_000, file.opted_in, e.eligible, 40]);
      await expect(page.getByTestId('recruit-compared')).toContainText('Compared:');
      const shown = (await page.getByTestId('recruit-countries').innerText()).replace(/^[^:]*:\s*/, '').replace(/\.$/, '').split(', ');
      const allowed = e.countries.map((c) => region.of(c)!);
      expect(shown.length, 'at least one country of the selected records').toBeGreaterThan(0);
      for (const c of shown) expect(allowed, `${c} is not a country of an eligible record`).toContain(c);
      await expect(page.getByTestId('sim-page-label')).toBeVisible();
      await expect(page.getByTestId('sim-machine-label')).toHaveText(`Recorded run on a boxd machine, ${runTime(vm.started_at)}. Replayed here, not live.`);
      await expect(page.getByTestId('sim-canvas')).toBeVisible();

      const before = await page.getByTestId('sim-records').innerText();
      await page.waitForTimeout(1500);
      expect(await page.getByTestId('sim-records').innerText(), 'nothing changes after the end state').toBe(before);
      await expect(page.getByTestId('recruit-submit')).toBeEnabled();

      // MIN-4756: the profiles of the 40 selected records and what they have in common, worked out here from the file
      const rows = selectRows('rheumatoid_arthritis', 40);
      expect(rows.length, 'this spec picks the same count as the file says is eligible').toBe(40);
      expect(selectRows('rheumatoid_arthritis', null).length, 'this spec and the file agree on eligible').toBe(e.eligible);
      const cond = file.conditions.find((c) => c.id === 'rheumatoid_arthritis')!;
      const profiles = page.getByTestId('recruit-profiles');
      const cards = page.getByTestId('recruit-profile');
      await expect(profiles.getByRole('heading')).toHaveText(`The ${rows.length} selected records, one by one`);
      await expect(page.getByTestId('recruit-profiles-note')).toHaveText('Shown one by one because these records are synthetic. On real records the matching answers in groups, never one record at a time.');
      await expect(page.getByTestId('recruit-profiles-showing')).toHaveText(`Showing 20 of ${rows.length}`);
      await expect(cards).toHaveCount(20);
      const more = page.getByTestId('recruit-profiles-more');
      await expect(more).toHaveText(`Show ${rows.length - 20} more`);
      expect((await more.boundingBox())!.height, 'the button is at least 44 px high').toBeGreaterThanOrEqual(44);
      // order on the page: result line, profiles, then the common block
      const order = await page.evaluate(() => ['recruit-line', 'recruit-profiles', 'recruit-common'].map((id) => {
        const el = document.querySelector(`[data-testid="${id}"]`)!;
        return Array.prototype.indexOf.call(document.querySelectorAll('*'), el);
      }));
      expect(order[0] < order[1] && order[1] < order[2], 'the result line, then the profiles, then what they have in common').toBe(true);
      await more.click();
      await expect(cards).toHaveCount(rows.length);
      await expect(more, 'the button is gone when every card is on').toHaveCount(0);
      await expect(page.getByTestId('recruit-profiles-showing')).toHaveText(`Showing ${rows.length} of ${rows.length}`);
      // card i is row rows[i]: its position, country, age band and as many codes as the row holds
      for (let i = 0; i < rows.length; i++) {
        const r = file.records[rows[i]];
        const card = cards.nth(i);
        await expect(card, `card ${i + 1} is the ${i + 1}st selected record`).toHaveAttribute('data-record', String(i + 1));
        await expect(card).toContainText(`Record ${i + 1}`);
        await expect(card).toContainText(`Country: ${region.of(r[0])}`);
        await expect(card).toContainText(`Age band: ${file.age_bands[r[1]]}`);
        expect((await card.getByTestId('recruit-profile-codes').innerText()).split(', ').length, `card ${i + 1} shows every code of its row`).toBe(r[3].length);
      }
      // never the file's row index, never a name, a button or a link on a card, never "Gp" or "VitD"
      const attrs = await page.evaluate(() => [...document.querySelectorAll('[data-testid="recruit-profiles"], [data-testid="recruit-profiles"] *, [data-testid="recruit-common"], [data-testid="recruit-common"] *')]
        .flatMap((el) => [...el.attributes].map((a) => [a.name, a.value] as const)));
      for (const [name, value] of attrs) {
        expect(ATTRS_ALLOWED.has(name), `attribute ${name} is not one the profiles use`).toBe(true);
        if (!['data-record', 'data-count'].includes(name)) expect(value, `${name} holds no bare number: a file row index would be one`).not.toMatch(/^\d+$/);
      }
      expect(await cards.locator('a, button, img, svg').count(), 'a card has no button, link or picture').toBe(0);
      const cardText = (await cards.allInnerTexts()).join('\n');
      expect(cardText, 'no card shows "Gp" or "VitD"').not.toMatch(/\bGp\b|VitD/);
      expect(cardText).not.toMatch(/Record 0\b|Record 4[1-9]\b|Record \d{3,}/);
      for (const [code, words] of [['spec_gp', 'General practice'], ['vitD_low', 'Vitamin D low'], ['HLA_B27_positive', 'HLA-B27 positive']] as const) {
        if (rows.some((row) => file.records[row][3].includes(file.codes.indexOf(code)))) expect(cardText, `${code} reads ${words}`).toContain(words);
      }
      await expect(page.getByTestId('sim-page-label')).toBeVisible();

      // what they have in common
      const common = commonOfRows(rows);
      const block = page.getByTestId('recruit-common');
      await expect(block.getByRole('heading')).toHaveText('What they have in common');
      await expect(page.getByTestId('recruit-common-all-title')).toHaveText(`All ${rows.length} have`);
      const allCodes = await page.getByTestId('recruit-common-all').locator('li').evaluateAll((els) => els.map((el) => el.getAttribute('data-code')));
      expect([...allCodes].sort(), 'the codes all 40 hold').toEqual([...common.all].sort());
      for (const m of cond.must) expect(allCodes, `the must code ${m} is held by all ${rows.length}`).toContain(m);
      const half = await page.getByTestId('recruit-common-half').locator('li').evaluateAll((els) => els.map((el) => ({ code: el.getAttribute('data-code'), count: Number(el.getAttribute('data-count')), text: (el as HTMLElement).innerText })));
      expect(half.map((h) => h.code).sort(), 'the codes at least half hold').toEqual(common.half.map((h) => h.code).sort());
      for (const h of half) {
        expect(h.count, `${h.code}: the count shown equals the spec's own count`).toBe(common.half.find((x) => x.code === h.code)!.count);
        expect(h.text).toContain(`${h.count} of ${rows.length}`);
        expect(h.count, `${h.code} is neither all nor under half`).toBeLessThan(rows.length);
      }
      expect(half.map((h) => h.count), 'highest count first').toEqual([...half.map((h) => h.count)].sort((a, b) => b - a));
      await expect(page.getByTestId('recruit-common-ages')).toHaveText(`Age bands: ${common.bands.join(', ')}.`);
    });

    test('R2 fewer found than asked (sarcoid, 40): one sentence with both numbers, funnel still shows', async ({ page }) => {
      const e = exp('rare_sarcoid_like');
      await search(page, 'I want to recruit 40 people matching sarcoidosis for a trial');
      await expect(page.getByTestId('recruit-line')).toHaveText(`Found ${e.eligible} of the 40 asked. No other record fits these criteria.`);
      expect(await funnel(page)).toEqual([50_000, file.opted_in, e.eligible, e.eligible]);
      await expect(page.getByTestId('recruit-more')).toHaveCount(0);
      // MIN-4756: 6 profiles, counts "of 6", no Show more
      await expect(page.getByTestId('recruit-profile')).toHaveCount(e.eligible);
      await expect(page.getByTestId('recruit-profiles-showing')).toHaveText(`Showing ${e.eligible} of ${e.eligible}`);
      await expect(page.getByTestId('recruit-profiles-more'), 'six cards fit in the first twenty').toHaveCount(0);
      const rows = selectRows('rare_sarcoid_like', 40);
      expect(rows.length).toBe(e.eligible);
      const common = commonOfRows(rows);
      await expect(page.getByTestId('recruit-common-all-title')).toHaveText(`All ${e.eligible} have`);
      const half = await page.getByTestId('recruit-common-half').locator('li').evaluateAll((els) => els.map((el) => ({ code: el.getAttribute('data-code'), count: Number(el.getAttribute('data-count')), text: (el as HTMLElement).innerText })));
      expect(half.map((h) => h.code).sort()).toEqual(common.half.map((h) => h.code).sort());
      for (const h of half) expect(h.text).toContain(`${common.half.find((x) => x.code === h.code)!.count} of ${e.eligible}`);
      expect(await page.getByTestId('recruit-common').innerText(), 'every count is over the six').not.toMatch(/ of (?!6\b)\d+/);
    });

    for (const [id, word] of [['rare_copper_metabolism', 'wilson disease'], ['rare_myopathy', 'myopathy']] as const) {
      test(`R3 under 5 (${id}): one sentence, no count, no funnel, no countries, the run stops after opted in`, async ({ page }) => {
        expect(file.expected[id].shown).toBe(false);
        await search(page, `I want to recruit 10 people matching ${word} for a trial`);
        await expect(page.getByTestId('recruit-few')).toHaveText('Fewer than 5 records fit these criteria, so nothing is shown.');
        for (const t of ['recruit-funnel', 'recruit-line', 'recruit-countries', 'recruit-found']) await expect(page.getByTestId(t)).toHaveCount(0);
        await expect(page.getByTestId('sim-canvas'), 'the fit stage is never drawn').not.toHaveAttribute('aria-label', /fit the criteria/);
        // MIN-4756: nothing of the new sections, no heading, no card, no count
        for (const t of ['recruit-profiles', 'recruit-profile', 'recruit-profiles-more', 'recruit-common']) await expect(page.getByTestId(t), `${t} is not in the DOM`).toHaveCount(0);
        expect(await page.locator('body').innerText()).not.toMatch(/Record 1\b|What they have in common|selected records, one by one/);
      });
    }

    test('R4 unknown condition (asthma): sentence + 13 buttons, no run, a button fills the box, search then works', async ({ page }) => {
      await search(page, 'I want to recruit 40 people matching asthma for a trial');
      await expect(page.getByTestId('recruit-unknown')).toBeVisible();
      await expect(page.locator('[data-testid^="recruit-pick-"]')).toHaveCount(Object.keys(file.expected).length);
      await expect(page.getByTestId('recruit-result')).toHaveCount(0);
      for (const t of ['sim-machine', 'sim-records']) await expect(page.getByTestId(t), 'no machine, no dots').toHaveCount(0);
      await page.getByTestId('recruit-pick-gout').click();
      await expect(page.getByTestId('recruit-input')).not.toHaveValue('');
      await expect(page.getByTestId('sim-machine'), 'a button only fills the box').toHaveCount(0);
      await page.getByTestId('recruit-input').press('Enter');
      await expect(page.getByTestId('recruit-result')).toHaveAttribute('data-condition', 'gout');
      await expect(page.getByTestId('recruit-line')).toBeVisible();
    });

    test('R5 bad requests each get their own sentence and clear the earlier result: empty box, above 50,000, no number, zero', async ({ page }) => {
      await page.getByTestId('recruit-submit').click();
      await expect(page.getByTestId('recruit-empty')).toBeVisible();
      await expect(page.getByTestId('sim-machine')).toHaveCount(0);

      await search(page, FOUNDER);
      await expect(page.getByTestId('recruit-line')).toHaveText('Asked 40. Found 40.');
      await search(page, 'I want to recruit 60,000 people matching gout for a trial');
      await expect(page.getByTestId('recruit-too-many')).toContainText(`more than the ${nf(file.n)} records`);
      for (const t of ['recruit-funnel', 'recruit-line', 'sim-machine', 'sim-records']) await expect(page.getByTestId(t), 'the earlier result is gone').toHaveCount(0);

      const gout = exp('gout').eligible;
      for (const s of ['I want to recruit gout people for a trial', 'I want to recruit 0 people matching gout for a trial']) {
        await search(page, s);
        await expect(page.getByTestId('recruit-no-number')).toBeVisible();
        await expect(page.getByTestId('recruit-line')).toHaveText(`Found ${nf(gout)} records that fit these criteria.`);
      }
    });

    test('R6 funnel never grows, and the same sentence twice gives the same numbers, for 10 common conditions typed by name', async ({ page }) => {
      const names: Record<string, string> = {
        inflammatory_back_pain: 'inflammatory back pain', hypothyroid: 'hypothyroidism', type2_diabetes_metabolic: 'type 2 diabetes',
        iron_deficiency: 'iron deficiency anaemia', lupus_like: 'lupus', gout: 'gout', hyperthyroid: 'hyperthyroidism',
        reduced_kidney_function: 'chronic kidney disease', low_bone_density: 'osteoporosis', rheumatoid_arthritis: 'rheumatoid arthritis',
      };
      for (const [id, word] of Object.entries(names)) {
        await search(page, `I want to recruit 25 people matching ${word} for a trial`);
        await expect(page.getByTestId('recruit-result')).toHaveAttribute('data-condition', id);
        await expect(page.getByTestId('recruit-line')).toBeVisible();
        const f = await funnel(page);
        expect(f, id).toEqual([50_000, file.opted_in, exp(id).eligible, 25]);
        expect(f[0] >= f[1] && f[1] >= f[2] && f[2] >= f[3], `${id} funnel does not grow`).toBe(true);
      }
      await search(page, `I want to recruit 25 people matching gout for a trial`);
      await expect(page.getByTestId('recruit-result')).toHaveAttribute('data-condition', 'gout');
      expect(await funnel(page), 'the same sentence twice, the same numbers').toEqual([50_000, file.opted_in, exp('gout').eligible, 25]);
    });
  });

  test('R7 full motion, the founder sentence: machine replay, dots, four stages in order, the result only after the last, then a second search', async ({ page, baseURL }) => {
    test.setTimeout(90_000);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await open(page, baseURL);
    const e = exp('rheumatoid_arthritis');

    // an in-page sampler: every 50 ms the lit funnel rows, the canvas label, whether the result is on screen, the fixed labels' opacity
    await page.evaluate(() => {
      const log: { t: number; lit: number; label: string; result: boolean; sections: boolean; solid: boolean; machineLines: number }[] = [];
      (window as unknown as { __log: typeof log }).__log = log;
      const t0 = performance.now();
      setInterval(() => {
        const q = (id: string) => document.querySelector(`[data-testid="${id}"]`);
        const solid = ['sim-page-label', 'sim-machine-label'].every((id) => {
          for (let n: Element | null = q(id); n && n !== document.documentElement; n = n.parentElement) if (Number(getComputedStyle(n).opacity) < 1) return false;
          return true;
        });
        log.push({
          t: performance.now() - t0,
          lit: document.querySelectorAll('[data-testid^="recruit-funnel-"].show').length,
          label: q('sim-canvas')?.getAttribute('aria-label') ?? '',
          result: !!q('recruit-line'),
          sections: !!q('recruit-profiles') || !!q('recruit-common') || !!q('recruit-profile'),
          solid,
          machineLines: document.querySelectorAll('[data-testid^="sim-machine-line-"]').length,
        });
      }, 50);
    });

    const t0 = Date.now();
    await search(page, FOUNDER);
    await expect(page.getByTestId('recruit-submit'), 'one simulation at a time').toBeDisabled();
    await expect(page.getByTestId('recruit-read')).toContainText('40 records, Rheumatoid arthritis'); // what was read shows at once
    await expect(page.getByTestId('recruit-line'), 'the result is not on screen at the click').toHaveCount(0);
    for (const t of ['recruit-profiles', 'recruit-common']) await expect(page.getByTestId(t), `${t} is not on screen at the click`).toHaveCount(0);
    await expect(page.getByTestId('sim-machine')).toHaveAttribute('data-mode', 'replay');
    await expect(page.getByTestId('sim-machine-label')).toHaveText(`Recorded run on a boxd machine, ${runTime(vm.started_at)}. Replayed here, not live.`);
    for (const p of vm.phases) await expect(page.getByTestId(`sim-machine-line-${p.id}`)).toContainText(p.log);
    await expect(page.getByTestId('sim-canvas')).toBeVisible({ timeout: 15_000 });
    // 50,000 dots: the canvas holds drawn (non-transparent) pixels
    await expect.poll(() => page.getByTestId('sim-canvas').evaluate((c: HTMLCanvasElement) => {
      const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
      let on = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 0) on++;
      return on;
    }), { message: 'the canvas is drawn', timeout: 15_000 }).toBeGreaterThan(1000);

    await expect(page.getByTestId('recruit-line')).toHaveText('Asked 40. Found 40.', { timeout: 30_000 });
    const elapsed = Date.now() - t0;
    expect(elapsed, 'the run is an animation, not instant (ms from the click)').toBeGreaterThan(5_000);
    expect(await funnel(page)).toEqual([50_000, file.opted_in, e.eligible, 40]);
    await expect(page.getByTestId('recruit-submit')).toBeEnabled();

    const log = await page.evaluate(() => (window as unknown as { __log: { t: number; lit: number; label: string; result: boolean; sections: boolean; solid: boolean; machineLines: number }[] }).__log);
    const lits = log.map((s) => s.lit);
    expect(lits.every((v, i) => i === 0 || v >= lits[i - 1]), 'lit stages only ever grow').toBe(true);
    for (const n of [1, 2, 3, 4]) expect(lits, `stage ${n} was seen lit`).toContain(n);
    const firstResult = log.findIndex((s) => s.result);
    expect(firstResult, 'the result appeared').toBeGreaterThan(-1);
    expect(log[firstResult].lit, 'all four stages are lit when the result first shows').toBe(4);
    expect(log.filter((s) => s.lit < 4).every((s) => !s.result), 'the result is never on screen before the last stage').toBe(true);
    expect(log.filter((s) => s.lit < 4 || !s.result).every((s) => !s.sections), 'profiles and common never show before the last stage or before the result line').toBe(true);
    expect(log.some((s) => s.sections), 'the sections did appear').toBe(true);
    await expect(page.getByTestId('recruit-profiles')).toBeVisible();
    await expect(page.getByTestId('recruit-common')).toBeVisible();
    const stageLabels = log.map((s) => s.label).filter((l, i, a) => l && l !== a[i - 1]);
    expect(stageLabels.length, 'the canvas label changed with every stage (all, opted in, fit, selected)').toBeGreaterThanOrEqual(4);
    expect(log.every((s) => s.solid), 'the page label and the machine label stayed solid').toBe(true);
    expect(Math.max(...log.map((s) => s.machineLines))).toBe(vm.phases.length);

    // a second search after a finished run starts a new simulation and lands on its own numbers
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await search(page, 'I want to recruit 25 people matching gout for a trial');
    await expect(page.getByTestId('recruit-result')).toHaveAttribute('data-condition', 'gout');
    await expect(page.getByTestId('recruit-line')).toHaveText('Asked 25. Found 25.');
    expect(await funnel(page)).toEqual([50_000, file.opted_in, exp('gout').eligible, 25]);
    await expect(page.getByTestId('recruit-profiles'), 'the new run is its own: 25 cards for gout, one list').toHaveCount(1);
    await expect(page.getByTestId('recruit-profile')).toHaveCount(20);
    await expect(page.getByTestId('recruit-profiles-showing')).toHaveText('Showing 20 of 25');
  });
});
