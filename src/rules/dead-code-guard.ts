// src/rules/dead-code-guard.ts
// ملاحظة: هاد الملف كان اسمه "dead-code-guard" بس مضمونه فعلياً كان فحص
// dependencies (منقول هلق لمكانه الصح بـ core/dependency-guard.ts). هون
// منطق فحص "الكود الميت" الحقيقي: exports غير مستخدمة، دوال فاضية، وكود
// بعد return/throw ما رح ينفّذ أبداً.
import fs from "fs";
import path from "path";
import { globSync } from "glob";

export interface DeadCodeAuditResult {
  isClean: boolean;
  reports: string[];
  emptyFunctions: string[];
  unreachableBranches: string[];
  unusedExports: string[];
}

export function performDeadCodeAudit(targetPath: string): DeadCodeAuditResult {
  const reports: string[] = [];
  const emptyFunctions: string[] = [];
  const unreachableBranches: string[] = [];
  const unusedExports: string[] = [];

  const tsFiles = globSync("**/*.ts", {
    cwd: targetPath,
    absolute: true,
    ignore: ["node_modules/**", "dist/**", "**/*.spec.ts", "**/*.d.ts"],
  });

  // نجمع محتوى كل الملفات مرة وحدة، عشان فحص "هل الـ export مستخدم بمكان تاني"
  // ما يعيد قراءة نفس الملفات مرات كتير (أداء أفضل).
  const fileContents = new Map<string, string>();
  for (const file of tsFiles) {
    fileContents.set(file, fs.readFileSync(file, "utf-8"));
  }

  for (const file of tsFiles) {
    const content = fileContents.get(file)!;
    const relativePath = path.relative(targetPath, file);
    const lines = content.split("\n");

    // 1) دوال فاضية: function foo() {} أو arrow function {} بدون أي محتوى فعلي
    const emptyFuncRegex = /(?:function\s+(\w+)\s*\([^)]*\)|(\w+)\s*(?::\s*[^=]+)?=\s*(?:async\s*)?\([^)]*\)\s*=>)\s*{\s*}/g;
    let match: RegExpExecArray | null;
    while ((match = emptyFuncRegex.exec(content)) !== null) {
      const name = match[1] || match[2] || "anonymous";
      const lineNum = content.slice(0, match.index).split("\n").length;
      emptyFunctions.push(`${relativePath}:${lineNum} (${name})`);
      reports.push(`Empty function body: ${relativePath}:${lineNum} — "${name}" does nothing`);
    }

    // 2) كود بعد return/throw/break/continue بنفس الـ block (unreachable)
    for (let i = 0; i < lines.length - 1; i++) {
      const currentLine = lines[i];
      const followingLine = lines[i + 1];
      if (currentLine === undefined || followingLine === undefined) continue;
      const line = currentLine.trim();
      const nextLine = followingLine.trim();

      const endsControlFlow = /^(return|throw)\b.*;?$/.test(line) || /^(break|continue);?$/.test(line);
      const nextIsMeaningful =
        nextLine.length > 0 &&
        nextLine !== "}" &&
        !nextLine.startsWith("//") &&
        !nextLine.startsWith("*") &&
        !nextLine.startsWith("/*") &&
        !nextLine.startsWith("case ") &&
        !nextLine.startsWith("default:");

      if (endsControlFlow && nextIsMeaningful) {
        unreachableBranches.push(`${relativePath}:${i + 2}`);
        reports.push(`Unreachable code: ${relativePath}:${i + 2} — appears right after a "${line.split(/\s+/)[0]}" statement`);
      }
    }

    // 3) exports مش مستخدمة بأي ملف تاني بالمشروع
    const exportRegex = /export\s+(?:async\s+)?(?:function|class|const|interface|type)\s+([A-Za-z_$][\w$]*)/g;
    while ((match = exportRegex.exec(content)) !== null) {
      const exportedName = match[1];
      if (!exportedName || exportedName === "default") continue;

      let usedElsewhere = false;
      for (const [otherFile, otherContent] of fileContents) {
        if (otherFile === file) continue;
        // فحص بسيط: هل الاسم موجود جوا سطر import بملف تاني
        const importUsageRegex = new RegExp(`import\\s+[^;]*\\b${exportedName}\\b[^;]*from`, "m");
        if (importUsageRegex.test(otherContent)) {
          usedElsewhere = true;
          break;
        }
      }

      if (!usedElsewhere) {
        const lineNum = content.slice(0, match.index).split("\n").length;
        unusedExports.push(`${relativePath}:${lineNum} (${exportedName})`);
        reports.push(`Potentially unused export: ${relativePath}:${lineNum} — "${exportedName}" is not imported anywhere else`);
      }
    }
  }

  return {
    isClean: reports.length === 0,
    reports,
    emptyFunctions,
    unreachableBranches,
    unusedExports,
  };
}
