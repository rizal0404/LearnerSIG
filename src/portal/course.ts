import type { Page } from 'playwright';
import type { AppConfig } from '../config/env.js';
import { courseSelectors } from './selectors.js';
import { captureDebugArtifacts } from '../browser/debug.js';

export type CourseContentItem = {
  index: number;
  title: string;
  progressPercent: number | null;
  kind: 'pre-test' | 'post-test' | 'video' | 'document' | 'unknown';
};

export type CourseDiscovery = {
  discoveredAt: string;
  sourceUrl: string;
  title: string | null;
  itemCount: number;
  items: CourseContentItem[];
};

type RawCourseItem = {
  position: number;
  text: string;
};

export async function discoverCourse(page: Page, config: AppConfig): Promise<CourseDiscovery> {
  await page.goto(config.courseUrl, { waitUntil: 'domcontentloaded', timeout: config.pageLoadTimeoutMs });
  await page.waitForLoadState('domcontentloaded', { timeout: config.pageLoadTimeoutMs }).catch(() => undefined);
  await page.waitForTimeout(5_000);

  const title = await readFirstText(page, courseSelectors.courseTitle);
  const rawItems = await page.locator(courseSelectors.contentItems).evaluateAll((elements) => {
    return elements
      .map((element, position) => {
        const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim();
        return { position, text };
      })
      .filter((item) => item.text.length > 0);
  });

  const bodyText = await page.locator('body').innerText({ timeout: 10_000 }).catch(() => '');
  const normalizedItems = normalizeCourseItems(rawItems, bodyText);

  const discovery = {
    discoveredAt: new Date().toISOString(),
    sourceUrl: page.url(),
    title,
    itemCount: normalizedItems.length,
    items: normalizedItems
  };

  await assertDiscoveryLooksValid(page, discovery);

  return discovery;
}

function normalizeCourseItems(rawItems: RawCourseItem[], bodyText: string): CourseContentItem[] {
  const parsedFromBody = parseNumberedCourseItems(bodyText);
  if (parsedFromBody.length > 0) {
    return parsedFromBody;
  }

  return dedupeItems(
    rawItems
      .map((item, itemIndex) => toCourseItem(item.text, itemIndex + 1))
      .filter((item) => item.kind !== 'unknown' && !isMetadataTitle(item.title))
  );
}

function parseNumberedCourseItems(text: string): CourseContentItem[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const matches = normalized.matchAll(/(?:^|\s)(\d{1,2})\s+(.+?)\s+(100|[1-9]?\d)%/g);
  const items: CourseContentItem[] = [];

  for (const match of matches) {
    const title = cleanTitle(match[2]);
    const kind = inferItemKind(title);

    if (kind === 'unknown' || isMetadataTitle(title)) {
      continue;
    }

    items.push({
      index: Number(match[1]),
      title,
      progressPercent: Number(match[3]),
      kind
    });
  }

  return dedupeItems(items).sort((left, right) => left.index - right.index);
}

function isMetadataTitle(title: string): boolean {
  const normalized = title.toLowerCase();
  return normalized.includes('videos, documents, and quizzes') || normalized === 'materi' || normalized.startsWith('materi ');
}

function toCourseItem(text: string, index: number): CourseContentItem {
  return {
    index,
    title: cleanTitle(text),
    progressPercent: extractProgressPercent(text),
    kind: inferItemKind(text)
  };
}

function dedupeItems(items: CourseContentItem[]): CourseContentItem[] {
  const seen = new Set<string>();
  const uniqueItems: CourseContentItem[] = [];

  for (const item of items) {
    const key = `${item.index}:${item.title.toLowerCase()}:${item.kind}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    uniqueItems.push(item);
  }

  return uniqueItems;
}

async function readFirstText(page: Page, selector: string): Promise<string | null> {
  const locator = page.locator(selector).first();
  if ((await locator.count()) === 0) {
    return null;
  }

  const text = await locator.textContent();
  return text?.replace(/\s+/g, ' ').trim() || null;
}

async function assertDiscoveryLooksValid(page: Page, discovery: CourseDiscovery): Promise<void> {
  const currentUrl = discovery.sourceUrl.toLowerCase();
  const looksLikeLoginPage = currentUrl.includes('/login') || currentUrl.includes('signin') || currentUrl.includes('sign-in');

  if (!looksLikeLoginPage && discovery.itemCount > 0) {
    return;
  }

  await captureDebugArtifacts(page, 'course-discovery-failure');

  if (looksLikeLoginPage) {
    throw new Error('Discovery gagal: browser masih berada di halaman login atau diarahkan kembali ke login. Periksa kredensial, OTP/CAPTCHA, atau selector login. Debug: screenshots/course-discovery-failure.*');
  }

  throw new Error('Discovery gagal: tidak ada item course yang terbaca. Kemungkinan selector course perlu disesuaikan di src/portal/selectors.ts. Debug: screenshots/course-discovery-failure.*');
}

function cleanTitle(text: string): string {
  return text.replace(/\b\d{1,3}%/g, '').replace(/\s+/g, ' ').trim();
}

function extractProgressPercent(text: string): number | null {
  const match = text.match(/\b(100|[1-9]?\d)%/);
  return match ? Number(match[1]) : null;
}

function inferItemKind(text: string): CourseContentItem['kind'] {
  const normalized = text.toLowerCase();

  if (normalized.includes('pre test') || normalized.includes('pre-test') || normalized.includes('pretest')) {
    return 'pre-test';
  }

  if (normalized.includes('post test') || normalized.includes('post-test') || normalized.includes('posttest')) {
    return 'post-test';
  }

  if (normalized.includes('.mp4') || normalized.includes('video')) {
    return 'video';
  }

  if (normalized.includes('.pdf') || normalized.includes('document') || normalized.includes('dokumen')) {
    return 'document';
  }

  return 'unknown';
}