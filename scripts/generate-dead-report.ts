import fs from 'fs';
import path from 'path';
import { performDeadCodeAudit } from '../src/rules/dead-code-guard.js';

function run() {
  const res = performDeadCodeAudit(process.cwd());
  const outPath = path.join(process.cwd(), `dead-code-report-${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(res, null, 2), 'utf-8');
  console.log('Saved dead-code report to', outPath);
}

run();
