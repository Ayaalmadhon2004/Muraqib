// src/core/image-guard.ts
import fs from 'fs';
import path from 'path';

export function createMuraqibImageGuard(staticAssetsDirectory: string) {
  return (req: any, res: any, next: any) => {
    if (req.url.match(/\.(jpg|jpeg|png|gif|svg)$/i)) {
      const fullImagePath = path.join(staticAssetsDirectory, req.url);
      
      if (fs.existsSync(fullImagePath)) {
        const fileStats = fs.statSync(fullImagePath);
        const fileSizeInMB = fileStats.size / (1024 * 1024);
        
        if (fileSizeInMB > 1.0) {
          console.warn(`\n⚠️  [Muraqib Image Quality Warning]: Performance Leak Detected!`);
          console.warn(`   File: [${req.url}] is oversized -> (${fileSizeInMB.toFixed(2)} MB).`);
          console.warn(`   Impact: This will downgrade Largest Contentful Paint (LCP) inside Staging environment.`);
          console.warn(`   Resolution: Run an image compression pipeline or convert to modern format (.webp).\n`);
        }
      }
    }
    next();//why i am putting a next ?
  };
}