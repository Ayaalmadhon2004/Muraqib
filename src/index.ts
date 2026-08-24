import { z } from "zod";
import { createEnv, createEnvWithPresets, loadEnv, safeCreateEnv } from "./env.js";
import { cachePerformanceSchema } from "./rules/cache-guard.js";
import { runImagePerformanceAudit } from "./core/performance/image-guard.js";
import { runComprehensiveBundleAudit } from "./rules/bundle-budget.js";
import { performLiveLatencyAudit } from "./core/performance/network-latency-advisor.js";
import { performMemoryAudit } from "./core/memory-guard.js";
import { performSecurityAudit } from "./core/security-guard.js";
import { performDeadCodeAudit } from "./rules/dead-code-guard.js";
import { performDependencyAudit } from "./core/dependency-guard.js";
import { performAsyncAudit } from "./core/async-guard.js";
import { performConfigAudit } from "./core/config-guard.js";

// ── NEW: previously dead code now wired in ──
import { runPerformanceAudit } from "./core/performance/auditor.js";
import { auditPerformance } from "./core/performance/optimizer-engine.js";
import { runRenderBlockingAudit } from "./core/performance/render-blocking.js";
import { upgradePackages } from "./core/orchestrator.js";

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
const BOLD = "\x1b[1m";

function log(title: string, status: "pass" | "fail" | "warn", message?: string) {
  const icon = status === "pass" ? `${GREEN}[PASS]${RESET}` : status === "fail" ? `${RED}[FAIL]${RESET}` : `${YELLOW}[WARN]${RESET}`;
  console.log(`  ${icon} ${title}${message ? `: ${message}` : ""}`);
}

function section(name: string) {
  console.log(`
${CYAN}${BOLD}${name}${RESET}`);
  console.log(`${DIM}${"-".repeat(60)}${RESET}`);
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
  securityUrl?: string;
  skipEnv?: boolean;
  skipMemory?: boolean;
  skipSecurity?: boolean;
  skipDeadCode?: boolean;
  skipDependencies?: boolean;
  skipAsync?: boolean;
  skipConfig?: boolean;
  skipPerformance?: boolean;      // NEW
  skipOptimizer?: boolean;        // NEW
  skipRenderBlocking?: boolean;   // NEW
  silent?: boolean;
  schedule?: string;
  presets?: string[];
  safe?: boolean;
  upgrade?: boolean;              // NEW
}

export interface AuditResult {
  env: { ok: boolean; errors: string[] };
  images: { ok: boolean; errors: string[] };
  bundle: { ok: boolean; errors: string[] };
  network: { ok: boolean; errors: string[] };
  memory: { ok: boolean; errors: string[] };
  security: { ok: boolean; errors: string[]; score?: number };
  deadCode: { ok: boolean; errors: string[] };
  dependencies: { ok: boolean; errors: string[] };
  async: { ok: boolean; errors: string[] };
  config: { ok: boolean; errors: string[] };
  performance: { ok: boolean; errors: string[] };    // NEW
  optimizer: { ok: boolean; errors: string[] };      // NEW
  renderBlocking: { ok: boolean; errors: string[] };  // NEW
}

export async function runAudit(options: AuditOptions = {}): Promise<AuditResult> {
  const targetPath = options.targetPath || process.cwd();
  const latencyUrl = options.latencyUrl || "https://jsonplaceholder.typicode.com/comments";
  const securityUrl = options.securityUrl || latencyUrl;
  const silent = options.silent || false;

  if (!silent) {
    console.log(`
${CYAN}${BOLD}╔════════════════════════════════════════════════════════════╗${RESET}`);
    console.log(`${CYAN}${BOLD}║        MURAQIB — COMPREHENSIVE AUDIT REPORT              ║${RESET}`);
    console.log(`${CYAN}${BOLD}╚════════════════════════════════════════════════════════════╝${RESET}`);
    console.log(`${DIM}Target: ${targetPath}${RESET}
`);
  }

  const result: AuditResult = {
    env: { ok: true, errors: [] },
    images: { ok: true, errors: [] },
    bundle: { ok: true, errors: [] },
    network: { ok: true, errors: [] },
    memory: { ok: true, errors: [] },
    security: { ok: true, errors: [], score: 100 },
    deadCode: { ok: true, errors: [] },
    dependencies: { ok: true, errors: [] },
    async: { ok: true, errors: [] },
    config: { ok: true, errors: [] },
    performance: { ok: true, errors: [] },    // NEW
    optimizer: { ok: true, errors: [] },      // NEW
    renderBlocking: { ok: true, errors: [] },// NEW
  };

  // ── Images ──
  section("1️⃣  STATIC ASSETS (Images)");
  try {
    const originalWarn = console.warn;
    const warnings: string[] = [];
    console.warn = (...args: any[]) => warnings.push(args.join(" "));

    runImagePerformanceAudit(targetPath);
    console.warn = originalWarn;

    const issues = warnings.filter((w) => w.includes("unoptimized") || w.includes("Exceeds") || w.includes("heavy"));
    if (issues.length > 0) {
      result.images.ok = false;
      result.images.errors = issues;
      log("Image audit", "fail", `${issues.length} oversized image(s)`);
      for (const issue of issues) {
        const match = issue.match(/File:\s*(.+?)\s*\(([\d]+)\s*KB\)/);
        if (match) {
          console.log(`    ${RED}•${RESET} ${match[1]} (${match[2]} KB > 500 KB limit)`);
        }
      }
    } else {
      log("Image audit", "pass", "All images within 500 KB limit");
    }
  } catch (err: any) {
    result.images.ok = false;
    result.images.errors = [err.message];
    log("Image audit", "fail", err.message);
  }

  // ── Bundle ──
  section("2️⃣  BUNDLE SIZE");
  try {
    runComprehensiveBundleAudit(targetPath);
    log("Bundle audit", "pass", "Within 14 KB round-trip budget");
  } catch (err: any) {
    result.bundle.ok = false;
    result.bundle.errors = [err.message];
    log("Bundle audit", "fail", err.message);
  }

  // ── Network ──
  section("3️⃣  NETWORK LATENCY");
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

  // ── Memory ──
  if (!options.skipMemory) {
    section("4️⃣  MEMORY USAGE");
    try {
      const mem = performMemoryAudit();
      if (!mem.isOptimized) {
        result.memory.ok = false;
        result.memory.errors = mem.reports;
        log("Memory audit", mem.leakRisk === "high" ? "fail" : "warn", `${mem.reports.length} issue(s)`);
        for (const report of mem.reports) {
          console.log(`    ${mem.leakRisk === "high" ? RED : YELLOW}•${RESET} ${report}`);
        }
        console.log(`    ${DIM}Heap: ${mem.heapUsedMb}/${mem.heapTotalMb} MB | RSS: ${mem.rssMb} MB | External: ${mem.externalMb} MB${RESET}`);
      } else {
        log("Memory audit", "pass", `Heap: ${mem.heapUsedMb} MB | RSS: ${mem.rssMb} MB`);
      }
    } catch (err: any) {
      result.memory.ok = false;
      result.memory.errors = [err.message];
      log("Memory audit", "fail", err.message);
    }
  }

  // ── Security ──
  if (!options.skipSecurity) {
    section("5️⃣  SECURITY HEADERS");
    try {
      const sec = await performSecurityAudit(securityUrl);
      result.security.score = sec.score;
      if (!sec.isSecure) {
        result.security.ok = false;
        result.security.errors = sec.reports;
        log("Security audit", sec.score < 50 ? "fail" : "warn", `Score: ${sec.score}/100 — ${sec.reports.length} issue(s)`);
        for (const report of sec.reports) {
          console.log(`    ${sec.score < 50 ? RED : YELLOW}•${RESET} ${report}`);
        }
      } else {
        log("Security audit", "pass", `Score: ${sec.score}/100`);
      }
    } catch (err: any) {
      result.security.ok = false;
      result.security.errors = [err.message];
      log("Security audit", "fail", err.message);
    }
  }

  // ── Dead Code ──
  if (!options.skipDeadCode) {
    section("6️⃣  DEAD CODE DETECTION");
    try {
      const dead = performDeadCodeAudit(targetPath);
      if (!dead.isClean) {
        result.deadCode.ok = false;
        result.deadCode.errors = dead.reports;
        log("Dead code audit", "warn", `${dead.reports.length} issue(s)`);
        if (dead.emptyFunctions.length > 0) {
          console.log(`    ${YELLOW}Empty functions:${RESET} ${dead.emptyFunctions.length}`);
        }
        if (dead.unreachableBranches.length > 0) {
          console.log(`    ${YELLOW}Unreachable code:${RESET} ${dead.unreachableBranches.length}`);
        }
        if (dead.unusedExports.length > 0) {
          console.log(`    ${YELLOW}Potentially unused exports:${RESET} ${dead.unusedExports.length}`);
        }
      } else {
        log("Dead code audit", "pass", "No dead code detected");
      }
    } catch (err: any) {
      result.deadCode.ok = false;
      result.deadCode.errors = [err.message];
      log("Dead code audit", "fail", err.message);
    }
  }

  // ── Dependencies ──
  if (!options.skipDependencies) {
    section("7️⃣  DEPENDENCY ANALYSIS");
    try {
      const dep = performDependencyAudit(targetPath);
      if (!dep.isClean) {
        result.dependencies.ok = false;
        result.dependencies.errors = dep.reports;
        log("Dependency audit", "warn", `${dep.reports.length} issue(s)`);
        if (dep.circularDependencies.length > 0) {
          console.log(`    ${RED}•${RESET} ${dep.circularDependencies.length} circular dependency cycle(s)`);
          for (const cycle of dep.circularDependencies) {
            console.log(`      ${DIM}→ ${cycle.join(" → ")}${RESET}`);
          }
        }
        if (dep.deprecatedImports.length > 0) {
          console.log(`    ${YELLOW}•${RESET} ${dep.deprecatedImports.length} deprecated API usage(s)`);
        }
        if (dep.duplicatePackages.length > 0) {
          console.log(`    ${YELLOW}•${RESET} ${dep.duplicatePackages.length} duplicate package(s)`);
        }
      } else {
        log("Dependency audit", "pass", "No issues found");
      }
    } catch (err: any) {
      result.dependencies.ok = false;
      result.dependencies.errors = [err.message];
      log("Dependency audit", "fail", err.message);
    }
  }

  // ── Async ──
  if (!options.skipAsync) {
    section("8️⃣  ASYNC PATTERNS");
    try {
      const async = performAsyncAudit(targetPath);
      if (!async.isClean) {
        result.async.ok = false;
        result.async.errors = async.reports;
        log("Async audit", "warn", `${async.reports.length} issue(s)`);
        if (async.floatingPromises.length > 0) {
          console.log(`    ${YELLOW}•${RESET} ${async.floatingPromises.length} floating promise(s)`);
        }
        if (async.missingAwait.length > 0) {
          console.log(`    ${YELLOW}•${RESET} ${async.missingAwait.length} missing await(s)`);
        }
        if (async.unhandledPromises.length > 0) {
          console.log(`    ${RED}•${RESET} ${async.unhandledPromises.length} unhandled promise(s)`);
        }
      } else {
        log("Async audit", "pass", "No async issues detected");
      }
    } catch (err: any) {
      result.async.ok = false;
      result.async.errors = [err.message];
      log("Async audit", "fail", err.message);
    }
  }

  // ── Config ──
  if (!options.skipConfig) {
    section("9️⃣  CONFIGURATION VALIDATION");
    try {
      const cfg = performConfigAudit(targetPath);
      if (!cfg.isValid) {
        result.config.ok = false;
        result.config.errors = cfg.reports;
        const hasCritical = cfg.insecureConfigs.length > 0;
        log("Config audit", hasCritical ? "fail" : "warn", `${cfg.reports.length} issue(s)`);
        if (cfg.missingFiles.length > 0) {
          console.log(`    ${YELLOW}•${RESET} Missing files: ${cfg.missingFiles.join(", ")}`);
        }
        if (cfg.insecureConfigs.length > 0) {
          for (const issue of cfg.insecureConfigs) {
            console.log(`    ${RED}•${RESET} ${issue}`);
          }
        }
        if (cfg.invalidConfigs.length > 0) {
          for (const issue of cfg.invalidConfigs) {
            console.log(`    ${YELLOW}•${RESET} ${issue}`);
          }
        }
      } else {
        log("Config audit", "pass", "All configurations valid");
      }
    } catch (err: any) {
      result.config.ok = false;
      result.config.errors = [err.message];
      log("Config audit", "fail", err.message);
    }
  }

  // ── Environment ──
  if (!options.skipEnv) {
    section("🔟 ENVIRONMENT VARIABLES");
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

  // ═══════════════════════════════════════════════════════════════════════
  // NEW SECTIONS — previously dead code now wired into the audit pipeline
  // ═══════════════════════════════════════════════════════════════════════

  // ── 11. Performance Cache Audit ──
  if (!options.skipPerformance) {
    section("1️⃣1️⃣  PERFORMANCE CACHE");
    try {
      const perf = runPerformanceAudit(targetPath);
      if (typeof perf === "object" && perf !== null && "isOptimized" in perf && !perf.isOptimized) {
        result.performance.ok = false;
        result.performance.errors = perf.reports || ["Performance cache issues detected"];
        log("Performance audit", "warn", `${result.performance.errors.length} issue(s)`);
        for (const report of result.performance.errors) {
          console.log(`    ${YELLOW}•${RESET} ${report}`);
        }
      } else {
        log("Performance audit", "pass", "Cache performance optimal");
      }
    } catch (err: any) {
      result.performance.ok = false;
      result.performance.errors = [err.message];
      log("Performance audit", "fail", err.message);
    }
  }

  // ── 12. HTTP Optimizer (Cookies / Protocol) ──
  if (!options.skipOptimizer) {
    section("1️⃣2️⃣  HTTP OPTIMIZER");
    try {
      const opt = runOptimizerAudit(targetPath);
      if (typeof opt === "object" && opt !== null && "isOptimized" in opt && !opt.isOptimized) {
        result.optimizer.ok = false;
        result.optimizer.errors = opt.reports || ["HTTP optimizer issues detected"];
        log("Optimizer audit", "warn", `${result.optimizer.errors.length} issue(s)`);
        for (const report of result.optimizer.errors) {
          console.log(`    ${YELLOW}•${RESET} ${report}`);
        }
      } else {
        log("Optimizer audit", "pass", "HTTP/cookie settings optimal");
      }
    } catch (err: any) {
      result.optimizer.ok = false;
      result.optimizer.errors = [err.message];
      log("Optimizer audit", "fail", err.message);
    }
  }

  // ── 13. Render Blocking Scripts ──
  if (!options.skipRenderBlocking) {
    section("1️⃣3️⃣  RENDER BLOCKING");
    try {
      const rb = runRenderBlockingAudit(targetPath);
      if (typeof rb === "object" && rb !== null && "isOptimized" in rb && !rb.isOptimized) {
        result.renderBlocking.ok = false;
        result.renderBlocking.errors = rb.reports || ["Render blocking issues detected"];
        log("Render blocking audit", "warn", `${result.renderBlocking.errors.length} issue(s)`);
        for (const report of result.renderBlocking.errors) {
          console.log(`    ${YELLOW}•${RESET} ${report}`);
        }
      } else {
        log("Render blocking audit", "pass", "No render blocking scripts");
      }
    } catch (err: any) {
      result.renderBlocking.ok = false;
      result.renderBlocking.errors = [err.message];
      log("Render blocking audit", "fail", err.message);
    }
  }

  // ── 14. Package Upgrade (orchestrator) — mutates project, runs only with --upgrade ──
  if (options.upgrade) {
    section("🔄  PACKAGE UPGRADE");
    try {
      await upgradePackages(targetPath);
      log("Package upgrade", "pass", "Packages upgraded with rollback support");
    } catch (err: any) {
      log("Package upgrade", "fail", err.message);
      // Note: not added to AuditResult because it's an action, not a check
    }
  }

  // ── Summary ──
  section("📋 FINAL SUMMARY");
  const allOk =
    result.env.ok &&
    result.images.ok &&
    result.bundle.ok &&
    result.network.ok &&
    result.memory.ok &&
    result.security.ok &&
    result.deadCode.ok &&
    result.dependencies.ok &&
    result.async.ok &&
    result.config.ok &&
    result.performance.ok &&
    result.optimizer.ok &&
    result.renderBlocking.ok;

  const rows = [
    ["Environment", result.env.ok ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`, result.env.errors.length],
    ["Images", result.images.ok ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`, result.images.errors.length],
    ["Bundle", result.bundle.ok ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`, result.bundle.errors.length],
    ["Network", result.network.ok ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`, result.network.errors.length],
    ["Memory", result.memory.ok ? `${GREEN}PASS${RESET}` : `${YELLOW}WARN${RESET}`, result.memory.errors.length],
    ["Security", result.security.ok ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`, result.security.errors.length],
    ["Dead Code", result.deadCode.ok ? `${GREEN}PASS${RESET}` : `${YELLOW}WARN${RESET}`, result.deadCode.errors.length],
    ["Dependencies", result.dependencies.ok ? `${GREEN}PASS${RESET}` : `${YELLOW}WARN${RESET}`, result.dependencies.errors.length],
    ["Async", result.async.ok ? `${GREEN}PASS${RESET}` : `${YELLOW}WARN${RESET}`, result.async.errors.length],
    ["Config", result.config.ok ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`, result.config.errors.length],
    ["Performance", result.performance.ok ? `${GREEN}PASS${RESET}` : `${YELLOW}WARN${RESET}`, result.performance.errors.length],
    ["Optimizer", result.optimizer.ok ? `${GREEN}PASS${RESET}` : `${YELLOW}WARN${RESET}`, result.optimizer.errors.length],
    ["Render Block", result.renderBlocking.ok ? `${GREEN}PASS${RESET}` : `${YELLOW}WARN${RESET}`, result.renderBlocking.errors.length],
  ];

  for (const [name, status, count] of rows) {
    const detail = count > 0 ? `${count} issue(s)` : "clean";
    const detailColor = count > 0 ? (name === "Security" || name === "Config" || name === "Environment" ? RED : YELLOW) : GREEN;
    console.log(`  ${name.padEnd(15)} ${status.padEnd(12)} ${detailColor}${detail}${RESET}`);
  }

  console.log("");
  if (allOk) {
    box([`${GREEN}${BOLD}✅ All checks passed!${RESET}`, `${DIM}Your project is clean and optimized.${RESET}`]);
  } else {
    const criticalCount = result.env.errors.length + result.security.errors.length + result.config.errors.length;
    const warningCount =
      result.memory.errors.length +
      result.deadCode.errors.length +
      result.dependencies.errors.length +
      result.async.errors.length +
      result.performance.errors.length +
      result.optimizer.errors.length +
      result.renderBlocking.errors.length;
    box([
      `${RED}${BOLD}❌ Audit completed with failures.${RESET}`,
      `${DIM}Critical: ${criticalCount} | Warnings: ${warningCount}${RESET}`,
      `${DIM}Review the issues above and fix your project.${RESET}`,
    ]);
  }
  console.log("");

  return result;
}

// =========================================================================
// Error extraction (fixed)
// =========================================================================
function extractEnvErrors(error: any): string[] {
  if (error?.isMuraqibCustom && Array.isArray(error.errors)) {
    return error.errors.map((e: any) => `${e.path || e.field || "unknown"}: ${e.message || "invalid"}`);
  }
  if (error?.issues && Array.isArray(error.issues)) {
    return error.issues.map((e: any) => {
      const path = Array.isArray(e.path) ? e.path.join(".") : String(e.path || "unknown");
      return `${path}: ${e.message}`;
    });
  }
  if (error?.errors && Array.isArray(error.errors)) {
    return error.errors.map((e: any) => {
      const path = Array.isArray(e.path) ? e.path.join(".") : (e.path || e.field || "unknown");
      return `${path}: ${e.message || "invalid"}`;
    });
  }
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
    securityUrl: getArg(args, "--security-url"),
    skipEnv: args.includes("--skip-env"),
    skipMemory: args.includes("--skip-memory"),
    skipSecurity: args.includes("--skip-security"),
    skipDeadCode: args.includes("--skip-dead-code"),
    skipDependencies: args.includes("--skip-dependencies"),
    skipAsync: args.includes("--skip-async"),
    skipConfig: args.includes("--skip-config"),
    skipPerformance: args.includes("--skip-performance"),      // NEW
    skipOptimizer: args.includes("--skip-optimizer"),          // NEW
    skipRenderBlocking: args.includes("--skip-render-blocking"),// NEW
    silent: args.includes("--silent"),
    schedule: getArg(args, "--schedule"),
    safe: args.includes("--safe"),
    presets: getArg(args, "--presets")?.split(","),
    upgrade: args.includes("--upgrade"),                       // NEW
  };

  runAudit(opts).then((res) => {
    const failed =
      !res.env.ok ||
      !res.images.ok ||
      !res.bundle.ok ||
      !res.network.ok ||
      !res.memory.ok ||
      !res.security.ok ||
      !res.deadCode.ok ||
      !res.dependencies.ok ||
      !res.async.ok ||
      !res.config.ok ||
      !res.performance.ok ||
      !res.optimizer.ok ||
      !res.renderBlocking.ok;
    process.exit(failed ? 1 : 0);
  });
}

function getArg(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("-") ? args[i + 1] : undefined;
}