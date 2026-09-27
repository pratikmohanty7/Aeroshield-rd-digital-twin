import { CommState, TelemetryPacket, TelemetryStats } from '../types/telemetry';
import { SensorData, SensorType } from '../types/sensor';

export function createTelemetryPacket(
  sequence: number,
  sensors: Record<SensorType, SensorData>,
  systemHealth: number,
  diagnosticState: string,
  commState: CommState,
  rssiDb: number = -68
): TelemetryPacket {
  const sensorSummary: Record<SensorType, { value: number; unit: string; quality: number; status: string }> = {} as any;

  let totalQuality = 0;
  for (const [key, sensor] of Object.entries(sensors)) {
    sensorSummary[key as SensorType] = {
      value: sensor.primaryValue,
      unit: sensor.unit,
      quality: sensor.qualityScore,
      status: sensor.status,
    };
    totalQuality += sensor.qualityScore;
  }

  const avgQuality = Math.round(totalQuality / Object.keys(sensors).length);
  const packetLossRate = commState === 'INTERRUPTED' ? 88.5 : commState === 'DEGRADED' ? 14.2 : 0.05;

  return {
    id: `PKT-${sequence.toString().padStart(6, '0')}`,
    sequence,
    timestamp: Date.now(),
    sensorSummary,
    systemHealth,
    diagnosticState,
    dataQuality: avgQuality,
    communicationState: commState,
    packetLossRate,
    referenceRateHz: 200,
    displayRateHz: 10,
    rssiDb,
  };
}

export function updateTelemetryStats(
  prevStats: TelemetryStats,
  commState: CommState
): TelemetryStats {
  const dropped = commState === 'INTERRUPTED' ? 18 : commState === 'DEGRADED' ? 3 : 0;
  const currentSequence = prevStats.currentSequence + 1;
  const packetsGenerated = prevStats.packetsGenerated + 1;
  const packetsDropped = prevStats.packetsDropped + dropped;

  let streamStatus: 'ACTIVE' | 'PAUSED' | 'DEGRADED' | 'DISCONNECTED' = 'ACTIVE';
  if (commState === 'INTERRUPTED') streamStatus = 'DISCONNECTED';
  else if (commState === 'DEGRADED') streamStatus = 'DEGRADED';

  return {
    packetsGenerated,
    packetsDropped,
    averageLatencyMs: commState === 'INTERRUPTED' ? 240 : commState === 'DEGRADED' ? 45 : 8.2,
    streamStatus,
    currentSequence,
    effectiveDataRateKbps: commState === 'INTERRUPTED' ? 2.4 : 115.2,
  };
}
