// src/core/async-guard.ts
// فحص أنماط الـ async/await والـ Promise عبر ملفات المشروع (فحص نصي/heuristic
// بسيط، مش AST حقيقي — كافي لمشروع بحجم Muraqib بدون تعقيد إضافي).
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

      // Detect unhandled promises (new Promise without catch)
      if (line.match(/new\s+Promise\s*\(/) && !content.includes(".catch(")) {
        const nextLines = lines.slice(i, Math.min(i + 5, lines.length)).join(" ");
        if (!nextLines.includes(".catch(")) {
          unhandledPromises.push(`${relativePath}:${lineNum}`);
          reports.push(`Unhandled Promise at ${relativePath}:${lineNum} — add .catch() or try/catch`);
        }
      }

      // Detect missing await on async function calls
      const asyncCallMatch = line.match(/(\w+)\s*\(\s*\)\s*;?\s*$/);
      if (asyncCallMatch && asyncCallMatch[1]) {
        const funcName = asyncCallMatch[1];
        const funcDeclRegex = new RegExp(`(?:async\\s+function|const\\s+${funcName}\\s*=\\s*async)\\s+${funcName}`);
        if (funcDeclRegex.test(content) && !line.includes("await") && !line.includes("return")) {
          missingAwait.push(`${relativePath}:${lineNum}`);
          reports.push(`Missing await for async call: ${relativePath}:${lineNum} — ${funcName}() returns a Promise`);
        }
      }

      // Detect callback hell (nested callbacks > 3 levels)
      // ملاحظة: كان في bug بأولوية العمليات (&& || بدون أقواس) كان بيخلي أي سطر
      // فيه الحرفين "cb" (حتى لو مو كلمة callback فعلاً) يتحسب خطأ. صلحناها بأقواس صريحة.
      const callbackDepth = (line.match(/\)/g) || []).length;
      if (callbackDepth >= 3 && (line.includes("callback") || /\bcb\b/.test(line))) {
        callbackHell.push(`${relativePath}:${lineNum}`);
        reports.push(`Potential callback hell: ${relativePath}:${lineNum} — consider async/await`);
      }

      // Detect floating promises (Promise not assigned, awaited, or returned)
      if (line.match(/(?:fetch|axios|request|query)\s*\(/) && !line.includes("await") && !line.includes("return") && !line.includes("const") && !line.includes("let") && !line.includes("var")) {
        floatingPromises.push(`${relativePath}:${lineNum}`);
        reports.push(`Floating Promise: ${relativePath}:${lineNum} — Promise result is ignored`);
      }

      // Detect .then() chains without .catch()
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
