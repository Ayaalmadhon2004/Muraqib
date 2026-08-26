import fs from 'fs';
import path from 'path';
import { performDeadCodeAudit } from '../src/rules/dead-code-guard.js';

function annotate() {
  const res = performDeadCodeAudit(process.cwd());
  const items = res.unreachableBranches || [];
  console.log('Found unreachable branches:', items.length);

  for (const it of items) {
    // format: relativePath:line
    const m = it.match(/^(.+?):(\d+)$/);
    if (!m) continue;
    const rel = m[1].replace(/\\/g, '/');
    const lineNum = parseInt(m[2], 10);
    const filePath = path.join(process.cwd(), rel);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\\r?\\n/);
    const idx = Math.max(0, Math.min(lines.length - 1, lineNum - 1));

    // Insert a non-destructive comment marker above the unreachable line if not already present
    const marker = '// muraqib-unreachable: flagged by automated triage. Review before removal.';
    const contextWindow = lines.slice(Math.max(0, idx - 2), Math.min(lines.length, idx + 2)).join('\n');
    if (contextWindow.includes('muraqib-unreachable')) {
      console.log(`Already annotated: ${rel}:${lineNum}`);
      continue;
    }

    lines.splice(idx, 0, marker);
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    console.log(`Annotated ${rel} at line ${lineNum}`);
  }
}

annotate();
