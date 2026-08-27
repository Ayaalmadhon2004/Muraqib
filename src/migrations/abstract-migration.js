export class AbstractMuraqibMigration {
    originalConfig;
    migratedConfig;
    constructor(originalConfig, migratedConfig) {
        this.originalConfig = originalConfig;
        this.migratedConfig = migratedConfig;
    }
    delete(property) {
        delete this.migratedConfig[property];
    }
    setSafely(key, value) {
        if (this.originalConfig[key] === undefined && this.migratedConfig[key] === undefined) {
            this.migratedConfig[key] = value;
        }
    }
}
//# sourceMappingURL=abstract-migration.js.map