/**
 * Config and security audit for required project files, TypeScript strictness,
 * exposed secrets, and Git tracking/ignore protection for environment files.
 * Secret detection uses exact key-word boundaries plus JWT, private-key,
 * credential-bearing URL, and high-entropy value patterns.
 */
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { getSensitiveMuraqibEnvKeys } from "./env-options.js";

export interface ConfigAuditResult {
  isValid: boolean;
  reports: string[];
  missingFiles: string[];
  invalidConfigs: string[];
  insecureConfigs: string[];
}

const REQUIRED_CONFIG_FILES = ["tsconfig.json", ".gitignore", "package.json"];

// تم تحسين مصفوفة الكلمات المفتاحية لتصبح أكثر دقة وتتجنب المطابقات الجزئية الخاطئة
const SECURITY_SENSITIVE_KEYS = [
  "password",
  "passwd",
  "private",
  "secret",
  "secrets",
  "token",
  "api_key",
  "apikey",
  "private_key",
  "credential",
  "auth_token",
  "access_token",
];

function stripJsonComments(input: string): string {
  let result = "";
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const nextChar = input[i + 1];

    if (inLineComment) {
      if (char === "\n") {
        inLineComment = false;
        result += char;
      }
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && nextChar === "/") {
        inBlockComment = false;
        i++;
      }
      continue;
    }

    if (inString) {
      result += char;
      if (char === "\\") {
        result += input[i + 1] ?? "";
        i++;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      result += char;
    } else if (char === "/" && nextChar === "/") {
      inLineComment = true;
      i++;
    } else if (char === "/" && nextChar === "*") {
      inBlockComment = true;
      i++;
    } else {
      result += char;
    }
  }

  return result;
}

export function performConfigAudit(targetPath: string): ConfigAuditResult {
  const reports: string[] = [];
  const missingFiles: string[] = [];
  const invalidConfigs: string[] = [];
  const insecureConfigs: string[] = [];

  // التأكد من استخدام الـ scanner المشترك
  scanProjectFiles(targetPath, ["ts", "js"]);

  // Check required config files
  for (const file of REQUIRED_CONFIG_FILES) {
    const filePath = path.join(targetPath, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
      reports.push(`Missing required config file: ${file}`);
    }
  }

  // Check tsconfig.json
  const tsconfigPath = path.join(targetPath, "tsconfig.json");
  if (fs.existsSync(tsconfigPath)) {
    try {
      const rawTsconfig = fs.readFileSync(tsconfigPath, "utf-8");
      const withoutComments = stripJsonComments(rawTsconfig);
      const stripped = withoutComments.replace(/,(\s*[}\]])/g, "$1");
      const parsed: unknown = JSON.parse(stripped);
      const tsconfig = isRecord(parsed) ? parsed : {};
      const compilerOptions = isRecord(tsconfig.compilerOptions) ? tsconfig.compilerOptions : undefined;

      if (!compilerOptions) {
        invalidConfigs.push("tsconfig.json missing compilerOptions");
        reports.push("tsconfig.json: missing compilerOptions section");
      } else {
        if (compilerOptions.strict !== true) {
          insecureConfigs.push("tsconfig.json: strict mode disabled");
          reports.push("tsconfig.json: strict mode is disabled — enable for type safety");
        }
        if (compilerOptions.noUncheckedIndexedAccess !== true) {
          insecureConfigs.push("tsconfig.json: noUncheckedIndexedAccess disabled");
          reports.push("tsconfig.json: noUncheckedIndexedAccess is disabled — enable for safer indexed access");
        }
        if (compilerOptions.noImplicitAny !== true) {
          insecureConfigs.push("tsconfig.json: noImplicitAny disabled");
          reports.push("tsconfig.json: noImplicitAny is disabled — enable to catch implicit any types");
        }
        if (compilerOptions.noUnusedLocals !== true) {
          reports.push("tsconfig.json: noUnusedLocals is disabled — enable to catch dead code");
        }
        if (compilerOptions.noUnusedParameters !== true) {
          reports.push("tsconfig.json: noUnusedParameters is disabled — enable to catch unused params");
        }
        if (compilerOptions.exactOptionalPropertyTypes !== true) {
          reports.push("tsconfig.json: exactOptionalPropertyTypes is disabled — enable for stricter optional types");
        }
      }
    } catch (e) {
      invalidConfigs.push("tsconfig.json is invalid JSON");
      reports.push("tsconfig.json: invalid JSON format");
    }
  }

  // Check package.json
  const muraqibKeys = new Set(getSensitiveMuraqibEnvKeys().map((key) => key.toUpperCase()));
  const packagePath = path.join(targetPath, "package.json");
  if (fs.existsSync(packagePath)) {
    try {
      const parsed: unknown = JSON.parse(fs.readFileSync(packagePath, "utf-8"));
      const pkg = isRecord(parsed) ? parsed : {};
      const scripts = isRecord(pkg.scripts) ? pkg.scripts : {};

      for (const script of ["test", "build", "lint"]) {
        if (typeof scripts[script] !== "string" || scripts[script] === "") {
          reports.push(`package.json: missing ${script} script`);
        }
      }

      const pkgStr = JSON.stringify(pkg);
      // استخدام حدود الكلمات (Word Boundaries) لمنع التطابق الجزئي الخاطئ مثل "author" مع "auth"
      for (const key of SECURITY_SENSITIVE_KEYS) {
        const regex = new RegExp(`"(?:[^"]*_)?${key}(?:_[^"]*)?\\s*":\\s*"[^"]+"`, "i");
        if (regex.test(pkgStr)) {
          insecureConfigs.push(`package.json contains exposed ${key}`);
          reports.push(`Security risk: package.json exposes a secret in ${key}`);
        }
      });
    } catch (e) {
      invalidConfigs.push("package.json is invalid JSON");
      reports.push("package.json: invalid JSON format");
    }
  }

  // Check .env files for exposed secrets with strict boundary matching
  const sensitiveMuraqibKeys = getSensitiveMuraqibEnvKeys();
  const envFiles = fs.readdirSync(targetPath).filter((f) => f.startsWith(".env"));
  for (const envFile of envFiles) {
    const envPath = path.join(targetPath, envFile);
    const envContent = fs.readFileSync(envPath, "utf-8");

    for (const key of SECURITY_SENSITIVE_KEYS) {
      // تدقيق دقيق يعتمد على حدود المتغيرات البيئية الحقيقية
      const regex = new RegExp(`^(?:[A-Z0-9_]*_)?${key.toUpperCase()}(?:_[A-Z0-9_]*)?\\s*=\\s*.+`, "im");
      if (regex.test(envContent)) {
        insecureConfigs.push(`${envFile} contains ${key}`);
        reports.push(`Security risk: ${envFile} exposes ${key} — use a secrets manager`);
      }
    }

    for (const envKey of sensitiveMuraqibKeys) {
      const regex = new RegExp(`^${envKey}\\s*=.+`, "m");
      if (regex.test(envContent)) {
        insecureConfigs.push(`${envFile} exposes sensitive Muraqib option ${envKey}`);
        reports.push(`Security risk: ${envFile} exposes ${envKey} directly — consider a secrets manager`);
      }
    }
  };

  try {
    collectEnvFiles(targetPath);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    insecureConfigs.push("Unable to scan .env files");
    reports.push(`Security audit could not scan .env files: ${reason}`);
  }

  for (const envPath of envFiles) {
    const relativePath = path.relative(targetPath, envPath).replace(/\\/g, "/");
    try {
      const contents = fs.readFileSync(envPath, "utf-8");
      for (const { key, value } of envEntries(contents)) {
        if (isExposedValue(value, isSensitiveKey(key, muraqibKeys))) {
          pushUnique(insecureConfigs, `${relativePath} contains exposed ${key}`);
          pushUnique(
            reports,
            `Security risk: ${relativePath} exposes a secret through ${key} — use a secrets manager`,
          );
        }
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      pushUnique(insecureConfigs, `Unable to read ${relativePath}`);
      pushUnique(reports, `Security audit could not read ${relativePath}: ${reason}`);
    }
  }

  checkGitEnvFiles(targetPath, insecureConfigs, reports);
  checkEnvIgnoreRules(targetPath, insecureConfigs, reports);

  return {
    isValid: reports.length === 0,
    reports,
    missingFiles,
    invalidConfigs,
    insecureConfigs,
  };
}