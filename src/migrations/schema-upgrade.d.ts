import { AbstractMuraqibMigration } from './abstract-migration.js';
import type { VersionUpdateStrategy } from '../core/muraqib-version.js';
export declare class SchemaUpgradeMigration extends AbstractMuraqibMigration {
    readonly propertyName: string;
    private readonly targetVersion;
    private readonly strategy;
    constructor(packageName: string, targetVersion: string, strategy: VersionUpdateStrategy, originalDependencies: Record<string, string>, migratedDependencies: Record<string, string>);
    run(value: unknown): void;
}
//# sourceMappingURL=schema-upgrade.d.ts.map