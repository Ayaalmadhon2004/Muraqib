import { existsSync } from 'node:fs';
import { join } from 'node:path';
export function detectProjectPackageManager(basePath = process.cwd()) {
    const lockFiles = {
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
//# sourceMappingURL=manager-detector.js.map