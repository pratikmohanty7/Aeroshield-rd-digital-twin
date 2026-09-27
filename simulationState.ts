import { SensorData, SensorType, FaultConfig } from './sensor';
import { TelemetryPacket, TelemetryStats, CommState } from './telemetry';
import { StateEstimation, DigitalTwinState } from './digitalTwin';
import { HealthBreakdown } from '../engines/healthEngine';
import { ObdsState, DiagnosticEvent } from './diagnostics';
import { ValidationTestCase, EvidenceRecord, TestHistoryItem } from './validation';
import { AuditLogEntry, TestSession } from './session';

export interface SensorStateGroup {
  sensors: Record<SensorType, SensorData>;
  activeFaults: FaultConfig[];
  recoveringSensors: Record<SensorType, number>;
}

export interface TelemetryStateGroup {
  latestPacket: TelemetryPacket | null;
  stats: TelemetryStats;
  commState: CommState;
}

export interface DataQualityGroup {
  overallScore: number;
  dataQualitySubscore: number;
  sensorConsistencySubscore: number;
  activeIssues: string[];
}

export interface DiagnosticStateGroup {
  obds: ObdsState;
  events: DiagnosticEvent[];
}

export interface ValidationStateGroup {
  tests: ValidationTestCase[];
  history: TestHistoryItem[];
  evidence: EvidenceRecord[];
  activeFaultStimulus?: string;
  passedTestsCount: number;
  totalTestsCount: number;
}

export interface CentralizedSimulationState {
  sensorState: SensorStateGroup;
  telemetryState: TelemetryStateGroup;
  dataQuality: DataQualityGroup;
  stateEstimate: StateEstimation;
  healthState: HealthBreakdown;
  diagnosticState: DiagnosticStateGroup;
  digitalTwinState: DigitalTwinState;
  validationState: ValidationStateGroup;
  logs: AuditLogEntry[];
  sessionState: TestSession;
}
