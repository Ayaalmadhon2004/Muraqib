// src/utils/font-validator.ts

export function auditHtmlFontLoading(htmlContent: string): { isValid: boolean; reason?: string } {
  const fontRegex = /fonts\.googleapis\.com\/css\?family=([^"']+)/;
  const match = htmlContent.match(fontRegex); 
  
  if (match) {
    const fontParams = match[1];
    const fontFamilies = fontParams.split('|');
    
    if (fontFamilies.length > 2) { 
      return {
        isValid: false,
        reason: `🚨 [Muraqib Font Guard Failure]: Found ${fontFamilies.length} external font families loaded via a single blocking request. This triggers high Render-Blocking and damages Cumulative Layout Shift (CLS). Optimize by hosting fonts locally.`,
      };
    }
  }

  return { isValid: true };
}