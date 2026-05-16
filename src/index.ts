import { presetsMap, type PresetName } from "./presets.js";

interface CreateEnvOptions {
  server?: Record<string, any>;
  client?: Record<string, any>;
  presets?: PresetName[]; // مصفوفة الأسماء مثل ["vercel", "supabase"]
  runtimeEnv: Record<string, any>;
}

export function createEnv(opts: CreateEnvOptions) {
  // 1. نبدأ بتجميع كل شروط الفحص في كائن واحد كبير
  let combinedSchema: Record<string, any> = {
    ...opts.server,
    ...opts.client,
  };

  // 2. السحر هان: لو المطور مرر بريسيتس، ادمجي الشروط الجاهزة تلقائياً!
  if (opts.presets) {
    for (const presetName of opts.presets) {
      const presetSchema = presetsMap[presetName];
      if (presetSchema) {
        // دمج شروط المنصة الجاهزة مع شروط المطور
        combinedSchema = { ...combinedSchema, ...presetSchema };
      }
    }
  }

  // 3. هان بكمل كود مكتبتك الباقي (الـ Validation بـ ~standard والـ Proxy)...
  console.log("Combined Schemas successfully for validation!", Object.keys(combinedSchema));
  
  return combinedSchema; // أو الـ Proxy الناتج
}

export * from "./core/types.js";
export * from "./core/standard.js";