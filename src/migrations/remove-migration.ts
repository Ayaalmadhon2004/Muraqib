import { AbstractMuraqibMigration } from './abstract-migration.js';

export class RemovePropertyMigration extends AbstractMuraqibMigration {
  override readonly propertyName: string; 
  constructor(
    propertyName: string,
    originalConfig: Record<string, any>,
    migratedConfig: Record<string, any>
  ) {
    super(originalConfig, migratedConfig);
    this.propertyName = propertyName;
  }

  override run(): void {
    this.delete(this.propertyName);
  }
}