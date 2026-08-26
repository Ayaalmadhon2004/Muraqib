import { existsSync } from 'node:fs';
import { join } from 'node:path';

// muraqib-ignore-dead: intentionally preserved (auto-suppress)
export type PackageManager = 'npm' | 'yarn' | 'pnpm';
export function detectProjectPackageManager(
  basePath: string = process.cwd()
): PackageManager {
  
  const lockFiles: Record<string, PackageManager> = {
    'pnpm-lock.yaml': 'pnpm',
    'yarn.lock': 'yarn',
    'package-lock.json': 'npm',
  };

  for (const [file, manager] of Object.entries(lockFiles)) {
    if (existsSync(join(basePath, file))) {
      return manager;
    }
  }

  return 'npm';
}