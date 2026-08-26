export interface SecurityAuditResult {
    isSecure: boolean;
    reports: string[];
    headers: Record<string, string | string[] | undefined>;
    score: number;
}
export declare function performSecurityAudit(targetUrl: string): Promise<SecurityAuditResult>;
//# sourceMappingURL=security-guard.d.ts.map