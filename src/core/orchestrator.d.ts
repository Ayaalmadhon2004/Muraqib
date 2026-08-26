export interface OrchestratorConfig {
    packageName: string;
    currentValue: string;
    newVersion: string;
    rangeStrategy: 'replace' | 'widen' | 'bump';
    remotePresetUrl?: string;
}
export declare function runMuraqibUpgradeOrchestrator({ packageName, currentValue, newVersion, rangeStrategy, remotePresetUrl, }: OrchestratorConfig): Promise<{
    updatedVersion: string | null;
    schemaMigrated: boolean;
    skipReason?: string;
}>;
//# sourceMappingURL=orchestrator.d.ts.map