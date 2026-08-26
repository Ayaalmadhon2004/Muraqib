export interface AsyncAuditResult {
    isClean: boolean;
    reports: string[];
    unhandledPromises: string[];
    missingAwait: string[];
    callbackHell: string[];
    floatingPromises: string[];
}
export declare function performAsyncAudit(targetPath: string): AsyncAuditResult;
//# sourceMappingURL=async-guard.d.ts.map