export type DiagnosticSeverity = 'INFO' | 'NOTICE' | 'WARNING' | 'ERROR' | 'CRITICAL';
export type DiagnosticStatus = 'CLEAR' | 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface DiagnosticEvent {
  id: string;
  timestamp: number;
  module: string;
  severity: DiagnosticSeverity;
  title: string;
  description: string;
  status: DiagnosticStatus;
  faultInjectionTime?: number;
  detectionTime?: number;
  detectionLatencyMs?: number; // Detection latency = detectionTime - faultInjectionTime
  sessionId: string;
  testId?: string;
  recommendedAction?: string;
  rootCauseTrace: string[];
}

export interface ObdsState {
  status: 'NORMAL' | 'WARNING' | 'DEGRADED' | 'FAILED';
  builtInTestStatus: 'PASSED' | 'WARNING' | 'FAILED' | 'RUNNING';
  activeFaultCount: number;
  lastBitTimestamp: number;
  isolationConfidence: number; // e.g., 90%
  subsystemStatuses: Record<string, 'HEALTHY' | 'ANOMALY' | 'ISOLATED' | 'OFFLINE'>;
}
