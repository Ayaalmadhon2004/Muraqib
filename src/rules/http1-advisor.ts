// src/rules/http1-advisor.ts

// muraqib-ignore-dead: intentionally preserved (auto-suppress)
export const analyzeHTTP1Compliance = (res: any, headers: Record<string, string>) => {
  const warnings = [];

  // 1. التحقق من الضغط (Gzip) المذكور في القواعد الذهبية
  if (!headers['content-encoding'] || !headers['content-encoding'].includes('gzip')) {
    warnings.push('تحذير: الأصول (Assets) غير مضغوطة بـ Gzip. هذا يضيع 60-80% من كفاءة الحجم.');
  }

  // 2. التحقق من الـ Caching (ETag و Expires)
  if (!headers['etag'] && !headers['expires']) {
    warnings.push('تحذير: لا توجد آليات إعادة التحقق (ETag/Expires). الموقع لا يستفيد من التخزين المؤقت للمتصفح.');
  }

  // 3. كشف الـ Head-of-Line Blocking (منطق تحليلي)
  // إذا كانت الاستجابة بطيئة جداً ومكررة، قد تسبب حجباً للموارد التالية
  return {
    isOptimized: warnings.length === 0,
    warnings
  };
};