// src/env.ts
import { z } from "zod";
import { presetsMap } from "./presets.js";
import type { PresetInput } from "./presets.js";
import { createGuard } from "./guard/core/standard.js";
import type { GuardSchema } from "./guard/core/types.js";

// ===================================================
// 🧬 TypeScript Strict Inference (مطابق للصورة بالملي)
// ===================================================

// استنتاج نوع المخرجات تلقائياً من أي مكتبة فحص (Standard Schema Inference)
type InferSchema<T extends GuardSchema> = {
  [K in keyof T]: T[K] extends { _output: infer O }
    ? O
    : T[K] extends { infer: () => infer O }
    ? O
    : T[K] extends { ["~standard"]: { types: { output: infer O } } }
    ? O
    : any;
};

// نوع ذكي لدمج المصفوفات الممتدة (extends) واستخراج أنواعها
type IntersectExtension<T extends any[]> = T extends [infer Head, ...infer Tail]
  ? (Head extends Record<string, any> ? Head : {}) & IntersectExtension<Tail>
  : {};

// واجهة خيارات createEnv الصارمة التي تجبر الـ Client على مطابقة الـ Prefix
interface CreateEnvOptions<
  TPrefix extends string = "",
  TServer extends GuardSchema = Record<string, never>,
  TClient extends GuardSchema = Record<string, never>,
  TExtends extends any[] = []
> {
  clientPrefix?: TPrefix;
  
  // فحص صارم: إذا بدأ مفتاح السيرفر بالـ Prefix يمنعه الـ Compiler فوراً
  server?: {
    [K in keyof TServer]: K extends `${TPrefix}${string}`
      ? never
      : TServer[K];
  };

  // فحص صارم: يجب أن تبدأ جميع مفاتيح الكلاينت بالـ Prefix وإلا تصبح never ويضرب الـ Compiler
  client?: {
    [K in keyof TClient]: K extends `${TPrefix}${string}`
      ? TClient[K]
      : never;
  };

  presets?: PresetInput[];
  runtimeEnv?: Record<string, any>;
  runtimeEnvStrict?: Record<string, any>;
  isServer?: boolean;
  emptyStringAsUndefined?: boolean;
  extends?: [...TExtends];
}

// ===================================================
// 🚀 الدالة المركزية المطورة بالأنواع الصارمة
// ===================================================
export function createEnv<
  TPrefix extends string = "",
  TServer extends GuardSchema = Record<string, never>,
  TClient extends GuardSchema = Record<string, never>,
  TExtends extends any[] = []
>(
  opts: CreateEnvOptions<TPrefix, TServer, TClient, TExtends>
): Readonly<InferSchema<TServer> & InferSchema<TClient> & IntersectExtension<TExtends>> {
  
  const clientPrefix = opts.clientPrefix ?? "";

  // 1️⃣ حارس الـ Runtime (لو حاول المطور تخطي التايب سكريبت بـ as any)
  if (clientPrefix && opts.server) {
    for (const key in opts.server) {
      if (key.startsWith(clientPrefix)) {
        throw new Error(`🚨 Muraqib Architectural Violation: Server variable "${key}" should not be prefixed with "${clientPrefix}".`);
      }
    }
  }

  if (clientPrefix && opts.client) {
    for (const key in opts.client) {
      if (!key.startsWith(clientPrefix)) {
        throw new Error(`🚨 Muraqib Architectural Violation: Client variable "${key}" must be prefixed with "${clientPrefix}".`);
      }
    }
  }

  // 2️⃣ تجميع الـ Schemas (Server + Client)
  let combinedSchema: GuardSchema = {
    ...opts.server,
    ...opts.client,
  };

  // 3️⃣ دمج الـ Presets
  if (opts.presets) {
    for (const preset of opts.presets) {
      if (typeof preset === "string") {
        const presetSchema = presetsMap[preset];
        if (presetSchema) {
          combinedSchema = { ...combinedSchema, ...presetSchema };
        }
      } else if (preset && typeof preset === "object") {
        combinedSchema = { ...combinedSchema, ...preset };
      }
    }
  }

  // 4️⃣ تجميع البيئة وتطبيق الـ Extends
  const rawEnv = opts.runtimeEnvStrict ?? opts.runtimeEnv ?? process.env;
  const processedEnv: Record<string, any> = { ...rawEnv };

  if (opts.extends && Array.isArray(opts.extends)) {
    for (const extendedEnv of opts.extends) {
      if (extendedEnv && typeof extendedEnv === "object") {
        Object.assign(processedEnv, extendedEnv);
      }
    }
  }

  // 5️⃣ التطهير (Sanitization)
  const shouldSanitize = opts.emptyStringAsUndefined ?? true;
  if (shouldSanitize) {
    for (const key in processedEnv) {
      if (processedEnv[key] === "") {
        processedEnv[key] = undefined;
      }
    }
  }

  // 6️⃣ إرجاع الـ Proxy Shield المحمي
  return createGuard(combinedSchema, {
    runtimeEnv: processedEnv,
    isServer: opts.isServer ?? typeof window === "undefined",
    emptyStringAsUndefined: shouldSanitize,
  }) as any;
}

// ===================================================
// 🔄 Backward Compatibility: createEnvWithPresets
// ===================================================
export function createEnvWithPresets<T extends Record<string, z.ZodTypeAny>>(
  userSchema: T,
  options: {
    runtimeEnv: Record<string, any>;
    isServer?: boolean;
    emptyStringAsUndefined?: boolean;
    presets?: PresetInput[]; 
  }
): Readonly<InferSchema<T>> {
  return createEnv({
    server: userSchema,
    presets: options.presets,
    runtimeEnv: options.runtimeEnv,
    isServer: options.isServer,
    emptyStringAsUndefined: options.emptyStringAsUndefined,
  }) as any;
}