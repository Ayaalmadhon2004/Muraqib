/**
 * Config & secrets audit.
 *
 * Checks, for a target project directory:
 *   1. Required config files exist (tsconfig.json, .gitignore, package.json).
 *   2. tsconfig.json strictness (comments / trailing commas / relative `extends` supported).
 *   3. package.json has build/test/lint scripts and does not embed secrets.
 *   4. Every `.env*` file found in the project tree (nested ones included) is scanned for
 *      exposed secrets: sensitive key names, JWTs, private keys, provider tokens,
 *      credential-bearing URLs, secrets in URL query strings and high-entropy values.
 *      Empty values and obvious placeholders are never reported.
 *   5. Git protection: env files must not be tracked, and `.gitignore` must cover
 *      the usual environment variants.
 *
 * Secret VALUES are never copied into the report: findings only name the file and the key.
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { getSensitiveMuraqibEnvKeys } from "./env-options.js";

export interface ConfigAuditResult {
  isValid: boolean;
  reports: string[];
  missingFiles: string[];
  invalidConfigs: string[];
  insecureConfigs: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const REQUIRED_CONFIG_FILES = ["tsconfig.json", ".gitignore", "package.json"] as const;
const REQUIRED_SCRIPTS = ["test", "build", "lint"] as const;

/** Environment files that must always be covered by .gitignore. */
const ENV_VARIANTS_TO_PROTECT = [".env", ".env.local", ".env.development", ".env.production", ".env.test"] as const;

const ENV_FILE_PATTERN = /^\.env(\..+)?$/;
const ENV_TEMPLATE_PATTERN = /\.(example|sample|template|dist)$/i;

const SKIPPED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
  ".nuxt",
  ".turbo",
  ".cache",
  "out",
]);
const MAX_SCAN_DEPTH = 8;
const MAX_TSCONFIG_EXTENDS_DEPTH = 5;

/** A key is sensitive when one of its words is in this set (exact words, so AUTHOR != AUTH). */
const SENSITIVE_KEY_WORDS = new Set([
  "PASSWORD",
  "PASSWD",
  "SECRET",
  "SECRETS",
  "TOKEN",
  "TOKENS",
  "CREDENTIAL",
  "CREDENTIALS",
  "AUTH",
  "JWT",
  "APIKEY",
]);

/** Adjacent word pairs that make a key sensitive (API_KEY, PRIVATE_KEY, ...). */
const SENSITIVE_KEY_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ["API", "KEY"],
  ["PRIVATE", "KEY"],
  ["ACCESS", "KEY"],
  ["ENCRYPTION", "KEY"],
  ["SIGNING", "KEY"],
];

/** If a key ENDS with one of these words it describes configuration, not a secret (PASSWORD_MIN_LENGTH). */
const NON_SECRET_KEY_SUFFIXES = new Set([
  "URL",
  "URI",
  "HOST",
  "HOSTNAME",
  "PORT",
  "PATH",
  "FILE",
  "DIR",
  "LENGTH",
  "MIN",
  "MAX",
  "TTL",
  "TIMEOUT",
  "EXPIRES",
  "EXPIRY",
  "IN",
  "SECONDS",
  "MINUTES",
  "HOURS",
  "DAYS",
  "MS",
  "ENABLED",
  "DISABLED",
  "REQUIRED",
  "HEADER",
  "NAME",
  "FIELD",
  "ENDPOINT",
  "ROUTE",
  "TYPE",
  "ALGORITHM",
  "ISSUER",
  "AUDIENCE",
]);

/** package.json sections that are never searched for secrets (they hold names, versions, paths). */
const PACKAGE_SKIPPED_SECTIONS = new Set([
  "scripts",
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
  "bundledDependencies",
  "overrides",
  "resolutions",
  "engines",
  "bin",
  "files",
  "keywords",
  "exports",
  "imports",
  "browser",
  "main",
  "module",
  "types",
  "workspaces",
  "pnpm",
  "packageManager",
]);

const PLACEHOLDER_PATTERNS: readonly RegExp[] = [
  /^<.*>$/,
  /^\$\{.*\}$/,
  /^\{\{.*\}\}$/,
  /^(?:your|my)[-_ ].+/i,
  /^(?:change|replace)[-_ ]?me$/i,
  /^x{3,}$/i,
  /^\*{3,}$/,
  /^(?:example|placeholder|todo|tbd|null|undefined|none|redacted)$/i,
];

const SECRET_VALUE_PATTERNS: readonly RegExp[] = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/, // JWT
  /^(?:AKIA|ASIA)[0-9A-Z]{16}$/, // AWS access key id
  /^gh[pousr]_[A-Za-z0-9]{30,}$/, // GitHub tokens
  /^sk-[A-Za-z0-9_-]{20,}$/, // OpenAI-style secret keys
  /^xox[baprs]-[A-Za-z0-9-]{10,}$/, // Slack tokens
  /^AIza[0-9A-Za-z_-]{35}$/, // Google API keys
];

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// JSON with comments / trailing commas (tsconfig.json)
// ---------------------------------------------------------------------------
function stripJsonCommentsAndTrailingCommas(input: string): string {
  const text = input.replace(/^\uFEFF/, "");

  // Pass 1: remove comments (string-aware).
  let noComments = "";
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i] ?? "";
    const next = text[i + 1] ?? "";

    if (inString) {
      noComments += ch;
      if (ch === "\\") {
        noComments += next;
        i++;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      noComments += ch;
    } else if (ch === "/" && next === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      noComments += "\n";
    } else if (ch === "/" && next === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i++;
    } else {
      noComments += ch;
    }
  }

  // Pass 2: remove trailing commas (string-aware).
  let result = "";
  inString = false;
  for (let i = 0; i < noComments.length; i++) {
    const ch = noComments[i] ?? "";

    if (inString) {
      result += ch;
      if (ch === "\\") {
        result += noComments[i + 1] ?? "";
        i++;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      result += ch;
    } else if (ch === ",") {
      let j = i + 1;
      while (j < noComments.length && /\s/.test(noComments[j] ?? "")) j++;
      const following = noComments[j];
      if (following !== "}" && following !== "]") result += ch;
    } else {
      result += ch;
    }
  }

  return result;
}

function parseJsonc(input: string): unknown {
  return JSON.parse(stripJsonCommentsAndTrailingCommas(input));
}

// ---------------------------------------------------------------------------
// tsconfig
// ---------------------------------------------------------------------------
/** Reads compilerOptions, following relative `extends` (child options win). */
function readCompilerOptions(configPath: string, depth = 0): Record<string, unknown> | undefined {
  const parsed = parseJsonc(fs.readFileSync(configPath, "utf-8"));
  const config = isRecord(parsed) ? parsed : {};
  let merged: Record<string, unknown> | undefined;

  if (depth < MAX_TSCONFIG_EXTENDS_DEPTH) {
    const extendsValue = config.extends;
    const parents = typeof extendsValue === "string" ? [extendsValue] : Array.isArray(extendsValue) ? extendsValue : [];
    for (const parent of parents) {
      if (typeof parent !== "string" || !parent.startsWith(".")) continue; // package-based extends are not resolved
      let parentPath = path.resolve(path.dirname(configPath), parent);
      if (!fs.existsSync(parentPath) && fs.existsSync(`${parentPath}.json`)) parentPath = `${parentPath}.json`;
      if (!fs.existsSync(parentPath)) continue;
      try {
        const parentOptions = readCompilerOptions(parentPath, depth + 1);
        if (parentOptions) merged = { ...(merged ?? {}), ...parentOptions };
      } catch {
        // an unreadable parent must not hide problems of the child config
      }
    }
  }

  if (isRecord(config.compilerOptions)) {
    merged = { ...(merged ?? {}), ...config.compilerOptions };
  }
  return merged;
}

// ---------------------------------------------------------------------------
// Secret detection
// ---------------------------------------------------------------------------
function tokenizeKey(key: string): string[] {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((word) => word.toUpperCase());
}

function isSensitiveKey(key: string, muraqibKeys: ReadonlySet<string>): boolean {
  if (muraqibKeys.has(key.toUpperCase())) return true;

  const words = tokenizeKey(key);
  const last = words[words.length - 1];
  if (last !== undefined && NON_SECRET_KEY_SUFFIXES.has(last)) return false;

  if (words.some((word) => SENSITIVE_KEY_WORDS.has(word))) return true;
  for (let i = 0; i < words.length - 1; i++) {
    if (SENSITIVE_KEY_PAIRS.some(([a, b]) => words[i] === a && words[i + 1] === b)) return true;
  }
  return false;
}

function isPlaceholder(value: string): boolean {
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value));
}

function isNonSecretLiteral(value: string): boolean {
  return /^(?:true|false|yes|no|on|off)$/i.test(value) || /^\d+(?:\.\d+)?$/.test(value);
}

function tryParseUrl(value: string): URL | undefined {
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) return undefined;
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
}

/** True when a URL carries a password or a secret-looking query parameter. */
function urlCarriesSecret(url: URL): boolean {
  if (url.password !== "" && !isPlaceholder(decodeURIComponent(url.password))) return true;
  for (const [name, value] of url.searchParams) {
    if (value !== "" && !isPlaceholder(value) && isSensitiveKey(name, new Set())) return true;
  }
  return false;
}

function shannonEntropy(value: string): number {
  const counts = new Map<string, number>();
  for (const ch of value) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  let entropy = 0;
  for (const count of counts.values()) {
    const p = count / value.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

function looksLikeHighEntropySecret(value: string): boolean {
  if (value.length < 20 || /\s/.test(value)) return false;
  if (value.includes("://") || /^(?:[A-Za-z]:)?[\\/~.]/.test(value)) return false; // URLs and file paths
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) => re.test(value)).length;
  return classes >= 3 && shannonEntropy(value) >= 3.5;
}

function matchesSecretPattern(value: string): boolean {
  if (SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(value))) return true;
  const url = tryParseUrl(value);
  return url !== undefined && urlCarriesSecret(url);
}

function isExposedEnvValue(key: string, rawValue: string, muraqibKeys: ReadonlySet<string>): boolean {
  const value = rawValue.trim();
  if (value === "" || isPlaceholder(value)) return false;
  if (muraqibKeys.has(key.toUpperCase())) return true; // sensitive Muraqib option set directly
  if (matchesSecretPattern(value)) return true;
  if (tryParseUrl(value) !== undefined) return false; // plain URL without credentials
  if (isNonSecretLiteral(value)) return false;
  if (isSensitiveKey(key, muraqibKeys)) return true;
  return looksLikeHighEntropySecret(value);
}

function isExposedPackageValue(key: string, rawValue: string): boolean {
  const value = rawValue.trim();
  if (value === "" || isPlaceholder(value)) return false;
  if (matchesSecretPattern(value)) return true;
  if (tryParseUrl(value) !== undefined || isNonSecretLiteral(value)) return false;
  return isSensitiveKey(key, new Set());
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

// ---------------------------------------------------------------------------
// .env parsing & discovery
// ---------------------------------------------------------------------------
interface EnvEntry {
  key: string;
  value: string;
}

function findClosingQuote(text: string, quote: string): number {
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "\\" && quote !== "'") {
      i++;
      continue;
    }
    if (ch === quote) return i;
  }
  return -1;
}

function parseEnvEntries(content: string): EnvEntry[] {
  const entries: EnvEntry[] = [];
  const lines = content.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const trimmed = (lines[i] ?? "").trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s*(.*)$/);
    const key = match?.[1];
    if (!key) continue;
    const rest = match?.[2] ?? "";

    const quote = rest[0];
    if (quote === '"' || quote === "'" || quote === "`") {
      let body = rest.slice(1);
      let closing = findClosingQuote(body, quote);
      let lastLine = i;
      // quoted value spanning several lines (e.g. a PEM key); never look further than 100 lines
      while (closing < 0 && lastLine + 1 < lines.length && lastLine - i < 100) {
        lastLine++;
        body += `\n${lines[lastLine] ?? ""}`;
        closing = findClosingQuote(body, quote);
      }
      if (closing >= 0) {
        entries.push({ key, value: body.slice(0, closing) });
        i = lastLine;
      } else {
        entries.push({ key, value: rest.slice(1) }); // unterminated quote: treat as a single line
      }
      continue;
    }

    entries.push({ key, value: rest.replace(/\s+#.*$/, "").trim() });
  }

  return entries;
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

// ---------------------------------------------------------------------------
// Git protection
// ---------------------------------------------------------------------------
function runGit(args: string[], cwd: string): { status: number | null; stdout: string } {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
  });
  return { status: result.error ? null : result.status, stdout: result.stdout ?? "" };
}

function globToRegExp(glob: string): RegExp {
  let source = "";
  for (let i = 0; i < glob.length; i++) {
    const ch = glob[i] ?? "";
    if (ch === "*") {
      if (glob[i + 1] === "*") {
        if (glob[i + 2] === "/") {
          source += "(?:.*/)?";
          i += 2;
        } else {
          source += ".*";
          i += 1;
        }
      } else {
        source += "[^/]*";
      }
    } else if (ch === "?") {
      source += "[^/]";
    } else {
      source += ch.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${source}$`);
}

/** Minimal .gitignore evaluation, used only when `git` itself cannot answer. */
function isIgnoredByGitignoreFile(root: string, relativePath: string): boolean {
  let content: string;
  try {
    content = fs.readFileSync(path.join(root, ".gitignore"), "utf-8");
  } catch {
    return false;
  }

  let ignored = false;
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;

    const negated = line.startsWith("!");
    let pattern = (negated ? line.slice(1) : line).replace(/\/+$/, "");
    const anchored = pattern.includes("/");
    pattern = pattern.replace(/^\/+/, "");
    if (pattern === "") continue;

    const subject = anchored ? relativePath : path.posix.basename(relativePath);
    if (globToRegExp(pattern).test(subject)) ignored = !negated;
  }
  return ignored;
}

function isGitIgnored(root: string, relativePath: string): boolean {
  const { status } = runGit(["check-ignore", "-q", "--no-index", "--", relativePath], root);
  if (status === 0) return true;
  if (status === 1) return false;
  return isIgnoredByGitignoreFile(root, relativePath); // not a repo / git missing
}

function trackedEnvFiles(root: string): string[] {
  const { status, stdout } = runGit(["ls-files", "-z"], root);
  if (status !== 0) return []; // not a git repository (or git unavailable): nothing is tracked
  return stdout
    .split("\0")
    .filter((file) => file !== "")
    .filter((file) => {
      const base = path.posix.basename(file);
      return ENV_FILE_PATTERN.test(base) && !ENV_TEMPLATE_PATTERN.test(base);
    });
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------
export function performConfigAudit(targetPath: string): ConfigAuditResult {
  const root = path.resolve(targetPath);
  const reports: string[] = [];
  const missingFiles: string[] = [];
  const invalidConfigs: string[] = [];
  const insecureConfigs: string[] = [];
  const muraqibKeys: ReadonlySet<string> = new Set(getSensitiveMuraqibEnvKeys().map((key) => key.toUpperCase()));

  const addInsecure = (finding: string, report: string): void => {
    pushUnique(insecureConfigs, finding);
    pushUnique(reports, report);
  };

  // 1. Required files ------------------------------------------------------
  for (const file of REQUIRED_CONFIG_FILES) {
    if (!fs.existsSync(path.join(root, file))) {
      missingFiles.push(file);
      reports.push(`Missing required config file: ${file}`);
    }
  }

  // 2. tsconfig.json ------------------------------------------------------
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

  // 3. package.json -------------------------------------------------------
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

  // 4. .env files (nested ones included) ----------------------------------
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

  const liveEnvFiles: string[] = []; // non-template env files, as project-relative POSIX paths
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

  // 5. Git protection -----------------------------------------------------
  for (const trackedFile of trackedEnvFiles(root)) {
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

  return {
    isValid: reports.length === 0,
    reports,
    missingFiles,
    invalidConfigs,
    insecureConfigs,
  };
}
