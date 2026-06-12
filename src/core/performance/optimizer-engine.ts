export const auditPerformance = (resourceCount: number, protocol: string, cookiesSize: number) => {
  const findings = [];

  if (cookiesSize > 2 * 1024) { 
    findings.push("تحذير: حجم الكوكيز يتجاوز 2KB. كل طلب سيتم تحميله ببيانات غير ضرورية.");
  }

  if (protocol === 'HTTP/2') {
    findings.push("ملاحظة: أنتِ تستخدمين HTTP/2. تأكدي من إزالة الـ Domain Sharding والـ Bundle-ing غير الضروري.");
  } else {
    findings.push("تنبيه: أنتِ على بروتوكول قديم (HTTP/1.x). قد تحتاجين لدمج الملفات (Concatenation) للالتفاف على القيود.");
  }

  return findings;
};
