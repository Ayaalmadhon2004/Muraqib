import { AbstractMuraqibMigration } from './abstract-migration.js';
export class RemovePropertyMigration extends AbstractMuraqibMigration {
    propertyName;
    constructor(propertyName, originalConfig, migratedConfig) {
        super(originalConfig, migratedConfig);
        this.propertyName = propertyName;
    }
    run() {
        this.delete(this.propertyName);
    }
}
//# sourceMappingURL=remove-migration.js.map