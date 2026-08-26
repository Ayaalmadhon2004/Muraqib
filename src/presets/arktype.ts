import { type } from "arktype";
import { createEnv } from "../index.js";

// استيراد الـ Interfaces مع تلبية شروط verbatimModuleSyntax الصارمة
import type { VercelEnv, NeonVercelEnv } from "../presets.js";

/**
 * 🌐 Vercel Environment Parser
 * فحص وتدقيق المتغيرات التي تحقنها منصة Vercel تلقائياً في السيرفر
 */
// muraqib-ignore-dead: intentionally preserved (auto-suppress)
export const vercel = (): Readonly<VercelEnv> => {
  // نقوم بتعريف الـ Schema ونترك ArkType يستنتج نوعها النقي
  const vercelSchema = type({
    VERCEL: "string | undefined",
    CI: "string | undefined",
    VERCEL_ENV: "'development' | 'preview' | 'production' | undefined",
    VERCEL_URL: "string | undefined",
  });

  // نقوم بعمل فحص (Assert) لبيئة التشغيل الحالية
  const out = vercelSchema(process.env);

  // إذا نجح الفحص نعود بالبيانات، وإذا فشل نعود بكائن فارغ كحارس أمان (Safe Fallback)
  return (out instanceof Error ? {} : out) as unknown as Readonly<VercelEnv>;
};

/**
 * 🐘 Neon Vercel Database Environment Parser
 * فحص وتدقيق متغيرات الاتصال بقاعدة البيانات وسلسلة الـ Connection Strings
// muraqib-ignore-dead: intentionally preserved (auto-suppress)
 */
export const neonVercel = (): Readonly<NeonVercelEnv> => {
  // بناء سكيمة فحص قاعدة البيانات متوافقة مع خصائص ArkType القياسية
  const neonSchema = type({
    DATABASE_URL: "string", 
    DATABASE_URL_UNPOOLED: "string | undefined",
  });

  const out = neonSchema(process.env);

  return (out instanceof Error ? {} : out) as unknown as Readonly<NeonVercelEnv>;
};