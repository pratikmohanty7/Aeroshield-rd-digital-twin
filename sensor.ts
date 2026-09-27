export type SensorStatus = 'NORMAL' | 'WARNING' | 'DEGRADED' | 'FAILED' | 'STALE' | 'UNAVAILABLE' | 'RECOVERING';

export type SensorType =
  | 'IMU'
  | 'GNSS'
  | 'PRESSURE'
  | 'TEMPERATURE'
  | 'POWER'
  | 'MAGNETOMETER'
  | 'ENVIRONMENT';

export interface SensorValueField {
  label: string;
  value: number;
  unit: string;
  nominalMin: number;
  nominalMax: number;
}

export interface SensorData {
  id: SensorType;
  name: string;
  category: string;
  status: SensorStatus;
  primaryValue: number;
  unit: string;
  fields: Record<string, SensorValueField>;
  qualityScore: number; // 0 - 100%
  confidence: number;   // 0 - 100%
  timestamp: number;    // simulation timestamp ms
  lastUpdateEpoch: number; // real timestamp ms
  sampleRateHz: number;
  source: string;       // e.g. "SIMULATED 200 Hz REFERENCE STREAM"
  validationNotes: string[];
  history: {
    timestamp: number;
    value: number;
    quality: number;
    status?: SensorStatus;
    nominalMin?: number;
    nominalMax?: number;
    baseline?: number;
  }[];
}

export type FaultType =
  | 'NONE'
  | 'GNSS_LOSS'
  | 'IMU_BIAS'
  | 'SENSOR_DROPOUT'
  | 'STALE_DATA'
  | 'TEMPERATURE_SPIKE'
  | 'POWER_DEGRADATION'
  | 'COMMUNICATION_INTERRUPTION'
  | 'SENSOR_DISAGREEMENT'
  | 'SENSOR_BIAS'
  | 'SENSOR_DRIFT'
  | 'NOISE_INCREASE';

export interface FaultConfig {
  type: FaultType;
  targetSensor?: SensorType;
  severity: 'WARNING' | 'DEGRADED' | 'FAILED';
  injectionTime: number; // ms
  injectionSimTime?: number; // simulation seconds
  description: string;
  active: boolean;
}

export interface FaultEventMarker {
  id: string;
  sensorId: SensorType;
  timeSeconds: number;
  type: 'INJECTED' | 'DETECTED' | 'RECOVERY' | 'RESTORED' | 'NORMALIZED';
  label: string;
  color: string;
}

export interface SensorTimelineEvent {
  id: string;
  timeSeconds: number;
  formattedTime: string; // e.g. "00:12.8"
  type: 'NORMAL' | 'INJECTED' | 'DETECTED' | 'RECOVERY_STARTED' | 'NORMALIZED';
  label: string; // e.g. "Sensor normal", "Fault injected", "Fault detected", "Recovery started", "Sensor normalized"
  detail?: string;
  color: string;
}

export interface SensorStateSnapshot {
  quality: number;
  confidence: number;
  status: SensorStatus;
  primaryValue?: number;
  timeSeconds?: number;
}

export interface SensorPhaseComparison {
  beforeFault: SensorStateSnapshot | null;
  duringFault: SensorStateSnapshot | null;
  afterRecovery: SensorStateSnapshot | null;
}

