import fs from 'fs';
import path from 'path';

const MAX_IMAGE_SIZE_BYTES = 500 * 1024; 

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg'];

interface ImageViolation {
    filePath: string;
    sizeKB: number;
    recommendation: string;
}

const scanDirectoryForImages = (dirPath: string, violations: ImageViolation[] = []): ImageViolation[] => {
    if (dirPath.includes('node_modules') || dirPath.includes('.git') || dirPath.includes('dist')) {
        return violations;
    }

    const files = fs.readdirSync(dirPath);

    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath); 

        if (stat.isDirectory()) {
            scanDirectoryForImages(fullPath, violations);
        } else {
            const ext = path.extname(fullPath).toLowerCase();
            if (IMAGE_EXTENSIONS.includes(ext)) {
                const fileSize = stat.size; 

                if (fileSize > MAX_IMAGE_SIZE_BYTES) {
                    const sizeKB = Math.round(fileSize / 1024);
                    violations.push({ 
                        filePath: path.relative(process.cwd(), fullPath),
                        sizeKB,
                        recommendation: `⚡ [Muraqib Suggestion]: Convert this image to '.webp' or compress it. WebP can reduce size up to 75%.`
                    });
                }
            }
        }
    }

    return violations;
};

export const runImagePerformanceAudit = (targetPath?: string) => {
    console.log("\n📷 [Muraqib]: Starting Image Assets Size Audit...");
    const rootDir = targetPath || process.cwd(); 
    const violations = scanDirectoryForImages(rootDir);

    if (violations.length > 0) {
        console.error(`\n🚨 [Muraqib Image Guard]: Found ${violations.length} unoptimized heavy images!`);
        console.log("=================================================================");
        
        violations.forEach(img => {
            console.error(`❌ File: ${img.filePath} (${img.sizeKB} KB) -> Exceeds limit of 500 KB.`);
            console.warn(`${img.recommendation}\n`);
        });
        
        console.log("=================================================================");
    } else {
        console.log("✅ [Muraqib]: All images are optimized and under the 500KB safety limit.");
    }
};