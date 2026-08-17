import https from "https";
import http from "http";
import { URL } from "url";

export interface SecurityAuditResult {
  isSecure: boolean;
  reports: string[];
  headers: Record<string, string | string[] | undefined>;
  score: number; // 0-100
}

const REQUIRED_HEADERS = [
  "content-security-policy",
  "x-frame-options",
  "x-content-type-options",
  "referrer-policy",
  "strict-transport-security",
];

const RECOMMENDED_HEADERS = [
  "permissions-policy",
  "cross-origin-embedder-policy",
  "cross-origin-opener-policy",
];

export async function performSecurityAudit(targetUrl: string): Promise<SecurityAuditResult> {
  const reports: string[] = [];
  const url = new URL(targetUrl);
  const isHttps = url.protocol === "https:";

  if (!isHttps) {
    reports.push("Connection is not HTTPS — data transmitted in plaintext");
  }

  return new Promise((resolve) => {
    const client = isHttps ? https : http;
    const req = client.request(
      targetUrl,
      { method: "HEAD", timeout: 10000 },
      (res) => {
        const headers = res.headers;
        const headerKeys = Object.keys(headers).map((k) => k.toLowerCase());

        // Check required headers
        for (const header of REQUIRED_HEADERS) {
          if (!headerKeys.includes(header)) {
            reports.push(`Missing security header: ${header}`);
          }
        }

        // Check recommended headers
        for (const header of RECOMMENDED_HEADERS) {
          if (!headerKeys.includes(header)) {
            reports.push(`Missing recommended header: ${header}`);
          }
        }

        // Check HSTS
        if (headers["strict-transport-security"]) {
          const hsts = String(headers["strict-transport-security"]);
          const maxAgeMatch = hsts.match(/max-age=(\d+)/);
          if (maxAgeMatch && maxAgeMatch[1]) {
            const maxAge = parseInt(maxAgeMatch[1], 10);
            if (maxAge < 31536000) {
              reports.push(`HSTS max-age too low: ${maxAge}s (recommended: 31536000s)`);
            }
          }
        }

        // Check CSP
        if (headers["content-security-policy"]) {
          const csp = String(headers["content-security-policy"]);
          if (csp.includes("'unsafe-inline'") || csp.includes("'unsafe-eval'")) {
            reports.push(`CSP contains unsafe directives: ${csp.match(/'unsafe-[^']+'/)?.[0]}`);
          }
          if (!csp.includes("default-src") && !csp.includes("script-src")) {
            reports.push("CSP missing default-src or script-src directive");
          }
        }

        // Check X-Frame-Options
        if (headers["x-frame-options"]) {
          const xfo = String(headers["x-frame-options"]).toLowerCase();
          if (xfo !== "deny" && xfo !== "sameorigin") {
            reports.push(`X-Frame-Options has weak value: ${xfo}`);
          }
        }

        // Score calculation
        const totalChecks = REQUIRED_HEADERS.length + RECOMMENDED_HEADERS.length + 3;
        const passedChecks = totalChecks - reports.length;
        const score = Math.max(0, Math.round((passedChecks / totalChecks) * 100));

        resolve({
          isSecure: reports.length === 0 && isHttps,
          reports,
          headers,
          score,
        });
      }
    );

    req.on("error", (err) => {
      reports.push(`Security audit request failed: ${err.message}`);
      resolve({
        isSecure: false,
        reports,
        headers: {},
        score: 0,
      });
    });

    req.on("timeout", () => {
      req.destroy();
      reports.push("Security audit request timed out");
      resolve({
        isSecure: false,
        reports,
        headers: {},
        score: 0,
      });
    });

    req.end();
  });
}