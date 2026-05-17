import { string, pipe, url, optional, picklist, type GenericSchema } from "valibot";

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

// كائن السجل لجمع الخلطات الجاهزة
export const presetsMap = {
  vercel: vercelPreset,
  supabase: supabasePreset,
} as const;

// تعريف الأنواع المدعومة نصياً
export type BuiltInPresetName = keyof typeof presetsMap;

// السحر هان: المطور يقدر يمرر إما اسم ميزة جاهزة أو كائن فحص كامل (Custom Schema)
export type PresetInput = BuiltInPresetName | Record<string, GenericSchema>;