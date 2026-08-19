/**
 * AsyncAudit: أداة فحص ذكية لمراقبة العمليات غير المتزامنة (Asynchronous Operations).
 * الهدف: حماية النظام من الانهيار (Crashes) والأخطاء المنطقية الصامتة الناتجة عن سوء إدارة الوعود (Promises).
 * الوظيفة: تكتشف الوعود غير المعالجة، نسيان استخدام 'await'، تداخل الـ Callbacks المعقد، 
 * والوعود العائمة (Floating Promises) التي لا يتم متابعة نتائجها أو التقاط أخطائها.
 */
import fs from "fs";
import path from "path";
import { globSync } from "glob";

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

  const tsFiles = globSync("**/*.ts", { cwd: targetPath, absolute: true, ignore: ["node_modules/**", "dist/**", "tests/**", "**/*.spec.ts"] });
  const jsFiles = globSync("**/*.js", { cwd: targetPath, absolute: true, ignore: ["node_modules/**", "dist/**"] });
  const allFiles = [...tsFiles, ...jsFiles];

  for (const file of allFiles) {
    const content = fs.readFileSync(file, "utf-8");
    const relativePath = path.relative(targetPath, file);
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line === undefined) continue;
      const lineNum = i + 1;

      if (line.match(/new\s+Promise\s*\(/) && !content.includes(".catch(")) {
        const nextLines = lines.slice(i, Math.min(i + 5, lines.length)).join(" ");
        if (!nextLines.includes(".catch(")) {
          unhandledPromises.push(`${relativePath}:${lineNum}`);
          reports.push(`Unhandled Promise at ${relativePath}:${lineNum} — add .catch() or try/catch`);
        }
      }

      const asyncCallMatch = line.match(/(\w+)\s*\(\s*\)\s*;?\s*$/);
      if (asyncCallMatch && asyncCallMatch[1]) {
        const funcName = asyncCallMatch[1];
        const funcDeclRegex = new RegExp(`(?:async\\s+function|const\\s+${funcName}\\s*=\\s*async)\\s+${funcName}`);
        if (funcDeclRegex.test(content) && !line.includes("await") && !line.includes("return")) {
          missingAwait.push(`${relativePath}:${lineNum}`);
          reports.push(`Missing await for async call: ${relativePath}:${lineNum} — ${funcName}() returns a Promise`);
        }
      }


      const callbackDepth = (line.match(/\)/g) || []).length;
      if (callbackDepth >= 3 && (line.includes("callback") || /\bcb\b/.test(line))) {
        callbackHell.push(`${relativePath}:${lineNum}`);
        reports.push(`Potential callback hell: ${relativePath}:${lineNum} — consider async/await`);
      }

      if (line.match(/(?:fetch|axios|request|query)\s*\(/) && !line.includes("await") && !line.includes("return") && !line.includes("const") && !line.includes("let") && !line.includes("var")) {
        floatingPromises.push(`${relativePath}:${lineNum}`);
        reports.push(`Floating Promise: ${relativePath}:${lineNum} — Promise result is ignored`);
      }

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
