// src/utils/font-validator.ts

/**
 * حارس تدقيق الأصول الثابتة بداخل ملفات الـ HTML
 * يكتشف استدعاءات الخطوط والأيقونات الخارجية التي تضر بمؤشرات الأداء والـ Core Web Vitals
 */
export function auditHtmlFontLoading(htmlContent: string): { isValid: boolean; reason?: string } {
  // تفحص روابط الخطوط الخارجية (مثل قوقل فونتس) المستدعاة بشكل مباشر
  const fontRegex = /fonts\.googleapis\.com\/css\?family=([^"']+)/;
  const match = htmlContent.match(fontRegex);
  
  if (match) {
    const fontParams = match[1];
    // فصل عائلات الخطوط المستدعاة لمعرفة عددها
    const fontFamilies = fontParams.split('|');
    
    // إذا استدعى المطور أكثر من عائلتين من الخطوط في طلب واحد، نطلق تحذيراً للأداء
    if (fontFamilies.length > 2) {
      return {
        isValid: false,
        reason: `🚨 [Muraqib Font Guard Failure]: Found ${fontFamilies.length} external font families loaded via a single blocking request. This triggers high Render-Blocking and damages Cumulative Layout Shift (CLS). Optimize by hosting fonts locally.`,
      };
    }
  }

  return { isValid: true };
}