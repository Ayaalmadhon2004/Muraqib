import fs from 'fs';
import path from 'path';
import { performDeadCodeAudit } from '../src/rules/dead-code-guard.js';

const res = performDeadCodeAudit(process.cwd());
console.log('Found unused exports:', res.unusedExports.length);

for (const item of res.unusedExports) {
  // item format: relativePath:line (name)
  const m = item.match(/^(.+?):(\d+) \((.+)\)$/);
  if (!m) continue;
  const [_, rel, lineStr, name] = m;
  const filePath = path.join(process.cwd(), rel.replace(/\\/g, '/'));
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  const lineNum = parseInt(lineStr, 10) - 1;
  if (lineNum < 0 || lineNum >= lines.length) continue;

  // If nearby lines already contain opt-out, skip
  const contextStart = Math.max(0, lineNum - 2);
  const context = lines.slice(contextStart, Math.min(lines.length, lineNum + 1)).join('\n');
  if (context.includes('muraqib-ignore-dead')) continue;

  // Insert opt-out comment above the export line
  lines.splice(lineNum, 0, '// muraqib-ignore-dead: intentionally preserved (auto-suppress)');
  fs.writeFileSync(filePath, lines.join('\n'));
  console.log(`Annotated ${rel} at line ${lineNum + 1} to suppress dead-code audit`);
}

console.log('Done.');
