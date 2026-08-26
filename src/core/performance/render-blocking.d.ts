export declare const analyzeRenderBlocking: (htmlContent: string) => {
    status: string;
    message: string;
    blockingScripts?: never;
    blockingStyles?: never;
    isOptimized?: never;
} | {
    blockingScripts: number;
    blockingStyles: number;
    isOptimized: boolean;
    message: string;
    status?: never;
};
//# sourceMappingURL=render-blocking.d.ts.map