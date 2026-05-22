import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getNewEnvValue } from '../muraqib-env.ts';

describe('Muraqib Env Transformation Engine (SemVer Inspired)', () => {
  
  beforeEach(() => {
    // تصفير الكاش وعزل الـ Modules تماماً قبل كل فحص لضمان الدقة
    vi.resetModules();
  });

  it('should successfully REPLACE old secret with the new version', () => {
    const result = getNewEnvValue({
      currentValue: 'postgresql://localhost:5432/old_db',
      newValue: 'postgresql://localhost:5432/new_db',
      updateStrategy: 'replace',
      secretKey: 'DATABASE_URL',
    });

    expect(result).toBe('postgresql://localhost:5432/new_db');
  });

  it('should successfully WIDEN and KEEP BOTH values using keep-both strategy', () => {
    const result = getNewEnvValue({
      currentValue: 'old-api-key-v1',
      newValue: 'new-api-key-v2',
      updateStrategy: 'keep-both',
      secretKey: 'API_KEY',
    });

    expect(result).toBe('"old-api-key-v1" || "new-api-key-v2"');
  });

  it('should successfully MERGE unique comma-separated values without duplication', () => {
    const result = getNewEnvValue({
      currentValue: 'org:read,repo:status',
      newValue: 'repo:status,user:email',
      updateStrategy: 'merge',
      secretKey: 'OAUTH_SCOPES',
    });

    // الـ repo:status مكررة، الدالة ح تدمجهم وتحذف التكرار تلقائياً 👇
    expect(result).toBe('org:read,repo:status,user:email');
  });
});