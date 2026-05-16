import { z } from "zod";
import { createGuard } from "./core/standard.js";

// ==========================================
// 1. تعريف الـ Presets الجاهزة (خلطات المنصات السحابية)
// ==========================================
const vercelPreset = {
  VERCEL: z.string().optional(),
  VERCEL_ENV: z.enum(["production", "preview", "development"]).optional(),
  VERCEL_URL: z.string().optional(),
};

const supabasePreset = {
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
};

// كائن يجمع كل الخلطات المتاحة في مكتبة مراقب
const presetsMap = {
  vercel: vercelPreset,
  supabase: supabasePreset,
} as const;

type PresetName = keyof typeof presetsMap;

// ==========================================
// 2. دالة مغلفة ذكية لدمج الـ Presets تلقائياً
// ==========================================
function createEnvWithPresets<T extends Record<string, any>>(
  userSchema: T,
  options: {
    runtimeEnv: Record<string, any>;
    isServer?: boolean;
    emptyStringAsUndefined?: boolean;
    presets?: PresetName[];
  }
) {
  let combinedSchema: Record<string, any> = { ...userSchema };

  // إذا طلب المطور تفعيل خلطات جاهزة، ندمجها في الـ Schema الكبيرة تلقائياً
  if (options.presets) {
    for (const presetName of options.presets) {
      const presetSchema = presetsMap[presetName];
      if (presetSchema) {
        combinedSchema = { ...combinedSchema, ...presetSchema };
      }
    }
  }

  // تمرير الـ Schema النهائية المدمجة لدالة الحماية الأساسية بمكتبتك
  return createGuard(combinedSchema, {
    runtimeEnv: options.runtimeEnv,
    isServer: options.isServer ?? typeof window === "undefined",
    emptyStringAsUndefined: options.emptyStringAsUndefined ?? true,
  });
}

// ==========================================
// 3. الاستخدام الفعلي والنهائي داخل المشروع (الـ Export)
// ==========================================
export const env = createEnvWithPresets(
  // أ) المتغيرات الخاصة ببرمجتك أنتِ يدوياً
  {
    DATABASE_URL: z.string().url(),
    NEXT_PUBLIC_SITE_NAME: z.string(),
  },
  // ب) الخيارات والـ Presets المطلوبة للسيستم
  {
    runtimeEnv: process.env, 
    isServer: typeof window === "undefined",
    emptyStringAsUndefined: true,
    
    // بمجرد كتابة الأسماء هان، الكود فوق حيسحب شروط فحصهم ويفحصهم فوراً!
    presets: ["vercel", "supabase"], 
  }
);