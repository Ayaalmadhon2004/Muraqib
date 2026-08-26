export interface PackageGroup {
    groupName: string;
    packages: string[];
}
export declare const MURAQIB_LOCAL_PRESETS: PackageGroup[];
export declare function fetchRemoteMuraqibPresets(url: string): Promise<PackageGroup[]>;
//# sourceMappingURL=presets.d.ts.map