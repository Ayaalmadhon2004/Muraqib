export const analyzeRenderBlocking = (htmlContent: string) => { // muraqib-ignore-dead: auto-suppressed by script for analyzeRenderBlocking
  const headMatch = htmlContent.match(/<head>[\s\S]*?<\/head>/i);
  
  if (!headMatch) return { status: 'ok', isOptimized: true, blockingScripts: 0, blockingStyles: 0, message: 'لم يتم العثور على <head>' };

  const headContent = headMatch[0];
  const blockingScripts = (headContent.match(/<script(?!\s+(?:defer|async))[^>]*>/gi) || []).length;
  const blockingStyles = (headContent.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi) || []).length;

  const isOptimized = blockingScripts === 0;
  const message = blockingScripts > 0
    ? `تحذير: لديك ${blockingScripts} سكريبتات تحجب الرندرة في الـ head!`
    : 'ممتاز، لا توجد سكريبتات تحجب الرندرة في الـ head.';

  return {
    status: isOptimized ? 'ok' : 'issues',
    blockingScripts,
    blockingStyles,
    isOptimized,
    message,
  };
};
