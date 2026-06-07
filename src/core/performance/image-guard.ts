import fs from 'fs';
import path from 'path';
import { Request, Response, NextFunction } from 'express';

export const muraqibImageGuard = (staticDir: string) => 
  (req: Request, res: Response, next: NextFunction) => {
    if (req.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      const fullPath = path.join(staticDir, req.url);
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        if (stats.size > 1024 * 1024) {
          console.warn(`⚠️ [Performance]: Oversized asset detected: ${req.url} (${(stats.size/1024/1024).toFixed(2)} MB)`);
        }
      }
    }
    next();
  };