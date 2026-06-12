import fs from 'fs';
import path from 'path';

/**
 * 1. ميزة فحص الـ Lazy Loading (تقسيم الكود)
 */
export const checkLazyLoadingNecessity = (filePath: string): string[] => {
    if (!fs.existsSync(filePath)) return [];
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    const heavyComponents = ['Comments', 'Map', 'Chart', 'Editor', 'VideoPlayer'];
    const suggestions: string[] = [];

    heavyComponents.forEach(component => {
        if (fileContent.includes(`import ${component}`) && !fileContent.includes('dynamic(') && !fileContent.includes('lazy(')) {
            suggestions.push(
                `💡 [Muraqib Suggestion]: Component '${component}' detected. Consider using dynamic import to save bundle size:\n` +
                `   const ${component} = dynamic(() => import('./components/${component}'), { ssr: false });`
            );
        }
    });

    return suggestions;
};

/**
 * 2. ميزة فحص المكتبات الضخمة وتفعيل الـ Tree Shaking
 */
export const checkHeavyImports = (filePath: string): string[] => {
    if (!fs.existsSync(filePath)) return [];
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const suggestions: string[] = [];

    if (fileContent.includes("import _ from 'lodash'") || fileContent.includes("import lodash from 'lodash'")) {
        suggestions.push(
            `⚠️ [Muraqib Optimization]: You are importing the ENTIRE 'lodash' library! This destroys your 14KB budget.\n` +
            `   👉 Fix: Import only what you need, like this: import cloneDeep from 'lodash/cloneDeep';`
        );
    }

    if (fileContent.includes("import * as Icons from '@mui/icons-material'")) {
        suggestions.push(
            `⚠️ [Muraqib Optimization]: Importing all MUI icons will crash your bundle size.\n` +
            `   👉 Fix: Change to: import SettingsIcon from '@mui/icons-material/Settings';`
        );
    }

    return suggestions;
};

/**
 * 3. ميزة فحص الـ Minification (هل الكود مضغوط؟)
 */
export const checkMinificationSettings = (projectRoot: string): string[] => {
    const nextConfigPath = path.join(projectRoot, 'next.config.js');
    const suggestions: string[] = [];

    if (fs.existsSync(nextConfigPath)) {
        const configContent = fs.readFileSync(nextConfigPath, 'utf-8');
        if (configContent.includes('swcMinify: false')) {
            suggestions.push(
                `🚨 [Muraqib Critical]: Minification is explicitly disabled ('swcMinify: false')!\n` +
                `   👉 Fix: Set 'swcMinify: true' in your next.config.js to compress production HTML/JS.`
            );
        }
    }
    
    return suggestions;
};

/**
 * 4. الدالة الرئيسية الشاملة لـ Bundle Budget
 */
export const runComprehensiveBundleAudit = (totalBytes: number, activeFilePath: string) => {
    const LIMIT_KB = 14; 
    const sizeKB = totalBytes / 1024;
    const projectRoot = process.cwd(); // الحصول على مجلد المشروع الحالي تلقائياً

    console.log(`\n📦 [Muraqib]: Auditing Page Bundle Size... (Current: ${sizeKB.toFixed(2)} KB)`);

    if (sizeKB > LIMIT_KB) {
        console.error(`❌ [Budget Violation]: Page size is ${sizeKB.toFixed(2)}KB (Limit is ${LIMIT_KB}KB).`);
        console.error(`🛑 This will cause an extra network Round Trip (TCP Congestion Window limit).`);
        console.log(`\n🛠️ [Muraqib Auto-Diagnostics] Scanning your code for quick fixes...`);
        console.log(`-----------------------------------------------------------------`);

        // تشغيل الفحوصات الثلاثة وتجميع المقترحات
        const lazySuggestions = checkLazyLoadingNecessity(activeFilePath);
        lazySuggestions.forEach(msg => console.warn(msg));

        const importSuggestions = checkHeavyImports(activeFilePath);
        importSuggestions.forEach(msg => console.warn(msg));

        const minifySuggestions = checkMinificationSettings(projectRoot);
        minifySuggestions.forEach(msg => console.warn(msg));
        
        console.log(`-----------------------------------------------------------------`);
    } else {
        console.log(`✅ [Muraqib]: Page is perfectly optimized for first-round trip transmission!`);
    }
};