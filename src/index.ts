// Main entry point with clean exports
// All logic is now organized into layers:
// - Shared: constants and utilities
// - Orchestrator: audit modules
// - Renderers: display and formatting
// - CLI: command-line interface

import { runAuditWorkflow } from "./cli/workflow.js";
import { run } from "./cli/index.js";
import type { AuditOptions, AuditResult } from "./orchestrator/audit.js";

export { createEnv, createEnvWithPresets, loadEnv, safeCreateEnv } from "./env.js";
export * from "./core/types.js";
export * from "./core/standard.js";

export { auditPerformance, analyzeHttpProfile } from "./core/performance/optimizer-engine.js";

// Re-export orchestrator types and functions
export type { AuditOptions, AuditResult, ModuleResult } from "./orchestrator/audit.js";
export { analyzeRenderBlocking } from "./orchestrator/audit.js";

// Main audit function for API usage
export async function runAudit(options: AuditOptions = {}): Promise<AuditResult> {
  return runAuditWorkflow(options);
}

// CLI entry point
const isMain = import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, "/") ?? "");

if (isMain || process.argv[1]?.endsWith("index.ts")) {
  (async () => {
    try {
      await run();
    } catch (err: unknown) {
      console.error(err);
      process.exit(1);
    }
  })();
}