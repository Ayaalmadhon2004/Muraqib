/**
 * CI audit collector — runs the audit without a live server and writes
 * the result to audit-report.json. Always exits 0 so the CI step
 * "Upload audit artifact" always runs (the artifact stores findings
 * for review; blocking CI is opt-in via a separate policy step).
 */
import fs from "node:fs";
import path from "node:path";
import { loadEnv } from "../src/env.js";
import { runAudit } from "../src/index.js";

async function main() {
  const reportPath = path.resolve(process.cwd(), "audit-report.json");

  // Load environment variables from .env file
  loadEnv({ cwd: process.cwd(), verbose: false });

  let result: Awaited<ReturnType<typeof runAudit>>;
  let auditError: string | null = null;

  try {
    result = await runAudit({
      targetPath: process.cwd(),
      // CI has no live server to probe, so the network checks are skipped
      // explicitly instead of being pointed at some other host.
      skipNetwork: true,
      skipSecurity: true,
      skipMemory: true,
      skipPerformance: true,
      silent: true,
    });
  } catch (error: unknown) {
    auditError = error instanceof Error ? error.message : String(error);
    // The audit did not run, so no module may be reported as passing.
    const notRun = () => ({ ok: false, errors: [`Audit did not run: ${auditError}`] });
    result = {
      env: notRun(),
      images: notRun(),
      bundle: notRun(),
      network: notRun(),
      memory: notRun(),
      security: { ...notRun(), score: 0 },
      deadCode: notRun(),
      dependencies: notRun(),
      async: notRun(),
      config: notRun(),
      performance: notRun(),
      optimizer: notRun(),
      renderBlocking: notRun(),
    };
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    ...(auditError ? { auditError } : {}),
    result,
  };

  try {
    fs.writeFileSync(reportPath, JSON.stringify(payload, null, 2));
  } catch (writeErr: unknown) {
    console.error("Failed to write report:", writeErr instanceof Error ? writeErr.message : String(writeErr));
    process.exit(1);
  }

  const anyFailed = Object.values(result).some(
    (v) => typeof v === "object" && v !== null && "ok" in v && !v.ok
  );

  if (auditError) {
    console.error(`Audit threw an unexpected error: ${auditError}`);
  } else if (anyFailed) {
    console.log("Audit completed with warnings/failures — see audit-report.json for details.");
  } else {
    console.log("Audit passed — no issues found.");
  }

  console.log(`Report saved to ${reportPath}`);
  // Always exit 0: the artifact upload step must run; a separate policy
  // step can read audit-report.json and fail the build if desired.
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err instanceof Error ? err.message : String(err));
  console.error("Stack:", err instanceof Error ? err.stack : "");
  process.exit(1);
});
