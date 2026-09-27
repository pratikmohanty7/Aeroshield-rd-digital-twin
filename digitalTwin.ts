import { SensorStatus, SensorType } from './sensor';
import { CommState } from './telemetry';

export type SubsystemId =
  | 'ACQUISITION'
  | 'VALIDATION_UNIT'
  | 'STATE_ESTIMATOR'
  | 'OBDS_DIAGNOSTICS'
  | 'TELEMETRY_LINK'
  | 'POWER_BUS'
  | 'ENVIRONMENTAL_SHIELD';

export interface SubsystemState {
  id: SubsystemId;
  name: string;
  category: string;
  health: number; // 0 - 100
  confidence: number; // 0 - 100
  status: 'NORMAL' | 'WARNING' | 'DEGRADED' | 'FAILED';
  inputs: string[];
  outputs: string[];
  lastEvent: string;
  implementationStatus: 'IMPLEMENTED' | 'SIMULATED' | 'PROPOSED' | 'PLANNED' | 'NOT TESTED';
  keyMetrics: Record<string, string | number>;
}

export interface StateEstimation {
  positionEstimate: { x: number; y: number; altitudeM: number };
  motionEstimate: { velocityMps: number; accelG: number; angularRateDps: number };
  orientationEstimate: { rollDeg: number; pitchDeg: number; yawDeg: number };
  environmentState: { ambientTempC: number; atmosphericPressureHpa: number };
  confidence: number; // 0-100%
  sourceSensors: SensorType[];
  fusionMethod: string;
  degradationReason?: string;
  lastUpdated: number;
}

export interface DigitalTwinState {
  timestamp: number;
  systemMode: 'R&D_SIMULATION' | 'STANDBY' | 'FAULT_ISOLATION';
  sensorHealth: Record<SensorType, SensorStatus>;
  sensorAvailability: number; // 0 - 100%
  dataQuality: number; // 0 - 100%
  stateEstimation: StateEstimation;
  powerState: { voltageV: number; currentA: number; healthPercent: number };
  communicationState: CommState;
  diagnosticState: 'NORMAL' | 'WARNING' | 'DEGRADED' | 'FAILED';
  systemHealthIndex: number; // 0 - 100
  validationPassRate: number; // 0 - 100%
  simulationState: 'IDLE' | 'RUNNING' | 'PAUSED' | 'FAULT_INJECTED' | 'RECOVERING';
  subsystems: Record<SubsystemId, SubsystemState>;
}
