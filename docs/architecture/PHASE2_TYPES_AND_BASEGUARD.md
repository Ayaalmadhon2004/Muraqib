# 📐 Phase 2 - الأنواع الموحدة وفئة الأساس

**التاريخ**: 2026-10-09  
**المرحلة**: Phase 2 - Step 1 (أساس معماري)  
**الالتزام**: `4884ef5`  
**الحالة**: ✅ اكتمل بنجاح

---

## 🎯 الهدف

إنشاء أساس معماري موحد لجميع Guards:
1. **Unified Types** - أنواع وواجهات مركزية
2. **BaseGuard Class** - فئة أساس معمارية مع وظائف مشتركة

---

## 📄 الملفات المنشأة/المحدثة

### 1. **src/core/types.ts** - توحيد الأنواع (366 سطر)

#### المحتوى:

```typescript
// SCHEMA & OPTIONS
export type GuardSchema = Record<string, z.ZodTypeAny>;
export interface GuardOptions { ... }

// SEVERITY & STATUS
export enum Severity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}
export enum AuditStatus {
  OK = "ok",
  ISSUES = "issues",
  WARNING = "warning",
  FAILED = "failed",
}

// ISSUE & FINDING
export interface Issue { ... }        // تمثيل موحد للمشكلة
export interface Finding { ... }      // تجميع المشاكل

// GUARD RESULT & PERFORMANCE
export interface PerformanceMetrics { ... }  // قياسات الأداء
export interface GuardResult { ... }         // نتيجة Guard واحد

// AUDIT CONTEXT
export interface AuditContext { ... }        // سياق التدقيق

// ERROR HANDLING
export class GuardError extends Error { ... }

// AGGREGATED RESULTS
export interface AuditResult { ... }         // النتيجة النهائية
```

#### الواجهات الرئيسية:

##### **Severity** - مستويات الخطورة
```typescript
enum Severity {
  INFO      // معلومات عامة
  WARNING   // تحذير
  ERROR     // خطأ
  CRITICAL  // خطر حرج
}
```

##### **Issue** - مشكلة واحدة
```typescript
interface Issue {
  id: string              // معرف فريد
  title: string           // العنوان
  description: string     // الوصف
  severity: Severity      // مستوى الخطورة
  location?: string       // المسار
  line?: number          // رقم السطر
  column?: number        // رقم العمود
  suggestion?: string     // الحل المقترح
  category?: string       // الفئة
  metadata?: Record<...>  // بيانات إضافية
  timestamp?: Date        // وقت الاكتشاف
}
```

##### **GuardResult** - نتيجة Guard واحد
```typescript
interface GuardResult {
  name: string            // اسم Guard
  status: AuditStatus     // حالة النتيجة
  ok: boolean             // نجاح/فشل
  messages: string[]      // الرسائل
  issues: Issue[]         // المشاكل المكتشفة
  summary?: string        // الملخص
  performance: PerformanceMetrics  // قياسات الأداء
  skipped?: boolean       // تم التخطي؟
  skipReason?: string     // السبب
  metadata?: Record<...>  // بيانات إضافية
  traceId?: string        // معرف التتبع
}
```

##### **AuditContext** - سياق التدقيق
```typescript
interface AuditContext {
  targetPath: string              // المسار المراد تدقيقه
  auditId: string                 // معرف التدقيق
  startTime: Date                 // الوقت
  env: Record<...>                // البيئة
  options: Record<...>            // الخيارات
  isServer: boolean               // بيئة الخادم؟
  maxDepth?: number               // عمق البحث
  projectVersion?: string         // نسخة المشروع
  nodeVersion: string             // نسخة Node
  platform: NodeJS.Platform       // المنصة
  processId: number               // معرف العملية
}
```

##### **PerformanceMetrics** - قياسات الأداء
```typescript
interface PerformanceMetrics {
  duration: number        // الوقت المستغرق (ms)
  timestamp: Date         // الوقت
  memoryDelta?: number    // تغير الذاكرة (MB)
  itemsProcessed?: number // عدد العناصر
  throughput?: number     // معدل المعالجة
}
```

---

### 2. **src/core/base-guard.ts** - فئة الأساس (400+ سطر)

#### الهيكل:

```typescript
export abstract class BaseGuard {
  // ============ خصائص الفئة ============
  protected abstract guardName: string;
  protected maxRetries: number = 3;
  protected baseDelay: number = 100;
  protected context?: AuditContext;
  protected issues: Issue[] = [];
  protected messages: string[] = [];
  protected traceId: string;

  // ============ المنطق الأساسي ============
  abstract execute(context: AuditContext): Promise<void>;
  async run(context: AuditContext): Promise<GuardResult> { ... }
  protected async executeWithRetry(context: AuditContext): Promise<void> { ... }
  protected handleError(error: unknown, startTime: number): GuardResult { ... }

  // ============ تدرج دالة execute ============
  // BaseGuard.run()
  //   ├─ قياس الأداء
  //   ├─ executeWithRetry()
  //   │   ├─ محاولة 1: execute()
  //   │   ├─ محاولة 2: execute() (بعد تأخير)
  //   │   └─ محاولة 3: execute() (بعد تأخير أطول)
  //   ├─ جمع النتائج
  //   └─ إرجاع GuardResult مكتمل
}
```

#### الميزات الرئيسية:

##### 1. **قياس الأداء الموحد**
```typescript
async run(context: AuditContext): Promise<GuardResult> {
  const startTime = Date.now();
  const memoryBefore = this.getMemoryUsage();
  
  // تنفيذ...
  
  const endTime = Date.now();
  const memoryAfter = this.getMemoryUsage();
  
  return {
    // ... نتائج أخرى
    performance: {
      duration: endTime - startTime,
      timestamp: new Date(),
      memoryDelta: memoryAfter - memoryBefore,
      itemsProcessed: this.getItemsProcessed(),
    },
  };
}
```

##### 2. **إعادة محاولة تلقائية مع Exponential Backoff**
```typescript
protected async executeWithRetry(context: AuditContext): Promise<void> {
  for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
    try {
      await this.execute(context);
      return;
    } catch (error) {
      if (attempt < this.maxRetries) {
        // exponential backoff: 100ms → 200ms → 400ms
        const delay = this.baseDelay * Math.pow(2, attempt - 1);
        await this.delay(delay);
      }
    }
  }
  throw new GuardError(...);
}
```

##### 3. **معالجة مركزية وآمنة للأخطاء**
```typescript
protected handleError(error: unknown, startTime: number): GuardResult {
  const errorMessage = this.extractErrorMessage(error);
  const errorCode = this.extractErrorCode(error);
  
  this.addIssue({
    id: `error-${this.traceId}`,
    title: `${this.guardName} Execution Failed`,
    description: errorMessage,
    severity: Severity.CRITICAL,
  });
  
  return {
    name: this.guardName,
    status: AuditStatus.FAILED,
    ok: false,
    messages: [...this.messages, `FATAL: ${errorMessage}`],
    issues: this.issues,
    // ... بيانات أخرى
  };
}
```

#### دوال مساعدة لإنشاء المشاكل:

```typescript
// إضافة مشاكل بأنواع مختلفة
protected addIssue(issue: Partial<Issue>): void { ... }
protected addWarning(title: string, description: string, suggestion?: string): void { ... }
protected addError(title: string, description: string, suggestion?: string): void { ... }
protected addCritical(title: string, description: string, suggestion?: string): void { ... }
protected addInfo(title: string, description: string): void { ... }

// إضافة رسائل
protected addMessage(message: string): void { ... }
protected addSuccessMessage(message: string): void { ... }
protected addWarningMessage(message: string): void { ... }
protected addErrorMessage(message: string): void { ... }
```

#### دوال الأداء:

```typescript
// قياس الأداء
protected getMemoryUsage(): number { ... }
protected async measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> { ... }

// التحكم بالتزامن
protected async runInParallel<T>(
  items: T[],
  fn: (item: T) => Promise<void>,
  concurrency: number = 5,
): Promise<void> { ... }

// مع timeout
protected async withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage?: string,
): Promise<T> { ... }
```

#### دوال الأدوات:

```typescript
// تحديد الحالة النهائية
protected determineStatus(): AuditStatus { ... }

// إنشاء ملخص تلقائي
protected generateSummary(): string { ... }

// توليد معرفات فريدة
protected generateId(): string { ... }
protected generateTraceId(): string { ... }

// تأخير وانتظار
protected delay(ms: number): Promise<void> { ... }
```

#### Type Guards:

```typescript
// التحقق من الأنواع
export function isGuardResult(value: unknown): value is GuardResult { ... }
export function isIssue(value: unknown): value is Issue { ... }
```

---

## 🔄 كيفية الاستخدام

### مثال: Guard بسيط يرث من BaseGuard

```typescript
import { BaseGuard } from "./base-guard.js";
import type { AuditContext } from "./types.js";
import { Severity } from "./types.js";

export class MyGuard extends BaseGuard {
  protected guardName = "my-guard";

  async execute(context: AuditContext): Promise<void> {
    this.addSuccessMessage("Starting guard execution");

    try {
      // منطق Guard هنا
      const result = await this.measureTime(async () => {
        return await someAsyncOperation();
      });

      if (result.result.hasIssues) {
        this.addError("Found configuration issues", result.result.message);
      } else {
        this.addSuccessMessage(`Completed in ${result.duration}ms`);
      }
    } catch (error) {
      // سيتم التقاطها تلقائياً من قبل run()
      throw error;
    }
  }
}

// الاستخدام:
const guard = new MyGuard();
const result = await guard.run(auditContext);
console.log(result.summary);  // ✓ my-guard: No issues found
console.log(result.performance.duration);  // 125ms
```

---

## 📊 الإحصائيات

| المقياس | الرقم |
|--------|-------|
| أسطر types.ts | 366 |
| أسطر base-guard.ts | 400+ |
| الواجهات الجديدة | 10+ |
| Enums | 2 (Severity, AuditStatus) |
| دوال مساعدة | 25+ |
| Type Guards | 2 |
| الاختبارات المارة | 73 ✓ |
| تغطية البناء | 100% ✓ |

---

## ✅ قائمة التحقق

### الإنجاز:
- [x] توسيع types.ts بـ 10+ واجهات
- [x] إنشاء BaseGuard مع run() method
- [x] تنفيذ retry logic مع exponential backoff
- [x] معالجة أخطاء مركزية وآمنة
- [x] دوال مساعدة لإنشاء المشاكل
- [x] قياس أداء موحد
- [x] Type guards للتحقق
- [x] جميع الاختبارات تمرة
- [x] TypeScript strict mode
- [x] exactOptionalPropertyTypes compliance

### النتيجة:
- ✅ البناء نجح بدون أخطاء
- ✅ جميع الاختبارات تمرة (73/73)
- ✅ معمارية قوية وموحدة
- ✅ جاهز للـ Guards المشتقة

---

## 🚀 الخطوة التالية

### Phase 2 - Step 2: نقل Guards الموجودة
```
1. تحويل memory-guard إلى BaseGuard
2. تحويل security-guard إلى BaseGuard
3. تحويل dependency-guard إلى BaseGuard
4. تحويل async-guard إلى BaseGuard
5. اختبارات التوافقية
```

---

## 📝 ملاحظات مهمة

### 1. **exactOptionalPropertyTypes**
المشروع يستخدم `exactOptionalPropertyTypes: true` في tsconfig.json  
هذا يعني أن القيم الاختيارية يجب أن تكون صريحة (`undefined`)

```typescript
// ❌ خطأ - linting issue
const issue: Partial<Issue> = {
  title,
  suggestion,  // undefined إذا لم تُعرَّف
};

// ✅ صحيح
const issue: Partial<Issue> = {
  title,
};
if (suggestion !== undefined) {
  issue.suggestion = suggestion;
}
```

### 2. **معرف التتبع (Trace ID)**
كل Guard instance يحصل على معرف فريد للتتبع:
```typescript
this.traceId = "trace-1728476456789-a1b2c3d4e"
```

### 3. **Exponential Backoff**
الفترات بين المحاولات تتضاعف تلقائياً:
```
محاولة 1: فشل
  ↓ (انتظار 100ms)
محاولة 2: فشل
  ↓ (انتظار 200ms)
محاولة 3: فشل
  ↓ إرجاع GuardError
```

---

## 🔗 المراجع

- `src/core/types.ts` - الأنواع الموحدة
- `src/core/base-guard.ts` - فئة الأساس
- `src/core/memory-guard.ts` - مثال على Guard موجود
- `CLAUDE.md` - التعليمات المشروع

---

**الحالة**: ✅ Phase 2 - Step 1 اكتمل بنجاح

**الالتزام الأخير**: `4884ef5`  
**التاريخ**: 2026-10-09  
**الاختبارات**: 73/73 ✓
