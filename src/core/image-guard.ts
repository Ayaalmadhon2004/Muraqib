// src/core/image-guard.ts
import fs from 'fs';
import path from 'path';

/**
 * مصد وحارس حجم الصور (Image Size Guard Middleware)
 * يعترض طلبات الأصول الثابتة بداخل بيئة الـ Staging/Dev لضمان عدم تمرير صور غير مضغوطة
 */
export function createMuraqibImageGuard(staticAssetsDirectory: string) {
  return (req: any, res: any, next: any) => {
    // فحص إذا كان الطلب يستهدف ملف صورة
    if (req.url.match(/\.(jpg|jpeg|png|gif|svg)$/i)) {
      const fullImagePath = path.join(staticAssetsDirectory, req.url);
      
      // التحقق من وجود الملف برمجياً على القرص
      if (fs.existsSync(fullImagePath)) {
        const fileStats = fs.statSync(fullImagePath);
        const fileSizeInMB = fileStats.size / (1024 * 1024);
        
        // حد الأمان لـ "مُراقب": 1 ميجابايت كحد أقصى للصور غير المحسنة في الـ Web
        if (fileSizeInMB > 1.0) {
          console.warn(`\n⚠️  [Muraqib Image Quality Warning]: Performance Leak Detected!`);
          console.warn(`   File: [${req.url}] is oversized -> (${fileSizeInMB.toFixed(2)} MB).`);
          console.warn(`   Impact: This will downgrade Largest Contentful Paint (LCP) inside Staging environment.`);
          console.warn(`   Resolution: Run an image compression pipeline or convert to modern format (.webp).\n`);
        }
      }
    }
    next();
  };
}