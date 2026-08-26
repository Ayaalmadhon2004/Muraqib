import fs from "fs";
import path from "path";
import { globSync } from "glob";
export function scanProjectFiles(targetPath, fileExtensions = ["ts", "js"]) {
    // بناء نمط البحث ديناميكياً بناءً على الامتدادات المطلوبة
    const pattern = fileExtensions.length === 1 ? `**/*.${fileExtensions[0]}` : `**/*.{${fileExtensions.join(",")}}`;
    // استثناء المجلدات غير المرغوبة
    const files = globSync(pattern, {
        cwd: targetPath,
        absolute: true,
        ignore: ["node_modules/**", "dist/**", "tests/**", "**/*.spec.ts", "**/*.d.ts"],
    });
    const scannedFiles = [];
    for (const file of files) {
        const content = fs.readFileSync(file, "utf-8");
        const relativePath = path.relative(targetPath, file);
        scannedFiles.push({
            path: file,
            relativePath,
            content,
        });
    }
    return scannedFiles;
}
//# sourceMappingURL=file-scanner.js.map