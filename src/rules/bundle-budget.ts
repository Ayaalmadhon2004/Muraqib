import fs from 'fs';
import path from 'path';

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

const BUNDLE_LIMIT_KB = 14;
const SUPPORTED_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js', '.svelte', '.vue'];
const SKIP_DIR_NAMES = new Set(['node_modules', 'dist', 'build', 'coverage', 'out']);

export interface BundleViolation {
    filePath: string;
    sizeKB: number;
    limitKB: number;
    suggestions: string[];
}

export interface BundleAuditResult {
    /** Number of source files that were actually measured. */
    scannedFiles: number;
    /** True when nothing could be measured — the caller must NOT report this as a pass. */
    skipped: boolean;
    violations: BundleViolation[];
    /** Project-level findings (e.g. minification disabled). */
    projectIssues: string[];
}

const collectSourceFiles = (dir: string, found: string[] = []): string[] => {
    let entries: fs.Dirent[];
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
        return found;
    }

    for (const entry of entries) {
        // Match on the entry's own name only, never on a substring of the full path.
        const name = path.basename(entry.name);
        if (name.startsWith('.') || entry.isSymbolicLink()) continue;

        const fullPath = path.join(dir, name);
        if (entry.isDirectory()) {
            if (!SKIP_DIR_NAMES.has(name)) collectSourceFiles(fullPath, found);
        } else if (entry.isFile() && SUPPORTED_EXTENSIONS.includes(path.extname(name)) && !name.endsWith('.d.ts')) {
            found.push(fullPath);
        }
    }
    return found;
};

export const runComprehensiveBundleAudit = (targetPath?: string): BundleAuditResult => {
    const projectRoot = targetPath || process.cwd();
    const violations: BundleViolation[] = [];

    console.log(`🔍 [Muraqib Engine]: Scanning workspace source files against the ${BUNDLE_LIMIT_KB}KB budget...`);
    const files = collectSourceFiles(projectRoot);

    if (files.length === 0) {
        console.warn(`⚠️ [Muraqib]: No JS/TS/Svelte/Vue source files found — bundle audit could not run.`);
        return { scannedFiles: 0, skipped: true, violations, projectIssues: [] };
    }

    for (const file of files) {
        let size: number;
        try {
            size = fs.statSync(file).size;
        } catch {
            continue;
        }
        const sizeKB = size / 1024;
        if (sizeKB <= BUNDLE_LIMIT_KB) continue;

        const suggestions = [...checkLazyLoadingNecessity(file), ...checkHeavyImports(file)];
        const filePath = path.relative(projectRoot, file);
        violations.push({ filePath, sizeKB: Number(sizeKB.toFixed(2)), limitKB: BUNDLE_LIMIT_KB, suggestions });

        console.error(`❌ [Budget Violation]: ${filePath} is ${sizeKB.toFixed(2)}KB (limit ${BUNDLE_LIMIT_KB}KB).`);
        suggestions.forEach(msg => console.warn(msg));
    }

    const projectIssues = checkMinificationSettings(projectRoot);
    projectIssues.forEach(msg => console.warn(msg));

    if (violations.length === 0 && projectIssues.length === 0) {
        console.log(`✅ [Muraqib]: All ${files.length} source file(s) are within the ${BUNDLE_LIMIT_KB}KB budget.`);
    }

    return { scannedFiles: files.length, skipped: false, violations, projectIssues };
};
