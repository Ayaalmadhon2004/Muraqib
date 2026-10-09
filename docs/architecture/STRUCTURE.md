# 📦 Muraqib Core v2.0 - البنية الهندسية الموحدة

**التاريخ**: 2026-10-09  
**الحالة**: ✅ البنية الهندسية متكاملة  
**المرحلة**: Phase 1 - إعداد الأساس

---

## 🏗️ مخطط البنية الكاملة

```
Muraqib Core v2.0/
│
├── 📂 src/                          # كود المصدر الرئيسي
│   │
│   ├── 📂 core/                     # المكتبة الأساسية
│   │   ├── guards/                  # وحدات المراقبة (Memory, Security, Deps, Async)
│   │   ├── performance/             # تحليل الأداء (Auditor, Image, Bundle)
│   │   └── helpers/                 # دوال المساعدة المشتركة
│   │
│   ├── 📂 modules/                  # الوحدات الإضافية (من pre-muraqib)
│   │   ├── telemetry/               # جمع البيانات التلقائية
│   │   ├── reporting/               # إنشاء التقارير المتقدمة
│   │   └── integrations/            # تكاملات خارجية (OSV, AI, etc)
│   │
│   ├── 📂 env/                      # إدارة البيئة والمتغيرات
│   │   └── engine.ts (مخطط)         # محرك التحقق الرئيسي
│   │
│   ├── 📂 cli/                      # واجهة سطر الأوامر
│   │   └── index.ts (مخطط)          # نقطة دخول CLI
│   │
│   ├── 📂 presets/                  # قوالب التحقق الجاهزة
│   │   ├── zod.ts                   # Zod schema presets
│   │   ├── valibot.ts               # Valibot presets
│   │   └── arktype.ts               # ArkType presets
│   │
│   ├── 📂 utils/                    # أدوات عامة
│   │   ├── manager-detector.ts      # كشف package manager
│   │   └── schedule-validator.ts    # التحقق من جداول Cron
│   │
│   ├── 📂 config/                   # ملفات التكوين
│   │   └── presets.ts               # تعريف القوالس
│   │
│   ├── 📂 guard/                    # Guards الأصلية (من Muraqib Core)
│   │   ├── memory-guard.ts
│   │   ├── security-guard.ts
│   │   ├── dependency-guard.ts
│   │   ├── async-guard.ts
│   │   └── config-guard.ts
│   │
│   ├── 📂 orchestrator/             # منظم الحزم (Package Upgrade)
│   │   └── orchestrator.ts
│   │
│   ├── 📂 renderers/                # معالجات الإخراج
│   │   ├── finding-renderer.ts      # عرض النتائج
│   │   ├── summary-renderer.ts      # الملخصات
│   │   ├── json-renderer.ts         # JSON format
│   │   └── ai-renderer.ts           # AI integration
│   │
│   ├── 📂 rules/                    # القواعد والسياسات
│   │   ├── cache-guard.ts
│   │   ├── bundle-budget.ts
│   │   ├── dead-code-guard.ts
│   │   └── http1-advisor.ts
│   │
│   ├── 📂 shared/                   # الملفات المشتركة
│   │   ├── types.ts                 # التعاريف المشتركة
│   │   └── constants.ts             # الثوابت
│   │
│   └── index.ts                     # نقطة الدخول الرئيسية (API)
│
├── 📂 tests/                        # الاختبارات الشاملة
│   ├── unit/                        # اختبارات الوحدات (40+)
│   │   ├── core/
│   │   ├── modules/
│   │   ├── env/
│   │   └── ...
│   │
│   ├── integration/                 # اختبارات التكامل (7+)
│   │   ├── osv-scanner.integration.ts
│   │   ├── remediation.integration.ts
│   │   └── ...
│   │
│   ├── e2e/                         # اختبارات شاملة (3+)
│   │   ├── full-audit.e2e.ts
│   │   └── workflow.e2e.ts
│   │
│   └── fixtures/                    # بيانات الاختبار
│       ├── sample-configs/
│       ├── mock-data/
│       └── test-projects/
│
├── 📂 docs/                         # التوثيق الشامل
│   ├── api/                         # توثيق API
│   │   ├── ENVIRONMENT.md           # متغيرات البيئة
│   │   ├── PRESETS.md               # نظام القوالب
│   │   └── GUARDS.md                # وحدات المراقبة
│   │
│   ├── guides/                      # أدلة الاستخدام
│   │   ├── GETTING_STARTED.md       # البدء السريع
│   │   ├── CLI.md                   # استخدام CLI
│   │   └── INTEGRATION.md           # التكامل مع المشاريع
│   │
│   └── architecture/                # الوثائق المعمارية
│       ├── STRUCTURE.md             # هذا الملف
│       ├── DESIGN.md                # القرارات المعمارية
│       └── MIGRATIONS.md            # هجرات Schema
│
├── 📂 .github/
│   ├── workflows/                   # GitHub Actions
│   │   ├── test.yml                 # اختبار CI
│   │   ├── build.yml                # بناء الإصدار
│   │   └── release.yml              # إطلاق الإصدار
│   │
│   └── ISSUE_TEMPLATE/              # قوالب المشاكل
│
├── 📂 examples/                     # أمثلة تطبيقية
│   └── express-prisma/              # تطبيق عملي كامل
│       ├── src/
│       ├── prisma/
│       └── package.json
│
├── package.json                     # إعدادات المشروع
├── tsconfig.json                    # تكوين TypeScript
├── vitest.config.ts                 # تكوين الاختبارات
├── eslint.config.mjs                # قواعس Linting
├── README.md                        # الملف التعريفي
├── CHANGELOG.md                     # سجل التغييرات
└── LICENSE                          # رخصة المشروع

```

---

## 📋 شرح كل مجموعة

### 🔴 **src/core/** - المكتبة الأساسية
**المسؤول**: Aya (Muraqib Core)  
**المحتوى**: 13+ وحدة تدقيق + أدوات الأداء  
**الملفات الموجودة**:
- `guards/memory-guard.ts` - تحليل الذاكرة
- `guards/security-guard.ts` - الرؤوس الأمنية
- `guards/dependency-guard.ts` - التحليل المتقدم للتبعيات
- `guards/async-guard.ts` - أنماط Async
- `performance/auditor.ts` - تحليل الأداء

**الإجراء التالي**: فحص الملفات الموجودة والتأكد من التوافقية

---

### 🟡 **src/modules/** - الوحدات الجديدة
**المسؤول**: Jenan (pre-muraqib)  
**المحتوى**: OSV Scanner, Remediation, Secret Detection  
**المجلدات المخطط إنشاؤها**:
- `telemetry/` - جمع البيانات الديناميكية
- `reporting/` - تقارير متقدمة
- `integrations/` - تكاملات (OSV, AI, GitHub, Slack)

**الحالة**: جاهز للعمل والإضافة

---

### 🟢 **src/env/** - إدارة البيئة
**من**: كلا المشروعين  
**المسؤول**: Aya (القاعدة) + Jenan (التحسينات)  
**المحتوى**:
- `engine.ts` - محرك التحقق الرئيسي
- Validation engines (Zod, Valibot, ArkType)
- Secret detection والتصفية

**التكامل**: دمج كامل للمحركات الأربعة

---

### 🔵 **src/cli/** - واجهة سطر الأوامر
**من**: pre-muraqib  
**المحتوى**: واجهة تفاعلية احترافية
- أوامر إنتاجية
- أوامر تطوير
- Mode تفاعلي مع @clack/prompts

---

### 🟣 **src/presets/** - قوالب التحقق
**من**: pre-muraqib  
**المحتوى**: 
- Zod schemas للمشاريع الشهيرة
- Valibot schemas
- ArkType schemas
- Custom validators

---

### ⚪ **tests/** - الاختبارات الشاملة
**الهدف**: 50+ اختبار مع تغطية 85%+  
**المنظمة**:
```
unit/          ← 40+ اختبار للوحدات
integration/   ← 7+ اختبار التكامل
e2e/           ← 3+ سيناريوهات شاملة
fixtures/      ← بيانات اختبار واقعية
```

**الحالة**: هيكل جاهز، الملفات تُضاف تدريجياً

---

### 📚 **docs/** - التوثيق
**المسؤول**: كلا الفريقين  
**المحتوى**:
- `/api/` - توثيق API كامل
- `/guides/` - أدلة عملية
- `/architecture/` - القرارات والتصاميم

---

## 🔄 خريطة التدفقات

```
المستخدم
  ↓
CLI (src/cli/index.ts)
  ↓
┌─────────────────────────────────────┐
│ محرك التدقيق الرئيسي               │
├─────────────────────────────────────┤
│  1. التحقق من البيئة (env/)        │
│  2. تشغيل Guards (core/guards/)    │
│  3. تحليل الأداء (core/performance/)│
│  4. Modules إضافية (modules/)       │
│  5. OSV Scanning (modules/...)      │
│  6. Remediation (modules/...)       │
└─────────────────────────────────────┘
  ↓
Renderers (src/renderers/)
  ↓
Output (JSON, HTML, CSV, Text)
```

---

## 📊 الإحصائيات الحالية

| المقياس | الرقم | الحالة |
|--------|-------|--------|
| مجلدات src/ | 12+ | ✅ جاهز |
| مجلدات tests/ | 4 | ✅ جاهز |
| مجلدات docs/ | 3 | ✅ جاهز |
| ملفات TypeScript موجودة | 50+ | ✅ موجود |
| اختبارات موجودة | 40+ | ✅ موجود |
| خطوط الكود (src/) | 5000+ | ✅ موجود |

---

## ✅ قائمة التحقق - البناء الأساسي

### Phase 1: البنية الهندسية ✅
- [x] إنشاء مجلدات src/ الرئيسية
- [x] إنشاء هيكل tests/ الشامل
- [x] إنشاء documentation structure
- [x] إنشاء workflows directory

### Phase 2: نقل الملفات (قادم)
- [ ] نقل Muraqib Core files (guards, orchestrator)
- [ ] نقل pre-muraqib modules (OSV, Remediation)
- [ ] توحيد types والواجهات
- [ ] دمج إعدادات TypeScript

### Phase 3: التكامل (قادم)
- [ ] دمج CLI الموحد
- [ ] دمج Validation Engines
- [ ] دمج Secret Detection
- [ ] دمج Remediation Workflow

### Phase 4: الاختبارات (قادم)
- [ ] كتابة 50+ اختبار
- [ ] تحقيق 85%+ coverage
- [ ] اختبارات integration
- [ ] اختبارات e2e

### Phase 5: التوثيق (قادم)
- [ ] API documentation
- [ ] Usage guides
- [ ] Architecture docs
- [ ] Contributing guide

---

## 🚀 الخطوة التالية

**الآن**: البنية الهندسية جاهزة ✅

**الخطوة التالية** (الخطوة 3):
```
1. فحص الملفات الموجودة في كلا المشروعين
2. نقل ملفات Muraqib Core → src/core/
3. نقل ملفات pre-muraqib → src/modules/
4. توحيد types والواجهات
5. أول اختبارات الدمج
```

---

## 📞 ملاحظات مهمة

1. **عدم الحذف**: لا نحذف أي ملفات موجودة
2. **التدرج**: نضيف الملفات تدريجياً مع الحفاظ على الاستقرار
3. **الاختبارات**: قبل كل دمج، نكتب اختبارات
4. **التوثيق**: نوثق كل تغيير فور إضافته

---

**الحالة**: ✅ البنية الهندسية الموحدة جاهزة للتطوير

**التاريخ**: 2026-10-09  
**المرحلة**: Phase 1 ✅ → الانتقال إلى Phase 2
