export const checkBundleBudget = (totalBytes: number) => {
  const LIMIT_KB = 14; 
  const isOverLimit = (totalBytes / 1024) > LIMIT_KB;

  return {
    isOverLimit,
    message: isOverLimit 
      ? `تحذير: حجم الصفحة يتجاوز 14KB. هذا سيسبب رحلة إضافية (Round Trip) قبل أن يتمكن المتصفح من الرندرة.`
      : 'ممتاز: الصفحة ضمن حدود الـ TCP Congestion Window.'
  };
};
