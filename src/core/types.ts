/**
 * @file src/core/types.ts
 * @description توحيد جميع الأنواع والواجهات الأساسية للمشروع
 * - Issue: تمثيل موحد للمشاكل
 * - GuardResult: نتيجة تشغيل Guard واحد
 * - AuditContext: السياق العام للتدقيق
 * - Severity: مستويات الخطورة
 */

import { z } from "zod";

// ============================================================================
// SCHEMA & OPTIONS
// ============================================================================

export type GuardSchema = Record<string, z.ZodTypeAny>;

export interface GuardOptions {
  runtimeEnv: Record<string, string | undefined>;
  isServer: boolean;
  emptyStringAsUndefined: boolean;
}

// ============================================================================
// SEVERITY & STATUS
// ============================================================================

export enum Severity {
  /**
   * معلومات عامة (لا تتطلب إجراء)
   */
  INFO = "info",
  /**
   * تحذير (قد يحتاج إلى نظر)
   */
  WARNING = "warning",
  /**
   * خطأ (يجب معالجته)
   */
  ERROR = "error",
  /**
   * خطر حرج (يتطلب إجراء فوري)
   */
  CRITICAL = "critical",
}

export type SeverityLevel = Severity | keyof typeof Severity;

export enum AuditStatus {
  OK = "ok",
  ISSUES = "issues",
  WARNING = "warning",
  FAILED = "failed",
}

// ============================================================================
// ISSUE & FINDING
// ============================================================================

/**
 * واجهة موحدة لتمثيل مشكلة واحدة
 */
export interface Issue {
  /**
   * معرف فريد للمشكلة
   */
  id: string;

  /**
   * عنوان المشكلة
   */
  title: string;

  /**
   * وصف مفصل للمشكلة
   */
  description: string;

  /**
   * مستوى الخطورة
   */
  severity: Severity;

  /**
   * المسار أو الموقع (ملف، سطر، إلخ)
   */
  location?: string;

  /**
   * رقم السطر (اختياري)
   */
  line?: number;

  /**
   * رقم العمود (اختياري)
   */
  column?: number;

  /**
   * الحل المقترح
   */
  suggestion?: string;

  /**
   * الفئة (security, performance, config, etc)
   */
  category?: string;

  /**
   * بيانات إضافية (خاصة بكل Guard)
   */
  metadata?: Record<string, unknown>;

  /**
   * الوقت الذي تم اكتشاف المشكلة فيه
   */
  timestamp?: Date;
}

/**
 * واجهة موحدة للنتائج المكتشفة
 */
export interface Finding {
  issues: Issue[];
  totalCount: number;
  criticalCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
}

// ============================================================================
// GUARD RESULT & PERFORMANCE
// ============================================================================

/**
 * قياسات الأداء لـ Guard واحد
 */
export interface PerformanceMetrics {
  /**
   * الوقت المستغرق (ملي ثانية)
   */
  duration: number;

  /**
   * الوقت بالطابع الزمني
   */
  timestamp: Date;

  /**
   * استهلاك الذاكرة (MB)
   */
  memoryDelta?: number;

  /**
   * عدد العمليات أو الملفات المسحوبة
   */
  itemsProcessed?: number;

  /**
   * معدل المعالجة (item/ms)
   */
  throughput?: number;
}

/**
 * نتيجة تشغيل Guard واحد بصيغة موحدة
 */
export interface GuardResult {
  /**
   * اسم Guard (مثل memory-guard, security-guard)
   */
  name: string;

  /**
   * حالة التنفيذ
   */
  status: AuditStatus;

  /**
   * هل النتيجة ناجحة؟
   */
  ok: boolean;

  /**
   * رسائل الأخطاء والتحذيرات
   */
  messages: string[];

  /**
   * قائمة المشاكل المكتشفة
   */
  issues: Issue[];

  /**
   * الملخص الإجمالي
   */
  summary?: string;

  /**
   * قياسات الأداء
   */
  performance: PerformanceMetrics;

  /**
   * هل تم تخطي Guard هذا؟
   */
  skipped?: boolean;

  /**
   * رسالة التخطي (إذا كان)
   */
  skipReason?: string;

  /**
   * البيانات الإضافية
   */
  metadata?: Record<string, unknown>;

  /**
   * معرف تتبع
   */
  traceId?: string;
}

// ============================================================================
// AUDIT CONTEXT
// ============================================================================

/**
 * سياق التدقيق الذي يتم تمريره لكل Guard
 */
export interface AuditContext {
  /**
   * المسار الذي يتم تدقيقه
   */
  targetPath: string;

  /**
   * معرف فريد للتدقيق
   */
  auditId: string;

  /**
   * وقت بدء التدقيق
   */
  startTime: Date;

  /**
   * متغيرات البيئة
   */
  env: Record<string, string | undefined>;

  /**
   * الخيارات المخصصة
   */
  options: Record<string, unknown>;

  /**
   * هل نحن في بيئة الخادم؟
   */
  isServer: boolean;

  /**
   * عمق البحث (للملفات المتداخلة)
   */
  maxDepth?: number;

  /**
   * النسخة المشروع
   */
  projectVersion?: string;

  /**
   * معلومات Node.js
   */
  nodeVersion: string;

  /**
   * المنصة
   */
  platform: NodeJS.Platform;

  /**
   * معرف العملية
   */
  processId: number;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * خطأ Guard قياسي
 */
export class GuardError extends Error {
  constructor(
    public guardName: string,
    message: string,
    public code?: string,
    public metadata?: Record<string, unknown>,
  ) {
    super(`[${guardName}] ${message}`);
    this.name = "GuardError";
  }
}

// ============================================================================
// AGGREGATED RESULTS
// ============================================================================

/**
 * نتيجة التدقيق الكاملة (جميع Guards)
 */
export interface AuditResult {
  /**
   * معرف التدقيق
   */
  auditId: string;

  /**
   * الحالة الإجمالية
   */
  status: AuditStatus;

  /**
   * نتائج جميع Guards
   */
  guards: GuardResult[];

  /**
   * المشاكل المجمعة
   */
  findings: Finding;

  /**
   * وقت البدء
   */
  startTime: Date;

  /**
   * وقت النهاية
   */
  endTime: Date;

  /**
   * الوقت الإجمالي (ملي ثانية)
   */
  totalDuration: number;

  /**
   * ملخص شامل
   */
  summary: string;

  /**
   * نسبة النجاح (%)
   */
  successRate: number;

  /**
   * معلومات إضافية
   */
  metadata?: Record<string, unknown>;
}