import { presetsMap, type PresetInput } from "./presets.js";
import { createGuard } from "./core/standard.js"; // الدالة الأساسية بمكتبتك

// تعريف المعاملات التي تستقبلها الدالة الذكية
interface CreateEnvOptions {
  server?: Record<string, any>;
  client?: Record<string, any>;
  presets?: PresetInput[]; // مصفوفة هجينة تقبل نصوص أو كائنات مخصصة
  runtimeEnv: Record<string, any>;
  isServer?: boolean;
  emptyStringAsUndefined?: boolean;
}

export function createEnv(opts: CreateEnvOptions) {
  // 1. تجميع شروط المطور الأساسية (السيرفر والكلينت)
  let combinedSchema: Record<string, any> = {
    ...opts.server,
    ...opts.client,
  };

  // 2. معالجة الـ Presets والـ Custom Schemas ديناميكياً
  if (opts.presets) {
    for (const preset of opts.presets) {
      if (typeof preset === "string") {
        // أ) إذا كان نصاً، نسحب الخلطة الجاهزة من السجل
        const presetSchema = presetsMap[preset];
        if (presetSchema) {
          combinedSchema = { ...combinedSchema, ...presetSchema };
        }
      } else if (preset && typeof preset === "object") {
        // ب) إذا كان Object، فهذا هو الـ Custom Schema المخصص من المطور! ندمجه فوراً
        combinedSchema = { ...combinedSchema, ...preset };
      }
    }
  }

  // 3. تمرير المخطط المدمج النهائي لحارس الحماية الأساسي بمكتبتك
  return createGuard(combinedSchema, {
    runtimeEnv: opts.runtimeEnv,
    isServer: opts.isServer ?? typeof window === "undefined",
    emptyStringAsUndefined: opts.emptyStringAsUndefined ?? true,
  });
}

export * from "./core/types.js";
export * from "./core/standard.js";