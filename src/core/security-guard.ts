import https from "https";
import http from "http";
import { URL } from "url";
import { BaseGuard } from "./base-guard.js";
import type { AuditContext } from "./types.js";

/**
 * Result of a security audit on an HTTP endpoint
 * @interface SecurityAuditResult
 */
export interface SecurityAuditResult { // muraqib-ignore-dead: auto-suppressed by script for SecurityAuditResult
  isSecure: boolean;
  reports: string[];
  headers: Record<string, string | string[] | undefined>;
  score: number; // 0-100
}

export interface SecurityAuditOptions {
  targetUrl: string;
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

/**
 * Guard class - Security header audit with BaseGuard architecture
 */
export class SecurityGuard extends BaseGuard {
  protected guardName = "security-guard";
  private options: SecurityAuditOptions;
  private auditResult: SecurityAuditResult | null = null;

  constructor(options: SecurityAuditOptions) {
    super();
    this.options = options;
  }

  async execute(_context: AuditContext): Promise<void> {
    this.auditResult = await this.performAuditInternal();

    if (this.auditResult.isSecure) {
      this.addSuccessMessage(
        `Security headers audit passed with score ${this.auditResult.score}/100`
      );
    } else {
      this.auditResult.reports.forEach((report) => {
        if (report.includes("not HTTPS") || report.includes("failed") || report.includes("timed out")) {
          this.addCritical("Security Critical", report);
        } else if (report.includes("Missing security header")) {
          this.addError("Missing Security Header", report);
        } else if (report.includes("Missing recommended")) {
          this.addWarning("Missing Recommended Header", report);
        } else {
          this.addWarning("Security Issue", report);
        }
      });
    }

    this.addMessage(`Security audit score: ${this.auditResult.score}/100`);
  }

  private async performAuditInternal(): Promise<SecurityAuditResult> {
    const reports: string[] = [];
    const url = new URL(this.options.targetUrl);
    const hostname = url.hostname;
    const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(hostname);
    const isHttps = url.protocol === "https:";

    if (!isLocalHost && !isHttps) {
      reports.push("Connection is not HTTPS — data transmitted in plaintext");
    }

    return new Promise((resolve) => {
      const client = isHttps ? https : http;
      const req = client.request(
        this.options.targetUrl,
        { method: "HEAD", timeout: 10000 },
        (res) => {
          const headers = res.headers;
          const headerKeys = Object.keys(headers).map((k) => k.toLowerCase());

          for (const header of REQUIRED_HEADERS) {
            if (!headerKeys.includes(header)) {
              reports.push(`Missing security header: ${header}`);
            }
          }

          for (const header of RECOMMENDED_HEADERS) {
            if (!headerKeys.includes(header)) {
              reports.push(`Missing recommended header: ${header}`);
            }
          }

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

          if (headers["content-security-policy"]) {
            const csp = String(headers["content-security-policy"]);

            const unsafeMatches = csp.match(/'unsafe-[^']+'/g) || [];
            if (unsafeMatches.length > 0) {
              reports.push(`CSP contains unsafe directives: ${unsafeMatches.join(', ')}`);
            }

            if (!csp.includes("default-src") && !csp.includes("script-src")) {
              reports.push("CSP missing default-src or script-src directive");
            }

            const criticalDirectives = ["font-src", "img-src", "style-src", "connect-src", "frame-ancestors"];
            const missingDirectives = criticalDirectives.filter(dir => !csp.includes(dir));
            if (missingDirectives.length > 0) {
              reports.push(`CSP missing recommended directives: ${missingDirectives.join(', ')}`);
            }

            if (csp.includes("script-src") && csp.includes("script-src 'none'")) {
              reports.push("CSP script-src is set to 'none', blocking all scripts");
            }
          }

          if (headers["x-frame-options"]) {
            const xfo = String(headers["x-frame-options"]).toLowerCase();
            if (xfo !== "deny" && xfo !== "sameorigin") {
              reports.push(`X-Frame-Options has weak value: ${xfo}`);
            }
          }

          const totalChecks = REQUIRED_HEADERS.length + RECOMMENDED_HEADERS.length + 3;
          const passedChecks = Math.max(0, totalChecks - reports.length);
          const score = Math.max(0, Math.round((passedChecks / totalChecks) * 100));
          const isSecure = reports.length === 0;

          resolve({
            isSecure,
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

  protected override getMetadata(): Record<string, unknown> {
    return {
      ...super.getMetadata(),
      score: this.auditResult?.score ?? 0,
      headerCount: this.auditResult?.headers ? Object.keys(this.auditResult.headers).length : 0,
    };
  }
}

/**
 * دالة للتوافقية مع الكود القديم
 * @deprecated استخدم SecurityGuard بدلاً من ذلك
 */
export async function performSecurityAudit(targetUrl: string): Promise<SecurityAuditResult> {
  const guard = new SecurityGuard({ targetUrl });
  const context: AuditContext = {
    targetPath: targetUrl,
    auditId: `security-${Date.now()}`,
    startTime: new Date(),
    env: process.env as Record<string, string | undefined>,
    options: {},
    isServer: true,
    nodeVersion: process.version,
    platform: process.platform,
    processId: process.pid,
  };

  const result = await guard.run(context);

  const reports = result.issues.map((issue) => issue.description);
  const score = (result.metadata?.score as number) ?? 0;

  const isSecure = result.ok;

  return {
    isSecure,
    reports,
    headers: {},
    score,
  };
}
