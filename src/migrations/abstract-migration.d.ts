export declare abstract class AbstractMuraqibMigration {
    abstract readonly propertyName: string;
    protected readonly originalConfig: Record<string, any>;
    protected readonly migratedConfig: Record<string, any>;
    constructor(originalConfig: Record<string, any>, migratedConfig: Record<string, any>);
    abstract run(value: unknown): void;
    protected delete(property: string): void;
    protected setSafely(key: string, value: unknown): void;
}
//# sourceMappingURL=abstract-migration.d.ts.map