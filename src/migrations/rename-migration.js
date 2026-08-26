import { AbstractMuraqibMigration } from './abstract-migration.js';
export class RenamePropertyMigration extends AbstractMuraqibMigration {
    propertyName;
    newPropertyName;
    constructor(deprecatedPropertyName, newPropertyName, originalConfig, migratedConfig) {
        super(originalConfig, migratedConfig);
        this.propertyName = deprecatedPropertyName;
        this.newPropertyName = newPropertyName;
    }
    // تطبيق الدالة المجردة: نأخذ القيمة القديمة ونضعها تحت الاسم الجديد
    run(value) {
        this.setSafely(this.newPropertyName, value);
        this.delete(this.propertyName); // حذف الاسم القديم لمنع الكراكيب
    }
}
//# sourceMappingURL=rename-migration.js.map