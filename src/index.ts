import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { loadConfig } from './config/env.js';
import { createBrowserSession } from './browser/session.js';
import { saveSessionState } from './browser/session-store.js';
import { loginToPortal } from './browser/login.js';
import { discoverCourse } from './portal/course.js';
import { runCourseVideos } from './portal/video-runner.js';
import { writeJsonReport } from './storage/reports.js';

const command = process.argv[2] ?? 'discover';
const useSession = process.argv.includes('--session');

async function runSaveSession(): Promise<void> {
  const config = loadConfig();
  const session = await createBrowserSession(config, { storeSession: true });

  try {
    await loginToPortal(session.page, config);
    await saveSessionState(session.context, config);
    console.log(`Session tersimpan: ${config.sessionStatePath}`);
    console.log('Browser akan ditutup dalam 5 detik. Jangan tutup tab.');
    await new Promise((resolve) => setTimeout(resolve, 5_000));
  } finally {
    await session.context.close();
    await session.browser.close();
  }
}

async function runDiscover(): Promise<void> {
  const config = loadConfig();
  const session = await createBrowserSession(config, { useSavedSession: useSession });

  try {
    if (!useSession) {
      await loginToPortal(session.page, config);
    }

    const discovery = await discoverCourse(session.page, config);
    await mkdir(dirname(config.discoveryOutput), { recursive: true });
    await writeJsonReport(config.discoveryOutput, discovery);
    console.log(`Discovery selesai: ${config.discoveryOutput}`);
  } finally {
    await session.context.close();
    await session.browser.close();
  }
}

async function runVideos(): Promise<void> {
  const config = loadConfig();
  const session = await createBrowserSession(config, { useSavedSession: useSession });

  try {
    if (!useSession) {
      await loginToPortal(session.page, config);
    }

    const report = await runCourseVideos(session.page, config);
    await mkdir(dirname(config.videoRunOutput), { recursive: true });
    await writeJsonReport(config.videoRunOutput, report);
    console.log(`Video run selesai: ${config.videoRunOutput}`);
  } finally {
    await session.context.close();
    await session.browser.close();
  }
}
async function main(): Promise<void> {
  if (command === 'save-session') {
    await runSaveSession();
    return;
  }

  if (command === 'discover') {
    await runDiscover();
    return;
  }

  if (command === 'run-videos') {
    await runVideos();
    return;
  }

  throw new Error(`Command tidak dikenal: ${command}. Gunakan: save-session, discover [--session], run-videos [--session]`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});