export const analyzeLatency = (requestTimeMs: number, payloadSizeKb: number) => {
  const reports = [];

  if (payloadSizeKb > 14) { // what is payload and from where we have it 
    reports.push('تحذير: حجم الاستجابة الأولى يتجاوز 14KB. هذا سيسبب رحلة إضافية (Round Trip) بناءً على قيود TCP.');
  }

  if (requestTimeMs > 300) { //wbat is the latency here in my code and why 300 ??? and request foe what , for API ? 
    //what do we mean by sluggish 
    reports.push('تنبيه: التأخير يتجاوز 300ms. Interaction أصبح "بطيئاً" (Sluggish) من منظور المستخدم.');
  }

  return {
    isOptimized: reports.length === 0,
    reports
  };
};