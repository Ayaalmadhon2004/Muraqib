export interface MemoryAuditResult {
    isOptimized: boolean;
    reports: string[];
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
    externalMb: number;
    arrayBuffersMb: number;
    leakRisk: "none" | "low" | "medium" | "high";
}
export declare function performMemoryAudit(): MemoryAuditResult;
//# sourceMappingURL=memory-guard.d.ts.map