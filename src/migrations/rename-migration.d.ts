import { AbstractMuraqibMigration } from './abstract-migration.js';
export declare class RenamePropertyMigration extends AbstractMuraqibMigration {
    readonly propertyName: string;
    private readonly newPropertyName;
    constructor(deprecatedPropertyName: string, newPropertyName: string, originalConfig: Record<string, any>, migratedConfig: Record<string, any>);
    run(value: unknown): void;
}
//# sourceMappingURL=rename-migration.d.ts.map