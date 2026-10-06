# دليل المطورين - Muraqib

## 🎯 بنية المشروع

### الطبقات الثلاث

```
┌─────────────────────────────────────────┐
│         CLI Layer (src/cli/)             │ ← واجهة سطر الأوامر
├─────────────────────────────────────────┤
│   Orchestrator Layer (src/orchestrator/) │ ← منطق التدقيق
├─────────────────────────────────────────┤
│   Renderers Layer (src/renderers/)       │ ← عرض النتائج
├─────────────────────────────────────────┤
│   Shared Layer (src/shared/)             │ ← ثوابت ودوال مشتركة
└─────────────────────────────────────────┘
```

---

## 📂 شرح كل ملف

### `src/shared/constants.ts`
**المسؤولية**: تعريف جميع الثوابت المستخدمة في المشروع

```typescript
export const COLORS = { RED, GREEN, YELLOW, ... }      // ANSI colors
export const DEFAULT_CONFIG = { ... }                   // إعدادات افتراضية
export const CLI_FLAGS = { ... }                        // flags CLI
```

**متى تعدل عليه**:
- إضافة ألوان جديدة
- تغيير الإعدادات الافتراضية
- إضافة flags CLI جديدة

---

### `src/shared/utils.ts`
**المسؤولية**: دوال مساعدة مشتركة

```typescript
export function toMessage(err)              // تحويل الخطأ إلى string
export function extractEnvErrors(err)       // استخراج أخطاء البيئة
export function getArg(args, flag)          // الحصول على قيمة flag
```

**متى تعدل عليه**:
- إضافة دوال مساعدة جديدة مشتركة
- تحسين معالجة الأخطاء

---

### `src/renderers/index.ts`
**المسؤولية**: تنسيق وعرض النتائج

```typescript
export function log(title, status, message)       // طباعة سطر
export function section(name)                     // رأس قسم
export function box(lines)                        // صندوق النتائج
export function renderHeader(targetPath)          // الرأس الرئيسي
export function renderSummary(...)                // ملخص النتائج النهائي
```

**متى تعدل عليه**:
- تغيير تنسيق العرض
- إضافة ألوان جديدة
- تحسين قراءة النتائج

---

### `src/orchestrator/audit.ts`
**المسؤولية**: كل منطق التدقيق

**الواجهات**:
```typescript
export interface AuditOptions { ... }       // خيارات التدقيق
export interface ModuleResult { ... }        // نتيجة module واحد
export interface AuditResult { ... }         // نتيجة كل التدقيق
```

**الدوال**:
```typescript
export function createInitialAuditResult()
export async function runImageAudit(targetPath)
export async function runBundleAudit(targetPath)
export async function runNetworkAudit(latencyUrl)
export async function runMemoryAudit()
export async function runSecurityAudit(securityUrl)
export async function runDeadCodeAudit(targetPath)
export async function runDependencyAudit(targetPath)
export async function runAsyncAudit(targetPath)
export async function runConfigAudit(targetPath)
export async function runEnvAudit(targetPath, options)
export async function runPerformanceAudit()
export async function runOptimizerAudit(targetPath, url)
export async function runRenderBlockingAudit(targetPath)
export async function runUpgradePackages(targetPath)
```

**متى تعدل عليه**:
- إضافة audit module جديد
- تعديل logic التدقيق
- تحسين الأداء

**كيفية إضافة audit جديد**:
```typescript
// 1. أضف الدالة
export async function runMyNewAudit(targetPath: string): Promise<ModuleResult> {
  try {
    // منطقك هنا
    return { ok: true, errors: [] };
  } catch (err) {
    return { ok: false, errors: [toMessage(err)] };
  }
}

// 2. أضف في AuditResult interface
export interface AuditResult {
  // ...
  myNewAudit: ModuleResult;
}

// 3. أضف في workflow.ts
if (!options.skipMyNewAudit) {
  section("🔟 MY NEW AUDIT");
  const audit = await runMyNewAudit(targetPath);
  // ...
}
```

---

### `src/cli/index.ts`
**المسؤولية**: معالجة خيارات CLI

```typescript
export function parseCliArgs(args: string[])   // تحليل الخيارات
export async function run()                    // تشغيل البرنامج
```

**متى تعدل عليه**:
- إضافة خيارات CLI جديدة
- تحسين parsing logic

**كيفية إضافة خيار CLI جديد**:
```typescript
// 1. أضف في constants.ts
export const CLI_FLAGS = {
  // ...
  MY_NEW_FLAG: "--my-new-flag",
};

// 2. أضف في parseCliArgs()
return {
  // ...
  myNewFlag: args.includes(CLI_FLAGS.MY_NEW_FLAG),
};

// 3. أضف في AuditOptions في orchestrator/audit.ts
export interface AuditOptions {
  // ...
  myNewFlag?: boolean;
}
```

---

### `src/cli/workflow.ts`
**المسؤولية**: تدفق العمل الرئيسي

```typescript
export async function runAuditWorkflow(options: AuditOptions): Promise<AuditResult>
```

**ماذا يفعل**:
1. ينشئ نتيجة أولية
2. يشغل كل audit module بناءً على الخيارات
3. يعرض النتائج
4. يعرض ملخص نهائي

**متى تعدل عليه**:
- تغيير ترتيب الـ audits
- تحسين المنطق المشترك

---

### `src/index.ts`
**المسؤولية**: نقطة الدخول الرئيسية

```typescript
export async function runAudit(options): Promise<AuditResult>  // API
// + CLI entry point عند التشغيل المباشر
```

---

## 🔧 كيفية الاستخدام

### كـ API
```typescript
import { runAudit } from "muraqib";

const result = await runAudit({
  targetPath: "./my-app",
  skipNetwork: true,
  latencyUrl: "https://api.example.com"
});

console.log(result.security.score);
```

### كـ CLI
```bash
# تشغيل كل الفحوصات
npx tsx src/index.ts

# مع خيارات
npx tsx src/index.ts --skip-network --path ./my-app --url https://localhost:3000

# صامت (بدون طباعة)
npx tsx src/index.ts --silent
```

---

## 📝 كيفية الاختبار

### اختبار CLI
```bash
# اختبار الفحوصات الأساسية
npx tsx src/index.ts --skip-network --skip-security --silent

# اختبار فحص واحد فقط
npx tsx src/index.ts --skip-network --skip-memory --skip-security --skip-performance --skip-optimizer
```

### اختبار API
```typescript
import { runAudit } from "./dist/index.js";

const result = await runAudit({
  targetPath: process.cwd(),
  silent: true,
  skipNetwork: true
});

console.log(result.images.ok);  // ✅ or ❌
```

---

## 🎯 أفضل الممارسات

### 1. اتبع Pattern في Orchestrator
```typescript
export async function runMyAudit(targetPath: string): Promise<ModuleResult> {
  try {
    // منطقك
    if (hasIssues) {
      return { ok: false, errors: [...] };
    }
    return { ok: true, errors: [] };
  } catch (err) {
    return { ok: false, errors: [toMessage(err)] };
  }
}
```

### 2. استخدم Renderers للطباعة
```typescript
// ✅ صحيح
import { log, section } from "../renderers/index.js";
section("My Audit");
log("Check 1", "pass", "All good");

// ❌ خطأ
console.log("Check 1: pass");
```

### 3. استخدم Constants للثوابت
```typescript
// ✅ صحيح
import { COLORS, DEFAULT_CONFIG } from "../shared/constants.js";

// ❌ خطأ
const RED = "\x1b[31m";
const TIMEOUT = 5000;
```

### 4. استخدم Shared Utils
```typescript
// ✅ صحيح
import { toMessage, extractEnvErrors } from "../shared/utils.js";

// ❌ خطأ
const msg = err instanceof Error ? err.message : String(err);
```

---

## 🚀 الإضافات الممكنة

### 1. إضافة HTTP Client موحد
```typescript
// src/core/http.ts
import axios from "axios";
export const httpClient = axios.create({
  timeout: 5000,
  headers: { "User-Agent": "Muraqib" }
});
```

### 2. إضافة Logging System
```typescript
// src/core/logger.ts
export class Logger {
  debug(msg: string) { }
  info(msg: string) { }
  error(msg: string) { }
}
```

### 3. إضافة Config Management
```typescript
// src/config/index.ts
export interface AuditConfig {
  limits: { image: number; bundle: number; }
  timeouts: { network: number; security: number; }
}
```

---

## ❓ الأسئلة الشائعة

**س: كيف أضيف audit module جديد؟**
ج: انظر قسم "كيفية إضافة audit جديد" أعلاه

**س: كيف أعدل الألوان؟**
ج: عدّل `src/shared/constants.ts` واستخدمها من `src/renderers/index.ts`

**س: هل يمكن استخدام المشروع كمكتبة؟**
ج: نعم! استخدم `runAudit()` كـ API

**س: ماذا لو أضفت audit جديد؟**
ج: أضفه في `orchestrator/audit.ts` وأضف في `workflow.ts`

---

## 📞 للمزيد من المساعدة

اقرأ `REFACTORING_SUMMARY.md` للمزيد من التفاصيل عن التحسينات التي تم إجراؤها.
