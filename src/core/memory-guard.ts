// src/core/memory-guard.ts
// فحص استهلاك الذاكرة اللحظي للعملية الحالية (Node process) — مفيد كـ smoke
// check أثناء تشغيل audit طويل، مش بديل عن أدوات profiling حقيقية.
import v8 from "v8";
import os from "os";

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

const HEAP_WARN_MB = 512;
const HEAP_CRITICAL_MB = 1024;
const RSS_WARN_MB = 1024;
const EXTERNAL_WARN_MB = 256;
const HEAP_RATIO_WARN = 0.85;

export function performMemoryAudit(): MemoryAuditResult {
  const mem = process.memoryUsage();
  const heapStats = v8.getHeapStatistics();
  // مأخوذة عشان لو حبينا مستقبلاً نقارن استهلاك العملية بالذاكرة الكلية للجهاز
  void os.totalmem();

  const heapUsedMb = Math.round(mem.heapUsed / 1024 / 1024);
  const heapTotalMb = Math.round(mem.heapTotal / 1024 / 1024);
  const rssMb = Math.round(mem.rss / 1024 / 1024);
  const externalMb = Math.round((mem.external || 0) / 1024 / 1024);
  const arrayBuffersMb = Math.round((mem.arrayBuffers || 0) / 1024 / 1024);

  const reports: string[] = [];
  const heapRatio = heapStats.used_heap_size / heapStats.total_heap_size;

  if (heapUsedMb > HEAP_CRITICAL_MB) {
    reports.push(`Critical heap usage: ${heapUsedMb} MB (limit: ${HEAP_CRITICAL_MB} MB)`);
  } else if (heapUsedMb > HEAP_WARN_MB) {
    reports.push(`High heap usage: ${heapUsedMb} MB (warn: ${HEAP_WARN_MB} MB)`);
  }

  if (rssMb > RSS_WARN_MB) {
    reports.push(`High RSS memory: ${rssMb} MB (warn: ${RSS_WARN_MB} MB)`);
  }

  if (externalMb > EXTERNAL_WARN_MB) {
    reports.push(`High external memory: ${externalMb} MB (warn: ${EXTERNAL_WARN_MB} MB)`);
  }

  if (heapRatio > HEAP_RATIO_WARN) {
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