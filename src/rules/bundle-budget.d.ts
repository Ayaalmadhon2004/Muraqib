/**
 * 1. ميزة فحص الحاجة للتحميل الكسول (Lazy Loading / Dynamic Imports)
 */
export declare const checkLazyLoadingNecessity: (filePath: string) => string[];
/**
 * 2. ميزة فحص الاستيرادات الفاطسة والثقيلة (Heavy Structural Imports)
 */
export declare const checkHeavyImports: (filePath: string) => string[];
/**
 * 3. ميزة فحص إعدادات الـ Minification لضغط الملفات (next.config.js)
 */
export declare const checkMinificationSettings: (projectRoot: string) => string[];
/**
 * 🌟 4. الدالة الرئيسية الشاملة لـ Bundle Budget (الآن ديناميكية بالكامل وبدون قيود)
 */
export declare const runComprehensiveBundleAudit: () => void;
//# sourceMappingURL=bundle-budget.d.ts.map