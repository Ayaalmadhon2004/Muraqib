// src/core/env-options.ts
// خريطة بأسماء متغيرات البيئة الخاصة بـ Muraqib نفسه (مش متغيرات مشروع
// المستخدم) — مين منها حساس (سر) ومين لأ. مستخدمة من core/config-guard.ts
// عشان يتأكد إنه ما في متغير حساس من هاي منكشف بملفات .env بالمشروع.
export interface MuraqibOptionInfo {
  configName: string;
  type: "string" | "number" | "boolean";
  isSensitive: boolean;
}

interface MuraqibOptionDefinition {
  name: string;
  type: MuraqibOptionInfo["type"];
  isSensitive: boolean;
}

const muraqibOptions: MuraqibOptionDefinition[] = [
  { name: "dbUrl", type: "string", isSensitive: true },
  { name: "allowEmpty", type: "boolean", isSensitive: false },
  { name: "serverPort", type: "number", isSensitive: false },
];

/**
 * بيحوّل اسم الخيار (camelCase) لاسم متغير بيئة (MURAQIB_SNAKE_CASE)
 * مثلاً: "dbUrl" → "MURAQIB_DB_URL"
 */
function toEnvKey(optionName: string): string {
  return `MURAQIB_${optionName.replace(/([A-Z])/g, "_$1").toUpperCase()}`;
}

export function getMuraqibEnvMap(): Record<string, MuraqibOptionInfo> {
  const map: Record<string, MuraqibOptionInfo> = {};

  for (const option of muraqibOptions) {
    map[toEnvKey(option.name)] = {
      configName: option.name,
      type: option.type,
      isSensitive: option.isSensitive,
    };
  }

  return map;
}

/** بيرجع بس أسماء متغيرات البيئة الحساسة (يلي المفروض ما تنكشف بأي ملف .env) */
export function getSensitiveMuraqibEnvKeys(): string[] {
  return Object.entries(getMuraqibEnvMap())
    .filter(([, info]) => info.isSensitive)
    .map(([envKey]) => envKey);
}
