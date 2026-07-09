import type { Frame, Page } from 'playwright';
import type { AppConfig } from '../config/env.js';
import { captureDebugArtifacts } from '../browser/debug.js';
import { captureProgressEvidence, type ProgressEvidence } from '../browser/evidence.js';
import { discoverCourse, type CourseContentItem, type CourseDiscovery } from './course.js';
import { courseSelectors } from './selectors.js';
import { extractVideoTranscript, type VideoTranscript } from './transcript.js';

export type VideoRunItemResult = {
  index: number;
  title: string;
  startedAt: string;
  completedAt: string;
  progressPercent: number;
  evidence: ProgressEvidence;
  transcript: VideoTranscript;
};

export type ProgressSnapshot = {
  capturedAt: string;
  completedCount: number;
  totalCount: number;
  averageProgressPercent: number;
  items: CourseContentItem[];
  evidence: ProgressEvidence;
};

export type VideoRunReport = {
  startedAt: string;
  completedAt: string;
  sourceUrl: string;
  title: string | null;
  videoCount: number;
  initialProgress: ProgressSnapshot;
  finalProgress: ProgressSnapshot;
  completedVideos: VideoRunItemResult[];
};

export async function runCourseVideos(page: Page, config: AppConfig): Promise<VideoRunReport> {
  const startedAt = new Date().toISOString();
  const initialDiscovery = await discoverCourse(page, config);
  const videos = initialDiscovery.items
    .filter((item) => item.kind === 'video')
    .sort((left, right) => left.index - right.index);

  if (videos.length === 0) {
    throw new Error('Tidak ada item video yang ditemukan dari hasil discovery course.');
  }

  assertVideosAreUnlockedByProgress(initialDiscovery.items, videos);

  const initialProgress = await captureProgressSnapshot(page, config, initialDiscovery, 'initial-progress');
  const completedVideos: VideoRunItemResult[] = [];

  for (const video of videos) {
    const freshVideo = await findCurrentVideo(page, config, video);
    if ((freshVideo.progressPercent ?? 0) >= 100) {
      console.log(`Lewati video ${freshVideo.index}: progress sudah 100%`);
      await openCourseVideo(page, config, freshVideo);
      const transcript = await extractVideoTranscript(page, config.transcriptOutputDir, freshVideo.index, freshVideo.title);
      await page.goto(config.courseUrl, { waitUntil: 'domcontentloaded', timeout: config.pageLoadTimeoutMs });
      const evidence = await captureProgressEvidence(page, config.progressEvidenceDir, `video-${freshVideo.index}-already-complete`);
      completedVideos.push(toCompletedResult(freshVideo, new Date().toISOString(), new Date().toISOString(), evidence, transcript));
      continue;
    }

    const videoStartedAt = new Date().toISOString();
    console.log(`Mulai video ${freshVideo.index}: ${freshVideo.title}`);

    try {
      await openCourseVideo(page, config, freshVideo);
      const transcript = await extractVideoTranscript(page, config.transcriptOutputDir, freshVideo.index, freshVideo.title);
      await playVisibleVideo(page, config);
      const completedVideo = await waitForVideoProgress(page, config, freshVideo);
      const evidence = await captureProgressEvidence(page, config.progressEvidenceDir, `video-${completedVideo.index}-complete`);
      completedVideos.push(toCompletedResult(completedVideo, videoStartedAt, new Date().toISOString(), evidence, transcript));
      console.log(`Selesai video ${completedVideo.index}: progress ${completedVideo.progressPercent}%`);
    } catch (error) {
      await captureDebugArtifacts(page, `video-${freshVideo.index}-failure`);
      throw new Error(`Gagal menjalankan video ${freshVideo.index} (${freshVideo.title}). Debug: screenshots/video-${freshVideo.index}-failure.*. Detail: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const finalDiscovery = await discoverCourse(page, config);
  const finalProgress = await captureProgressSnapshot(page, config, finalDiscovery, 'final-progress');

  return {
    startedAt,
    completedAt: new Date().toISOString(),
    sourceUrl: initialDiscovery.sourceUrl,
    title: initialDiscovery.title,
    videoCount: videos.length,
    initialProgress,
    finalProgress,
    completedVideos
  };
}

async function captureProgressSnapshot(page: Page, config: AppConfig, discovery: CourseDiscovery, label: string): Promise<ProgressSnapshot> {
  const progressValues = discovery.items.map((item) => item.progressPercent ?? 0);
  const averageProgressPercent = progressValues.length === 0
    ? 0
    : Math.round(progressValues.reduce((total, value) => total + value, 0) / progressValues.length);

  return {
    capturedAt: new Date().toISOString(),
    completedCount: discovery.items.filter((item) => (item.progressPercent ?? 0) >= 100).length,
    totalCount: discovery.items.length,
    averageProgressPercent,
    items: discovery.items,
    evidence: await captureProgressEvidence(page, config.progressEvidenceDir, label)
  };
}

async function findCurrentVideo(page: Page, config: AppConfig, expectedVideo: CourseContentItem): Promise<CourseContentItem> {
  const discovery = await discoverCourse(page, config);
  const video = discovery.items.find((item) => item.kind === 'video' && item.index === expectedVideo.index)
    ?? discovery.items.find((item) => item.kind === 'video' && item.title === expectedVideo.title);

  if (!video) {
    throw new Error(`Video tidak ditemukan ulang di course: ${expectedVideo.title}`);
  }

  return video;
}

async function openCourseVideo(page: Page, config: AppConfig, video: CourseContentItem): Promise<void> {
  await page.goto(config.courseUrl, { waitUntil: 'domcontentloaded', timeout: config.pageLoadTimeoutMs });
  await page.waitForLoadState('domcontentloaded', { timeout: config.pageLoadTimeoutMs }).catch(() => undefined);
  await page.waitForTimeout(2_000);

  if (await hasPlayableVideo(page)) {
    return;
  }

  const lessonButton = await findLessonButton(page, video);
  if (!lessonButton) {
    throw new Error(`Tombol lesson video tidak ditemukan dan elemen video belum tampil: ${video.title}. Jika video sudah tampil di browser, jalankan ulang; jika masih gagal, selector layout responsive perlu disesuaikan.`);
  }

  if (lessonButton.locked || lessonButton.disabled) {
    throw new Error(`Video masih terkunci/disabled di portal: ${lessonButton.title}. Selesaikan prasyarat sebelumnya terlebih dahulu, biasanya pre-test atau materi sebelum video ini.`);
  }

  await page.locator('button.sig-lesson-item, [data-slide-id].sig-lesson-item').nth(lessonButton.position).click();
  await page.waitForLoadState('domcontentloaded', { timeout: config.pageLoadTimeoutMs }).catch(() => undefined);
  await page.waitForTimeout(3_000);

  if (!(await hasPlayableVideo(page))) {
    throw new Error(`Tombol video sudah diklik, tetapi elemen video belum tampil: ${video.title}`);
  }
}

type LessonButtonState = {
  position: number;
  title: string;
  disabled: boolean;
  locked: boolean;
};

async function findLessonButton(page: Page, video: CourseContentItem): Promise<LessonButtonState | null> {
  const expectedVideoJson = JSON.stringify({ index: video.index, title: video.title });

  return await page.evaluate(`(() => {
    const expectedVideo = ${expectedVideoJson};
    const normalize = (value) => value.replace(/\s+/g, ' ').trim().toLowerCase();
    const compact = (value) => normalize(value).replace(/[^a-z0-9]+/g, '');
    const expectedTitle = normalize(expectedVideo.title);
    const expectedCompactTitle = compact(expectedVideo.title);
    const elements = [...document.querySelectorAll('button.sig-lesson-item, [data-slide-id].sig-lesson-item')];

    for (const [position, element] of elements.entries()) {
      const titleElement = element.querySelector('.sig-lesson-title');
      const indexElement = element.querySelector('.sig-lesson-index');
      const rawTitle = (titleElement && titleElement.textContent) || element.textContent || '';
      const title = normalize(rawTitle);
      const compactTitle = compact(rawTitle);
      const indexText = normalize((indexElement && indexElement.textContent) || '');
      const isVideo = element.dataset.category === 'video' || element.dataset.mediaType === 'video' || title.includes('.mp4');
      const titleMatches = title === expectedTitle || title.includes(expectedTitle) || expectedTitle.includes(title) || compactTitle.includes(expectedCompactTitle) || expectedCompactTitle.includes(compactTitle);
      const indexMatches = indexText === String(expectedVideo.index);

      if (!isVideo || (!titleMatches && !indexMatches)) {
        continue;
      }

      return {
        position,
        title: rawTitle.replace(/\s+/g, ' ').trim(),
        disabled: element.matches(':disabled') || element.hasAttribute('disabled'),
        locked: element.classList.contains('is-locked') || element.dataset.forceLocked === '1'
      };
    }

    return null;
  })()`) as LessonButtonState | null;
}
function assertVideosAreUnlockedByProgress(items: CourseContentItem[], videos: CourseContentItem[]): void {
  const firstPendingVideo = videos.find((video) => (video.progressPercent ?? 0) < 100);
  if (!firstPendingVideo) {
    return;
  }

  const blockingItems = items.filter((item) => item.index < firstPendingVideo.index && (item.progressPercent ?? 0) < 100);
  if (blockingItems.length === 0) {
    return;
  }

  const blockers = blockingItems.map((item) => `#${item.index} ${item.title} (${item.progressPercent ?? 0}%)`).join(', ');
  throw new Error(`Video #${firstPendingVideo.index} belum bisa dijalankan karena prasyarat sebelumnya belum 100%: ${blockers}. Selesaikan item tersebut di portal, lalu jalankan ulang npm run run-videos:session.`);
}

async function hasPlayableVideo(page: Page): Promise<boolean> {
  for (const frame of page.frames()) {
    const hasVideo = await frame.evaluate(`(() => {
      return [...document.querySelectorAll('video')].some((element) => {
        const rect = element.getBoundingClientRect();
        const source = element.currentSrc || (element.querySelector('source') && element.querySelector('source').src) || '';
        return rect.width > 0 && rect.height > 0 && source.length > 0;
      });
    })()`).then(Boolean).catch(() => false);

    if (hasVideo) {
      return true;
    }
  }

  return false;
}

async function playVisibleVideo(page: Page, config: AppConfig): Promise<void> {
  const deadline = Date.now() + config.pageLoadTimeoutMs;

  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      const started = await tryPlayVideoInFrame(frame);
      if (started) {
        return;
      }
    }

    await page.waitForTimeout(1_000);
  }

  throw new Error('Elemen video tidak ditemukan atau tidak bisa diputar.');
}

async function tryPlayVideoInFrame(frame: Frame): Promise<boolean> {
  return await frame.evaluate(`(async () => {
    const video = [...document.querySelectorAll('video')].find((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    if (!video) {
      return false;
    }

    video.muted = true;
    video.playbackRate = 1;
    await video.play();
    return !video.paused;
  })()`).then(Boolean).catch(() => false);
}

async function waitForVideoProgress(page: Page, config: AppConfig, video: CourseContentItem): Promise<CourseContentItem> {
  const timeoutMs = config.maxVideoMinutes * 60_000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    await waitForAnyVideoToEnd(page, 30_000).catch(() => undefined);
    await page.goto(config.courseUrl, { waitUntil: 'domcontentloaded', timeout: config.pageLoadTimeoutMs });
    await page.waitForTimeout(5_000);

    const refreshedVideo = await findCurrentVideo(page, config, video);
    if ((refreshedVideo.progressPercent ?? 0) >= 100) {
      return refreshedVideo;
    }

    console.log(`Progress video ${video.index}: ${refreshedVideo.progressPercent ?? 0}%`);
    await openCourseVideo(page, config, refreshedVideo);
    await playVisibleVideo(page, config);
  }

  throw new Error(`Timeout menunggu progress video mencapai 100% setelah ${config.maxVideoMinutes} menit.`);
}

async function waitForAnyVideoToEnd(page: Page, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      const ended = await isVideoEnded(frame);
      if (ended) {
        return;
      }
    }

    await page.waitForTimeout(2_000);
  }

  throw new Error('Video belum selesai dalam interval polling.');
}

async function isVideoEnded(frame: Frame): Promise<boolean> {
  return await frame.evaluate(`(() => {
    const video = [...document.querySelectorAll('video')].find((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    if (!video) {
      return false;
    }

    return video.ended || (Number.isFinite(video.duration) && video.duration > 0 && video.currentTime >= video.duration - 1);
  })()`).then(Boolean).catch(() => false);
}

function toCompletedResult(item: CourseContentItem, startedAt: string, completedAt: string, evidence: ProgressEvidence, transcript: VideoTranscript): VideoRunItemResult {
  return {
    index: item.index,
    title: item.title,
    startedAt,
    completedAt,
    progressPercent: item.progressPercent ?? 100,
    evidence,
    transcript
  };
}
