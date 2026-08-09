import { z } from "zod";
import { createEnv, createEnvWithPresets, loadEnv, safeCreateEnv } from "./env.js";
import { cachePerformanceSchema } from "./rules/cache-guard.js";
import { runImagePerformanceAudit } from "./core/performance/image-guard.js";
import { runComprehensiveBundleAudit } from "./rules/bundle-budget.js";
import { performLiveLatencyAudit } from "./core/performance/network-latency-advisor.js";

export { createEnv, createEnvWithPresets, loadEnv, safeCreateEnv } from "./env.js";
export * from "./core/types.js";
export * from "./core/standard.js";

// =========================================================================
// Output helpers
// =========================================================================
const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";

function log(title: string, status: "pass" | "fail" | "warn", message?: string) {
  const icon = status === "pass" ? `${GREEN}[PASS]${RESET}` : status === "fail" ? `${RED}[FAIL]${RESET}` : `${YELLOW}[WARN]${RESET}`;
  console.log(`  ${icon} ${title}${message ? `: ${message}` : ""}`);
}

function section(name: string) {
  console.log(`\n${CYAN}${name}${RESET}`);
  console.log(`${DIM}${"-".repeat(50)}${RESET}`);
}

function box(lines: string[]) {
  const width = Math.max(...lines.map((l) => l.length), 40);
  console.log(`  ${DIM}┌${"─".repeat(width + 2)}┐${RESET}`);
  for (const line of lines) {
    console.log(`  ${DIM}│${RESET} ${line.padEnd(width)} ${DIM}│${RESET}`);
  }
  console.log(`  ${DIM}└${"─".repeat(width + 2)}┘${RESET}`);
}

// =========================================================================
// Audit Runner
// =========================================================================
export interface AuditOptions {
  targetPath?: string;
  latencyUrl?: string;
  skipEnv?: boolean;
  silent?: boolean;
  schedule?: string;
  presets?: string[];
  safe?: boolean;
}

export interface AuditResult {
  env: { ok: boolean; errors: string[] };
  images: { ok: boolean; errors: string[] };
  bundle: { ok: boolean; errors: string[] };
  network: { ok: boolean; errors: string[] };
}

export async function runAudit(options: AuditOptions = {}): Promise<AuditResult> {
  const targetPath = options.targetPath || process.cwd();
  const latencyUrl = options.latencyUrl || "https://jsonplaceholder.typicode.com/comments";
  const silent = options.silent || false;

  if (!silent) {
    console.log(`\n${CYAN}MURAQIB AUDIT REPORT${RESET}`);
    console.log(`${DIM}Target: ${targetPath}${RESET}\n`);
  }

  const result: AuditResult = {
    env: { ok: true, errors: [] },
    images: { ok: true, errors: [] },
    bundle: { ok: true, errors: [] },
    network: { ok: true, errors: [] },
  };

  // ── Images ──
  section("STATIC ASSETS");
  try {
    // Capture console output from image guard to check for real issues
    const originalWarn = console.warn;
    const warnings: string[] = [];
    console.warn = (...args: any[]) => warnings.push(args.join(" "));

    runImagePerformanceAudit(targetPath);

    console.warn = originalWarn;

    // Filter real issues
    const issues = warnings.filter((w) => w.includes("unoptimized") || w.includes("Exceeds") || w.includes("heavy"));
    if (issues.length > 0) {
      result.images.ok = false;
      result.images.errors = issues;
      log("Image sizes", "fail", `${issues.length} oversized image(s) found`);
      for (const issue of issues) {
        const match = issue.match(/File:\s*(.+?)\s*\(([\d]+)\s*KB\)/);
        if (match) {
          console.log(`    ${RED}•${RESET} ${match[1]} (${match[2]} KB > 500 KB limit)`);
        }
      }
    } else {
      log("Image sizes", "pass", "All images within 500 KB limit");
    }
  } catch (err: any) {
    result.images.ok = false;
    result.images.errors = [err.message];
    log("Image sizes", "fail", err.message);
  }

  // ── Bundle ──
  section("BUNDLE SIZE");
  try {
    runComprehensiveBundleAudit(targetPath);
    log("Bundle audit", "pass", "Within 14 KB round-trip budget");
  } catch (err: any) {
    result.bundle.ok = false;
    result.bundle.errors = [err.message];
    log("Bundle audit", "fail", err.message);
  }

  // ── Network ──
  section("NETWORK LATENCY");
  try {
    const net = await performLiveLatencyAudit(latencyUrl);
    if (!net.isOptimized) {
      result.network.ok = false;
      result.network.errors = net.reports;
      log("Latency check", "fail", `${net.reports.length} issue(s)`);
      for (const report of net.reports) {
        console.log(`    ${YELLOW}•${RESET} ${report}`);
      }
      console.log(`    ${DIM}Measured: ${net.requestTimeMs || "N/A"}ms | Payload: ${net.payloadSizeKb || "N/A"} KB${RESET}`);
    } else {
      log("Latency check", "pass", `${net.requestTimeMs}ms / ${net.payloadSizeKb} KB`);
    }
  } catch (err: any) {
    result.network.ok = false;
    result.network.errors = [err.message || "Network request failed"];
    log("Latency check", "fail", err.message || "Request failed");
  }

  // ── Environment ──
  if (!options.skipEnv) {
    section("ENVIRONMENT VARIABLES");
    try {
      const schema = {
        DATABASE_URL: z.string().url(),
        PORT: z.string().regex(/^\d+$/, "PORT must be a numeric string").transform(Number),
        ...cachePerformanceSchema,
      };

      if (options.safe) {
        const envResult = safeCreateEnv({
          server: schema,
          runtimeEnv: process.env,
          presets: options.presets as any,
          isServer: true,
          schedule: options.schedule,
          silent: true,
        });

        if (!envResult.success) {
          result.env.ok = false;
          result.env.errors = envResult.error.map((e) => `${e.path}: ${e.message}`);
          log("Env validation", "fail", `${envResult.error.length} violation(s)`);
          for (const err of envResult.error) {
            console.log(`    ${RED}•${RESET} ${err.path}: ${err.message}`);
          }
        } else {
          log("Env validation", "pass", "All variables valid");
        }
      } else {
        createEnvWithPresets(schema, {
          runtimeEnv: process.env,
          presets: options.presets as any,
          isServer: true,
          schedule: options.schedule,
          silent: true,
        });
        log("Env validation", "pass", "All variables valid");
      }
    } catch (err: any) {
      result.env.ok = false;
      const errors = extractEnvErrors(err);
      result.env.errors = errors;
      log("Env validation", "fail", `${errors.length} violation(s)`);
      for (const e of errors) {
        console.log(`    ${RED}•${RESET} ${e}`);
      }
    }
  }

  // ── Summary ──
  section("SUMMARY");
  const allOk = result.env.ok && result.images.ok && result.bundle.ok && result.network.ok;

  const rows = [
    ["Environment", result.env.ok ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`, result.env.errors.length > 0 ? `${RED}${result.env.errors.length} errors${RESET}` : `${GREEN}clean${RESET}`],
    ["Images", result.images.ok ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`, result.images.errors.length > 0 ? `${RED}${result.images.errors.length} issues${RESET}` : `${GREEN}clean${RESET}`],
    ["Bundle", result.bundle.ok ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`, result.bundle.errors.length > 0 ? `${RED}${result.bundle.errors.length} errors${RESET}` : `${GREEN}clean${RESET}`],
    ["Network", result.network.ok ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`, result.network.errors.length > 0 ? `${YELLOW}${result.network.errors.length} warnings${RESET}` : `${GREEN}clean${RESET}`],
  ];

  for (const [name, status, detail] of rows) {
    console.log(`  ${name.padEnd(15)} ${status.padEnd(10)} ${detail}`);
  }

  console.log("");
  if (allOk) {
    box([`${GREEN}All checks passed.${RESET}`]);
  } else {
    box([`${RED}Audit completed with failures.${RESET}`, `${DIM}Review the issues above and fix your .env / assets.${RESET}`]);
  }
  console.log("");

  return result;
}

// =========================================================================
// Error extraction (fixed)
// =========================================================================
function extractEnvErrors(error: any): string[] {
  // New env.ts format: Error with isMuraqibCustom + errors array
  if (error?.isMuraqibCustom && Array.isArray(error.errors)) {
    return error.errors.map((e: any) => `${e.path || e.field || "unknown"}: ${e.message || "invalid"}`);
  }

  // Zod error directly
  if (error?.issues && Array.isArray(error.issues)) {
    return error.issues.map((e: any) => {
      const path = Array.isArray(e.path) ? e.path.join(".") : String(e.path || "unknown");
      return `${path}: ${e.message}`;
    });
  }

  // Legacy format
  if (error?.errors && Array.isArray(error.errors)) {
    return error.errors.map((e: any) => {
      const path = Array.isArray(e.path) ? e.path.join(".") : (e.path || e.field || "unknown");
      return `${path}: ${e.message || "invalid"}`;
    });
  }

  // Fallback
  return [error?.message || String(error)];
}

// =========================================================================
// CLI
// =========================================================================
const isMain = import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, "/") ?? "");

if (isMain || process.argv[1]?.endsWith("index.ts")) {
  loadEnv({ verbose: false });

  const args = process.argv.slice(2);
  const opts: AuditOptions = {
    targetPath: getArg(args, "--path"),
    latencyUrl: getArg(args, "--url"),
    skipEnv: args.includes("--skip-env"),
    silent: args.includes("--silent"),
    schedule: getArg(args, "--schedule"),
    safe: args.includes("--safe"),
    presets: getArg(args, "--presets")?.split(","),
  };

  runAudit(opts).then((res) => {
    const failed = !res.env.ok || !res.images.ok || !res.bundle.ok || !res.network.ok;
    process.exit(failed ? 1 : 0);
  });
}

function getArg(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("-") ? args[i + 1] : undefined;
}