export interface ConfigAuditResult {
    isValid: boolean;
    reports: string[];
    missingFiles: string[];
    invalidConfigs: string[];
    insecureConfigs: string[];
}
export declare function performConfigAudit(targetPath: string): ConfigAuditResult;
//# sourceMappingURL=config-guard.d.ts.map