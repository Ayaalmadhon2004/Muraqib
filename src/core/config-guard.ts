/**
 * Config & secrets audit.
 * Checks configuration files, tsconfig.json, package.json, and .env files for security issues.
 * Uses helper modules for reduced bundle size.
 */
import fs from "fs";
import path from "path";
import { getSensitiveMuraqibEnvKeys } from "./env-options.js";
import { createTimer } from "../shared/progress.js";
import {
  isExposedEnvValue, isExposedPackageValue,
} from "./helpers/secret-detector.js";
import { parseEnvEntries } from "./helpers/env-parser.js";
import { readCompilerOptions } from "./helpers/tsconfig-parser.js";
import { trackedEnvFiles, isGitIgnored } from "./helpers/git-protection.js";
import { BaseGuard } from "./base-guard.js";
import type { AuditContext } from "./types.js";

export interface ConfigAuditResult {
  isValid: boolean;
  reports: string[];
  missingFiles: string[];
  invalidConfigs: string[];
  insecureConfigs: string[];
}

export interface ConfigAuditOptions {
  targetPath: string;
}

const REQUIRED_CONFIG_FILES = ["tsconfig.json", ".gitignore", "package.json"] as const;
const REQUIRED_SCRIPTS = ["test", "build", "lint"] as const;
const ENV_VARIANTS_TO_PROTECT = [".env", ".env.local", ".env.development", ".env.production", ".env.test"] as const;
const ENV_FILE_PATTERN = /^\.env(\..+)?$/;
const ENV_TEMPLATE_PATTERN = /\.(example|sample|template|dist)$/i;
const SKIPPED_DIRECTORIES = new Set([
  "node_modules", ".git", "dist", "build", "coverage", ".next", ".nuxt", ".turbo", ".cache", "out",
]);
const MAX_SCAN_DEPTH = 8;
const PACKAGE_SKIPPED_SECTIONS = new Set([
  "scripts", "dependencies", "devDependencies", "peerDependencies", "optionalDependencies",
  "bundledDependencies", "overrides", "resolutions", "engines", "bin", "files", "keywords",
  "exports", "imports", "browser", "main", "module", "types", "workspaces", "pnpm", "packageManager",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pushUnique(list: string[], item: string): void {
  if (!list.includes(item)) list.push(item);
}

function toPosix(p: string): string {
  return p.replace(/\\/g, "/");
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function collectPackageSecretKeys(node: Record<string, unknown>, found: string[], isTopLevel: boolean): void {
  for (const [key, value] of Object.entries(node)) {
    if (isTopLevel && PACKAGE_SKIPPED_SECTIONS.has(key)) continue;
    if (typeof value === "string") {
      if (isExposedPackageValue(key, value)) pushUnique(found, key);
    } else if (isRecord(value)) {
      collectPackageSecretKeys(value, found, false);
    }
  }
}

function collectEnvFiles(root: string, scanErrors: string[]): string[] {
  const found: string[] = [];

  const walk = (directory: string, depth: number): void => {
    let dirents: fs.Dirent[];
    try {
      dirents = fs.readdirSync(directory, { withFileTypes: true });
    } catch (error) {
      if (directory === root) throw error;
      scanErrors.push(`${toPosix(path.relative(root, directory))}: ${errorMessage(error)}`);
      return;
    }

    for (const dirent of dirents) {
      if (dirent.isSymbolicLink()) continue;
      const fullPath = path.join(directory, dirent.name);
      if (dirent.isDirectory()) {
        if (depth < MAX_SCAN_DEPTH && !SKIPPED_DIRECTORIES.has(dirent.name)) walk(fullPath, depth + 1);
      } else if (dirent.isFile() && ENV_FILE_PATTERN.test(dirent.name)) {
        found.push(fullPath);
      }
    }
  };

  walk(root, 0);
  return found.sort();
}

/**
 * Guard class - Config audit with BaseGuard architecture
 */
export class ConfigGuard extends BaseGuard {
  protected guardName = "config-guard";
  private options: ConfigAuditOptions;

  constructor(options: ConfigAuditOptions) {
    super();
    this.options = options;
  }

  async execute(_context: AuditContext): Promise<void> {
    const result = this.performAuditInternal();

    if (result.isValid) {
      this.addSuccessMessage("Configuration is secure and valid");
    } else {
      result.reports.forEach((report) => {
        if (report.includes("Security risk")) {
          this.addCritical("Security Risk", report);
        } else if (report.includes("tracked by git") || report.includes("exposed")) {
          this.addError("Security Issue", report);
        } else if (report.includes("disabled")) {
          this.addWarning("Configuration Warning", report);
        } else if (report.includes("missing")) {
          this.addError("Missing Configuration", report);
        } else {
          this.addWarning("Config Alert", report);
        }
      });
    }

    if (result.missingFiles.length > 0) {
      this.addMessage(`Missing ${result.missingFiles.length} required file(s)`);
    }
    if (result.insecureConfigs.length > 0) {
      this.addMessage(`Found ${result.insecureConfigs.length} insecure configuration(s)`);
    }
  }

  public performAuditInternal(): ConfigAuditResult {
    const root = path.resolve(this.options.targetPath);
    const reports: string[] = [];
    const missingFiles: string[] = [];
    const invalidConfigs: string[] = [];
    const insecureConfigs: string[] = [];
    const muraqibKeys: ReadonlySet<string> = new Set(getSensitiveMuraqibEnvKeys().map((key) => key.toUpperCase()));

    const addInsecure = (finding: string, report: string): void => {
      pushUnique(insecureConfigs, finding);
      pushUnique(reports, report);
    };

    const timer1 = createTimer("Checking required files", true);
    timer1.start();
    for (const file of REQUIRED_CONFIG_FILES) {
      if (!fs.existsSync(path.join(root, file))) {
        missingFiles.push(file);
        reports.push(`Missing required config file: ${file}`);
      }
    }
    timer1.end();

    // 2. tsconfig.json
    const timer2 = createTimer("Validating tsconfig.json", true);
    timer2.start();
    const tsconfigPath = path.join(root, "tsconfig.json");
    if (fs.existsSync(tsconfigPath)) {
      try {
        const compilerOptions = readCompilerOptions(tsconfigPath);
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
      } catch {
        invalidConfigs.push("tsconfig.json is invalid JSON");
        reports.push("tsconfig.json: invalid JSON format");
      }
    }
    timer2.end();

    // 3. package.json
    const timer3 = createTimer("Scanning package.json", true);
    timer3.start();
    const packagePath = path.join(root, "package.json");
    if (fs.existsSync(packagePath)) {
      try {
        const parsed: unknown = JSON.parse(fs.readFileSync(packagePath, "utf-8"));
        const pkg = isRecord(parsed) ? parsed : {};
        const scripts = isRecord(pkg.scripts) ? pkg.scripts : {};

        for (const script of REQUIRED_SCRIPTS) {
          const value = scripts[script];
          if (typeof value !== "string" || value === "") {
            reports.push(`package.json: missing ${script} script`);
          }
        }

        const exposedKeys: string[] = [];
        collectPackageSecretKeys(pkg, exposedKeys, true);
        for (const key of exposedKeys) {
          addInsecure(`package.json contains exposed ${key}`, `Security risk: package.json exposes a secret in ${key}`);
        }
      } catch {
        invalidConfigs.push("package.json is invalid JSON");
        reports.push("package.json: invalid JSON format");
      }
    }
    timer3.end();

    // 4. .env files
    const timer4 = createTimer("Scanning .env files", true);
    timer4.start();
    let envFiles: string[] = [];
    const scanErrors: string[] = [];
    try {
      envFiles = collectEnvFiles(root, scanErrors);
    } catch (error) {
      addInsecure("Unable to scan .env files", `Security audit could not scan .env files: ${errorMessage(error)}`);
    }
    for (const problem of scanErrors) {
      pushUnique(reports, `Security audit could not scan a directory: ${problem}`);
    }

    const liveEnvFiles: string[] = [];
    for (const envFile of envFiles) {
      const relativePath = toPosix(path.relative(root, envFile));
      if (!ENV_TEMPLATE_PATTERN.test(path.basename(envFile))) liveEnvFiles.push(relativePath);

      let content: string;
      try {
        content = fs.readFileSync(envFile, "utf-8");
      } catch (error) {
        addInsecure(`Unable to read ${relativePath}`, `Security audit could not read ${relativePath}: ${errorMessage(error)}`);
        continue;
      }

      for (const { key, value } of parseEnvEntries(content)) {
        if (isExposedEnvValue(key, value, muraqibKeys)) {
          addInsecure(
            `${relativePath} contains exposed ${key}`,
            `Security risk: ${relativePath} exposes a secret through ${key} — use a secrets manager`,
          );
        }
      }
    }
    timer4.end();

    // 5. Git protection
    const timer5 = createTimer("Verifying Git protection", true);
    timer5.start();
    for (const trackedFile of trackedEnvFiles(root, ENV_FILE_PATTERN, ENV_TEMPLATE_PATTERN)) {
      addInsecure(
        `${trackedFile} is tracked by git`,
        `Security risk: ${trackedFile} is tracked by git — untrack it and rotate any secret it contained`,
      );
    }

    const protectionTargets = new Set<string>(liveEnvFiles);
    if (fs.existsSync(path.join(root, ".gitignore"))) {
      for (const variant of ENV_VARIANTS_TO_PROTECT) protectionTargets.add(variant);
    }
    for (const target of protectionTargets) {
      if (!isGitIgnored(root, target)) {
        addInsecure(
          `.gitignore does not protect ${target}`,
          `Security risk: .gitignore does not ignore ${target} — add a rule so it can never be committed`,
        );
      }
    }
    timer5.end();

    return {
      isValid: reports.length === 0,
      reports,
      missingFiles,
      invalidConfigs,
      insecureConfigs,
    };
  }
}

/**
 * دالة للتوافقية مع الكود القديم
 * @deprecated استخدم ConfigGuard بدلاً من ذلك
 */
export function performConfigAudit(targetPath: string): ConfigAuditResult {
  const guard = new ConfigGuard({ targetPath });
  return guard.performAuditInternal();
}
