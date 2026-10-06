import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runImagePerformanceAudit } from "./image-guard.js";
import { performLiveLatencyAudit } from "./network-latency-advisor.js";
import { runComprehensiveBundleAudit } from "../../rules/bundle-budget.js";

let root: string;

beforeEach(() => {
  // The project folder name deliberately contains "dist" and "build".
  root = fs.mkdtempSync(path.join(os.tmpdir(), "my-dist-build-app-"));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

const write = (rel: string, bytes: number) => {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.alloc(bytes, "a"));
};

describe("image guard", () => {
  it("returns real violations for oversized images", () => {
    write("public/big.png", 600 * 1024);
    write("public/small.jpg", 10 * 1024);
    const { violations } = runImagePerformanceAudit(root);
    expect(violations.map((v) => v.filePath.endsWith(path.join("public", "big.png")))).toEqual([true]);
    expect(violations[0]!.sizeKB).toBe(600);
  });

  it("skips a real dist folder but not a project whose name contains 'dist'", () => {
    write("dist/big.png", 600 * 1024);
    write("distribution/big.png", 600 * 1024);
    const { violations } = runImagePerformanceAudit(root);
    expect(violations).toHaveLength(1);
    expect(violations[0]!.filePath).toContain("distribution");
  });
});

describe("bundle budget", () => {
  it("reports every file over the budget instead of passing by default", () => {
    write("src/a.ts", 1024);
    write("src/nested/huge.ts", 20 * 1024);
    write("dist/huge.js", 50 * 1024);
    const res = runComprehensiveBundleAudit(root);
    expect(res.skipped).toBe(false);
    expect(res.scannedFiles).toBe(2);
    expect(res.violations.map((v) => v.filePath)).toEqual([path.join("src", "nested", "huge.ts")]);
  });

  it("flags an empty project as skipped, not as a pass", () => {
    const res = runComprehensiveBundleAudit(root);
    expect(res.skipped).toBe(true);
    expect(res.scannedFiles).toBe(0);
  });
});

describe("network latency", () => {
  it("fails on an unreachable local server without falling back elsewhere", async () => {
    const res = await performLiveLatencyAudit("http://127.0.0.1:1");
    expect(res.reachable).toBe(false);
    expect(res.isOptimized).toBe(false);
    expect(res.reports[0]).toContain("127.0.0.1:1");
  });
});
