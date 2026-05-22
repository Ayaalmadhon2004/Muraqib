export abstract class AbstractMuraqibMigration {
  abstract readonly propertyName: string;
  protected readonly originalConfig: Record<string, any>;
  protected readonly migratedConfig: Record<string, any>;

  constructor(originalConfig: Record<string, any>, migratedConfig: Record<string, any>) {
    this.originalConfig = originalConfig;
    this.migratedConfig = migratedConfig;
  }

  abstract run(value: unknown): void;

  protected delete(property: string): void {
    delete this.migratedConfig[property];
  }

  protected setSafely(key: string, value: unknown): void {
    if (this.originalConfig[key] === undefined && this.migratedConfig[key] === undefined) {
      this.migratedConfig[key] = value;
    }
  }
}