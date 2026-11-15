import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test';

// MIN-4668, slice 1 of the live doctor dashboard (MIN-4659) on staging-dev: env dev, schema healthapp_dev, synthetic personas only.
// The passcode comes from the environment, is cleared from the field right after submit, and is never logged or screenshotted.
// One handshake per project, then the scenarios run in order on the same workspace. Copy, layout and styling are not checked here (unit tests do that).
const PASSCODE = process.env.HEALTHAPP_DEMO_PASSCODE ?? '';
const RPC_MATCHES = /\/rest\/v1\/rpc\/healthapp_possible_matches/;
const FN_OVER_TIME = /\/functions\/v1\/[^/?]*over-time/;
const FN_ASSISTANT = /\/functions\/v1\/[^/?]*assistant/;
const FN_DIAGNOSES = /\/functions\/v1\/[^/?]*diagnoses/;

async function signIn(page: Page, persona: 'patient' | 'doctor') {
  await page.goto('/health');
  await expect(page.getByTestId('env'), 'target is not dev: aborting before sign-in').toHaveText('dev', { timeout: 15_000 });
  await expect(page.getByTestId('schema'), 'target schema is not healthapp_dev: aborting before sign-in').toHaveText('healthapp_dev');
  await page.goto('/login');
  const field = page.getByLabel('Demo passcode');
  const clear = () => field.fill('', { timeout: 2_000 }).catch(() => {});
  try {
    await field.fill(PASSCODE);
    await page.getByTestId(`login-${persona}`).click();
    await clear();
    await page.waitForURL(new RegExp(`/${persona}$`), { timeout: 30_000 });
  } catch {
    await clear();
    throw new Error(`sign-in did not reach /${persona}`);
  }
}

async function endAccessIfRunning(patient: Page) {
  const end = patient.getByRole('button', { name: 'End access' });
  const running = await end.or(patient.getByTestId('share-short-code')).first().waitFor({ timeout: 20_000 }).then(() => end.isVisible()).catch(() => false);
  if (running) {
    await end.click();
    await expect(patient.getByTestId('share-ended').or(patient.getByTestId('share-scene'))).toBeVisible({ timeout: 15_000 });
    await patient.goto('/patient/share');
  }
}

type Calls = { matches: number; overTime: number; assistant: number; diagnoses: number };
const calls: Calls = { matches: 0, overTime: 0, assistant: 0, diagnoses: 0 };
let pctx: BrowserContext;
let dctx: BrowserContext;
let patient: Page;
let doctor: Page;
let wide = false;

async function openPair(browser: Browser, opts: Parameters<Browser['newContext']>[0]) {
  pctx = await browser.newContext(opts);
  dctx = await browser.newContext(opts);
  patient = await pctx.newPage();
  doctor = await dctx.newPage();
}

test.describe.serial('doctor dashboard, slice 1 (staging-dev)', () => {
  test.beforeAll(async ({ browser }, ti) => {
    test.skip(!PASSCODE, 'HEALTHAPP_DEMO_PASSCODE not set');
    wide = (ti.project.use.viewport?.width ?? 0) >= 900;
    await openPair(browser, ti.project.use as Parameters<Browser['newContext']>[0]);
    // Count backend calls from the doctor's first request on, so "nothing on open" is a measurement, not a reading of the code.
    doctor.on('request', (r) => {
      const u = r.url();
      if (RPC_MATCHES.test(u)) calls.matches++;
      else if (FN_OVER_TIME.test(u) && r.method() !== 'OPTIONS') calls.overTime++;
      else if (FN_ASSISTANT.test(u) && r.method() !== 'OPTIONS') calls.assistant++;
      else if (FN_DIAGNOSES.test(u) && r.method() !== 'OPTIONS') calls.diagnoses++;
    });
    await signIn(patient, 'patient');
    await signIn(doctor, 'doctor');
    await patient.goto('/patient/share');
    await endAccessIfRunning(patient); // a grant left by an earlier run would hide the code
    const codeEl = patient.getByTestId('share-short-code');
    await expect(codeEl).toBeVisible({ timeout: 30_000 });
    const code = ((await codeEl.textContent()) ?? '').replace(/\s/g, '');
    expect(code).toMatch(/^[A-Z0-9]{8}$/);
    await doctor.goto('/doctor/connect');
    await doctor.getByTestId('scan-typed-input').fill(code);
    await doctor.getByTestId('scan-submit').click();
    await expect(doctor.getByTestId('doctor-waiting')).toBeVisible({ timeout: 30_000 });
    await expect(patient.getByTestId('share-asking')).toBeVisible({ timeout: 30_000 });
    await patient.getByTestId('ask-approve').click();
    await expect(doctor.getByTestId('doctor-workspace')).toBeVisible({ timeout: 30_000 });
    await expect(doctor.getByTestId('assistant-workspace')).toBeVisible({ timeout: 30_000 });
    // settle: the one over-time answer has arrived (cards, or the empty state)
    await expect(doctor.getByTestId('over-time')).toHaveAttribute('data-state', /series|empty|error/, { timeout: 45_000 });
  });

  test.afterAll(async () => {
    if (patient) {
      await patient.goto('/patient/share').catch(() => {});
      await endAccessIfRunning(patient).catch(() => {}); // leave no open grant on dev
    }
    await pctx?.close();
    await dctx?.close();
  });

  test('D1 opening the workspace: header, timer, two nav items, no diagnoses entry, and no matching, assistant or diagnoses call on open', async () => {
    await expect(doctor.getByRole('heading', { level: 1 })).not.toBeEmpty();
    await expect(doctor.getByTestId('access-timer')).toBeVisible();
    await expect(doctor.getByTestId('access-timer')).toHaveAttribute('data-state', /.+/);
    const nav = doctor.getByTestId('doctor-nav');
    await expect(nav.getByRole('button')).toHaveCount(2);
    await expect(nav.getByRole('button', { name: 'Overview' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Ask the assistant' })).toBeVisible();
    await expect(doctor.getByText(/possible diagnoses/i), 'slice 1 has no Possible diagnoses entry').toHaveCount(0);
    await expect(doctor.getByTestId('over-time')).toHaveAttribute('data-state', 'series'); // an empty or failed over-time answer is a blocker for the rest of this run
    await doctor.waitForTimeout(2_500); // a late call on open would land here
    expect(calls.overTime, 'one over-time call per open').toBe(1);
    expect(calls.matches, 'no matching call on open').toBe(0);
    expect(calls.assistant, 'no assistant call on open').toBe(0);
    expect(calls.diagnoses, 'no diagnoses call on open').toBe(0);
  });

  test('D2 chart cards equal values_with_series after Show all; range marked by shape; projection only where present; flags chips; a point opens its source', async () => {
    const counts = (await doctor.getByTestId('over-time-counts').innerText()).match(/values with a series (\d+)/);
    expect(counts, 'footer counts line is present').not.toBeNull();
    const n = Number(counts![1]);
    expect(n).toBeGreaterThan(0);
    const cards = doctor.getByTestId('chart-card');
    const showAll = doctor.getByTestId('show-all');
    if (n > 6) {
      await expect(cards, 'the first 6 cards before Show all').toHaveCount(6);
      await showAll.click();
    } else {
      await expect(showAll, 'no Show all button when there are 6 or fewer').toHaveCount(0);
    }
    await expect(cards).toHaveCount(n);
    expect(calls.overTime, 'Show all is a view change, not a second call').toBe(1);

    const all = await cards.all();
    let outsideSeen = 0;
    let projSeen = 0;
    let noProjSeen = 0;
    for (const c of all) {
      const hasProj = (await c.getByTestId('ot-projection').count()) === 1;
      const hasNo = (await c.getByTestId('ot-no-projection').count()) === 1;
      expect(hasProj !== hasNo, 'exactly one of the projection label or "not enough"').toBe(true);
      if (hasProj) {
        projSeen++;
        await expect(c.getByTestId('ot-projection-label')).toContainText('Arithmetic, not a prediction and not a diagnosis.');
        await expect(c.getByTestId('ot-line'), 'a dashed line only with its label').toHaveCount(1);
      } else {
        noProjSeen++;
        await expect(c.getByTestId('ot-line'), 'no dashed line without a projection').toHaveCount(0);
      }
      for (const p of await c.getByTestId('ot-point').all()) {
        const out = (await p.getAttribute('data-outside')) === 'true';
        outsideSeen += out ? 1 : 0;
        await expect(p.locator('polygon.ot-pt-out'), 'outside the printed range is a diamond').toHaveCount(out ? 1 : 0);
        await expect(p.locator('circle.ot-pt'), 'inside is a circle').toHaveCount(out ? 0 : 1);
      }
    }
    test.info().annotations.push({ type: 'data', description: `cards ${n}, with projection ${projSeen}, without ${noProjSeen}, points outside range ${outsideSeen}` });

    // flags chips: text names the value and the count against the printed range, nothing about a condition
    const chips = doctor.getByTestId('flag-chip');
    if (outsideSeen > 0) {
      const total = await chips.count();
      expect(total).toBeGreaterThan(0);
      for (const t of await chips.allInnerTexts()) expect(t).toMatch(/^.+: \d+ results? (above|below|outside) the printed range$|^.+: \d+ results? above and \d+ results? below the printed range$/);
      await chips.first().click(); // goes to its card; must not throw or open a source
      await expect(doctor.getByTestId('source-viewer')).toHaveCount(0);
    } else {
      await expect(doctor.getByTestId('flags-none')).toBeVisible();
      test.info().annotations.push({ type: 'uncovered', description: 'no result outside its printed range on this dev patient: flag chip text and diamond not exercised' });
    }

    // a point opens its source, the close button closes it
    await cards.first().getByTestId('ot-point').first().click();
    await expect(doctor.getByTestId('source-viewer')).toBeVisible();
    await doctor.getByTestId('source-close').click();
    await expect(doctor.getByTestId('source-viewer')).toHaveCount(0);
  });

  test('D3 Run the matching: idle with the label, no call until pressed, one call per press, result or the one empty state, label in every state, under 3 s', async () => {
    const panel = doctor.getByTestId('matches-panel');
    const label = doctor.getByTestId('matches-label');
    await expect(panel).toHaveAttribute('data-state', 'idle');
    await expect(label).toHaveText('Seeded synthetic data. Not real patients.');
    await expect(doctor.getByTestId('matches-idle')).toBeVisible();
    expect(calls.matches, 'no matching call before the press').toBe(0);

    for (const press of [1, 2]) {
      const t0 = Date.now();
      const resp = doctor.waitForResponse((r) => RPC_MATCHES.test(r.url()) && r.request().method() === 'POST', { timeout: 30_000 });
      await doctor.getByTestId('matches-run').click();
      const r = await resp;
      const ms = Date.now() - t0;
      await expect(panel).toHaveAttribute('data-state', /populated|empty/, { timeout: 15_000 });
      expect(r.status(), `press ${press}: the RPC answers`).toBe(200);
      expect(ms, `press ${press}: the answer arrives in under 3 s (${ms} ms)`).toBeLessThan(3_000);
      expect(calls.matches, `exactly ${press} call(s) after ${press} press(es)`).toBe(press);
      await expect(label, 'the synthetic label stays in the result state').toHaveText('Seeded synthetic data. Not real patients.');
      const state = await panel.getAttribute('data-state');
      if (state === 'empty') {
        await expect(doctor.getByTestId('matches-empty')).toHaveText('No matches in the seeded data.');
        await expect(doctor.getByTestId('matches-empty-why')).toContainText('fewer than 5');
      } else {
        await expect(doctor.getByTestId('matches-total')).toContainText('seeded synthetic records');
        expect(await doctor.getByTestId('match-group').count()).toBeGreaterThan(0);
      }
      test.info().annotations.push({ type: 'data', description: `press ${press}: ${state}, ${ms} ms` });
      await doctor.waitForTimeout(1_000);
      expect(calls.matches, 'nothing else fires after the answer').toBe(press);
    }
  });

  test('D3b the patient has matching on: the same button gives the grouped result with the synthetic label (the switch is put back after)', async () => {
    await patient.goto('/patient');
    const sw = patient.getByTestId('matches-switch');
    await expect(sw).toBeVisible({ timeout: 20_000 });
    const wasOn = (await sw.getAttribute('aria-checked')) === 'true';
    try {
      if (!wasOn) {
        await sw.click();
        await expect(sw).toHaveAttribute('aria-checked', 'true', { timeout: 15_000 });
      }
      const before = calls.matches;
      const panel = doctor.getByTestId('matches-panel');
      await doctor.getByTestId('matches-run').click();
      await expect(panel).toHaveAttribute('data-state', /populated|empty/, { timeout: 15_000 });
      expect(calls.matches, 'one more call for one more press').toBe(before + 1);
      await expect(doctor.getByTestId('matches-label')).toHaveText('Seeded synthetic data. Not real patients.');
      const state = await panel.getAttribute('data-state');
      test.info().annotations.push({ type: 'data', description: `opted in: ${state}` });
      if (state === 'populated') {
        await expect(doctor.getByTestId('matches-total')).toContainText('seeded synthetic records share a pattern with this record');
        expect(await doctor.getByTestId('match-group').count()).toBeGreaterThan(0);
        for (const g of await doctor.getByTestId('match-group').all()) {
          await expect(g.getByTestId('match-pattern').getByRole('listitem').first()).toBeVisible();
          await expect(g.getByTestId('match-countries').getByRole('listitem').first()).toBeVisible();
        }
      } else {
        test.info().annotations.push({ type: 'uncovered', description: 'opted in but the answer is empty (no pattern shared by 5 or more seeded records): the grouped result is not exercised' });
      }
    } finally {
      if (!wasOn) {
        await patient.goto('/patient');
        const sw2 = patient.getByTestId('matches-switch');
        await sw2.waitFor({ timeout: 20_000 });
        if ((await sw2.getAttribute('aria-checked')) === 'true') await sw2.click();
        await expect(sw2).toHaveAttribute('aria-checked', 'false', { timeout: 15_000 });
      }
    }
  });

  test('D4 exams list: below the charts, newest first, a row opens its source', async () => {
    const exams = doctor.getByTestId('exams');
    await exams.scrollIntoViewIfNeeded();
    const rows = doctor.getByTestId('exam-row');
    expect(await rows.count()).toBeGreaterThan(0);
    const dates = await doctor.locator('[data-testid="exam-row"] .exam-date').allInnerTexts();
    const ms = dates.map((d) => Date.parse(d + ' UTC'));
    expect(ms.every((x) => !Number.isNaN(x)), `dates parse: ${dates.join(' | ')}`).toBe(true);
    for (let i = 1; i < ms.length; i++) expect(ms[i], `row ${i} is not newer than row ${i - 1}`).toBeLessThanOrEqual(ms[i - 1]);
    const boxCharts = await doctor.getByTestId('over-time').boundingBox();
    const boxExams = await exams.boundingBox();
    expect(boxExams!.y, 'the exams list sits below the charts').toBeGreaterThan(boxCharts!.y + boxCharts!.height - 1);
    await rows.first().click();
    await expect(doctor.getByTestId('source-viewer')).toBeVisible();
    await doctor.getByTestId('source-close').click();
    await expect(doctor.getByTestId('source-viewer')).toHaveCount(0);
  });

  test('D5 ask panel: reachable from the nav, shows only the ask view from 900 px, one question makes one call and an answer', async () => {
    await doctor.getByTestId('nav-ask').click();
    await expect(doctor.getByTestId('ask-input')).toBeVisible();
    await expect(doctor.getByTestId('ask-input')).toBeInViewport();
    if (wide) {
      await expect(doctor.locator('#dash-overview'), 'the overview is hidden while Ask is open at 900 px and wider').toBeHidden();
      await expect(doctor.getByTestId('nav-ask')).toHaveAttribute('aria-current', 'page');
    }
    expect(calls.assistant).toBe(0);
    await doctor.getByTestId('ask-input').fill('What do the CRP results show?');
    await doctor.getByTestId('ask-submit').click();
    await expect(doctor.getByTestId('turn').first()).toBeVisible({ timeout: 10_000 });
    await expect(doctor.getByTestId('turn').first()).toHaveAttribute('data-status', /done|error/, { timeout: 90_000 });
    await expect(doctor.getByTestId('turn').first(), 'the answer is not an error').toHaveAttribute('data-status', 'done');
    expect(calls.assistant, 'one question is one assistant call').toBe(1);
    const chip = doctor.getByTestId('turn').first().getByRole('button', { name: /^Source \d+:/ }).first();
    if (await chip.count()) {
      await chip.click();
      await expect(doctor.getByTestId('source-viewer'), 'a citation opens its source over any view').toBeVisible();
      await doctor.getByTestId('source-close').click();
    } else {
      test.info().annotations.push({ type: 'uncovered', description: 'the answer to this question carried no citation: citation-opens-source not exercised in the ask panel' });
    }
    await doctor.getByTestId('nav-overview').click();
    await expect(doctor.getByTestId('over-time')).toBeVisible();
    expect(calls.overTime, 'switching views never refetches the series').toBe(1);
    expect(calls.diagnoses, 'no diagnoses call in slice 1').toBe(0);
  });

  test('D6 when the patient ends access the dashboard closes', async () => {
    await patient.goto('/patient/share');
    await endAccessIfRunning(patient);
    await expect(doctor.getByTestId('doctor-workspace')).toHaveCount(0, { timeout: 60_000 });
    await expect(doctor.getByTestId('doctor-ended')).toBeVisible();
  });
});
