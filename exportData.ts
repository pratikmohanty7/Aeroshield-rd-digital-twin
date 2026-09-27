import { AuditLogEntry, TestSession } from '../types/session';
import { EvidenceRecord, ValidationTestCase } from '../types/validation';

export function exportToJsonFile(data: unknown, filename: string): void {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportLogsToCsv(logs: AuditLogEntry[], filename: string = 'aeroshield_audit_logs.csv'): void {
  const headers = ['Timestamp', 'SessionId', 'TestId', 'Module', 'Severity', 'EventType', 'Message', 'StateBefore', 'StateAfter', 'EvidenceId'];
  const rows = logs.map((log) => [
    new Date(log.timestamp).toISOString(),
    `"${log.sessionId || ''}"`,
    `"${log.testId || ''}"`,
    `"${log.module}"`,
    `"${log.severity}"`,
    `"${log.eventType}"`,
    `"${log.message.replace(/"/g, '""')}"`,
    `"${log.stateBefore || ''}"`,
    `"${log.stateAfter || ''}"`,
    `"${log.evidenceId || ''}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', url);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  URL.revokeObjectURL(url);
}

export function exportValidationToCsv(
  tests: ValidationTestCase[],
  evidence: EvidenceRecord[],
  filename: string = 'aeroshield_validation_matrix.csv'
): void {
  const headers = ['TestId', 'Name', 'Category', 'Status', 'InputCondition', 'ExpectedResult', 'ObservedResult', 'EvidenceId', 'Hash'];
  const rows = tests.map((t) => {
    const ev = evidence.find((e) => e.testId === t.testId);
    return [
      `"${t.testId}"`,
      `"${t.name.replace(/"/g, '""')}"`,
      `"${t.category}"`,
      `"${t.status}"`,
      `"${t.inputCondition.replace(/"/g, '""')}"`,
      `"${t.expectedResult.replace(/"/g, '""')}"`,
      `"${t.observedResult.replace(/"/g, '""')}"`,
      `"${t.evidenceId || ''}"`,
      `"${ev?.hash || 'N/A'}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', url);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  URL.revokeObjectURL(url);
}

export function exportFullSessionReport(session: TestSession, logs: AuditLogEntry[], evidence: EvidenceRecord[], tests: ValidationTestCase[]): void {
  const payload = {
    metadata: {
      platform: 'AeroShield R&D Simulation & Digital Twin',
      type: 'NON-OPERATIONAL ACADEMIC / SIH RESEARCH EVIDENCE RECORD',
      exportTimestamp: new Date().toISOString(),
    },
    session,
    validationSummary: {
      totalTests: tests.length,
      passed: tests.filter((t) => t.status === 'SIMULATED PASS').length,
      failed: tests.filter((t) => t.status === 'SIMULATED FAIL').length,
      pending: tests.filter((t) => t.status === 'PENDING').length,
    },
    validationMatrix: tests,
    evidenceRecords: evidence,
    auditTrail: logs,
  };

  exportToJsonFile(payload, `aeroshield_session_${session.sessionId}_evidence_report.json`);
}
