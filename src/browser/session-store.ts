import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { BrowserContext } from 'playwright';
import type { AppConfig } from '../config/env.js';

export async function saveSessionState(context: BrowserContext, config: AppConfig): Promise<void> {
  const state = await context.storageState();
  await mkdir(dirname(config.sessionStatePath), { recursive: true });
  await writeFile(config.sessionStatePath, JSON.stringify(state, null, 2), 'utf8');
}