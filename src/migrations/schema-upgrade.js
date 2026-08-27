import { AbstractMuraqibMigration } from './abstract-migration.js';
import { getMuraqibNewVersionValue } from '../core/muraqib-version.js';
export class SchemaUpgradeMigration extends AbstractMuraqibMigration {
    propertyName;
    targetVersion;
    strategy;
    constructor(packageName, targetVersion, strategy, originalDependencies, migratedDependencies) {
        super(originalDependencies, migratedDependencies);
        this.propertyName = packageName;
        this.targetVersion = targetVersion;
        this.strategy = strategy;
    }
    run(value) {
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
//# sourceMappingURL=schema-upgrade.js.map