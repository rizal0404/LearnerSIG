import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Page } from 'playwright';

export type ProgressEvidence = {
  capturedAt: string;
  label: string;
  screenshotPath: string;
  textPath: string;
  url: string;
};

export async function captureProgressEvidence(page: Page, directory: string, label: string): Promise<ProgressEvidence> {
  await mkdir(directory, { recursive: true });

  const capturedAt = new Date().toISOString();
  const baseName = `${toTimestampSlug(capturedAt)}-${toSafeFileName(label)}`;
  const screenshotPath = join(directory, `${baseName}.png`);
  const textPath = join(directory, `${baseName}.txt`);

  await writeFile(textPath, await page.locator('body').innerText({ timeout: 5_000 }).catch(() => ''), 'utf8');
  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
    animations: 'disabled',
    timeout: 10_000
  });

  return {
    capturedAt,
    label,
    screenshotPath,
    textPath,
    url: page.url()
  };
}

function toTimestampSlug(value: string): string {
  return value.replace(/[:.]/g, '-');
}

function toSafeFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'evidence';
}
