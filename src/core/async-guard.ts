/**
 * AsyncAudit: أداة فحص ذكية لمراقبة العمليات غير المتزامنة (Asynchronous Operations).
 * تعتمد على الـ file-scanner المشترك لضمان معمارية نظيفة وخالية من التكرار.
 */
import { scanProjectFiles } from "../utils/file-scanner.js";

export interface AsyncAuditResult {
  isClean: boolean;
  reports: string[];
  unhandledPromises: string[];
  missingAwait: string[];
  callbackHell: string[];
  floatingPromises: string[];
}

export function performAsyncAudit(targetPath: string): AsyncAuditResult {
  const reports: string[] = [];
  const unhandledPromises: string[] = [];
  const missingAwait: string[] = [];
  const callbackHell: string[] = [];
  const floatingPromises: string[] = [];

  // Use the shared scanner to fetch files. Prefer TypeScript sources when both .ts and .js exist
  let scannedFiles = scanProjectFiles(targetPath, ["ts", "js"]);

  // Filter: if a .ts version exists for the same relative path, ignore the .js artifact (avoids duplicate findings)
  const tsSet = new Set(scannedFiles.filter(f => f.relativePath.endsWith('.ts')).map(f => f.relativePath.replace(/\.ts$/, '')));
  scannedFiles = scannedFiles.filter(f => {
    if (f.relativePath.endsWith('.js')) {
      const base = f.relativePath.replace(/\.js$/, '');
      return !tsSet.has(base);
    }
    return true;
  });

  for (const scannedFile of scannedFiles) {
    const { relativePath, content } = scannedFile;
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line === undefined) continue;
      const lineNum = i + 1;

      // 1. فحص الـ Promises غير المعالجة (بدون .catch)
      if (line.match(/new\s+Promise\s*\(/) && !content.includes(".catch(")) {
        const nextLines = lines.slice(i, Math.min(i + 5, lines.length)).join(" ");
        if (!nextLines.includes(".catch(")) {
          unhandledPromises.push(`${relativePath}:${lineNum}`);
          reports.push(`Unhandled Promise at ${relativePath}:${lineNum} — add .catch() or try/catch`);
        }
      }

      // 2. فحص الدوال غير المتزامنة المستدعاة بدون await أو return
      const asyncCallMatch = line.match(/(\w+)\s*\(\s*\)\s*;?\s*$/);
      if (asyncCallMatch && asyncCallMatch[1]) {
        const funcName = asyncCallMatch[1];
        const funcDeclRegex = new RegExp(`(?:async\\s+function|const\\s+${funcName}\\s*=\\s*async)\\s+${funcName}`);
        if (funcDeclRegex.test(content) && !line.includes("await") && !line.includes("return")) {
          missingAwait.push(`${relativePath}:${lineNum}`);
          reports.push(`Missing await for async call: ${relativePath}:${lineNum} — ${funcName}() returns a Promise`);
        }
      }

      // 3. فحص تعقيد الـ Callbacks (Callback Hell)
      const callbackDepth = (line.match(/\)/g) || []).length;
      if (callbackDepth >= 3 && (line.includes("callback") || /\bcb\b/.test(line))) {
        callbackHell.push(`${relativePath}:${lineNum}`);
        reports.push(`Potential callback hell: ${relativePath}:${lineNum} — consider async/await`);
      }

      // 4. فحص الوعود العائمة (Floating Promises)
      if (line.match(/(?:fetch|axios|request|query)\s*\(/) && !line.includes("await") && !line.includes("return") && !line.includes("const") && !line.includes("let") && !line.includes("var")) {
        floatingPromises.push(`${relativePath}:${lineNum}`);
        reports.push(`Floating Promise: ${relativePath}:${lineNum} — Promise result is ignored`);
      }

      // 5. فحص سلاسل الـ .then() التي تفتقد لـ .catch()
      if (line.includes(".then(") && !line.includes(".catch(")) {
        const nextLines = lines.slice(i, Math.min(i + 3, lines.length)).join(" ");
        if (!nextLines.includes(".catch(")) {
          reports.push(`Promise chain without .catch(): ${relativePath}:${lineNum}`);
        }
      }
    }
  }

  return {
    isClean: reports.length === 0,
    reports,
    unhandledPromises,
    missingAwait,
    callbackHell,
    floatingPromises,
  };
}