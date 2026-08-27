export { createEnv, createEnvWithPresets, loadEnv, safeCreateEnv } from "./env.js";
export * from "./core/types.js";
export * from "./core/standard.js";
export declare const auditPerformance: (resourceCount: number, protocol: string, cookiesSize: number) => string[];
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
export interface AuditOptions {
    targetPath?: string;
    latencyUrl?: string;
    securityUrl?: string;
    skipEnv?: boolean;
    skipMemory?: boolean;
    skipSecurity?: boolean;
    skipDeadCode?: boolean;
    skipDependencies?: boolean;
    skipAsync?: boolean;
    skipConfig?: boolean;
    skipPerformance?: boolean;
    skipOptimizer?: boolean;
    skipRenderBlocking?: boolean;
    silent?: boolean;
    schedule?: string;
    presets?: string[];
    safe?: boolean;
    upgrade?: boolean;
}
export interface AuditResult {
    env: {
        ok: boolean;
        errors: string[];
    };
    images: {
        ok: boolean;
        errors: string[];
    };
    bundle: {
        ok: boolean;
        errors: string[];
    };
    network: {
        ok: boolean;
        errors: string[];
    };
    memory: {
        ok: boolean;
        errors: string[];
    };
    security: {
        ok: boolean;
        errors: string[];
        score?: number;
    };
    deadCode: {
        ok: boolean;
        errors: string[];
    };
    dependencies: {
        ok: boolean;
        errors: string[];
    };
    async: {
        ok: boolean;
        errors: string[];
    };
    config: {
        ok: boolean;
        errors: string[];
    };
    performance: {
        ok: boolean;
        errors: string[];
    };
    optimizer: {
        ok: boolean;
        errors: string[];
    };
    renderBlocking: {
        ok: boolean;
        errors: string[];
    };
}
export declare function runAudit(options?: AuditOptions): Promise<AuditResult>;
//# sourceMappingURL=index.d.ts.map