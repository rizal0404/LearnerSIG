import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { loadConfig } from './config/env.js';
import { createBrowserSession } from './browser/session.js';
import { loginToPortal } from './browser/login.js';
import { discoverCourse } from './portal/course.js';
import { writeJsonReport } from './storage/reports.js';

const command = process.argv[2] ?? 'discover';

async function runDiscover(): Promise<void> {
  const config = loadConfig();
  const session = await createBrowserSession(config);

  try {
    await loginToPortal(session.page, config);
    const discovery = await discoverCourse(session.page, config);
    await mkdir(dirname(config.discoveryOutput), { recursive: true });
    await writeJsonReport(config.discoveryOutput, discovery);
    console.log(`Discovery selesai: ${config.discoveryOutput}`);
  } finally {
    await session.context.close();
    await session.browser.close();
  }
}

async function main(): Promise<void> {
  if (command !== 'discover') {
    throw new Error(`Command tidak dikenal: ${command}. Gunakan: discover`);
  }

  await runDiscover();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
