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

export interface ConfigAuditResult { // muraqib-ignore-dead: auto-suppressed by script for ConfigAuditResult
  isValid: boolean;
  reports: string[];
  missingFiles: string[];
  invalidConfigs: string[];
  insecureConfigs: string[];
}

const REQUIRED_CONFIG_FILES = ["tsconfig.json", ".gitignore", "package.json"];

const SENSITIVE_KEY_WORDS = new Set([
  "auth",
  "authentication",
  "authorization",
  "credential",
  "credentials",
  "passwords",
  "password",
  "passwd",
  "private",
  "secret",
  "secrets",
  "token",
  "tokens",
]);
const PLACEHOLDER_VALUE =
  /^(?:|changeme|change-me|example|placeholder|replace[-_ ]?me|your[-_ ].*|<[^>]+>|\$\{[^}]+\})$/i;
const ENV_FILE_NAME = /(^|\/)\.env(?:\..+)?$/i;
const ENV_TEMPLATE_NAME = /^\.env\.(?:example|sample|template|dist)$/i;
const ENV_IGNORE_PROBES = [".env", ".env.local", ".env.production", ".env.test.local"];

function pushUnique(items: string[], item: string): void {
  if (!items.includes(item)) items.push(item);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSensitiveKey(key: string, muraqibKeys: Set<string>): boolean {
  if (muraqibKeys.has(key.toUpperCase())) return true;
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  return words.some((word) => SENSITIVE_KEY_WORDS.has(word)) ||
    words.some((word, index) => word === "api" && words[index + 1] === "key");
}

function inspectJsonValues(
  value: unknown,
  parentKey: string,
  muraqibKeys: Set<string>,
  onSecret: (key: string, value: string) => void,
): void {
  if (Array.isArray(value)) {
    for (const entry of value) inspectJsonValues(entry, parentKey, muraqibKeys, onSecret);
  } else if (isRecord(value)) {
    for (const [key, entry] of Object.entries(value)) {
      inspectJsonValues(entry, key, muraqibKeys, onSecret);
    }
  } else if (typeof value === "string") {
    onSecret(parentKey, value);
  }
}

function hasSecretPattern(value: string): boolean {
  if (
    /\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\b/.test(value) ||
    /-----BEGIN (?:(?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY)-----/.test(value) ||
    /(?:[A-Za-z][A-Za-z0-9+.-]*:\/\/)[^/\s:@]+:[^/\s@]+@/i.test(value)
  ) return true;

  if (/[A-Za-z][A-Za-z0-9+.-]*:\/\/[^\s]*[?&](?:access[_-]?token|api[_-]?key|auth|key|password|secret|token)=([^&#\s]{8,})/i.test(value)) {
    return true;
  }

  const compact = value.trim();
  if (compact.length < 24 || /\s/.test(compact) || /^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(compact)) return false;
  const frequencies = new Map<string, number>();
  for (const character of compact) {
    frequencies.set(character, (frequencies.get(character) ?? 0) + 1);
  }
  let entropy = 0;
  for (const count of frequencies.values()) {
    const probability = count / compact.length;
    entropy -= probability * Math.log2(probability);
  }
  return entropy >= 3.5;
}

function isExposedValue(value: string, sensitiveKey: boolean): boolean {
  let normalized = value.trim();
  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) normalized = normalized.slice(1, -1).trim();
  if (PLACEHOLDER_VALUE.test(normalized)) {
    return false;
  }
  return (sensitiveKey && normalized.length > 0) || hasSecretPattern(normalized);
}

function envEntries(contents: string): Array<{ key: string; value: string }> {
  const entries: Array<{ key: string; value: string }> = [];
  for (const line of contents.split(/\r?\n/)) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (match?.[1] !== undefined && match[2] !== undefined) {
      entries.push({ key: match[1], value: match[2] });
    }
  }
  return entries;
}

function isEnvFilePath(filePath: string): boolean {
  return ENV_FILE_NAME.test(filePath.replace(/\\/g, "/"));
}

function isEnvTemplatePath(filePath: string): boolean {
  return ENV_TEMPLATE_NAME.test(path.posix.basename(filePath.replace(/\\/g, "/")));
}

function hasGitMetadata(targetPath: string): boolean {
  let directory = path.resolve(targetPath);
  while (true) {
    if (fs.existsSync(path.join(directory, ".git"))) return true;
    const parent = path.dirname(directory);
    if (parent === directory) return false;
    directory = parent;
  }
}

function checkGitEnvFiles(targetPath: string, insecureConfigs: string[], reports: string[]): void {
  try {
    const trackedEnvFiles = execFileSync("git", ["ls-files", "-z", "--cached"], {
      cwd: targetPath,
      encoding: "utf8",
    }).split("\0").filter(isEnvFilePath);
    for (const envFile of trackedEnvFiles) {
      if (!isEnvTemplatePath(envFile)) {
        pushUnique(insecureConfigs, `${envFile} is tracked by git`);
        pushUnique(
          reports,
          `Critical security risk: ${envFile} is tracked by git — environment secrets may be exposed`,
        );
      }
    }
  } catch (error) {
    if (!hasGitMetadata(targetPath)) return;
    const reason = error instanceof Error ? error.message : String(error);
    pushUnique(insecureConfigs, "Unable to verify tracked .env files with git");
    pushUnique(reports, `Security audit could not verify tracked .env files: ${reason}`);
  }
}

function checkEnvIgnoreRules(targetPath: string, insecureConfigs: string[], reports: string[]): void {
  if (!hasGitMetadata(targetPath)) return;
  for (const probe of ENV_IGNORE_PROBES) {
    try {
      execFileSync("git", ["check-ignore", "--no-index", "--quiet", "--", probe], {
        cwd: targetPath,
        stdio: "ignore",
      });
    } catch (error) {
      if (isRecord(error) && error.status === 1) {
        pushUnique(insecureConfigs, `.gitignore does not protect ${probe}`);
        pushUnique(reports, `Security risk: .gitignore does not protect ${probe} — environment secrets may be committed`);
      } else {
        const reason = error instanceof Error ? error.message : String(error);
        pushUnique(insecureConfigs, "Unable to verify .env ignore rules with git");
        pushUnique(reports, `Security audit could not verify .env ignore rules: ${reason}`);
        return;
      }
    }
  }
}

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
// muraqib-unreachable: flagged by automated triage. Review before removal.
  }

  return result;
}

export function performConfigAudit(targetPath: string): ConfigAuditResult {
  const reports: string[] = [];
  const missingFiles: string[] = [];
  const invalidConfigs: string[] = [];
  const insecureConfigs: string[] = [];

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

      inspectJsonValues(pkg, "", muraqibKeys, (key, value) => {
        if (isExposedValue(value, isSensitiveKey(key, muraqibKeys))) {
          insecureConfigs.push(`package.json contains exposed ${key}`);
          reports.push(`Security risk: package.json exposes a secret in ${key}`);
        }
      });
    } catch (e) {
      invalidConfigs.push("package.json is invalid JSON");
      reports.push("package.json: invalid JSON format");
    }
  }

  const envFiles = new Set<string>();
  const collectEnvFiles = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.name === ".git" || entry.name === "node_modules" || entry.name === "dist") continue;
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        collectEnvFiles(absolutePath);
      } else if (entry.isFile() && isEnvFilePath(path.relative(targetPath, absolutePath))) {
        envFiles.add(absolutePath);
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