export interface DeadCodeAuditResult {
    isClean: boolean;
    reports: string[];
    emptyFunctions: string[];
    unreachableBranches: string[];
    unusedExports: string[];
}
export declare function performDeadCodeAudit(targetPath: string): DeadCodeAuditResult;
//# sourceMappingURL=dead-code-guard.d.ts.map