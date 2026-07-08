import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORTAL_URL: z.string().url(),
  PORTAL_USERNAME: z.string().min(1),
  PORTAL_PASSWORD: z.string().min(1),
  COURSE_URL: z.string().url(),
  HEADLESS: z.coerce.boolean().default(true),
  SLOW_MO_MS: z.coerce.number().int().min(0).default(0),
  MAX_TEST_MINUTES: z.coerce.number().int().positive().default(10),
  MAX_VIDEO_MINUTES: z.coerce.number().int().positive().default(60),
  DISCOVERY_OUTPUT: z.string().min(1).default('reports/course-discovery.json'),
  SESSION_STATE_PATH: z.string().min(1).default('.auth/session.json'),
  LOGIN_SUCCESS_URL: z.string().min(1).default('/erp'),
  LOGIN_TIMEOUT_MS: z.coerce.number().int().positive().default(120_000),
  PAGE_LOAD_TIMEOUT_MS: z.coerce.number().int().positive().default(120_000)
});

export type AppConfig = {
  portalUrl: string;
  username: string;
  password: string;
  courseUrl: string;
  headless: boolean;
  slowMoMs: number;
  maxTestMinutes: number;
  maxVideoMinutes: number;
  discoveryOutput: string;
  sessionStatePath: string;
  loginSuccessUrl: string;
  loginTimeoutMs: number;
  pageLoadTimeoutMs: number;
};

export function loadConfig(): AppConfig {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n');
    throw new Error(`Konfigurasi .env tidak valid:\n${details}`);
  }

  return {
    portalUrl: parsed.data.PORTAL_URL,
    username: parsed.data.PORTAL_USERNAME,
    password: parsed.data.PORTAL_PASSWORD,
    courseUrl: parsed.data.COURSE_URL,
    headless: parsed.data.HEADLESS,
    slowMoMs: parsed.data.SLOW_MO_MS,
    maxTestMinutes: parsed.data.MAX_TEST_MINUTES,
    maxVideoMinutes: parsed.data.MAX_VIDEO_MINUTES,
    discoveryOutput: parsed.data.DISCOVERY_OUTPUT,
    sessionStatePath: parsed.data.SESSION_STATE_PATH,
    loginSuccessUrl: parsed.data.LOGIN_SUCCESS_URL,
    loginTimeoutMs: parsed.data.LOGIN_TIMEOUT_MS,
    pageLoadTimeoutMs: parsed.data.PAGE_LOAD_TIMEOUT_MS
  };
}
