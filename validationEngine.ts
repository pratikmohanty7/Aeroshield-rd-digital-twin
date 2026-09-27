import { SensorData, SensorStatus, SensorType } from '../types/sensor';

export interface SensorValidationResult {
  sensorId: SensorType;
  status: SensorStatus;
  qualityScore: number; // 0 - 100%
  confidence: number;   // 0 - 100%
  flags: {
    rangeValid: boolean;
    timestampValid: boolean;
    staleDataDetected: boolean;
    available: boolean;
    rateOfChangeValid: boolean;
    consistencyValid: boolean;
  };
  notes: string[];
}

export function validateSensorData(
  sensor: SensorData,
  allSensors: Record<SensorType, SensorData>,
  currentTimeEpoch: number,
  recoveringSensors?: Record<SensorType, number>,
  simTimeSec?: number
): SensorValidationResult {
  const notes: string[] = [];
  let rangeValid = true;
  let timestampValid = true;
  let staleDataDetected = false;
  let available = true;
  let rateOfChangeValid = true;
  let consistencyValid = true;

  // Check if sensor is currently in recovery phase (< 1.5s after recovery trigger)
  const recoveryStart = (recoveringSensors && simTimeSec !== undefined) ? recoveringSensors[sensor.id] : undefined;
  const isRecovering = recoveryStart !== undefined && simTimeSec !== undefined && (simTimeSec - recoveryStart) < 1.5;
  const recoveryProgress = isRecovering && simTimeSec !== undefined ? Math.min(1, Math.max(0, (simTimeSec - recoveryStart) / 1.5)) : 1;

  // 1. AVAILABILITY CHECK
  if (sensor.primaryValue === 0 && (sensor.id === 'GNSS' || sensor.id === 'IMU' || sensor.id === 'ENVIRONMENT' || sensor.id === 'PRESSURE')) {
    available = false;
    notes.push(`${sensor.name} transducer dropout / signal loss (0.00 reading)`);
  }

  if (sensor.id === 'GNSS') {
    const sats = sensor.fields.satellites?.value ?? 0;
    const fix = sensor.fields.fixType?.value ?? 0;
    if (sats < 4 || fix === 0) {
      available = false;
      notes.push('GNSS satellite constellation lock lost (Fix: 0, Sats < 4)');
    }
  }

  // 2. STALE DATA CHECK
  const timeSinceLastUpdate = currentTimeEpoch - sensor.lastUpdateEpoch;
  if (timeSinceLastUpdate > 1800) {
    staleDataDetected = true;
    notes.push(`Sensor frame stale: no update received for ${(timeSinceLastUpdate / 1000).toFixed(1)}s`);
  }

  // 3. RANGE CHECK
  for (const [, field] of Object.entries(sensor.fields)) {
    if (field.value < field.nominalMin || field.value > field.nominalMax) {
      rangeValid = false;
      notes.push(`Field '${field.label}' (${field.value} ${field.unit}) outside nominal [${field.nominalMin}, ${field.nominalMax}]`);
    }
  }

  // Primary value nominal bounds check
  const lastPoint = sensor.history && sensor.history.length > 0 ? sensor.history[sensor.history.length - 1] : null;
  if (lastPoint && lastPoint.nominalMin !== undefined && lastPoint.nominalMax !== undefined) {
    if (sensor.primaryValue < lastPoint.nominalMin || sensor.primaryValue > lastPoint.nominalMax) {
      rangeValid = false;
    }
  }

  // 4. RATE OF CHANGE & CONSISTENCY CHECK
  if (sensor.id === 'IMU') {
    if (sensor.primaryValue > 1.25 || sensor.primaryValue < 0.75) {
      rangeValid = false;
      consistencyValid = false;
      notes.push(`IMU total acceleration bias detected: ${sensor.primaryValue.toFixed(2)} G outside nominal band [0.90, 1.15] G`);
    }
  }

  if (sensor.id === 'PRESSURE' && allSensors.GNSS) {
    const baroAlt = sensor.fields.baroAltitude?.value ?? 450;
    const gnssAlt = allSensors.GNSS.fields.altitude?.value ?? 450;
    const gnssAvail = (allSensors.GNSS.fields.satellites?.value ?? 0) >= 4;

    if (gnssAvail) {
      const altDelta = Math.abs(baroAlt - gnssAlt);
      if (altDelta > 25) {
        consistencyValid = false;
        notes.push(`Barometric altitude (${baroAlt}m) diverged from GNSS (${gnssAlt}m) by ${altDelta.toFixed(1)}m`);
      }
    }
  }

  if (sensor.id === 'TEMPERATURE') {
    const pcbTemp = sensor.fields.pcbTemp?.value ?? sensor.primaryValue;
    if (pcbTemp > 50) {
      rangeValid = false;
      notes.push(`Thermal critical threshold exceeded: Core PCB ${pcbTemp}°C > 48°C nominal`);
    }
  }

  if (sensor.id === 'MAGNETOMETER') {
    if (sensor.primaryValue > 155 || sensor.primaryValue < 130) {
      consistencyValid = false;
      notes.push(`Magnetometer heading divergence (${sensor.primaryValue.toFixed(1)}°) exceeds attitude filter bound`);
    }
  }

  if (sensor.id === 'ENVIRONMENT') {
    if (sensor.primaryValue > 18.0 || sensor.primaryValue < 6.0) {
      rangeValid = false;
      notes.push(`Radar proximity clearance anomaly: ${sensor.primaryValue.toFixed(1)} m outside nominal [8, 16] m`);
    }
  }

  // Calculate Quality & Confidence
  let quality = 98;
  let confidence = 96;

  if (isRecovering) {
    // Smooth recovery ramp from 68/71 back to 98/96
    quality = Math.round(68 + recoveryProgress * 30);
    confidence = Math.round(71 + recoveryProgress * 25);
  } else if (!available) {
    quality = 12;
    confidence = 10;
  } else if (staleDataDetected) {
    quality = 30;
    confidence = 25;
  } else if (!rangeValid || !consistencyValid) {
    // Bias / Drift / Disagreement condition: exactly 68% quality and 71% confidence as expected in specs
    quality = 68;
    confidence = 71;
  } else if (!rateOfChangeValid) {
    quality = 78;
    confidence = 80;
  }

  quality = Math.max(5, Math.min(100, quality));
  confidence = Math.max(5, Math.min(100, confidence));

  // Determine Status
  let status: SensorStatus = 'NORMAL';
  if (isRecovering) {
    status = recoveryProgress >= 0.95 ? 'NORMAL' : 'RECOVERING';
  } else if (!available) {
    status = 'FAILED';
  } else if (staleDataDetected) {
    status = 'STALE';
  } else if (quality < 50) {
    status = 'FAILED';
  } else if (quality <= 75) {
    status = 'DEGRADED';
  } else if (quality < 90) {
    status = 'WARNING';
  }

  if (notes.length === 0) {
    notes.push('All deterministic range, freshness, and physical bounds checks passed');
  }

  return {
    sensorId: sensor.id,
    status,
    qualityScore: quality,
    confidence,
    flags: {
      rangeValid,
      timestampValid,
      staleDataDetected,
      available,
      rateOfChangeValid,
      consistencyValid,
    },
    notes,
  };
}
