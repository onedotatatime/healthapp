import { expect, test } from '@playwright/test';

test('the built shell loads and the health check shows OK', async ({ page }) => {
  // Backend mocked: nothing leaves the machine.
  await page.route('https://smoke.invalid/functions/v1/healthapp-hello', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}', headers: { 'access-control-allow-origin': '*' } }),
  );
  await page.goto('/');
  await expect(page.getByTestId('hello')).toHaveText('OK (HTTP 200)');
  await expect(page.getByTestId('env')).toHaveText('dev');
  await expect(page.getByTestId('schema')).toHaveText('healthapp_dev');
  await expect(page.getByTestId('sha')).not.toBeEmpty();
});
