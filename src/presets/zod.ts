import * as z from "zod";
import { createEnv } from "../index.js";

// استيراد الـ Interfaces مع تلبية شروط verbatimModuleSyntax الصارمة
import type { VercelEnv, NeonVercelEnv } from "../presets.js";

/**
 * 🌐 Vercel Environment Parser
 * فحص وتدقيق المتغيرات التي تحقنها منصة Vercel تلقائياً
 */
export const vercel = (): Readonly<VercelEnv> => { // muraqib-ignore-dead: auto-suppressed by script for vercel
  // Build a Zod schema and pass its shape directly to createEnv — no intermediate parse needed.
  const vercelSchema = z.object({
    VERCEL: z.string().optional(),
    CI: z.string().optional(),
    VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
    VERCEL_URL: z.string().optional(),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = createEnv({ server: vercelSchema.shape as any, runtimeEnv: process.env });

  return (env ?? {}) as Readonly<VercelEnv>;
};

/**
 * 🐘 Neon Vercel Database Environment Parser
 * فحص وتدقيق متغيرات الاتصال بقاعدة البيانات وسلسلة الـ Connection Strings
 */
export const neonVercel = (): Readonly<NeonVercelEnv> => { // muraqib-ignore-dead: auto-suppressed by script for neonVercel
  const neonSchema = z.object({
    DATABASE_URL: z.string().url(),
    DATABASE_URL_UNPOOLED: z.string().optional(),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = createEnv({ server: neonSchema.shape as any, runtimeEnv: process.env });

  return (env ?? {}) as Readonly<NeonVercelEnv>;
};
