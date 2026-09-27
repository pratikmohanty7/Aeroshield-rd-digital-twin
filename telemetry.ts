import { SensorType } from './sensor';

export type CommState = 'OPTIMAL' | 'DEGRADED' | 'INTERRUPTED' | 'STANDBY';

export interface TelemetryPacket {
  id: string;
  sequence: number;
  timestamp: number;
  sensorSummary: Record<SensorType, { value: number; unit: string; quality: number; status: string }>;
  systemHealth: number;
  diagnosticState: string;
  dataQuality: number;
  communicationState: CommState;
  packetLossRate: number; // percentage
  referenceRateHz: number; // 200
  displayRateHz: number;   // 10
  rssiDb: number;
}

export interface TelemetryStats {
  packetsGenerated: number;
  packetsDropped: number;
  averageLatencyMs: number;
  streamStatus: 'ACTIVE' | 'PAUSED' | 'DEGRADED' | 'DISCONNECTED';
  currentSequence: number;
  effectiveDataRateKbps: number;
}
