/**
 * @file env-options.ts
 * @description خريطة بأسماء متغيرات البيئة الخاصة بـ Muraqib نفسه (وليست متغيرات مشروع المستخدم).
 * توضح هذه الخريطة أي من هذه المتغيرات يعتبر حسناً (سراً) وأيها غير حساس،
 * وتُستخدم من قبل core/config-guard.ts للتحقق من عدم تسريب أي مفاتيح حساسة
 * ضمن ملفات الـ .env الخاصة بمشروع المستخدم.
 */
export interface MuraqibOptionInfo {
    configName: string;
    type: "string" | "number" | "boolean";
    isSensitive: boolean;
}
export declare function getMuraqibEnvMap(): Record<string, MuraqibOptionInfo>;
export declare function getSensitiveMuraqibEnvKeys(): string[];
//# sourceMappingURL=env-options.d.ts.map