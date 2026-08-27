export type VersionUpdateStrategy = 'replace' | 'keep-both';
export interface MuraqibVersionConfig {
    currentVersion: string;
    newVersion: string;
    updateStrategy: VersionUpdateStrategy;
    packageName?: string;
}
export declare function getMuraqibNewVersionValue({ currentVersion, newVersion, updateStrategy, packageName: _packageName, }: MuraqibVersionConfig): string | null;
//# sourceMappingURL=muraqib-version.d.ts.map