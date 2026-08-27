import { AbstractMuraqibMigration } from './abstract-migration.js';

export class RemovePropertyMigration extends AbstractMuraqibMigration { // muraqib-ignore-dead: auto-suppressed by script for RemovePropertyMigration
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