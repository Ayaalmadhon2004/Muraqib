import { z } from "zod";
import { createGuard } from "./core/standard.js";

// ==========================================
// 1. تعريف الـ Presets الجاهزة (خلطات المنصات السحابية الثابتة)
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

// كائن السجل المعتمد للخلطات الجاهزة داخل مكتبة مراقب
const presetsMap = {
  vercel: vercelPreset,
  supabase: supabasePreset,
} as const;

type PresetName = keyof typeof presetsMap;

// تعريف نوع المدخلات: إما اسم بريسيت جاهز كنص، أو كائن مخطط مخصص (Custom Schema)
type PresetInput = PresetName | Record<string, z.ZodTypeAny>;

// ==========================================
// 2. دالة مغلفة ذكية تدعم الـ Presets والـ Custom Schemas معاً
// ==========================================
function createEnvWithPresets<T extends Record<string, z.ZodTypeAny>>(
  userSchema: T,
  options: {
    runtimeEnv: Record<string, any>;
    isServer?: boolean;
    emptyStringAsUndefined?: boolean;
    presets?: PresetInput[]; // المصفوفة أصبحت تقبل النصوص والكائنات
  }
) {
  // نبدأ بنسخ المخطط الأساسي الذي كتبه المطور يدوياً
  let combinedSchema: Record<string, z.ZodTypeAny> = { ...userSchema };

  // الـ Loop الذكي للدمج والتركيب الفوري
  if (options.presets) {
    for (const preset of options.presets) {
      if (typeof preset === "string") {
        // أ) إذا كان المدخل نصاً، نسحب الخلطة الجاهزة من السجل
        const presetSchema = presetsMap[preset];
        if (presetSchema) {
          combinedSchema = { ...combinedSchema, ...presetSchema };
        }
      } else if (preset && typeof preset === "object") {
        // ب) السحر هان: إذا كان المدخل كائناً (Custom Schema)، ندمجه مباشرة في المخطط النهائي!
        combinedSchema = { ...combinedSchema, ...preset };
      }
    }
  }

  // تمرير الـ Schema النهائية الشاملة والمدمجة لدالة الحماية الأساسية بمكتبتك
  return createGuard(combinedSchema, {
    runtimeEnv: options.runtimeEnv,
    isServer: options.isServer ?? typeof window === "undefined",
    emptyStringAsUndefined: options.emptyStringAsUndefined ?? true,
  });
}

// ==========================================
// 3. محاكاة للاستخدام الفعلي والتطبيق العملي (الـ Export)
// ==========================================

// لنفرض أن المطور يريد فحص Firebase وهو غير مدعوم تلقائياً بمكتبتك، سيبني الـ Custom Schema الخاصة به هنا:
const firebaseCustomSchema = {
  FIREBASE_API_KEY: z.string().min(1, "Firebase API Key is required"),
  FIREBASE_PROJECT_ID: z.string(),
};

export const env = createEnvWithPresets(
  // أ) المتغيرات الخاصة ببرمجته هو يدوياً للمشروع
  {
    DATABASE_URL: z.string().url(),
    NEXT_PUBLIC_SITE_NAME: z.string(),
  },
  // ب) الخيارات والـ Presets الهجينة المطلوبة للسيستم بالكامل
  {
    runtimeEnv: process.env, 
    isServer: typeof window === "undefined",
    emptyStringAsUndefined: true,
    
    presets: [
      "vercel",              // خلطة جاهزة مبنية داخل مكتبة مراقب
      "supabase",            // خلطة جاهزة أخرى مبنية داخل مكتبة مراقب
      firebaseCustomSchema,  // 💥 تمرير مخطط مخصص (Custom Schema) لخدمة خارجية تماماً!
    ], 
  }
);