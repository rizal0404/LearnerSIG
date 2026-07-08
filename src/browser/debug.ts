import { mkdir, writeFile } from 'node:fs/promises';
import type { Page } from 'playwright';

export async function captureDebugArtifacts(page: Page, baseName: string): Promise<void> {
  await mkdir('screenshots', { recursive: true });

  const htmlPath = `screenshots/${baseName}.html`;
  const textPath = `screenshots/${baseName}.txt`;
  const screenshotPath = `screenshots/${baseName}.png`;

  await writeFile(htmlPath, await page.content(), 'utf8');
  await writeFile(textPath, await page.locator('body').innerText({ timeout: 5_000 }).catch(() => ''), 'utf8');

  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
    animations: 'disabled',
    timeout: 5_000
  }).catch(() => undefined);
}