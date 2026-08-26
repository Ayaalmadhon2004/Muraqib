import { AbstractMuraqibMigration } from './abstract-migration.js';
import { getMuraqibNewVersionValue} from '../core/muraqib-version.js';
import type {VersionUpdateStrategy} from '../core/muraqib-version.js';

// muraqib-ignore-dead: intentionally preserved (auto-suppress)
export class SchemaUpgradeMigration extends AbstractMuraqibMigration {
  override readonly propertyName: string; 
  private readonly targetVersion: string;  
  private readonly strategy: VersionUpdateStrategy;

  constructor(
    packageName: string,
    targetVersion: string,
    strategy: VersionUpdateStrategy,
    originalDependencies: Record<string, string>,
    migratedDependencies: Record<string, string>
  ) {
    super(originalDependencies, migratedDependencies);
    this.propertyName = packageName;
    this.targetVersion = targetVersion;
    this.strategy = strategy;
  }

  override run(value: unknown): void {
    const currentVersion = typeof value === 'string' ? value : String(value || '');

    const finalVersion = getMuraqibNewVersionValue({
      currentVersion: currentVersion,
      newVersion: this.targetVersion,
      updateStrategy: this.strategy,
      packageName: this.propertyName,
    });

    if (finalVersion) {
      this.migratedConfig[this.propertyName] = finalVersion;
    }
  }
}
// الملف التنفيذي لترقية إصدارات الحزم في ملف package.json باستخدام استراتيجيات مرنة للتحديث، مع الحفاظ على التوافقية والأمان في التحديثات.