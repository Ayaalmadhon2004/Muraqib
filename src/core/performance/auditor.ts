// src/core/performance/auditor.ts
import { checkCacheConfig } from './cache-guard';

export const runPerformanceAudit = () => {
  console.log("⚡ [Muraqib]: Starting Performance Audit Suite...");
  checkCacheConfig();
  console.log("✅ [Muraqib]: Performance Audit Passed.");
};