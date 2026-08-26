import fs from 'fs';
import path from 'path';
import { loadEnv } from '../src/env.js';
import { runImagePerformanceAudit } from '../src/core/performance/image-guard.js';
import { runComprehensiveBundleAudit } from '../src/rules/bundle-budget.js';
import { performLiveLatencyAudit } from '../src/core/performance/network-latency-advisor.js';
import { performMemoryAudit } from '../src/core/memory-guard.js';
import { performSecurityAudit } from '../src/core/security-guard.js';
import { performDeadCodeAudit } from '../src/rules/dead-code-guard.js';
import { performDependencyAudit } from '../src/core/dependency-guard.js';
import { performAsyncAudit } from '../src/core/async-guard.js';
import { performConfigAudit } from '../src/core/config-guard.js';
import { runPerformanceAudit } from '../src/core/performance/auditor.js';

async function run() {
  loadEnv({ verbose: false });
  const targetPath = process.cwd();
  const result: any = {};

  try {
    runImagePerformanceAudit(targetPath);
    result.images = { ok: true };
  } catch (e: any) {
    result.images = { ok: false, error: String(e) };
  }

  try {
    runComprehensiveBundleAudit(targetPath);
    result.bundle = { ok: true };
  } catch (e: any) {
    result.bundle = { ok: false, error: String(e) };
  }

  try {
    const net = await performLiveLatencyAudit(process.env.LATENCY_URL || 'http://localhost:3000');
    result.network = net;
  } catch (e: any) {
    result.network = { ok: false, error: String(e) };
  }

  try {
    result.memory = performMemoryAudit();
  } catch (e: any) {
    result.memory = { ok: false, error: String(e) };
  }

  try {
    result.security = await performSecurityAudit(process.env.SECURITY_URL || process.env.LATENCY_URL || 'http://localhost:3000');
  } catch (e: any) {
    result.security = { ok: false, error: String(e) };
  }

  try {
    result.deadCode = performDeadCodeAudit(targetPath);
  } catch (e: any) {
    result.deadCode = { ok: false, error: String(e) };
  }

  try {
    result.dependencies = performDependencyAudit(targetPath);
  } catch (e: any) {
    result.dependencies = { ok: false, error: String(e) };
  }

  try {
    result.async = performAsyncAudit(targetPath);
  } catch (e: any) {
    result.async = { ok: false, error: String(e) };
  }

  try {
    result.config = performConfigAudit(targetPath);
  } catch (e: any) {
    result.config = { ok: false, error: String(e) };
  }

  try {
    result.performance = runPerformanceAudit ? runPerformanceAudit(targetPath) : { ok: true };
  } catch (e: any) {
    result.performance = { ok: false, error: String(e) };
  }

  const out = path.join(process.cwd(), `muraqib-collect-report-${Date.now()}.json`);
  fs.writeFileSync(out, JSON.stringify(result, null, 2), 'utf-8');
  console.log('Saved collect-audit to', out);
}

run().catch((e) => { console.error(e); process.exit(1); });
