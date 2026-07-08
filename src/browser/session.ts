import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import type { AppConfig } from '../config/env.js';

export type BrowserSession = {
  browser: Browser;
  context: BrowserContext;
  page: Page;
};

export async function createBrowserSession(config: AppConfig): Promise<BrowserSession> {
  const browser = await chromium.launch({
    headless: config.headless,
    slowMo: config.slowMoMs
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 }
  });

  const page = await context.newPage();
  page.setDefaultTimeout(30_000);

  return { browser, context, page };
}
