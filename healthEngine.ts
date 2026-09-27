import { SensorData, SensorType } from '../types/sensor';
import { CommState } from '../types/telemetry';
import { ObdsState } from '../types/diagnostics';
import { SystemStatus } from '../types/session';

export interface HealthWeights {
  sensorAvailabilityWeight: number; // 0.25 (25%)
  dataQualityWeight: number;        // 0.20 (20%)
  sensorConsistencyWeight: number;  // 0.20 (20%)
  powerHealthWeight: number;        // 0.15 (15%)
  communicationHealthWeight: number;// 0.10 (10%)
  diagnosticStateWeight: number;    // 0.10 (10%)
}

export const DEFAULT_HEALTH_WEIGHTS: HealthWeights = {
  sensorAvailabilityWeight: 0.25,
  dataQualityWeight: 0.20,
  sensorConsistencyWeight: 0.20,
  powerHealthWeight: 0.15,
  communicationHealthWeight: 0.10,
  diagnosticStateWeight: 0.10,
};

export interface HealthBreakdown {
  systemHealthIndex: number; // 0 - 100
  status: SystemStatus;
  subscores: {
    sensorAvailability: number; // 0 - 100
    dataQuality: number;        // 0 - 100
    sensorConsistency: number;  // 0 - 100
    powerHealth: number;        // 0 - 100
    communicationHealth: number;// 0 - 100
    diagnosticStateScore: number;// 0 - 100
  };
  weights: HealthWeights;
  activeCauses: string[];
}

export function computeSystemHealth(
  sensors: Record<SensorType, SensorData>,
  obdsState: ObdsState,
  commState: CommState,
  weights: HealthWeights = DEFAULT_HEALTH_WEIGHTS
): HealthBreakdown {
  const sensorList = Object.values(sensors);
  const activeCauses: string[] = [];

  // 1. SENSOR AVAILABILITY (25%)
  const availableSensors = sensorList.filter((s) => s.status !== 'FAILED' && s.status !== 'UNAVAILABLE');
  const availabilityScore = Math.round((availableSensors.length / sensorList.length) * 100);
  if (availabilityScore < 100) {
    const failedSensors = sensorList.filter((s) => s.status === 'FAILED' || s.status === 'UNAVAILABLE').map((s) => s.id);
    activeCauses.push(`Sensor loss detected (${failedSensors.join(', ')})`);
  }

  // 2. DATA QUALITY (20%)
  const avgQuality = Math.round(sensorList.reduce((acc, s) => acc + s.qualityScore, 0) / sensorList.length);
  if (avgQuality < 85) {
    activeCauses.push(`Aggregate sensor quality dropped to ${avgQuality}%`);
  }

  // 3. SENSOR CONSISTENCY (20%)
  // Consistency checks across sensors (e.g. IMU gravity, Baro-GNSS correlation, magnetometer)
  let consistencyScore = 100;
  if (sensors.GNSS.status === 'NORMAL' && sensors.PRESSURE.status === 'NORMAL') {
    const deltaAlt = Math.abs((sensors.PRESSURE.fields.baroAltitude?.value ?? 0) - (sensors.GNSS.fields.altitude?.value ?? 0));
    if (deltaAlt > 15) {
      consistencyScore -= 30;
      activeCauses.push(`Altimeter cross-consistency divergence (${deltaAlt.toFixed(1)}m)`);
    }
  }
  if (sensors.IMU.status === 'DEGRADED' || sensors.IMU.status === 'WARNING') {
    consistencyScore -= 30;
    activeCauses.push('IMU inertial acceleration vector exceeds physical dynamic model');
  }
  if (sensors.MAGNETOMETER.status === 'DEGRADED') {
    consistencyScore -= 20;
    activeCauses.push('Magnetometer heading skew inconsistent with rate gyro');
  }
  consistencyScore = Math.max(20, consistencyScore);

  // 4. POWER HEALTH (15%)
  let powerScore = 100;
  const vBus = sensors.POWER.fields.busVoltage?.value ?? 24.0;
  if (vBus < 22.0) {
    powerScore = 40;
    activeCauses.push(`Electrical bus undervoltage sag (${vBus}V < 22.0V limit)`);
  } else if (vBus < 23.0) {
    powerScore = 75;
    activeCauses.push(`Electrical bus voltage minor dip (${vBus}V)`);
  }

  // 5. COMMUNICATION HEALTH (10%)
  let commScore = 100;
  if (commState === 'INTERRUPTED') {
    commScore = 10;
    activeCauses.push('Telemetry downlink channel interrupted / packet drop');
  } else if (commState === 'DEGRADED') {
    commScore = 60;
    activeCauses.push('Telemetry frame degradation / elevated packet retransmissions');
  }

  // 6. DIAGNOSTIC STATE (10%)
  let diagScore = 100;
  if (obdsState.status === 'FAILED') {
    diagScore = 20;
    activeCauses.push('OBDS critical fault flag asserted');
  } else if (obdsState.status === 'WARNING' || obdsState.status === 'DEGRADED') {
    diagScore = 60;
    activeCauses.push(`OBDS diagnostic alert active (${obdsState.activeFaultCount} fault${obdsState.activeFaultCount > 1 ? 's' : ''})`);
  }

  // Weighted Index
  const totalIndex = Math.round(
    availabilityScore * weights.sensorAvailabilityWeight +
    avgQuality * weights.dataQualityWeight +
    consistencyScore * weights.sensorConsistencyWeight +
    powerScore * weights.powerHealthWeight +
    commScore * weights.communicationHealthWeight +
    diagScore * weights.diagnosticStateWeight
  );

  const clampedIndex = Math.max(0, Math.min(100, totalIndex));

  // Determine overall status
  let status: SystemStatus = 'NORMAL';
  if (clampedIndex < 50) {
    status = 'FAILED';
  } else if (clampedIndex < 75) {
    status = 'DEGRADED';
  } else if (clampedIndex < 90) {
    status = 'WARNING';
  }

  if (activeCauses.length === 0) {
    activeCauses.push('All subsystems nominal; acquisition, power, and diagnostic margins healthy');
  }

  return {
    systemHealthIndex: clampedIndex,
    status,
    subscores: {
      sensorAvailability: availabilityScore,
      dataQuality: avgQuality,
      sensorConsistency: consistencyScore,
      powerHealth: powerScore,
      communicationHealth: commScore,
      diagnosticStateScore: diagScore,
    },
    weights,
    activeCauses,
  };
}
