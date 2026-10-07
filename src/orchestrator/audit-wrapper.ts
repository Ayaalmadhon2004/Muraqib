/**
 * Audit wrapper with progress indicators and metrics collection.
 * Decorates audit functions with timing and feedback.
 */

import { createProgress, createTimer, MetricsCollector } from "../shared/progress.js";
import type { ModuleResult } from "./audit.js";
import type { AuditTimer } from "../shared/progress.js";

export interface WrappedAuditOptions {
  silent?: boolean;
  collectMetrics?: boolean;
}

export async function wrapAudit<T extends ModuleResult>(
  moduleName: string,
  auditFn: () => Promise<T> | T,
  options: WrappedAuditOptions = {}
): Promise<T> {
  const { silent = false } = options;

  const progress = createProgress(`📊 ${moduleName}`, silent);
  const timer: AuditTimer = createTimer(moduleName, silent);

  progress.start();
  timer.start();

  try {
    const result = await auditFn();
    timer.end();

    if (result.ok) {
      progress.succeed(`✓ ${moduleName} passed`, 0);
    } else {
      progress.succeed(`⚠️ ${moduleName}: ${result.errors.length} issues found`, result.errors.length);
    }

    return result;
  } catch (error) {
    progress.fail(String(error));
    throw error;
  }
}

export class AuditOrchestrator {
  private metrics: MetricsCollector;
  private silent: boolean;

  constructor(silent = false) {
    this.silent = silent;
    this.metrics = new MetricsCollector(silent);
  }

  async runAudit<T extends ModuleResult>(
    moduleName: string,
    auditFn: () => Promise<T> | T
  ): Promise<T> {
    return wrapAudit(moduleName, auditFn, { silent: this.silent });
  }

  printMetricsSummary(): void {
    this.metrics.printSummary();
  }

  getMetrics() {
    return this.metrics.getMetrics();
  }
}
