export type ValidationStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'SIMULATED PASS'
  | 'SIMULATED FAIL'
  | 'NOT TESTED'
  | 'REQUIRES HARDWARE TEST';

export interface ValidationTestCase {
  testId: string; // e.g. 'VT-01', 'VT-02', etc.
  name: string;
  objective: string;
  category: 'SENSOR_QUALITY' | 'FAULT_TOLERANCE' | 'DIAGNOSTICS' | 'RECOVERY' | 'TELEMETRY';
  inputCondition: string;
  expectedResult: string;
  observedResult: string;
  status: ValidationStatus;
  timestamp?: number;
  evidenceId?: string;
  details?: string;
  testFunctionKey: string;
}

export interface TestHistoryItem {
  id: string;
  testId: string;
  name: string;
  runTime: number;
  scenario: string;
  result: ValidationStatus;
  evidenceId: string;
  observed: string;
  expected: string;
}

export interface EvidenceRecord {
  evidenceId: string;
  testId: string;
  sessionId: string;
  simulationId: string;
  timestamp: number;
  inputCondition: string;
  expectedResult: string;
  observedResult: string;
  result: 'SIMULATED PASS' | 'SIMULATED FAIL' | 'INCONCLUSIVE';
  metricsSnapshot: {
    systemHealth: number;
    dataQuality: number;
    activeFaults: number;
    detectionLatencyMs?: number;
  };
  notes: string;
  hash: string; // Deterministic sha-like evidence signature
}
