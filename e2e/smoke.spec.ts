import { expect, test, type Page } from '@playwright/test';

// Every backend call is mocked: nothing leaves the machine. Journeys only, no copy or layout checks.
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' };
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (sub: string) => `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub, role: 'authenticated', aud: 'authenticated', exp: 4102444800 })}.sig`;
const PROFILES: Record<string, { id: string; role: 'patient' | 'doctor'; full_name: string }> = {
  'p-1': { id: 'p-1', role: 'patient', full_name: 'Maria (synthetic)' },
  'd-1': { id: 'd-1', role: 'doctor', full_name: 'Doctor (synthetic)' },
};

async function mockBackend(page: Page) {
  await page.route('https://smoke.invalid/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const json = (status: number, body: unknown) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body), headers: CORS });
    if (url.pathname === '/functions/v1/healthapp-hello') return json(200, { ok: true });
    if (url.pathname === '/functions/v1/healthapp-demo-login') {
      const { persona, passcode } = req.postDataJSON() as { persona: 'patient' | 'doctor'; passcode: string };
      if (passcode !== 'letmein') return json(401, { error: { code: 'bad_passcode', message: 'bad passcode' } });
      const sub = persona === 'patient' ? 'p-1' : 'd-1';
      return json(200, { access_token: jwt(sub), refresh_token: `r-${sub}`, expires_at: 4102444800, user_id: sub, persona, role: persona });
    }
    const sub = JSON.parse(Buffer.from((req.headers()['authorization'] ?? '').split('.')[1] ?? 'e30', 'base64url').toString()).sub as string | undefined;
    if (url.pathname === '/auth/v1/user') return json(200, { id: sub, aud: 'authenticated', role: 'authenticated', email: `${sub}@healthapp.invalid`, app_metadata: {}, user_metadata: {}, created_at: '2026-11-14T00:00:00Z' });
    if (url.pathname === '/rest/v1/profiles') return json(200, sub ? PROFILES[sub] : null);
    return json(404, { error: 'not mocked' });
  });
}

test('the built shell loads and the health check shows OK', async ({ page }) => {
  await mockBackend(page);
  await page.goto('/health');
  await expect(page.getByTestId('hello')).toHaveText('OK (HTTP 200)');
  await expect(page.getByTestId('env')).toHaveText('dev');
  await expect(page.getByTestId('schema')).toHaveText('healthapp_dev');
  await expect(page.getByTestId('sha')).not.toBeEmpty();
});

test('both personas sign in from the panel and land on their own home; a wrong role is sent back', async ({ page }) => {
  await mockBackend(page);
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel('Demo passcode').fill('wrong');
  await page.getByTestId('login-patient').click();
  await expect(page.getByTestId('error-note')).toContainText('not accepted');

  await page.getByLabel('Demo passcode').fill('letmein');
  await page.getByTestId('login-patient').click();
  await expect(page).toHaveURL(/\/patient$/);
  await expect(page.getByTestId('patient-home')).toContainText('Maria (synthetic)');

  await page.goto('/doctor');
  await expect(page).toHaveURL(/\/patient$/);

  await page.getByTestId('sign-out').click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel('Demo passcode').fill('letmein');
  await page.getByTestId('login-doctor').click();
  await expect(page).toHaveURL(/\/doctor$/);
  await expect(page.getByTestId('doctor-home')).toContainText('Doctor (synthetic)');

  await page.goto('/patient');
  await expect(page).toHaveURL(/\/doctor$/);
});
