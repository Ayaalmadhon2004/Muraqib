/**
 * @file src/core/base-guard.ts
 * @description فئة الأساس المعمارية لجميع Guards
 * توفر:
 * - قياس الأداء الموحد (timing + memory)
 * - معالجة مركزية وآمنة للأخطاء
 * - دوال مساعدة لإنشاء المشاكل والتحذيرات
 * - منطق إعادة المحاولة
 */

import {
  type AuditContext,
  type GuardResult,
  type Issue,
  AuditStatus,
  Severity,
  GuardError,
} from "./types.js";

// ============================================================================
// BASE GUARD CLASS
// ============================================================================

/**
 * الفئة الأساس لجميع Guards
 * توفر البنية الأساسية والوظائف المشتركة
 */
export abstract class BaseGuard {
  /**
   * اسم Guard (يجب تعريفه في الفئات المشتقة)
   */
  protected abstract guardName: string;

  /**
   * الحد الأقصى لعدد محاولات إعادة التشغيل
   */
  protected maxRetries: number = 3;

  /**
   * التأخير الأساسي بين المحاولات (ملي ثانية)
   */
  protected baseDelay: number = 100;

  /**
   * السياق الحالي
   */
  protected context?: AuditContext;

  /**
   * القائمة الداخلية للمشاكل
   */
  protected issues: Issue[] = [];

  /**
   * الرسائل المرتبطة
   */
  protected messages: string[] = [];

  /**
   * معرف التتبع
   */
  protected traceId: string;

  constructor() {
    this.traceId = this.generateTraceId();
  }

  /**
   * نقطة الدخول الرئيسية للـ Guard
   * يجب تنفيذها في الفئات المشتقة
   */
  abstract execute(context: AuditContext): Promise<void>;

  /**
   * تشغيل Guard مع قياس الأداء الموحد
   */
  async run(context: AuditContext): Promise<GuardResult> {
    this.context = context;
    this.issues = [];
    this.messages = [];

    const startTime = Date.now();
    const memoryBefore = this.getMemoryUsage();

    try {
      // تنفيذ Guard مع إعادة المحاولة
      await this.executeWithRetry(context);

      // حساب قياسات الأداء
      const endTime = Date.now();
      const memoryAfter = this.getMemoryUsage();

      return {
        name: this.guardName,
        status: this.determineStatus(),
        ok: this.issues.length === 0,
        messages: this.messages,
        issues: this.issues,
        summary: this.generateSummary(),
        performance: {
          duration: endTime - startTime,
          timestamp: new Date(),
          memoryDelta: memoryAfter - memoryBefore,
          itemsProcessed: this.getItemsProcessed(),
        },
        metadata: this.getMetadata(),
        traceId: this.traceId,
      };
    } catch (error) {
      // معالجة الأخطاء بشكل آمن
      return this.handleError(error, startTime);
    }
  }

  /**
   * تنفيذ Guard مع إعادة محاولة تلقائية
   */
  protected async executeWithRetry(context: AuditContext): Promise<void> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.execute(context);
        return;
      } catch (error) {
        lastError = error;

        if (attempt < this.maxRetries) {
          // الانتظار قبل المحاولة التالية (exponential backoff)
          const delay = this.baseDelay * Math.pow(2, attempt - 1);
          await this.delay(delay);
          this.addMessage(
            `attempt #${attempt} failed, retrying... (delay: ${delay}ms)`,
          );
        }
      }
    }

    // إذا فشلت جميع المحاولات
    throw new GuardError(
      this.guardName,
      `Failed after ${this.maxRetries} attempts`,
      "MAX_RETRIES_EXCEEDED",
      { lastError },
    );
  }

  /**
   * معالجة الأخطاء الموحدة
   */
  protected handleError(error: unknown, startTime: number): GuardResult {
    const errorMessage = this.extractErrorMessage(error);
    const errorCode = this.extractErrorCode(error);

    this.addIssue({
      id: `error-${this.traceId}`,
      title: `${this.guardName} Execution Failed`,
      description: errorMessage,
      severity: Severity.CRITICAL,
      category: "execution",
      metadata: {
        errorCode,
        guardName: this.guardName,
        timestamp: new Date().toISOString(),
      },
    });

    return {
      name: this.guardName,
      status: AuditStatus.FAILED,
      ok: false,
      messages: [...this.messages, `FATAL: ${errorMessage}`],
      issues: this.issues,
      summary: `Guard execution failed: ${errorMessage}`,
      performance: {
        duration: Date.now() - startTime,
        timestamp: new Date(),
      },
      traceId: this.traceId,
      metadata: {
        errorCode,
        errorMessage,
      },
    };
  }

  // ============================================================================
  // HELPER METHODS - ISSUES
  // ============================================================================

  /**
   * إضافة مشكلة (خطأ)
   */
  protected addIssue(issue: Partial<Issue>): void {
    const newIssue: Issue = {
      id: issue.id || this.generateId(),
      title: issue.title || "Unknown Issue",
      description: issue.description || "",
      severity: issue.severity || Severity.ERROR,
      timestamp: issue.timestamp || new Date(),
    };

    if (issue.category !== undefined) newIssue.category = issue.category;
    if (issue.location !== undefined) newIssue.location = issue.location;
    if (issue.line !== undefined) newIssue.line = issue.line;
    if (issue.column !== undefined) newIssue.column = issue.column;
    if (issue.suggestion !== undefined) newIssue.suggestion = issue.suggestion;
    if (issue.metadata !== undefined) newIssue.metadata = issue.metadata;

    this.issues.push(newIssue);
  }

  /**
   * إضافة تحذير
   */
  protected addWarning(
    title: string,
    description: string,
    suggestion?: string,
  ): void {
    const issue: Partial<Issue> = {
      title,
      description,
      severity: Severity.WARNING,
    };
    if (suggestion !== undefined) issue.suggestion = suggestion;
    this.addIssue(issue);
  }

  /**
   * إضافة خطأ
   */
  protected addError(
    title: string,
    description: string,
    suggestion?: string,
  ): void {
    const issue: Partial<Issue> = {
      title,
      description,
      severity: Severity.ERROR,
    };
    if (suggestion !== undefined) issue.suggestion = suggestion;
    this.addIssue(issue);
  }

  /**
   * إضافة خطأ حرج
   */
  protected addCritical(
    title: string,
    description: string,
    suggestion?: string,
  ): void {
    const issue: Partial<Issue> = {
      title,
      description,
      severity: Severity.CRITICAL,
    };
    if (suggestion !== undefined) issue.suggestion = suggestion;
    this.addIssue(issue);
  }

  /**
   * إضافة معلومة
   */
  protected addInfo(title: string, description: string): void {
    this.addIssue({
      title,
      description,
      severity: Severity.INFO,
    });
  }

  // ============================================================================
  // HELPER METHODS - MESSAGES
  // ============================================================================

  /**
   * إضافة رسالة
   */
  protected addMessage(message: string): void {
    this.messages.push(message);
  }

  /**
   * إضافة رسالة نجاح
   */
  protected addSuccessMessage(message: string): void {
    this.addMessage(`✓ ${message}`);
  }

  /**
   * إضافة رسالة تحذير
   */
  protected addWarningMessage(message: string): void {
    this.addMessage(`⚠ ${message}`);
  }

  /**
   * إضافة رسالة خطأ
   */
  protected addErrorMessage(message: string): void {
    this.addMessage(`✗ ${message}`);
  }

  // ============================================================================
  // HELPER METHODS - PERFORMANCE
  // ============================================================================

  /**
   * الحصول على استهلاك الذاكرة الحالي (MB)
   */
  protected getMemoryUsage(): number {
    const mem = process.memoryUsage();
    return Math.round(mem.heapUsed / 1024 / 1024);
  }

  /**
   * قياس وقت تنفيذ دالة
   */
  protected async measureTime<T>(
    fn: () => Promise<T>,
  ): Promise<{ result: T; duration: number }> {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    return { result, duration };
  }

  /**
   * رقم معالج موازي لعمليات متزامنة
   * (تجاوز في الفئات المشتقة)
   */
  protected getItemsProcessed(): number {
    return 0;
  }

  /**
   * الحصول على البيانات الإضافية
   * (تجاوز في الفئات المشتقة)
   */
  protected getMetadata(): Record<string, unknown> {
    return {
      guardName: this.guardName,
      traceId: this.traceId,
    };
  }

  // ============================================================================
  // HELPER METHODS - UTILITIES
  // ============================================================================

  /**
   * تحديد حالة التنفيذ النهائية
   */
  protected determineStatus(): AuditStatus {
    if (this.issues.length === 0) {
      return AuditStatus.OK;
    }

    const criticalCount = this.issues.filter(
      (i) => i.severity === Severity.CRITICAL,
    ).length;
    const errorCount = this.issues.filter(
      (i) => i.severity === Severity.ERROR,
    ).length;

    if (criticalCount > 0) return AuditStatus.FAILED;
    if (errorCount > 0) return AuditStatus.ISSUES;
    return AuditStatus.WARNING;
  }

  /**
   * إنشاء ملخص النتائج
   */
  protected generateSummary(): string {
    const issueCount = this.issues.length;
    if (issueCount === 0) {
      return `✓ ${this.guardName}: No issues found`;
    }

    const criticalCount = this.issues.filter(
      (i) => i.severity === Severity.CRITICAL,
    ).length;
    const errorCount = this.issues.filter(
      (i) => i.severity === Severity.ERROR,
    ).length;
    const warningCount = this.issues.filter(
      (i) => i.severity === Severity.WARNING,
    ).length;

    const parts: string[] = [];
    if (criticalCount > 0) parts.push(`${criticalCount} critical`);
    if (errorCount > 0) parts.push(`${errorCount} error(s)`);
    if (warningCount > 0) parts.push(`${warningCount} warning(s)`);

    return `✗ ${this.guardName}: Found ${issueCount} issue(s) - ${parts.join(", ")}`;
  }

  /**
   * استخراج رسالة الخطأ من كائن خطأ
   */
  protected extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === "string") {
      return error;
    }
    return String(error);
  }

  /**
   * استخراج رمز الخطأ
   */
  protected extractErrorCode(error: unknown): string {
    if (error instanceof GuardError) {
      return error.code || "GUARD_ERROR";
    }
    if (error instanceof Error && "code" in error) {
      return String((error as Record<string, unknown>).code);
    }
    return "UNKNOWN_ERROR";
  }

  /**
   * توليد معرف فريد
   */
  protected generateId(): string {
    return `${this.guardName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * توليد معرف تتبع
   */
  protected generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * انتظار (للتأخير)
   */
  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * تنفيذ دالة مع timeout
   */
  protected async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string = "Operation timed out",
  ): Promise<T> {
    const timeoutPromise = new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs),
    );

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * تشغيل عمليات متوازية بحد أقصى للتزامن
   */
  protected async runInParallel<T>(
    items: T[],
    fn: (item: T) => Promise<void>,
    concurrency: number = 5,
  ): Promise<void> {
    const queue = [...items];
    const promises: Promise<void>[] = [];

    while (queue.length > 0 || promises.length > 0) {
      while (promises.length < concurrency && queue.length > 0) {
        const item = queue.shift();
        if (item !== undefined) {
          promises.push(
            fn(item).catch((error) => {
              this.addErrorMessage(`Parallel execution error: ${String(error)}`);
            }),
          );
        }
      }

      if (promises.length > 0) {
        await Promise.race(promises);
        promises.splice(
          promises.findIndex((p) => p instanceof Promise && p.then),
          1,
        );
      }
    }
  }
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * التحقق من أن الكائن هو GuardResult
 */
export function isGuardResult(value: unknown): value is GuardResult {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;
  return (
    typeof obj.name === "string" &&
    typeof obj.status === "string" &&
    typeof obj.ok === "boolean" &&
    Array.isArray(obj.messages) &&
    Array.isArray(obj.issues) &&
    typeof obj.performance === "object"
  );
}

/**
 * التحقق من أن القيمة هي Issue
 */
export function isIssue(value: unknown): value is Issue {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;
  return (
    typeof obj.id === "string" &&
    typeof obj.title === "string" &&
    typeof obj.description === "string" &&
    typeof obj.severity === "string"
  );
}
