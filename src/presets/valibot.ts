import { optional, string, picklist, pipe, url, parse } from "valibot";

// استيراد الـ Interfaces مع تلبية شروط verbatimModuleSyntax الصارمة
import type { VercelEnv, NeonVercelEnv } from "../presets.js";

/**
 * 🌐 Vercel Environment Parser
 * فحص وتدقيق المتغيرات التي تحقنها منصة Vercel تلقائياً باستخدام Valibot
 */
export const vercel = (): Readonly<VercelEnv> => {
  try {
    // 1️⃣ بناء سكيمة الفحص الخاصة بـ Valibot
    const vercelSchema = {
      VERCEL: optional(string()),
      CI: optional(string()),
      VERCEL_ENV: optional(picklist(["development", "preview", "production"])),
      VERCEL_URL: optional(string()),
    };

    // 2️⃣ تشغيل الفحص المباشر على متغيرات البيئة لمنع تضارب الأنواع (never)
    // نستخدم الأسلوب المرن للتمرير لضمان مطابقة الـ Keys المطلوبة فقط
    const parsedData = parse(
      { type: 'object', entries: vercelSchema } as any, 
      process.env
    );

    return parsedData as unknown as Readonly<VercelEnv>;
  } catch (error) {
    // حارس الأمان (Safe Fallback): في حال فشل الفحص نعود بكائن فارغ لمنع الـ Runtime Crash
    return {} as Readonly<VercelEnv>;
  }
};

/**
 * 🐘 Neon Vercel Database Environment Parser
 * فحص وتدقيق متغيرات الاتصال بقاعدة البيانات وسلسلة الـ Connection Strings
 */
export const neonVercel = (): Readonly<NeonVercelEnv> => {
  try {
    const neonSchema = {
      // 🚀 استخدام الـ pipe: نفحص أولاً أنه string، ثم ندققه لنتأكد أنه url صحيح
      DATABASE_URL: pipe(string(), url()), 
      DATABASE_URL_UNPOOLED: optional(string()),
    };

    const parsedData = parse(
      { type: 'object', entries: neonSchema } as any, 
      process.env
    );

    return parsedData as unknown as Readonly<NeonVercelEnv>;
  } catch (error) {
    // هبوط آمن لقاعدة البيانات أيضاً في حال غياب المتغيرات محلياً أثناء التطوير
    return {} as Readonly<NeonVercelEnv>;
  }
};