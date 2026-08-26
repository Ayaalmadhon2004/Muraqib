import { AbstractMuraqibMigration } from './abstract-migration.js';
export declare class RemovePropertyMigration extends AbstractMuraqibMigration {
    readonly propertyName: string;
    constructor(propertyName: string, originalConfig: Record<string, any>, migratedConfig: Record<string, any>);
    run(): void;
}
//# sourceMappingURL=remove-migration.d.ts.map