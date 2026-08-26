// src/rules/bundle-budget.ts
import fs from 'fs';
import path from 'path';

/**
 * 1. ميزة فحص الحاجة للتحميل الكسول (Lazy Loading / Dynamic Imports)
 */
// muraqib-ignore-dead: intentionally preserved (auto-suppress)
export const checkLazyLoadingNecessity = (filePath: string): string[] => {
    if (!fs.existsSync(filePath)) return [];
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    const heavyComponents = ['Comments', 'Map', 'Chart', 'Editor', 'VideoPlayer'];
    const suggestions: string[] = [];

    heavyComponents.forEach(component => {
        const isComponentUsed = fileContent.includes(`import ${component}`) || fileContent.includes(`<${component}`);
        const isAlreadyLazy = fileContent.includes('dynamic(') || fileContent.includes('lazy(') || fileContent.includes('defineAsyncComponent');

        if (isComponentUsed && !isAlreadyLazy) {
            suggestions.push(
                `💡 [Muraqib Suggestion]: Heavy component '${component}' detected in workspace. Consider using lazy/dynamic loading to preserve initial bundle budget:\n` +
                `   👉 Next.js/React: const ${component} = dynamic(() => import('./components/${component}'), { ssr: false });\n` +
                `   👉 Vue/Svelte:    const ${component} = defineAsyncComponent(() => import('./${component}.vue'));`
            );
        }
    });

    return suggestions;
};

/**
 * 2. ميزة فحص الاستيرادات الفاطسة والثقيلة (Heavy Structural Imports)
// muraqib-ignore-dead: intentionally preserved (auto-suppress)
 */
export const checkHeavyImports = (filePath: string): string[] => {
    if (!fs.existsSync(filePath)) return [];
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const suggestions: string[] = [];

    if (fileContent.includes("import _ from 'lodash'") || fileContent.includes("import lodash from 'lodash'")) {
        suggestions.push(
            `⚠️ [Muraqib Optimization]: You are importing the ENTIRE 'lodash' library! This breaks your 14KB first-byte budget.\n` +
            `   👉 Fix: Import only the isolated module: import cloneDeep from 'lodash/cloneDeep';`
        );
    }

    if (fileContent.includes("import * as Icons from '@mui/icons-material'")) {
        suggestions.push(
            `⚠️ [Muraqib Optimization]: Importing global MUI icons namespace will heavily bloat your compile bundle size.\n` +
            `   👉 Fix: Destructure specific asset components: import SettingsIcon from '@mui/icons-material/Settings';`
        );
    }

    return suggestions;
};

/**
// muraqib-ignore-dead: intentionally preserved (auto-suppress)
 * 3. ميزة فحص إعدادات الـ Minification لضغط الملفات (next.config.js)
 */
export const checkMinificationSettings = (projectRoot: string): string[] => {
    const nextConfigPath = path.join(projectRoot, 'next.config.js');
    const suggestions: string[] = [];

    if (fs.existsSync(nextConfigPath)) {
        const configContent = fs.readFileSync(nextConfigPath, 'utf-8');
        if (configContent.includes('swcMinify: false')) {
            suggestions.push(
                `🚨 [Muraqib Critical]: Minification optimization is explicitly disabled ('swcMinify: false')!\n` +
                `   👉 Fix: Enforce 'swcMinify: true' inside your next.config.js layout to compress web assets.`
            );
        }
    }
    
    return suggestions;
};

/**
 * 🌟 4. الدالة الرئيسية الشاملة لـ Bundle Budget (الآن ديناميكية بالكامل وبدون قيود)
 */
export const runComprehensiveBundleAudit = () => {
    const LIMIT_KB = 14; 
    const projectRoot = process.cwd(); // تعيين مجلد العمل الحالي تلقائياً
    const supportedExtensions = ['.tsx', '.ts', '.jsx', '.js', '.svelte', '.vue'];

    // دالة البحث التراجعي الذكي لقطف أول ملف كود نشط في مشروع المطور
    function findActiveWorkspaceFile(dir: string): string | null {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            
            // تخطي مجلدات النظام والـ dependencies لحماية الـ CPU
            if (file === 'node_modules' || file === '.next' || file === 'dist' || file === 'build' || file.startsWith('.')) {
                continue;
            }
            
            if (stat.isDirectory()) {
                const found = findActiveWorkspaceFile(fullPath);
                if (found) return found;
            } else {
                const ext = path.extname(file);
                if (supportedExtensions.includes(ext)) {
                    return fullPath;
                }
            }
        }
        return null;
    }

    console.log(`🔍 [Muraqib Engine]: Scanning workspace directories for dynamic script paths...`);
    const activeFilePath = findActiveWorkspaceFile(projectRoot);

    if (activeFilePath) {
        const fileStats = fs.statSync(activeFilePath);
        const sizeKB = fileStats.size / 1024;
        const fileExtension = path.extname(activeFilePath);

        console.log(`📦 [Muraqib]: Auditing Page Bundle Size... [Dynamic Match: ${fileExtension.toUpperCase()}]`);
        console.log(`👉 Target Path: ./${path.relative(projectRoot, activeFilePath)} (Current Size: ${sizeKB.toFixed(2)} KB)`);

        if (sizeKB > LIMIT_KB) {
            console.error(`❌ [Budget Violation]: Target workspace layout size is ${sizeKB.toFixed(2)}KB (Limit threshold is ${LIMIT_KB}KB).`);
            console.error(`🛑 Critical Warning: This payload weight triggers TCP Congestion window blocks (Extra Round Trip Latency).`);
            console.log(`\n🛠️ [Muraqib Auto-Diagnostics] Scanning matched files text structures for quick automated fixes...`);
            console.log(`------------------------------------------------------------------------------------------------`);

            // تشغيل الفحوصات التشخيصية الثلاثة وتجميع المقترحات
            const lazySuggestions = checkLazyLoadingNecessity(activeFilePath);
            lazySuggestions.forEach(msg => console.warn(msg));

            const importSuggestions = checkHeavyImports(activeFilePath);
            importSuggestions.forEach(msg => console.warn(msg));

            const minifySuggestions = checkMinificationSettings(projectRoot);
            minifySuggestions.forEach(msg => console.warn(msg));
            
            console.log(`------------------------------------------------------------------------------------------------`);
        } else {
            console.log(`✅ [Muraqib Success]: Active target workspace file size matches the 14KB single network round-trip window parameters perfectly!`);
        }
    } else {
        console.log(`ℹ️ [Muraqib Info]: No active JS/TS/Svelte/Vue workspace files detected. Skipping bundle audits.`);
    }
};