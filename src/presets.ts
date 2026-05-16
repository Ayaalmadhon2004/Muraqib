import { string, pipe, url, optional, picklist } from "valibot";

// 1. خلطة فيرسل الجاهزة
export const vercelPreset = {
  VERCEL: optional(string()),
  VERCEL_ENV: optional(picklist(["production", "preview", "development"])),
  VERCEL_URL: optional(string()),
};

// 2. خلطة سوبابيز الجاهزة
export const supabasePreset = {
  NEXT_PUBLIC_SUPABASE_URL: pipe(string(), url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL")),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string("NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
};

// كائن يجمع كل الـ Presets لتسهيل استدعائهم بالاسم
export const presetsMap = {
  vercel: vercelPreset,
  supabase: supabasePreset,
} as const;

// تصدير الأنواع للمطورين (لضمان الـ Type Safety اللي حكينا عنه)
export type PresetName = keyof typeof presetsMap;