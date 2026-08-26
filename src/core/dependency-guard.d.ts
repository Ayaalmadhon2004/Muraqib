export interface DependencyAuditResult {
    isClean: boolean;
    reports: string[];
    circularDependencies: string[][];
    outdatedPackages: string[];
    duplicatePackages: string[];
    deprecatedImports: string[];
}
export declare function performDependencyAudit(targetPath: string): DependencyAuditResult;
//# sourceMappingURL=dependency-guard.d.ts.map