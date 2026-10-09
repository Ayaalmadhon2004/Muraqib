/**
 * AsyncAudit: أداة فحص ذكية لمراقبة العمليات غير المتزامنة (Asynchronous Operations).
 * تعتمد على الـ file-scanner المشترك لضمان معمارية نظيفة وخالية من التكرار.
 */
import { scanProjectFiles } from "../utils/file-scanner.js";
import { BaseGuard } from "./base-guard.js";
import type { AuditContext } from "./types.js";

export interface AsyncAuditResult { // muraqib-ignore-dead: auto-suppressed by script for AsyncAuditResult
  isClean: boolean;
  reports: string[];
  unhandledPromises: string[];
  missingAwait: string[];
  callbackHell: string[];
  floatingPromises: string[];
}

export interface AsyncAuditOptions {
  targetPath: string;
}

/**
 * Guard class - Async audit with BaseGuard architecture
 */
export class AsyncGuard extends BaseGuard {
  protected guardName = "async-guard";
  private options: AsyncAuditOptions;

  constructor(options: AsyncAuditOptions) {
    super();
    this.options = options;
  }

  async execute(_context: AuditContext): Promise<void> {
    const result = this.performAuditInternal();

    if (result.isClean) {
      this.addSuccessMessage("No async/await issues detected");
    } else {
      result.reports.forEach((report) => {
        if (report.includes("Unhandled Promise")) {
          this.addError("Unhandled Promise", report);
        } else if (report.includes("Missing await")) {
          this.addWarning("Missing Await", report);
        } else if (report.includes("Floating Promise")) {
          this.addError("Floating Promise", report);
        } else if (report.includes("callback hell")) {
          this.addWarning("Callback Hell", report);
        } else if (report.includes(".catch()")) {
          this.addWarning("Missing Catch", report);
        } else {
          this.addWarning("Async Issue", report);
        }
      });
    }

    if (result.floatingPromises.length > 0) {
      this.addMessage(`Found ${result.floatingPromises.length} floating promise(s)`);
    }
  }

  public performAuditInternal(): AsyncAuditResult {
    const reports: string[] = [];
    const unhandledPromises: string[] = [];
    const missingAwait: string[] = [];
    const callbackHell: string[] = [];
    const floatingPromises: string[] = [];

    const scannedFiles = scanProjectFiles(this.options.targetPath, ["ts"]);

    for (const scannedFile of scannedFiles) {
      const { relativePath, content } = scannedFile;
      if (/core[\\/]async-guard/.test(relativePath) || /core[\\/]security-guard/.test(relativePath)) {
        continue;
      }
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line === undefined) continue;
        const lineNum = i + 1;
        const trimmed = line.trim();
        const nextWindow = lines.slice(i, Math.min(i + 5, lines.length)).join(" ");

        if (/new\s+Promise\s*\(/.test(trimmed) && !nextWindow.includes(".catch(")) {
          unhandledPromises.push(`${relativePath}:${lineNum}`);
          reports.push(`Unhandled Promise at ${relativePath}:${lineNum} — add .catch() or try/catch`);
        }

        const asyncCallMatch = trimmed.match(/([A-Za-z_$][\w$]*)\s*\(\s*\)\s*;?\s*$/);
        if (asyncCallMatch && asyncCallMatch[1]) {
          const funcName = asyncCallMatch[1];
          const funcDeclRegex = new RegExp(`(?:async\\s+function|const\\s+${funcName}\\s*=\\s*async)\\s+${funcName}`);
          const functionExists = funcDeclRegex.test(content);
          if (functionExists && !trimmed.includes("await") && !trimmed.includes("return") && !trimmed.startsWith("if ") && !trimmed.startsWith("for ") && !trimmed.startsWith("while ")) {
            missingAwait.push(`${relativePath}:${lineNum}`);
            reports.push(`Missing await for async call: ${relativePath}:${lineNum} — ${funcName}() returns a Promise`);
          }
        }

        const callbackDepth = (trimmed.match(/\)/g) || []).length;
        if (callbackDepth >= 3 && (trimmed.includes("callback") || /\bcb\b/.test(trimmed))) {
          callbackHell.push(`${relativePath}:${lineNum}`);
          reports.push(`Potential callback hell: ${relativePath}:${lineNum} — consider async/await`);
        }

        if (/\b(?:fetch|axios|request|query)\s*\(/.test(trimmed) && !trimmed.includes("await") && !trimmed.includes("return") && !trimmed.startsWith("const ") && !trimmed.startsWith("let ") && !trimmed.startsWith("var ") && !trimmed.startsWith("if ") && !trimmed.startsWith("for ")) {
          floatingPromises.push(`${relativePath}:${lineNum}`);
          reports.push(`Floating Promise: ${relativePath}:${lineNum} — Promise result is ignored`);
        }

        if (trimmed.includes(".then(") && !nextWindow.includes(".catch(")) {
          reports.push(`Promise chain without .catch(): ${relativePath}:${lineNum}`);
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
}

/**
 * دالة للتوافقية مع الكود القديم
 * @deprecated استخدم AsyncGuard بدلاً من ذلك
 */
export function performAsyncAudit(targetPath: string): AsyncAuditResult {
  const guard = new AsyncGuard({ targetPath });
  return guard.performAuditInternal();
}