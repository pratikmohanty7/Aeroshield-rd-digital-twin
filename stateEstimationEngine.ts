import { SensorData, SensorType } from '../types/sensor';
import { StateEstimation } from '../types/digitalTwin';

export function estimateState(
  sensors: Record<SensorType, SensorData>,
  currentTimeSec: number
): StateEstimation {
  const gnss = sensors.GNSS;
  const imu = sensors.IMU;
  const pressure = sensors.PRESSURE;
  const temp = sensors.TEMPERATURE;
  const mag = sensors.MAGNETOMETER;

  const gnssConf = gnss.confidence;
  const gnssQuality = gnss.qualityScore;
  const gnssAvail = gnss.status === 'NORMAL' || gnss.status === 'WARNING';

  const baroConf = pressure.confidence;
  const baroAlt = pressure.fields.baroAltitude?.value ?? 450;
  const gnssAlt = gnss.fields.altitude?.value ?? 450;

  // Fusion for Altitude:
  // (GNSS Alt * gnssWeight + Baro Alt * baroWeight) / totalWeight
  let estimatedAlt: number;
  let fusionMethod = 'WEIGHTED DUAL-SENSOR FUSION (GNSS + BAROMETRIC)';
  let degradationReason: string | undefined = undefined;

  if (gnssAvail) {
    const totalW = gnssConf + baroConf;
    estimatedAlt = (gnssAlt * gnssConf + baroAlt * baroConf) / (totalW > 0 ? totalW : 1);
  } else {
    // GNSS Loss fallback
    estimatedAlt = baroAlt;
    fusionMethod = 'DEGRADED SINGLE-SOURCE FALLBACK (BARO-ALTIMETRIC ONLY)';
    degradationReason = 'GNSS satellite constellation unavailable; utilizing barometric pressure fallback';
  }

  // Position confidence
  let positionConfidence = gnssAvail ? Math.round((gnssConf * 0.7 + baroConf * 0.3)) : Math.round(baroConf * 0.55);
  if (imu.status === 'FAILED' || imu.status === 'DEGRADED') {
    positionConfidence = Math.max(15, positionConfidence - 20);
    degradationReason = (degradationReason ? degradationReason + '; ' : '') + 'IMU inertial bias degraded dead-reckoning support';
  }

  // Motion estimate
  const velocity = gnssAvail ? (gnss.fields.groundSpeed?.value ?? 18.0) : 18.0;
  const accelTotal = imu.primaryValue;
  const pitchRate = imu.fields.gyroPitch?.value ?? 0;

  // Orientation
  const roll = imu.fields.gyroRoll?.value ?? 0;
  const pitch = imu.fields.gyroPitch?.value ?? 0;
  const yaw = mag.fields.headingDeg?.value ?? 142.5;

  // Environment state
  const ambientT = temp.fields.sensorBayTemp?.value ?? 24.5;
  const pressHpa = pressure.fields.pressureHpa?.value ?? 961.2;

  const sourceSensors: SensorType[] = gnssAvail
    ? ['GNSS', 'IMU', 'PRESSURE', 'MAGNETOMETER']
    : ['IMU', 'PRESSURE', 'MAGNETOMETER'];

  return {
    positionEstimate: {
      x: parseFloat((Math.cos(currentTimeSec * 0.05) * 120).toFixed(1)),
      y: parseFloat((Math.sin(currentTimeSec * 0.05) * 120).toFixed(1)),
      altitudeM: parseFloat(estimatedAlt.toFixed(1)),
    },
    motionEstimate: {
      velocityMps: parseFloat(velocity.toFixed(1)),
      accelG: parseFloat(accelTotal.toFixed(2)),
      angularRateDps: parseFloat(Math.abs(pitchRate).toFixed(1)),
    },
    orientationEstimate: {
      rollDeg: parseFloat(roll.toFixed(1)),
      pitchDeg: parseFloat(pitch.toFixed(1)),
      yawDeg: parseFloat(yaw.toFixed(1)),
    },
    environmentState: {
      ambientTempC: parseFloat(ambientT.toFixed(1)),
      atmosphericPressureHpa: parseFloat(pressHpa.toFixed(1)),
    },
    confidence: positionConfidence,
    sourceSensors,
    fusionMethod,
    degradationReason,
    lastUpdated: currentTimeSec,
  };
}
