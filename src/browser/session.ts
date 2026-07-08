import { access } from 'node:fs/promises';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import type { AppConfig } from '../config/env.js';

export type BrowserSession = {
  browser: Browser;
  context: BrowserContext;
  page: Page;
};

export type BrowserSessionOptions = {
  storeSession?: boolean;
  useSavedSession?: boolean;
};

export async function createBrowserSession(config: AppConfig, options: BrowserSessionOptions = {}): Promise<BrowserSession> {
  if (options.useSavedSession) {
    await assertSessionStateExists(config);
  }

  const browser = await chromium.launch({
    headless: options.storeSession ? false : config.headless,
    slowMo: config.slowMoMs
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    storageState: options.useSavedSession ? config.sessionStatePath : undefined
  });

  const page = await context.newPage();
  page.setDefaultTimeout(30_000);

  return { browser, context, page };
}

async function assertSessionStateExists(config: AppConfig): Promise<void> {
  try {
    await access(config.sessionStatePath);
  } catch {
    throw new Error(`Session belum tersedia di ${config.sessionStatePath}. Jalankan npm run save-session terlebih dahulu.`);
  }
}