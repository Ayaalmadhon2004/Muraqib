export type EnvUpdateStrategy = 'replace' | 'keep-both' | 'merge';
export interface NewEnvConfig {
    currentValue: string;
    newValue: string;
    updateStrategy: EnvUpdateStrategy;
    secretKey?: string;
}
/**
 * دالة Muraqib لتطهير وصياغة قيم متغيرات البيئة بناءً على استراتيجيات هندسية مرنة
 */
export declare function getNewEnvValue({ currentValue, newValue, updateStrategy, secretKey: _secretKey, }: NewEnvConfig): string | null;
//# sourceMappingURL=muraqib-env.d.ts.map