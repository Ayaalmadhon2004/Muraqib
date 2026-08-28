export const analyzeHTTP1Compliance = (_res: any, headers: Record<string, string>) => {
  const warnings: string[] = [];

  if (!headers['content-encoding'] || !headers['content-encoding'].includes('gzip')) {
    warnings.push('تحذير: الأصول (Assets) غير مضغوطة بـ Gzip. هذا يضيع 60-80% من كفاءة الحجم.');
  }

  if (!headers['etag'] && !headers['expires']) {
    warnings.push('تحذير: لا توجد آليات إعادة التحقق (ETag/Expires). الموقع لا يستفيد من التخزين المؤقت للمتصفح.');
  }

  return {
    isOptimized: warnings.length === 0,
    warnings
  };
};