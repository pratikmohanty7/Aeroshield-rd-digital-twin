export type SystemStatus = 'NORMAL' | 'WARNING' | 'DEGRADED' | 'FAILED' | 'RECOVERING';

export type EventType =
  | 'SESSION_STARTED'
  | 'SESSION_STOPPED'
  | 'SIMULATION_STARTED'
  | 'SIMULATION_STOPPED'
  | 'FAULT_INJECTED'
  | 'FAULT_DETECTED'
  | 'HEALTH_CHANGED'
  | 'DIAGNOSTIC_CREATED'
  | 'DIGITAL_TWIN_UPDATED'
  | 'VALIDATION_STARTED'
  | 'VALIDATION_COMPLETED'
  | 'VALIDATION_RESET'
  | 'SYSTEM_CHECK_INITIALIZED'
  | 'STAGE_CHECK_FAILED'
  | 'SYSTEM_CHECK_COMPLETED'
  | 'FAULT_RECOVERED'
  | 'SYSTEM_STATE_CHANGED'
  | 'OPERATOR_ACTION';

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  sessionId: string;
  testId?: string;
  module: string;
  severity: 'INFO' | 'NOTICE' | 'WARNING' | 'ERROR' | 'CRITICAL';
  eventType: EventType;
  type?: EventType;
  message: string;
  description?: string;
  stateBefore?: string;
  stateAfter?: string;
  evidenceId?: string;
}

export interface TestSession {
  sessionId: string;
  operator: string;
  organization: string;
  scenario: string;
  startTime: number;
  endTime?: number;
  status: 'ACTIVE' | 'PAUSED' | 'CONCLUDED' | 'ABORTED';
  simulationId: string;
  testCount: number;
  faultCount: number;
  validationCount: number;
  notes: string;
}

export interface SimulationConfig {
  referenceSampleRate: number; // 200 Hz
  displayUpdateRate: number;   // 10 Hz
  noiseLevel: number;          // 0.02
  driftLevel: number;          // 0.01
  simulationSpeed: number;     // 1x, 2x, etc.
}
