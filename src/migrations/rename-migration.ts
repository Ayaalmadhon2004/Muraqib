import { AbstractMuraqibMigration } from './abstract-migration.js';

=export class RenamePropertyMigration extends AbstractMuraqibMigration {
  override readonly propertyName: string;
  private readonly newPropertyName: string;

  constructor(
    deprecatedPropertyName: string,
    newPropertyName: string,
    originalConfig: Record<string, any>,
    migratedConfig: Record<string, any>
  ) {
    super(originalConfig, migratedConfig);
    this.propertyName = deprecatedPropertyName;
    this.newPropertyName = newPropertyName;
  }

  // تطبيق الدالة المجردة: نأخذ القيمة القديمة ونضعها تحت الاسم الجديد
  override run(value: unknown): void {
    this.setSafely(this.newPropertyName, value);
    this.delete(this.propertyName); // حذف الاسم القديم لمنع الكراكيب
  }
}