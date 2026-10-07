export interface AuditIssue {
  code: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  details?: Record<string, unknown> | undefined;
}

export interface AuditResultBase {
  status: 'ok' | 'issues' | 'error';
  issues: AuditIssue[];
  message?: string | undefined;
}

export abstract class AuditGuard {
  protected name: string;

  constructor(name: string) {
    this.name = name;
  }

  protected createIssue(
    code: string,
    severity: 'error' | 'warning' | 'info',
    message: string,
    details?: Record<string, unknown>
  ): AuditIssue {
    return { code, severity, message, details };
  }

  protected createResult(
    status: 'ok' | 'issues' | 'error',
    issues: AuditIssue[] = [],
    message?: string
  ): AuditResultBase {
    return { status, issues, message };
  }

  protected okResult(message?: string): AuditResultBase {
    return this.createResult('ok', [], message);
  }

  protected issuesResult(issues: AuditIssue[], message?: string): AuditResultBase {
    return this.createResult('issues', issues, message);
  }

  protected errorResult(message: string): AuditResultBase {
    return this.createResult('error', [], message);
  }

  protected wrapError(error: unknown): AuditResultBase {
    const message = error instanceof Error ? error.message : String(error);
    return this.errorResult(`${this.name}: ${message}`);
  }

  abstract run(): Promise<AuditResultBase>;
}
