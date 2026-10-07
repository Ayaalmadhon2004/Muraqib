# Progress Indicators & Metrics Guide

This guide explains how to use Muraqib's new progress indicators and audit metrics.

## 📊 Quick Start

### Command Line Usage
```bash
# Run audit with progress indicators and timing
npm run audit

# Suppress progress output (useful for CI/CD)
npm run audit -- --silent
```

### Programmatic Usage
```typescript
import { MetricsCollector } from "muraqib/dist/shared/progress.js";
import { performConfigAudit } from "muraqib";

const metrics = new MetricsCollector(false); // false = show output
const result = performConfigAudit("./project");

// Print aggregated metrics
metrics.printSummary();
```

## 🎯 Progress Indicators

### SimpleProgress
Provides visual feedback during long-running operations:

```typescript
import { createProgress } from "muraqib/dist/shared/progress.js";

const progress = createProgress("Scanning files for secrets", false);
progress.start();

// Do work...
for (let i = 0; i < files.length; i++) {
  progress.update(`Scanned ${i + 1} files`, i + 1);
}

progress.succeed(`Scanned ${totalFiles} files`, totalFiles);
```

**Output:**
```
⏳ Scanning files for secrets...
  ⚙️  Scanned 50 files [0.5s]
  ⚙️  Scanned 100 files [1.0s]
✅ Scanned 250 files (250 files scanned) [2.3s]
```

### StepTimer
Track execution time for individual steps:

```typescript
import { createTimer } from "muraqib/dist/shared/progress.js";

const timer = createTimer("Parsing configuration", false);
timer.start();

// Do work...
const duration = timer.end(); // Logs: "✓ (0.23s)"
console.log(`Task took ${timer.getDuration()}ms`);
```

## 📈 Metrics Collection

### MetricsCollector
Aggregate and summarize audit performance:

```typescript
import { MetricsCollector } from "muraqib/dist/shared/progress.js";

const collector = new MetricsCollector(false);

// Record metrics from each audit
collector.record("config-audit", 1250, 5, 2);
collector.record("security-audit", 2340, 156, 12);
collector.record("dependency-audit", 890, 32, 0);

// Print summary
collector.printSummary();
```

**Output:**
```
📊 Audit Performance Metrics:
────────────────────────────
  config-audit         1.25s | 5 files | 2 found
  security-audit       2.34s | 156 files | 12 found
  dependency-audit     0.89s | 32 files
────────────────────────────
  Total Time: 4.48s
  Total Files: 193
```

## 🔧 Integration with Audits

### Config Audit with Timing
```typescript
import { performConfigAudit } from "muraqib";
import { createProgress } from "muraqib/dist/shared/progress.js";

const progress = createProgress("Running config audit", false);
progress.start();

const startTime = Date.now();
const result = performConfigAudit("./project");
const duration = Date.now() - startTime;

if (result.isValid) {
  progress.succeed("Config audit passed", result.reports.length);
} else {
  progress.fail("Config audit found issues");
  console.error("Issues:", result.reports);
}
```

### Multi-Audit Workflow
```typescript
import { 
  performConfigAudit,
  performMemoryAudit,
  performSecurityAudit 
} from "muraqib";
import { MetricsCollector, createProgress } from "muraqib/dist/shared/progress.js";

const metrics = new MetricsCollector(false);

async function runFullAudit(targetPath: string, securityUrl: string) {
  const allResults = {};

  // Config audit
  const configProgress = createProgress("Config Audit", false);
  configProgress.start();
  const configStart = Date.now();
  const configResult = performConfigAudit(targetPath);
  const configDuration = Date.now() - configStart;
  metrics.record("config", configDuration, 3, configResult.reports.length);
  configProgress.succeed("Config audit complete", configResult.reports.length);
  allResults.config = configResult;

  // Memory audit
  const memProgress = createProgress("Memory Audit", false);
  memProgress.start();
  const memStart = Date.now();
  const memResult = performMemoryAudit();
  const memDuration = Date.now() - memStart;
  metrics.record("memory", memDuration);
  memProgress.succeed("Memory audit complete");
  allResults.memory = memResult;

  // Security audit
  const secProgress = createProgress("Security Audit", false);
  secProgress.start();
  const secStart = Date.now();
  const secResult = await performSecurityAudit(securityUrl);
  const secDuration = Date.now() - secStart;
  metrics.record("security", secDuration, 1, secResult.reports?.length || 0);
  secProgress.succeed("Security audit complete", secResult.reports?.length);
  allResults.security = secResult;

  // Print summary
  console.log("\n");
  metrics.printSummary();

  return allResults;
}
```

## 🎨 Customization

### Disabling Progress Output
```typescript
// For CI/CD environments
const progress = createProgress("Task", true); // true = silent
progress.start();
// ... work ...
progress.succeed("Done"); // Produces no output
```

### Custom Timing
```typescript
const timer = createTimer("Custom task", true); // silent mode
timer.start();
// ... work ...
const ms = timer.getDuration(); // Get raw milliseconds
console.log(`Task completed in ${ms}ms`);
```

## 📊 Example Output

Complete audit with progress indicators:

```
⏳ Running config audit...
  ⚙️  Checking required files [0.1s]
  ⚙️  Validating tsconfig.json [0.2s]
  ⚙️  Scanning package.json [0.1s]
  ⚙️  Finding .env files [0.5s]
  ⚙️  Verifying Git protection [0.3s]
✅ Config audit complete (5 files checked) [1.2s]

⏳ Running memory audit...
✅ Memory audit complete [0.4s]

⏳ Running security audit...
✅ Security audit complete (12 issues found) [2.3s]

📊 Audit Performance Metrics:
────────────────────────────
  config       1.20s | 5 files | 3 found
  memory       0.40s
  security     2.30s | 1 files | 12 found
────────────────────────────
  Total Time: 3.90s
  Total Files: 6
```

## 🚀 Best Practices

1. **Use progress for operations > 500ms**
   - Short operations don't need progress indicators
   - Long scans benefit from real-time feedback

2. **Record metrics for analysis**
   - Track which audits are slowest
   - Monitor changes over time

3. **Silent mode for CI/CD**
   - Disable progress in automated environments
   - Reduce log verbosity

4. **Provide file counts**
   - Helps users understand scope
   - Useful for performance analysis

## 📚 API Reference

### createProgress(title, silent?)
```typescript
export function createProgress(title: string, silent?: boolean): SimpleProgress;

interface SimpleProgress {
  start(): void;
  update(message: string, count?: number): void;
  succeed(message?: string, fileCount?: number): void;
  fail(error: string): void;
  getDuration(): number;
}
```

### createTimer(name, silent?)
```typescript
export function createTimer(name: string, silent?: boolean): AuditTimer;

interface AuditTimer {
  start(): void;
  end(): string;
  getDuration(): number;
}
```

### MetricsCollector
```typescript
export class MetricsCollector {
  constructor(silent?: boolean);
  record(moduleName: string, duration: number, filesScanned?: number, itemsFound?: number): void;
  printSummary(): void;
  getMetrics(): AuditMetrics[];
}

interface AuditMetrics {
  moduleName: string;
  duration: number;
  filesScanned?: number;
  itemsFound?: number;
}
```

---

**Note:** The progress system is designed to be lightweight and not impact audit performance. Progress indicators can be safely used in all environments without overhead.
