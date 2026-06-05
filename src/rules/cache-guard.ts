// src/rules/cache-guard.ts
import { z } from "zod";

/**
 * حارس فحص سياسات التخزين المؤقت (HTTP Cache-Control Config Guard)
 * يضمن عدم تمرير إعدادات تالفة أو ضعيفة للأداء في بيئات العمل الحية
 */
export const cachePerformanceSchema = {
  // إجبار المطور على تحديد الـ Cache Max-Age بالأرقام (بالثواني)
  STATIC_ASSETS_CACHE_MAX_AGE: z
    .string()
    .or(z.number())
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val >= 86400, {
      message: "❌ [Muraqib Performance Guard]: Cache max-age for static assets must be at least 1 day (86400 seconds) to ensure optimal Staging/Production performance!",
    }),
  
  // التأكد من تفعيل بروتوكول الضغط والـ Compression لتقليل حجم المنقول عبر الشبكة
  ENABLE_SERVER_COMPRESSION: z
    .string()
    .or(z.boolean())
    .transform((val) => String(val).toLowerCase() === "true")
    .refine((val) => val === true, {
      message: "⚠️ [Muraqib Performance Warning]: Gzip/Brotli Compression is disabled. Please set ENABLE_SERVER_COMPRESSION=true to reduce asset payload sizes.",
    }),
};