export declare const performLiveLatencyAudit: (url: string) => Promise<{
    isOptimized: boolean;
    reports: string[];
}>;
export declare const analyzeLatency: (requestTimeMs: number, payloadSizeKb: number) => {
    isOptimized: boolean;
    reports: string[];
};
//# sourceMappingURL=network-latency-advisor.d.ts.map