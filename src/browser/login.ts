import type { Page } from 'playwright';
import type { AppConfig } from '../config/env.js';
import { loginSelectors } from '../portal/selectors.js';
import { captureDebugArtifacts } from './debug.js';

export async function loginToPortal(page: Page, config: AppConfig): Promise<void> {
  await page.goto(config.portalUrl, {
    waitUntil: 'domcontentloaded',
    timeout: config.pageLoadTimeoutMs
  });

  try {
    await page.locator(loginSelectors.username).first().fill(config.username);
    await page.locator(loginSelectors.password).first().fill(config.password);
    await page.locator(loginSelectors.submit).first().click();
    await waitForLoginSuccess(page, config);
  } catch (error) {
    await captureDebugArtifacts(page, 'login-failure');
    throw new Error(`Login gagal. Debug tersimpan di screenshots/login-failure.*. Detail: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function waitForLoginSuccess(page: Page, config: AppConfig): Promise<void> {
  const loginSuccessUrl = config.loginSuccessUrl.toLowerCase();

  await page.waitForFunction(
    ({ expectedUrl }) => {
      const currentUrl = window.location.href.toLowerCase();
      const bodyText = document.body?.innerText?.toLowerCase() ?? '';
      return currentUrl.includes(expectedUrl) || (!currentUrl.includes('/login') && !bodyText.includes('silakan masuk'));
    },
    { expectedUrl: loginSuccessUrl },
    { timeout: config.loginTimeoutMs }
  );

  await page.waitForLoadState('domcontentloaded', { timeout: config.pageLoadTimeoutMs }).catch(() => undefined);
}