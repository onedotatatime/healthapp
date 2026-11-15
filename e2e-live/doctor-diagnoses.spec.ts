import { expect, test, type Browser, type BrowserContext, type Page, type Response } from '@playwright/test';

// MIN-4668, slice 2 of the live doctor dashboard (MIN-4659): Possible diagnoses on staging-dev. Env dev, schema healthapp_dev, synthetic personas only.
// The passcode comes from the environment, is cleared from the field right after submit, and is never logged or screenshotted.
// Paid calls: 1 press at 390, 2 presses at 1280 (the second is "List again"). The "access ended" press is refused by the server before the model (no paid call).
// Strings are checked word for word here only for the banner and the AI line (a safety rule); other copy and layout are unit tests.
const PASSCODE = process.env.HEALTHAPP_DEMO_PASSCODE ?? '';
const FN_OVER_TIME = /\/functions\/v1\/[^/?]*over-time/;
const FN_ASSISTANT = /\/functions\/v1\/[^/?]*assistant/;
const FN_DIAGNOSES = /\/functions\/v1\/[^/?]*diagnoses/;
const BANNER = "For the doctor to evaluate. Not a diagnosis. Based on this patient's symptoms and exams only. Listed in alphabetical order; no ranking.";
const AI_LINE = 'This list comes from an AI reading this record. Check each line against its source.';
const CALL_LIMIT_MS = 60_000;

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

const calls = { overTime: 0, assistant: 0, diagnoses: 0 };
let overTimeUrl = '';
let pctx: BrowserContext;
let dctx: BrowserContext;
let patient: Page;
let doctor: Page;
let wide = false;
let wideRun = false;

/** One press of the run button, measured: returns the answer and the milliseconds from the press to the settled view. */
async function press(label: string) {
  const resp = doctor.waitForResponse((r) => FN_DIAGNOSES.test(r.url()) && r.request().method() === 'POST', { timeout: CALL_LIMIT_MS });
  const t0 = Date.now();
  await doctor.getByTestId('dx-run').click();
  await expect(doctor.getByTestId('diagnoses'), `${label}: loading`).toHaveAttribute('data-state', 'loading', { timeout: 5_000 });
  return { resp, t0 };
}

async function settle(t0: number) {
  await expect(doctor.getByTestId('diagnoses')).toHaveAttribute('data-state', /^(ok|none|off|error|ended)$/, { timeout: CALL_LIMIT_MS });
  return Date.now() - t0;
}

test.describe.serial('doctor dashboard, slice 2: Possible diagnoses (staging-dev)', () => {
  test.beforeAll(async ({ browser }: { browser: Browser }, ti) => {
    test.skip(!PASSCODE, 'HEALTHAPP_DEMO_PASSCODE not set');
    wide = (ti.project.use.viewport?.width ?? 0) >= 900;
    wideRun = wide;
    const opts = ti.project.use as Parameters<Browser['newContext']>[0];
    pctx = await browser.newContext(opts);
    dctx = await browser.newContext(opts);
    patient = await pctx.newPage();
    doctor = await dctx.newPage();
    doctor.on('request', (r) => {
      const u = r.url();
      if (r.method() === 'OPTIONS') return;
      if (FN_OVER_TIME.test(u)) {
        calls.overTime++;
        overTimeUrl = u;
      } else if (FN_ASSISTANT.test(u)) calls.assistant++;
      else if (FN_DIAGNOSES.test(u)) calls.diagnoses++;
    });
    await signIn(patient, 'patient');
    await signIn(doctor, 'doctor');
    await patient.goto('/patient/share');
    await endAccessIfRunning(patient);
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
    await expect(doctor.getByTestId('over-time')).toHaveAttribute('data-state', /series|empty|error/, { timeout: 45_000 });
  });

  test.afterAll(async () => {
    if (patient) {
      await patient.goto('/patient/share').catch(() => {});
      await endAccessIfRunning(patient).catch(() => {});
    }
    await pctx?.close();
    await dctx?.close();
  });

  test('X1 opening the workspace: third nav item, the view is idle with banner and AI line, and NO diagnoses call is made on open', async () => {
    const nav = doctor.getByTestId('doctor-nav');
    await expect(nav.getByRole('button')).toHaveCount(3);
    await expect(nav.getByRole('button').nth(1), 'Possible diagnoses is the third item in the order Overview, Possible diagnoses, Ask').toContainText('Possible diagnoses');
    await expect(nav.getByRole('button', { name: 'Overview' })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Ask the assistant' })).toBeVisible();
    await expect(doctor.getByTestId('diagnoses')).toHaveAttribute('data-state', 'idle');
    await expect(doctor.getByTestId('dx-banner')).toContainText(BANNER);
    await expect(doctor.getByTestId('dx-ai-line')).toHaveText(AI_LINE);
    await expect(doctor.getByTestId('dx-run')).toHaveText(/List possible diagnoses/);
    await expect(doctor.getByTestId('dx-card')).toHaveCount(0);
    await doctor.waitForTimeout(3_000); // a late call on open (an effect, a mount at 390) would land here
    expect(calls.overTime, 'one over-time call per open').toBe(1);
    expect(calls.diagnoses, 'no diagnoses call on open (CTO F1)').toBe(0);
    expect(calls.assistant, 'no assistant call on open').toBe(0);
    // opening the view from the nav is not a call either
    await doctor.getByTestId('nav-diagnoses').click();
    if (wide) await expect(doctor.locator('#dash-overview'), 'at 900 px and wider only the diagnoses view shows').toBeHidden();
    await expect(doctor.getByTestId('dx-run')).toBeVisible();
    await expect(doctor.getByTestId('dx-banner')).toContainText(BANNER);
    await doctor.waitForTimeout(1_500);
    expect(calls.diagnoses, 'no diagnoses call when the view is opened').toBe(0);
  });

  test('X2 one press: loading line, one call, banner and AI line in loading, cards in received order with the four labels, chips open the source, footer counts, nothing numeric on a card', async () => {
    const view = doctor.getByTestId('diagnoses');
    const { resp, t0 } = await press('first press');
    await expect(doctor.getByTestId('dx-loading')).toContainText('Reading the record. This can take up to a minute.');
    await expect(doctor.getByTestId('dx-run'), 'the button is disabled while a call runs').toBeDisabled();
    await expect(doctor.getByTestId('dx-banner'), 'banner in the loading state').toContainText(BANNER);
    await expect(doctor.getByTestId('dx-ai-line'), 'AI line in the loading state').toHaveText(AI_LINE);
    await doctor.getByTestId('dx-run').click({ force: true, timeout: 2_000 }).catch(() => {}); // a second press while loading must not make a second call
    const r: Response = await resp;
    const ms = await settle(t0);
    test.info().annotations.push({ type: 'data', description: `first press: HTTP ${r.status()}, ${ms} ms to the settled view` });
    expect(r.status(), 'the diagnoses call answers 200').toBe(200);
    expect(ms, `time to result under ${CALL_LIMIT_MS / 1000} s (${ms} ms)`).toBeLessThan(CALL_LIMIT_MS);
    expect(calls.diagnoses, 'exactly one call for one press (and none for the second click while loading)').toBe(1);
    await expect(view, 'the answer is a list, not an error, off or none').toHaveAttribute('data-state', 'ok');
    await expect(doctor.getByTestId('dx-banner'), 'banner in the result state').toContainText(BANNER);
    await expect(doctor.getByTestId('dx-ai-line'), 'AI line in the result state').toHaveText(AI_LINE);
    await expect(doctor.getByTestId('dx-run')).toHaveText(/List again/);

    const body = (await r.json()) as {
      status: string;
      items: { name: string; fits: { text: string; cites: string[] }[]; does_not_explain: unknown[]; not_in_record: string[] }[];
      counts: { facts: number; items: number; citations: number; guard_drops: number; errors: number };
    };
    expect(body.status).toBe('ok');
    // the wire has no number, rank or probability field anywhere
    const keys = new Set<string>();
    const walk = (v: unknown) => {
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) (keys.add(k), walk(x));
    };
    walk(body);
    for (const k of keys) expect(k, `unexpected wire key "${k}"`).toMatch(/^(run_id|status|items|truncated|counts|created_at|name|fits|does_not_explain|not_in_record|text|cites|facts|citations|guard_drops|errors)$/);

    const cards = doctor.getByTestId('dx-card');
    const n = await cards.count();
    expect(n, 'between 1 and 6 cards').toBeGreaterThanOrEqual(1);
    expect(n).toBeLessThanOrEqual(6);
    // received order: the cards are drawn in the order of the response, and that order is alphabetical (server side)
    const names = await cards.locator('h3').allInnerTexts();
    expect(names, 'cards in the order received').toEqual(body.items.map((i) => i.name));
    const sorted = [...names].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    expect(names, 'the received order is alphabetical').toEqual(sorted);

    for (const c of await cards.all()) {
      const name = (await c.locator('h3').innerText()).trim();
      expect(name, 'a name, not a number, rank or percentage').not.toMatch(/^[\d#]|%|\b(rank|probab|likel|score|confidence)/i);
      await expect(c.getByTestId('dx-fits')).toBeVisible();
      await expect(c.getByTestId('dx-fits').locator('.dx-k')).toHaveText('Fits:');
      expect(await c.getByTestId('dx-fits').getByTestId('dx-statement').count(), 'at least one Fits statement').toBeGreaterThan(0);
      if (await c.getByTestId('dx-does-not-explain').count()) await expect(c.getByTestId('dx-does-not-explain').locator('.dx-k')).toHaveText('Does not fully explain:');
      if (await c.getByTestId('dx-not-in-record').count()) await expect(c.getByTestId('dx-not-in-record').locator('.dx-k')).toHaveText('Not in this record:');
      await expect(c.getByTestId('dx-based').locator('.dx-k')).toHaveText('Based on:');
      expect(await c.getByTestId('dx-source').count(), 'at least one Based on source').toBeGreaterThan(0);
      // outside the statements, nothing on a card carries a percentage, a rank or a likelihood word
      const frame = await c.evaluate((el) => {
        const clone = el.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('[data-testid="dx-statement"]').forEach((s) => s.remove());
        return clone.innerText;
      });
      expect(frame, 'no percentage or rank wording outside the cited statements').not.toMatch(/%|\b(rank|probab|likel|score|confidence|most likely|top \d)/i);
    }

    // citation chips open the source viewer: the Based on chip, then a chip inside a statement
    const based = cards.first().getByTestId('dx-source').first();
    await based.click();
    await expect(doctor.getByTestId('source-viewer'), 'a Based on chip opens the source').toBeVisible();
    await doctor.getByTestId('source-close').click();
    await expect(doctor.getByTestId('source-viewer')).toHaveCount(0);
    const stmtChip = cards.first().getByTestId('dx-statement').first().getByRole('button').first();
    await stmtChip.click();
    await expect(doctor.getByTestId('source-viewer'), 'a statement chip opens the source').toBeVisible();
    await doctor.getByTestId('source-close').click();
    await expect(doctor.getByTestId('source-viewer')).toHaveCount(0);

    // footer counts are the response's counts, and the guard line shows exactly when something was removed
    const foot = (await doctor.getByTestId('dx-counts').innerText()).trim();
    expect(foot).toMatch(/^Record lines read \d+, possibilities \d+, citations \d+, removed \d+, errors \d+\.$/);
    expect(foot).toBe(`Record lines read ${body.counts.facts}, possibilities ${body.counts.items}, citations ${body.counts.citations}, removed ${body.counts.guard_drops}, errors ${body.counts.errors}.`);
    expect(body.counts.items, 'footer possibilities equals the cards drawn').toBe(n);
    await expect(doctor.getByTestId('dx-guard')).toHaveCount(body.counts.guard_drops > 0 ? 1 : 0);
    test.info().annotations.push({ type: 'data', description: `cards ${n}, counts ${JSON.stringify(body.counts)}` });
    await doctor.waitForTimeout(1_000);
    expect(calls.diagnoses, 'nothing else fires after the answer, and opening a source is not a call').toBe(1);
  });

  test('X3 "List again" is one more call (1280 only, to keep paid calls at 3)', async () => {
    test.skip(!wideRun, 'one paid call at 390 is enough; List again is exercised at 1280');
    const before = calls.diagnoses;
    const { resp, t0 } = await press('second press');
    await expect(doctor.getByTestId('dx-banner'), 'banner in loading').toContainText(BANNER);
    const r = await resp;
    const ms = await settle(t0);
    test.info().annotations.push({ type: 'data', description: `List again: HTTP ${r.status()}, ${ms} ms` });
    expect(calls.diagnoses, 'one press is one call').toBe(before + 1);
    expect(ms).toBeLessThan(CALL_LIMIT_MS);
    await expect(doctor.getByTestId('diagnoses')).toHaveAttribute('data-state', 'ok');
    await expect(doctor.getByTestId('dx-run')).toHaveText(/List again/);
    expect(await doctor.getByTestId('dx-card').count()).toBeGreaterThan(0);
  });

  test('X4 a patient session never reaches the view, and the function refuses a patient token before the model', async () => {
    await patient.goto('/patient');
    await expect(patient.getByTestId('matches-switch')).toBeVisible({ timeout: 20_000 });
    await expect(patient.getByText(/possible diagnoses/i)).toHaveCount(0);
    await expect(patient.getByTestId('diagnoses')).toHaveCount(0);
    for (const path of ['/doctor', '/doctor/connect', '/doctor/simulate']) {
      await patient.goto(path);
      await patient.waitForLoadState('networkidle');
      expect(new URL(patient.url()).pathname, `patient is not left on ${path}`).not.toMatch(/^\/doctor/);
      await expect(patient.getByTestId('diagnoses')).toHaveCount(0);
      await expect(patient.getByTestId('doctor-nav')).toHaveCount(0);
    }
    // the server side: the patient's own token against the function. The token is read from the patient's own requests and never printed.
    expect(overTimeUrl, 'the doctor made an over-time call, so the function URL is known').not.toBe('');
    let bearer = '';
    let apikey = '';
    patient.on('request', (r) => {
      const h = r.headers();
      if (/\/rest\/v1\//.test(r.url()) && h.authorization && h.apikey && h.authorization !== `Bearer ${h.apikey}`) {
        bearer = h.authorization;
        apikey = h.apikey;
      }
    });
    await patient.goto('/patient');
    await expect.poll(() => bearer !== '', { timeout: 20_000 }).toBe(true);
    const url = overTimeUrl.replace(/over-time/, 'diagnoses');
    const before = calls.diagnoses;
    const res = await patient.request.post(url, {
      headers: { 'content-type': 'application/json', authorization: bearer, apikey, 'x-healthapp-env': 'dev' },
      data: { grant_id: '00000000-0000-4000-8000-000000000000' },
      timeout: 15_000,
    });
    expect(res.status(), 'a patient token gets 403').toBe(403);
    expect(JSON.stringify(await res.json())).toContain('wrong_role');
    expect(calls.diagnoses, 'the doctor page made no call here').toBe(before);
  });

  test('X5 when the patient ends access, the view cannot list: access ended (the press is refused before the model)', async () => {
    test.skip(!wideRun, 'the ended state is exercised once, at 1280');
    await patient.goto('/patient/share');
    await endAccessIfRunning(patient);
    const run = doctor.getByTestId('dx-run');
    // the workspace polls the grant; race the poll with a press. Either the view says ended, or the whole workspace is gone.
    if (await run.isVisible().catch(() => false)) await run.click({ timeout: 3_000 }).catch(() => {});
    await expect(doctor.getByTestId('dx-ended').or(doctor.getByTestId('doctor-ended')), 'ended is shown').toBeVisible({ timeout: 60_000 });
    const viaView = await doctor.getByTestId('dx-ended').count();
    test.info().annotations.push({ type: 'data', description: viaView ? 'ended shown by the diagnoses view (403 on press)' : 'ended shown by the workspace before the press landed' });
    await expect(doctor.getByTestId('doctor-workspace'), 'the workspace and every card go').toHaveCount(0, { timeout: 60_000 });
    await expect(doctor.getByTestId('dx-card')).toHaveCount(0);
  });
});
