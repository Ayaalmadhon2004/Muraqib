// src/env.ts
import { z } from "zod";
import { presetsMap } from "./presets.js";
import type { PresetInput } from "./presets.js";
import { createGuard } from "./core/standard.js";
import type { GuardSchema } from "./core/types.js";
import { isWithinSchedule } from "./utils/schedule-validator.js";

// =========================================================================
// 1. الأنواع البرمجية العميقة واستنتاج مخرجات الأنواع
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
// 2. واجهات إعدادات المحرك المركزي
// =========================================================================
export interface CreateEnvOptions<
  TPrefix extends string = "",
  TServer extends GuardSchema = Record<string, never>,
  TClient extends GuardSchema = Record<string, never>,
  TExtends extends any[] = []
> {
  clientPrefix?: TPrefix;
  server?: {
    [K in keyof TServer]: K extends `${TPrefix}${string}`
      ? ErrorMessage<`❌ خطأ مالي: المتغير "${K & string}" يحمل البادئة المخصصة للعميل، يرجى نقله إلى كائن الـ client.`>
      : TServer[K];
  };
  client?: {
    [K in keyof TClient]: K extends `${TPrefix}${string}`
      ? TClient[K]
      : ErrorMessage<`❌ خطأ أمني: المتغير "${K & string}" لا يحمل البادئة الآمنة "${TPrefix}"، يرجى نقله للسيرفر.`>;
  };
  runtimeEnvStrict?: Record<string, unknown>;
  runtimeEnv?: Record<string, string | undefined>;
  extends?: TExtends;
  emptyStringAsUndefined?: boolean;
  isServer?: boolean;
  schedule?: string;
}

// =========================================================================
// 3. المحرك المعماري الأساسي لبناء وتدقيق بيئة العمل
// =========================================================================
export function createEnv<
  TPrefix extends string = "",
  TServer extends GuardSchema = Record<string, never>,
  TClient extends GuardSchema = Record<string, never>,
  TExtends extends any[] = []
>(
  opts: CreateEnvOptions<TPrefix, TServer, TClient, TExtends>
): InferSchema<TServer> & InferSchema<TClient> & IntersectExtension<TExtends> | null {
  
  if (opts.schedule) {
    const allowedToRun = isWithinSchedule(opts.schedule);
    if (!allowedToRun) {
      console.warn(`⏳ [Muraqib Scheduler]: Process halted automatically. Current time is outside allowed cron window.`);
      return null;
    }
  }

  let rawSchemaFields: Record<string, any> = {
    ...opts.server,
    ...opts.client,
  };

  const combinedSchema = z.object(rawSchemaFields);
  const rawEnv = opts.runtimeEnvStrict ?? opts.runtimeEnv ?? process.env;
  const processedEnv: Record<string, any> = { ...rawEnv };

  if (opts.extends && Array.isArray(opts.extends)) {
    for (const extendedEnv of opts.extends) {
      if (extendedEnv && typeof extendedEnv === "object") {
        Object.assign(processedEnv, extendedEnv);
      }
    }
  }

  const shouldSanitize = opts.emptyStringAsUndefined ?? true;
  if (shouldSanitize) {
    for (const key in processedEnv) {
      if (processedEnv[key] === "") {
        processedEnv[key] = undefined;
      }
    }
  }

  console.log(`🛡️ [Muraqib Guards]: Building and executing runtime environment integrity validations...`);

  try {
    const validatedGuard = createGuard(combinedSchema, {
      runtimeEnv: processedEnv,
      isServer: opts.isServer ?? typeof window === "undefined",
      emptyStringAsUndefined: shouldSanitize,
    });
    
    return (validatedGuard?.data ?? validatedGuard) as any;
  } catch (validationError: any) {
    console.error(`💥 [Muraqib Guards Error]: Environment core validation crashed!`);
    throw validationError;
  }
}

// =========================================================================
// 4. الدالة المغلّفة المسهلة لتجربة المطورين (Presets Wrapper)
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
  
  const serverSchema: Record<string, z.ZodTypeAny> = { ...userSchema };

  if (options.presets && Array.isArray(options.presets)) {
    for (const presetName of options.presets) {
      const preset = presetsMap[presetName];
      if (preset) {
        console.log(`📦 [Muraqib Presets]: Injecting centralized validation schema for [${presetName}].`);
        Object.assign(serverSchema, preset);
      }
    }
  }

  return createEnv({
    server: serverSchema,
    runtimeEnv: options.runtimeEnv,
    emptyStringAsUndefined: options.emptyStringAsUndefined,
    isServer: options.isServer,
    schedule: options.schedule,
  } as any) as any;
}