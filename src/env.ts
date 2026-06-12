// src/env.ts
import { z } from "zod";
import { presetsMap } from "./presets.js";
import type { PresetInput } from "./presets.js";
import { createGuard } from "./core/standard.js";
import type { GuardSchema } from "./core/types.js";
import { isWithinSchedule } from "./utils/schedule-validator.js";
import { runImagePerformanceAudit } from "./core/performance/image-guard.js";
import { runComprehensiveBundleAudit } from "./rules/bundle-budget.js";
import path from "path";

// =========================================================================
// 1. الأنواع البرمجية العميقة واستنتاج مخرجات الأنواع (Advanced TypeScript Meta-programming)
// =========================================================================

export type InferSchema<T extends GuardSchema> = {
  [K in keyof T]: T[K] extends { _output: infer O }
    ? O
    : T[K] extends { infer: () => infer O }
    ? O
    : T[K] extends { ["~standard"]: { types: { output: infer O } } }
    ? O
    : any;
};

export type IntersectExtension<T extends any[]> = T extends [infer Head, ...infer Tail]
  ? (Head extends Record<string, any> ? Head : {}) & IntersectExtension<Tail>
  : {};

export type ErrorMessage<T extends string> = T & { __brand: "ErrorMessage" };

// =========================================================================
// 2. واجهات إعدادات المحرك المركزي (Infrastructure Strict Interfaces)
// =========================================================================

export interface CreateEnvOptions<
  TPrefix extends string = "",
  TServer extends GuardSchema = Record<string, never>,
  TClient extends GuardSchema = Record<string, never>,
  TExtends extends any[] = []
> {
  /**
   * الرمز البادئ لمتغيرات العميل المسموح بتسريبها للمتصفح (مثل VITE_ أو NEXT_PUBLIC_)
   */
  clientPrefix?: TPrefix;

  /**
   * مخطط حراسة وفحص السيرفر (Server-side schema validation rules)
   */
  server?: {
    [K in keyof TServer]: K extends `${TPrefix}${string}`
      ? ErrorMessage<`❌ خطأ مالي: المتغير "${K & string}" يحمل البادئة المخصصة للعميل، يرجى نقله إلى كائن الـ client.`>
      : TServer[K];
  };

  /**
   * مخطط حراسة وفحص العميل (Client-side schema validation rules)
   */
  client?: {
    [K in keyof TClient]: K extends `${TPrefix}${string}`
      ? TClient[K]
      : ErrorMessage<`❌ خطأ أمني: المتغير "${K & string}" لا يحمل البادئة الآمنة "${TPrefix}"، يرجى نقله للسيرفر.`>;
  };

  /**
   * كائن المتغيرات الصارم (يُجبر الأداة على القراءة منه حصراً وعدم اللجوء لـ process.env)
   */
  runtimeEnvStrict?: Record<string, unknown>;

  /**
   * كائن المتغيرات المرن الافتراضي لقراءة المتغيرات المخزنة بالذاكرة
   */
  runtimeEnv?: Record<string, string | undefined>;

  /**
   * امتدادات ووراثة برمجية خارجية من بيئات أخرى مكملة للنظام
   */
  extends?: TExtends;

  /**
   * تحويل النصوص الفارغة "" تلقائياً لقيم غير معرفة undefined لتفعيل أمان الـ Validators
   */
  emptyStringAsUndefined?: boolean;

  /**
   * محاكاة الفحص بداخل بيئة السيرفر أو المتصفح بشكل يدوي وقسري
   */
  isServer?: boolean;

  /**
   * ⏳ حارس الجدولة الزمنية لتحديد أوقات التشغيل المسموح بها للأداة (Cron Syntax)
   */
  schedule?: string;
}

// =========================================================================
// 3. المحرك المعماري الأساسي لبناء وتدقيق بيئة العمل (Core Environment Engine)
// =========================================================================

export function createEnv<
  TPrefix extends string = "",
  TServer extends GuardSchema = Record<string, never>,
  TClient extends GuardSchema = Record<string, never>,
  TExtends extends any[] = []
>(
  opts: CreateEnvOptions<TPrefix, TServer, TClient, TExtends>
): InferSchema<TServer> & InferSchema<TClient> & IntersectExtension<TExtends> | null {
  
  // 🛡️ صمام الأمان والتحكم بالموارد: فحص الجدولة الزمنية (Schedule Validation Boundary)
  if (opts.schedule) {
    const allowedToRun = isWithinSchedule(opts.schedule);
    if (!allowedToRun) {
      console.warn(`⏳ [Muraqib Scheduler]: Process halted automatically. Current time is outside the allowed cron schedule window: "${opts.schedule}"`);
      return null; // يدخل المحرك في طور السبات (Hibernate) ويخرج تماماً دون استهلاك طاقة الجهاز
    }
  }

  // تجميع مخططات الفحص المشتركة (Server + Client) في كائن واحد مفرود
  let rawSchemaFields: Record<string, any> = {
    ...opts.server,
    ...opts.client,
  };

  // 🎯 الإصلاح الجذري: تحويل الـ Record المجمع إلى Zod Object رسمي ومتكامل
  // هذا يمنع حدوث خطأ السقوط البرمجي (Cannot read properties of undefined (reading 'validate')) داخل الـ core الخاص بكِ
  const combinedSchema = z.object(rawSchemaFields);

  // تحديد كائن القراءة الفعلي للمتغيرات بناءً على الصرامة المعمارية المحددة
  const rawEnv = opts.runtimeEnvStrict ?? opts.runtimeEnv ?? process.env;
  const processedEnv: Record<string, any> = { ...rawEnv };

  // معالجة الامتدادات والوراثة الخارجية (Extends Execution Loop)
  if (opts.extends && Array.isArray(opts.extends)) {
    for (const extendedEnv of opts.extends) {
      if (extendedEnv && typeof extendedEnv === "object") {
        // حماية الأنواع: نقوم بنسخ الخصائص الممتدة ودمجها بداخل البيئة الحالية
        Object.assign(processedEnv, extendedEnv);
      }
    }
  }

  // مرحلة التطهير البرمجي: مسح النصوص المفرغة (Sanitization Stage)
  const shouldSanitize = opts.emptyStringAsUndefined ?? true;
  if (shouldSanitize) {
    for (const key in processedEnv) {
      if (processedEnv[key] === "") {
        processedEnv[key] = undefined; // تحويل السلسلة الفارغة لقيمة undefined لتمر تحت بوابة الـ Fallback في Zod
      }
    }
  }

  console.log(`🛡️ [Muraqib Guards]: Building and executing runtime environment integrity validations...`);

  // حقن البيانات النظيفة والمخطط المبني بداخل الحارس القياسي ومراقبة مخرجات الأمان
  try {
    const validatedGuard = createGuard(combinedSchema, {
      runtimeEnv: processedEnv,
      isServer: opts.isServer ?? typeof window === "undefined",
      emptyStringAsUndefined: shouldSanitize,
    });
    
    // إرجاع مخرجات الحارس بعد التحقق منها وتطهيرها بنجاح واستهداف الـ data الناتجة
    return (validatedGuard?.data ?? validatedGuard) as any;
  } catch (validationError: any) {
    console.error(`💥 [Muraqib Guards Error]: Environment core validation crashed!`);
    if (validationError && validationError.errors) {
      console.error(`📋 Detailed breakdown of violating fields:`, JSON.stringify(validationError.errors, null, 2));
    }
    throw validationError; // إطلاق الخطأ للأعلى ليقوم الـ Orchestrator بالتقاطه والتراجع الفوري
  }
}

// =========================================================================
// 4. الدالة المغلّفة المسهلة لتجربة المطورين (Developer Experience - DX Wrapper)
// =========================================================================

export function createEnvWithPresets<T extends Record<string, z.ZodTypeAny>>(
  userSchema: T,
  options: {
    runtimeEnv: Record<string, any>;
    isServer?: boolean;
    emptyStringAsUndefined?: boolean;
    presets?: PresetInput[]; 
    schedule?: string; 
  }
): z.infer<z.ZodObject<T>> | null {
  
  // بناء كائن السيرفر المبدئي ونسخ مخططات المطور المباشرة
  const serverSchema: Record<string, z.ZodTypeAny> = { ...userSchema };

  // البحث عن الـ Presets وحقنها آلياً خلف الكواليس لتقليل التكرار
  if (options.presets && Array.isArray(options.presets)) {
    for (const presetName of options.presets) {
      const preset = presetsMap[presetName];
      if (preset) {
        console.log(`📦 [Muraqib Presets]: Injecting centralized validation schema for [${presetName}] package group.`);
        Object.assign(serverSchema, preset); // دمج خصائص الحزمة الجاهزة (مثل الـ tokens أو الـ URLs)
      } else {
        console.warn(`⚠️  [Muraqib Presets Warning]: Declared preset package "${presetName}" was not found in the local registry.`);
      }
    }
  }

  // إرسال الكائن المهيأ بالكامل إلى محرك الحماية الأساسي مع حماية الأنواع بـ any للربط المرن
  return createEnv({
    server: serverSchema,
    runtimeEnv: options.runtimeEnv,
    emptyStringAsUndefined: options.emptyStringAsUndefined,
    isServer: options.isServer,
    schedule: options.schedule,
  } as any) as any;
}

/****************************************************** */
try {
    runImagePerformanceAudit();
} catch (error) {
    console.error("🚨 [Muraqib]: Something went wrong during image auditing:", error);
}

/********************************************************** */

// سيناريو تجريبي (Simulation) لغرض فحص الكود وعرضه للجنة المناقشة:
// تخيلي أن المبرمج يحفظ ملفاً اسمه 'page.tsx' وحجم الصفحة الناتج تضخم وأصبح 25KB
const simulatedBundleSizeInBytes = 25 * 1024; // 25 KB (أكبر من 14)
const activeUserFile = path.join(process.cwd(), "src/app/page.tsx"); // مسار افتراضي لملف مبرمج

try {
    // تشغيل نظام مراقبة وتشخيص الـ Bundle فوراً
    runComprehensiveBundleAudit(simulatedBundleSizeInBytes, activeUserFile);
} catch (error) {
    console.error("🚨 [Muraqib]: Error during bundle diagnostics execution:", error);
}

/****************************************************************** */
