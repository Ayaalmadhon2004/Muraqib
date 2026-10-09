/**
 * @file memory-guard.ts
 * @description فحص استهلاك الذاكرة اللحظي للعملية الحالية (Node process).
 * يُستخدم كـ smoke check أثناء تشغيل عمليات الـ audit الطويلة لمراقبة الأداء
 * والكشف المبكر عن أي ارتفاع غير طبيعي في الذاكرة.
 *
 * يرث من BaseGuard لتوفير قياس أداء موحد ومعالجة أخطاء مركزية.
 */
import v8 from "v8";
import { BaseGuard } from "./base-guard.js";
import type { AuditContext } from "./types.js";

export interface MemoryAuditResult {
  isOptimized: boolean;
  reports: string[];
  heapUsedMb: number;
  heapTotalMb: number;
  rssMb: number;
  externalMb: number;
  arrayBuffersMb: number;
  leakRisk: "none" | "low" | "medium" | "high";
}

export interface MemoryAuditOptions {
  heapWarnMb?: number;
  heapCriticalMb?: number;
  rssWarnMb?: number;
  externalWarnMb?: number;
  heapRatioWarn?: number;
}

const DEFAULT_OPTIONS: Required<MemoryAuditOptions> = {
  heapWarnMb: 512,
  heapCriticalMb: 1024,
  rssWarnMb: 1024,
  externalWarnMb: 256,
  heapRatioWarn: 0.85,
};

/**
 * Guard class - فحص الذاكرة مع معمارية موحدة
 */
export class MemoryGuard extends BaseGuard {
  protected guardName = "memory-guard";
  private options: Required<MemoryAuditOptions>;

  constructor(options: MemoryAuditOptions = {}) {
    super();
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async execute(_context: AuditContext): Promise<void> {
    const result = this.performAudit();

    // تسجيل النتائج
    if (result.isOptimized) {
      this.addSuccessMessage(
        `Memory usage optimal: Heap ${result.heapUsedMb}MB / RSS ${result.rssMb}MB`,
      );
    } else {
      // إضافة المشاكل بناءً على مستوى الخطورة
      result.reports.forEach((report) => {
        if (
          report.includes("Critical") ||
          result.leakRisk === "high"
        ) {
          this.addCritical("Memory Issue", report);
        } else if (report.includes("High") || result.leakRisk === "medium") {
          this.addWarning("Memory Warning", report);
        } else {
          this.addError("Memory Alert", report);
        }
      });
    }

    // تسجيل البيانات الإضافية
    this.addMessage(
      `Memory Stats: Heap ${result.heapUsedMb}/${result.heapTotalMb}MB, ` +
      `RSS ${result.rssMb}MB, External ${result.externalMb}MB, ` +
      `Leak Risk ${result.leakRisk}`,
    );
  }

  /**
   * تنفيذ فحص الذاكرة الفعلي
   */
  private performAudit(): MemoryAuditResult {
    const mem = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();

    const heapUsedMb = Math.round(mem.heapUsed / 1024 / 1024);
    const heapTotalMb = Math.round(mem.heapTotal / 1024 / 1024);
    const rssMb = Math.round(mem.rss / 1024 / 1024);
    const externalMb = Math.round((mem.external || 0) / 1024 / 1024);
    const arrayBuffersMb = Math.round((mem.arrayBuffers || 0) / 1024 / 1024);

    const reports: string[] = [];
    const heapRatio = heapStats.used_heap_size / heapStats.total_heap_size;

    if (heapUsedMb > this.options.heapCriticalMb) {
      reports.push(
        `Critical heap usage: ${heapUsedMb} MB (limit: ${this.options.heapCriticalMb} MB)`,
      );
    } else if (heapUsedMb > this.options.heapWarnMb) {
      reports.push(
        `High heap usage: ${heapUsedMb} MB (warn: ${this.options.heapWarnMb} MB)`,
      );
    }

    if (rssMb > this.options.rssWarnMb) {
      reports.push(`High RSS memory: ${rssMb} MB (warn: ${this.options.rssWarnMb} MB)`);
    }

    if (externalMb > this.options.externalWarnMb) {
      reports.push(
        `High external memory: ${externalMb} MB (warn: ${this.options.externalWarnMb} MB)`,
      );
    }

    if (heapRatio > this.options.heapRatioWarn) {
      reports.push(`Heap fragmentation risk: ${(heapRatio * 100).toFixed(1)}% used`);
    }

    let leakRisk: MemoryAuditResult["leakRisk"] = "none";
    if (reports.length >= 3) leakRisk = "high";
    else if (reports.length === 2) leakRisk = "medium";
    else if (reports.length === 1) leakRisk = "low";

    return {
      isOptimized: reports.length === 0,
      reports,
      heapUsedMb,
      heapTotalMb,
      rssMb,
      externalMb,
      arrayBuffersMb,
      leakRisk,
    };
  }

  protected override getMetadata(): Record<string, unknown> {
    const mem = process.memoryUsage();
    return {
      ...super.getMetadata(),
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
      rssMb: Math.round(mem.rss / 1024 / 1024),
    };
  }
}

/**
 * دالة للتوافقية مع الكود القديم
 * @deprecated استخدم MemoryGuard بدلاً من ذلك
 */
export function performMemoryAudit(options: MemoryAuditOptions = {}): MemoryAuditResult {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const mem = process.memoryUsage();
  const heapStats = v8.getHeapStatistics();

  const heapUsedMb = Math.round(mem.heapUsed / 1024 / 1024);
  const heapTotalMb = Math.round(mem.heapTotal / 1024 / 1024);
  const rssMb = Math.round(mem.rss / 1024 / 1024);
  const externalMb = Math.round((mem.external || 0) / 1024 / 1024);
  const arrayBuffersMb = Math.round((mem.arrayBuffers || 0) / 1024 / 1024);

  const reports: string[] = [];
  const heapRatio = heapStats.used_heap_size / heapStats.total_heap_size;

  if (heapUsedMb > config.heapCriticalMb) {
    reports.push(`Critical heap usage: ${heapUsedMb} MB (limit: ${config.heapCriticalMb} MB)`);
  } else if (heapUsedMb > config.heapWarnMb) {
    reports.push(`High heap usage: ${heapUsedMb} MB (warn: ${config.heapWarnMb} MB)`);
  }

  if (rssMb > config.rssWarnMb) {
    reports.push(`High RSS memory: ${rssMb} MB (warn: ${config.rssWarnMb} MB)`);
  }

  if (externalMb > config.externalWarnMb) {
    reports.push(`High external memory: ${externalMb} MB (warn: ${config.externalWarnMb} MB)`);
  }

  if (heapRatio > config.heapRatioWarn) {
    reports.push(`Heap fragmentation risk: ${(heapRatio * 100).toFixed(1)}% used`);
  }

  let leakRisk: MemoryAuditResult["leakRisk"] = "none";
  if (reports.length >= 3) leakRisk = "high";
  else if (reports.length === 2) leakRisk = "medium";
  else if (reports.length === 1) leakRisk = "low";

  return {
    isOptimized: reports.length === 0,
    reports,
    heapUsedMb,
    heapTotalMb,
    rssMb,
    externalMb,
    arrayBuffersMb,
    leakRisk,
  };
}