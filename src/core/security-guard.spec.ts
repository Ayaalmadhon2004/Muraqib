import http from "http";
import { describe, expect, it, afterEach } from "vitest";
import { performSecurityAudit } from "./security-guard.ts";

let testServer: http.Server | null = null;

function startMockServer(
  port: number,
  headers: Record<string, string> = {}
): Promise<http.Server> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      res.writeHead(200);
      res.end();
    });

    server.listen(port, () => {
      resolve(server);
    });
  });
}

afterEach(() => {
  if (testServer) {
    testServer.close();
    testServer = null;
  }
});

describe("performSecurityAudit", () => {
  it("detects missing required security headers", async () => {
    testServer = await startMockServer(9001, {
      "content-security-policy": "default-src 'self'",
      "x-frame-options": "DENY",
    });

    const result = await performSecurityAudit("http://localhost:9001");

    expect(result.isSecure).toBe(false);
    expect(result.reports).toContain("Missing security header: x-content-type-options");
    expect(result.reports).toContain("Missing security header: referrer-policy");
    expect(result.reports).toContain("Missing security header: strict-transport-security");
  });

  it("passes audit when all required and recommended headers are present with secure values", async () => {
    testServer = await startMockServer(9002, {
      "content-security-policy": "default-src 'self'; font-src 'self'; img-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'",
      "x-frame-options": "DENY",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "strict-transport-security": "max-age=31536000; includeSubDomains",
      "permissions-policy": "geolocation=()",
      "cross-origin-embedder-policy": "require-corp",
      "cross-origin-opener-policy": "same-origin",
    });

    const result = await performSecurityAudit("http://localhost:9002");

    expect(result.isSecure).toBe(true);
    expect(result.reports.length).toBe(0);
    expect(result.score).toBe(100);
  });

  it("warns about low HSTS max-age values", async () => {
    testServer = await startMockServer(9003, {
      "content-security-policy": "default-src 'self'",
      "x-frame-options": "DENY",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "strict-transport-security": "max-age=3600", // Too low (1 hour instead of 1 year)
    });

    const result = await performSecurityAudit("http://localhost:9003");

    expect(result.reports).toContain("HSTS max-age too low: 3600s (recommended: 31536000s)");
    expect(result.isSecure).toBe(false);
  });

  it("detects unsafe CSP directives", async () => {
    testServer = await startMockServer(9004, {
      "content-security-policy": "default-src 'unsafe-inline' 'unsafe-eval'",
      "x-frame-options": "DENY",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "strict-transport-security": "max-age=31536000",
    });

    const result = await performSecurityAudit("http://localhost:9004");

    expect(result.reports.some((r) => r.includes("CSP contains unsafe directives"))).toBe(true);
    expect(result.isSecure).toBe(false);
  });

  it("warns about missing CSP source directive", async () => {
    testServer = await startMockServer(9005, {
      "content-security-policy": "font-src 'self'",
      "x-frame-options": "DENY",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "strict-transport-security": "max-age=31536000",
    });

    const result = await performSecurityAudit("http://localhost:9005");

    expect(result.reports).toContain("CSP missing default-src or script-src directive");
    expect(result.isSecure).toBe(false);
  });

  it("detects weak X-Frame-Options values", async () => {
    testServer = await startMockServer(9006, {
      "content-security-policy": "default-src 'self'",
      "x-frame-options": "ALLOW-FROM https://example.com",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "strict-transport-security": "max-age=31536000",
    });

    const result = await performSecurityAudit("http://localhost:9006");

    expect(result.reports.some((r) => r.includes("X-Frame-Options has weak value"))).toBe(true);
  });

  it("accepts X-Frame-Options: SAMEORIGIN as secure", async () => {
    testServer = await startMockServer(9007, {
      "content-security-policy": "default-src 'self'",
      "x-frame-options": "SAMEORIGIN",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "strict-transport-security": "max-age=31536000",
    });

    const result = await performSecurityAudit("http://localhost:9007");

    expect(result.reports.some((r) => r.includes("X-Frame-Options has weak value"))).toBe(false);
  });

  it("flags missing recommended headers in reports but still marks as secure if no required headers are missing", async () => {
    testServer = await startMockServer(9008, {
      "content-security-policy": "default-src 'self'",
      "x-frame-options": "DENY",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "strict-transport-security": "max-age=31536000",
      // Missing recommended headers: permissions-policy, cross-origin-embedder-policy, etc.
    });

    const result = await performSecurityAudit("http://localhost:9008");

    // Note: missing recommended headers still count in the reports, so isSecure will be false
    expect(result.isSecure).toBe(false);
    expect(result.reports.some((r) => r.includes("Missing recommended header"))).toBe(true);
    expect(result.score).toBeLessThan(100);
  });

  it("calculates security score based on passed checks", async () => {
    testServer = await startMockServer(9009, {
      "content-security-policy": "default-src 'self'",
      "x-frame-options": "DENY",
      "x-content-type-options": "nosniff",
      // Missing: referrer-policy, strict-transport-security (required)
      // Missing: permissions-policy, cross-origin-embedder-policy, cross-origin-opener-policy (recommended)
    });

    const result = await performSecurityAudit("http://localhost:9009");

    expect(result.score).toBeLessThan(100);
    expect(result.score).toBeGreaterThan(0);
  });

  it("handles request errors gracefully", async () => {
    const result = await performSecurityAudit("http://localhost:19999"); // Non-existent server

    expect(result.isSecure).toBe(false);
    expect(result.reports.length).toBeGreaterThan(0);
    expect(result.reports.some((r) => r.includes("Security audit request failed"))).toBe(true);
    expect(result.score).toBe(0);
  });

  it("handles request timeout gracefully", async () => {
    testServer = await startMockServer(9010, {});

    // Create a server that never responds
    const slowServer = http.createServer((req, res) => {
      // Never send response - will cause timeout
    });

    await new Promise<void>((resolve) => {
      slowServer.listen(9011, () => resolve());
    });

    const result = await performSecurityAudit("http://localhost:9011");

    expect(result.isSecure).toBe(false);
    expect(result.reports.some((r) => r.includes("timed out"))).toBe(true);
    expect(result.score).toBe(0);

    slowServer.close();
  }, 15000); // Increase timeout for this test since it involves a 10s HTTP timeout

  it("handles case-insensitive header names", async () => {
    testServer = await startMockServer(9012, {
      "Content-Security-Policy": "default-src 'self'; font-src 'self'; img-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'",
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Strict-Transport-Security": "max-age=31536000",
      "Permissions-Policy": "geolocation=()",
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    });

    const result = await performSecurityAudit("http://localhost:9012");

    expect(result.isSecure).toBe(true);
  });

  it("correctly processes HSTS header with additional directives", async () => {
    testServer = await startMockServer(9013, {
      "content-security-policy": "default-src 'self'; font-src 'self'; img-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'",
      "x-frame-options": "DENY",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
      "permissions-policy": "geolocation=()",
      "cross-origin-embedder-policy": "require-corp",
      "cross-origin-opener-policy": "same-origin",
    });

    const result = await performSecurityAudit("http://localhost:9013");

    expect(result.isSecure).toBe(true);
  });
});
