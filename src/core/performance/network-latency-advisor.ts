// src/core/performance/network-latency-advisor.ts

export const analyzeLatency = (requestTimeMs: number, payloadSizeKb: number) => {
  const reports = [];

  // فكرة الـ Round Trips والـ 14KB المذكورة في الكتاب
  if (payloadSizeKb > 14) {
    reports.push('تحذير: حجم الاستجابة الأولى يتجاوز 14KB. هذا سيسبب رحلة إضافية (Round Trip) بناءً على قيود TCP.');
  }

  // فيزياء المسافة والـ Latency
  if (requestTimeMs > 300) {
    reports.push('تنبيه: التأخير يتجاوز 300ms. Interaction أصبح "بطيئاً" (Sluggish) من منظور المستخدم.');
  }

  return {
    isOptimized: reports.length === 0,
    reports
  };
};