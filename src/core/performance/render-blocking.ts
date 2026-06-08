// src/core/performance/render-blocking.ts

export const analyzeRenderBlocking = (htmlContent: string) => {
  // فحص السكريبتات التي لا تحتوي على defer أو async في الـ head
  const headMatch = htmlContent.match(/<head>[\s\S]*?<\/head>/i);
  
  if (!headMatch) return { status: 'ok', message: 'لم يتم العثور على <head>' };

  const headContent = headMatch[0];
  const blockingScripts = (headContent.match(/<script(?!\s+(?:defer|async))[^>]*>/gi) || []).length;
  const blockingStyles = (headContent.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi) || []).length;

  return {
    blockingScripts,
    blockingStyles,
    isOptimized: blockingScripts === 0,
    message: blockingScripts > 0 
      ? `تحذير: لديك ${blockingScripts} سكريبتات تحجب الرندرة في الـ head!`
      : 'ممتاز، لا توجد سكريبتات تحجب الرندرة في الـ head.'
  };
};