import { FaultConfig, SensorData, SensorType } from '../types/sensor';
import { SimulationConfig } from '../types/session';

export interface RawSimulationState {
  timeSeconds: number;
  sensors: Record<SensorType, SensorData>;
}

// Deterministic pseudo-random noise generator seeded by step for repeatability
function pseudoNoise(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1; // Range: [-1, 1]
}

// Helper to generate realistic initial history before t=0 so graphs are immediately streaming
function generateInitialSensorHistory(
  baseline: number,
  nominalMin: number,
  nominalMax: number,
  trendFreq: number,
  trendAmp: number,
  noiseAmp: number,
  seedOffset: number,
  pointsCount = 150
): { timestamp: number; value: number; quality: number; status: 'NORMAL'; nominalMin: number; nominalMax: number; baseline: number }[] {
  const result = [];
  const dt = 0.1; // 10 Hz
  for (let i = pointsCount - 1; i >= 0; i--) {
    const t = -i * dt;
    const stepSeed = Math.round(t * 10);
    const noise = pseudoNoise(stepSeed + seedOffset) * noiseAmp;
    const harmonic = Math.sin(t * trendFreq) * trendAmp + Math.cos(t * trendFreq * 2.2) * (trendAmp * 0.35);
    const val = parseFloat((baseline + harmonic + noise).toFixed(2));
    result.push({
      timestamp: parseFloat(t.toFixed(1)),
      value: val,
      quality: 98,
      status: 'NORMAL' as const,
      nominalMin,
      nominalMax,
      baseline,
    });
  }
  return result;
}

export function createInitialSensors(): Record<SensorType, SensorData> {
  const now = Date.now();
  return {
    IMU: {
      id: 'IMU',
      name: 'IMU / Inertial Motion Unit',
      category: 'Inertial & Dynamics',
      status: 'NORMAL',
      primaryValue: 1.02,
      unit: 'G (Total Accel)',
      fields: {
        accelZ: { label: 'Accel Z (Gravity)', value: 0.98, unit: 'G', nominalMin: 0.9, nominalMax: 1.15 },
        accelX: { label: 'Accel X (Surge)', value: 0.05, unit: 'G', nominalMin: -0.5, nominalMax: 0.5 },
        accelY: { label: 'Accel Y (Sway)', value: 0.02, unit: 'G', nominalMin: -0.5, nominalMax: 0.5 },
        gyroPitch: { label: 'Gyro Pitch', value: 0.4, unit: 'deg/s', nominalMin: -15, nominalMax: 15 },
        gyroRoll: { label: 'Gyro Roll', value: -0.2, unit: 'deg/s', nominalMin: -15, nominalMax: 15 },
        gyroYaw: { label: 'Gyro Yaw', value: 1.1, unit: 'deg/s', nominalMin: -30, nominalMax: 30 },
      },
      qualityScore: 98,
      confidence: 96,
      timestamp: 0,
      lastUpdateEpoch: now,
      sampleRateHz: 200,
      source: 'SIMULATED 200 Hz REFERENCE STREAM',
      validationNotes: ['Nominal 1.0G gravity vector verified', 'Gyro drift within ±0.05 deg/s bound'],
      history: generateInitialSensorHistory(1.02, 0.90, 1.15, 0.8, 0.03, 0.015, 1, 150),
    },
    GNSS: {
      id: 'GNSS',
      name: 'GNSS / Positioning Unit',
      category: 'Position & Timing',
      status: 'NORMAL',
      primaryValue: 452.4,
      unit: 'm (Ellipsoid Alt)',
      fields: {
        altitude: { label: 'GNSS Altitude', value: 452.4, unit: 'm', nominalMin: 445, nominalMax: 460 },
        satellites: { label: 'Satellites Locked', value: 11, unit: 'sats', nominalMin: 6, nominalMax: 14 },
        hdop: { label: 'HDOP Precision', value: 0.92, unit: 'dilution', nominalMin: 0.5, nominalMax: 2.0 },
        fixType: { label: 'Fix Mode (3D)', value: 3, unit: 'mode', nominalMin: 2, nominalMax: 3 },
        groundSpeed: { label: 'Ground Speed', value: 18.2, unit: 'm/s', nominalMin: 0, nominalMax: 60 },
      },
      qualityScore: 97,
      confidence: 95,
      timestamp: 0,
      lastUpdateEpoch: now,
      sampleRateHz: 10,
      source: 'SIMULATED 10 Hz DILUTION STREAM',
      validationNotes: ['Dual-constellation 3D lock valid', 'HDOP 0.92 confirms sub-meter confidence'],
      history: generateInitialSensorHistory(452.4, 445, 460, 0.15, 2.0, 0.4, 10, 150),
    },
    PRESSURE: {
      id: 'PRESSURE',
      name: 'Barometric Altimeter & Air Data',
      category: 'Atmospheric Air Data',
      status: 'NORMAL',
      primaryValue: 961.2,
      unit: 'hPa',
      fields: {
        pressureHpa: { label: 'Baro Pressure', value: 961.2, unit: 'hPa', nominalMin: 957, nominalMax: 965 },
        baroAltitude: { label: 'Baro Altitude', value: 451.8, unit: 'm', nominalMin: 445, nominalMax: 460 },
        verticalSpeed: { label: 'Pressure Vertical Rate', value: 0.1, unit: 'm/s', nominalMin: -10, nominalMax: 10 },
      },
      qualityScore: 99,
      confidence: 97,
      timestamp: 0,
      lastUpdateEpoch: now,
      sampleRateHz: 50,
      source: 'SIMULATED 50 Hz TRANSDUCER STREAM',
      validationNotes: ['Baro altitude correlates with GNSS within 0.6m margin'],
      history: generateInitialSensorHistory(961.2, 957, 965, 0.15, 0.45, 0.12, 20, 150),
    },
    TEMPERATURE: {
      id: 'TEMPERATURE',
      name: 'Internal Thermal Sensor',
      category: 'Environmental & Health',
      status: 'NORMAL',
      primaryValue: 34.6,
      unit: '°C',
      fields: {
        pcbTemp: { label: 'Processor Core PCB', value: 34.6, unit: '°C', nominalMin: 25, nominalMax: 48 },
        enclosureTemp: { label: 'Chassis Enclosure', value: 26.2, unit: '°C', nominalMin: 15, nominalMax: 45 },
        sensorBayTemp: { label: 'Sensor Bay Ambient', value: 24.8, unit: '°C', nominalMin: 15, nominalMax: 45 },
      },
      qualityScore: 99,
      confidence: 98,
      timestamp: 0,
      lastUpdateEpoch: now,
      sampleRateHz: 10,
      source: 'SIMULATED 10 Hz THERMAL ADC STREAM',
      validationNotes: ['Operating temperature well inside safe envelope (25°C - 48°C)'],
      history: generateInitialSensorHistory(34.6, 25, 48, 0.05, 1.2, 0.15, 30, 150),
    },
    POWER: {
      id: 'POWER',
      name: 'Regulated Power Subsystem',
      category: 'Electrical Bus',
      status: 'NORMAL',
      primaryValue: 24.1,
      unit: 'V (Main Bus)',
      fields: {
        busVoltage: { label: 'Main Rail Voltage', value: 24.1, unit: 'V', nominalMin: 22.0, nominalMax: 26.0 },
        currentA: { label: 'Current Draw', value: 1.45, unit: 'A', nominalMin: 0.5, nominalMax: 3.5 },
        powerWatts: { label: 'Total Dissipation', value: 34.9, unit: 'W', nominalMin: 10, nominalMax: 80 },
        batteryLevel: { label: 'Aux Battery Reserve', value: 94.2, unit: '%', nominalMin: 20, nominalMax: 100 },
      },
      qualityScore: 98,
      confidence: 98,
      timestamp: 0,
      lastUpdateEpoch: now,
      sampleRateHz: 20,
      source: 'SIMULATED 20 Hz POWER MONITOR BUS',
      validationNotes: ['Main 24V supply within ±1.2% regulation threshold'],
      history: generateInitialSensorHistory(24.1, 22.0, 26.0, 0.1, 0.15, 0.05, 40, 150),
    },
    MAGNETOMETER: {
      id: 'MAGNETOMETER',
      name: 'Tri-Axis Magnetometer',
      category: 'Attitude Reference',
      status: 'NORMAL',
      primaryValue: 142.5,
      unit: 'deg (Heading)',
      fields: {
        headingDeg: { label: 'Magnetic Heading', value: 142.5, unit: 'deg', nominalMin: 135, nominalMax: 150 },
        magFieldX: { label: 'Field X', value: 21.4, unit: 'µT', nominalMin: -60, nominalMax: 60 },
        magFieldY: { label: 'Field Y', value: -14.2, unit: 'µT', nominalMin: -60, nominalMax: 60 },
        magFieldZ: { label: 'Field Z', value: 43.1, unit: 'µT', nominalMin: -60, nominalMax: 60 },
      },
      qualityScore: 96,
      confidence: 94,
      timestamp: 0,
      lastUpdateEpoch: now,
      sampleRateHz: 50,
      source: 'SIMULATED 50 Hz FLUXGATE REFERENCE',
      validationNotes: ['Hard/soft iron calibration matrix intact', 'Total field strength 50.1 µT aligns with local model'],
      history: generateInitialSensorHistory(142.5, 135, 150, 0.1, 2.5, 0.3, 50, 150),
    },
    ENVIRONMENT: {
      id: 'ENVIRONMENT',
      name: 'MMW / Proximity Radar Sensor',
      category: 'Radar Proximity Altimeter',
      status: 'NORMAL',
      primaryValue: 12.4,
      unit: 'm (Ground Clearance)',
      fields: {
        standoffDist: { label: 'Ground Clearance', value: 12.4, unit: 'm', nominalMin: 8.0, nominalMax: 16.0 },
        ambientHumidity: { label: 'Relative Humidity', value: 44.5, unit: '%', nominalMin: 10, nominalMax: 90 },
        chassisVibration: { label: 'Vibration Envelope', value: 0.08, unit: 'G RMS', nominalMin: 0, nominalMax: 1.5 },
      },
      qualityScore: 97,
      confidence: 95,
      timestamp: 0,
      lastUpdateEpoch: now,
      sampleRateHz: 20,
      source: 'SIMULATED 20 Hz MMW FMCW ARRAY',
      validationNotes: ['77 GHz radar proximity lock verified, sub-decimeter surface resolution'],
      history: generateInitialSensorHistory(12.4, 8.0, 16.0, 0.1, 1.2, 0.1, 60, 150),
    },
  };
}

/**
 * Step sensor simulation deterministically.
 * Follows: base value + slow trend + small noise + optional fault effect
 */
export function stepSensors(
  prevSensors: Record<SensorType, SensorData>,
  timeSec: number,
  config: SimulationConfig,
  activeFaults: FaultConfig[],
  recoveringSensors?: Record<SensorType, number>
): Record<SensorType, SensorData> {
  const nextSensors = { ...prevSensors };
  const now = Date.now();
  const noiseScale = config.noiseLevel;
  const driftScale = config.driftLevel;

  // Helper to query active fault and recovery factor for a given sensor
  const getFaultInfo = (sensorId: SensorType) => {
    const recoveryStart = recoveringSensors ? recoveringSensors[sensorId] : undefined;
    const isRecovering = recoveryStart !== undefined && (timeSec - recoveryStart) < 1.5;
    const recoveryFactor = isRecovering
      ? Math.max(0, 1 - (timeSec - recoveryStart) / 1.5)
      : 0;

    const fault = activeFaults.find(
      (f) =>
        f.active &&
        (f.targetSensor === sensorId ||
          (sensorId === 'IMU' && f.type === 'IMU_BIAS') ||
          (sensorId === 'GNSS' && f.type === 'GNSS_LOSS') ||
          (sensorId === 'PRESSURE' && f.type === 'STALE_DATA') ||
          (sensorId === 'TEMPERATURE' && f.type === 'TEMPERATURE_SPIKE') ||
          (sensorId === 'POWER' && f.type === 'POWER_DEGRADATION') ||
          (sensorId === 'MAGNETOMETER' && f.type === 'SENSOR_DISAGREEMENT') ||
          (sensorId === 'ENVIRONMENT' && f.type === 'COMMUNICATION_INTERRUPTION'))
    );

    return { fault, isRecovering, recoveryFactor };
  };

  // 1. IMU (Baseline: 1.02 G, Nominal: [0.90, 1.15] G)
  {
    const stepSeed = timeSec * 20;
    const { fault, isRecovering, recoveryFactor } = getFaultInfo('IMU');
    const faultType = fault?.type;
    const elapsedFaultSec = fault?.injectionSimTime ? Math.max(0, timeSec - fault.injectionSimTime) : 0;

    const normalNoise = pseudoNoise(stepSeed + 1) * 0.015 * noiseScale;
    let jitter = normalNoise;

    // Harmonic aerodynamic flutter and airframe vibration oscillation
    const harmonic = (Math.sin(timeSec * 2.4) * 0.055 + Math.cos(timeSec * 5.2) * 0.02) * driftScale;
    let baseG = 1.02 + harmonic;

    // Apply Fault Behaviors
    if (faultType === 'IMU_BIAS' || (faultType === 'SENSOR_BIAS' && fault?.targetSensor === 'IMU')) {
      const biasMag = isRecovering ? 0.55 * recoveryFactor : 0.55;
      baseG += biasMag; // Shifts to ~1.57G, visibly outside nominal band
    } else if (faultType === 'SENSOR_DRIFT' && fault?.targetSensor === 'IMU') {
      const driftMag = isRecovering ? (elapsedFaultSec * 0.06) * recoveryFactor : elapsedFaultSec * 0.06;
      baseG += driftMag; // Continually drifts away from baseline
    } else if (faultType === 'NOISE_INCREASE' && fault?.targetSensor === 'IMU') {
      const noiseAmp = isRecovering ? 0.35 * recoveryFactor : 0.35;
      jitter = pseudoNoise(stepSeed + 1) * noiseAmp; // High jitter
    } else if (faultType === 'SENSOR_DROPOUT' && fault?.targetSensor === 'IMU') {
      baseG = isRecovering ? baseG * (1 - recoveryFactor) : 0.0;
      jitter = 0;
    } else if (faultType === 'STALE_DATA' && fault?.targetSensor === 'IMU') {
      baseG = prevSensors.IMU.primaryValue;
      jitter = 0;
    } else if (faultType === 'SENSOR_DISAGREEMENT' && fault?.targetSensor === 'IMU') {
      baseG += (isRecovering ? 0.65 * recoveryFactor : 0.65);
    }

    const totalG = Math.max(0, baseG + jitter);
    const history = [...(prevSensors.IMU.history || [])];
    if (history.length > 600) history.shift();
    history.push({
      timestamp: parseFloat(timeSec.toFixed(1)),
      value: parseFloat(totalG.toFixed(2)),
      quality: prevSensors.IMU.qualityScore,
      status: prevSensors.IMU.status,
      nominalMin: 0.90,
      nominalMax: 1.15,
      baseline: 1.02,
    });

    nextSensors.IMU = {
      ...prevSensors.IMU,
      primaryValue: parseFloat(totalG.toFixed(2)),
      timestamp: timeSec,
      lastUpdateEpoch: (faultType === 'STALE_DATA' && fault?.targetSensor === 'IMU') ? prevSensors.IMU.lastUpdateEpoch : now,
      history,
    };
  }

  // 2. GNSS (Baseline: 452.4 m, Nominal: [445, 460] m)
  {
    const stepSeed = timeSec * 10;
    const { fault, isRecovering, recoveryFactor } = getFaultInfo('GNSS');
    const faultType = fault?.type;
    const elapsedFaultSec = fault?.injectionSimTime ? Math.max(0, timeSec - fault.injectionSimTime) : 0;

    let jitter = pseudoNoise(stepSeed + 10) * 0.35 * noiseScale;
    const harmonic = (Math.sin(timeSec * 1.2) * 3.6 + Math.cos(timeSec * 2.8) * 1.4) * driftScale;
    let alt = 452.4 + harmonic;

    if (faultType === 'GNSS_LOSS' || (faultType === 'SENSOR_DROPOUT' && fault?.targetSensor === 'GNSS')) {
      alt = isRecovering ? 452.4 * (1 - recoveryFactor) : 0.0;
      jitter = 0;
    } else if (faultType === 'SENSOR_BIAS' && fault?.targetSensor === 'GNSS') {
      const bias = isRecovering ? 30.0 * recoveryFactor : 30.0;
      alt += bias; // Shifts to 482.4m
    } else if (faultType === 'SENSOR_DRIFT' && fault?.targetSensor === 'GNSS') {
      const drift = isRecovering ? (elapsedFaultSec * 3.5) * recoveryFactor : elapsedFaultSec * 3.5;
      alt += drift;
    } else if (faultType === 'NOISE_INCREASE' && fault?.targetSensor === 'GNSS') {
      const noiseAmp = isRecovering ? 14.0 * recoveryFactor : 14.0;
      jitter = pseudoNoise(stepSeed + 10) * noiseAmp;
    } else if (faultType === 'STALE_DATA' && fault?.targetSensor === 'GNSS') {
      alt = prevSensors.GNSS.primaryValue;
      jitter = 0;
    } else if (faultType === 'SENSOR_DISAGREEMENT' && fault?.targetSensor === 'GNSS') {
      alt += (isRecovering ? 35.0 * recoveryFactor : 35.0);
    }

    const currentAlt = Math.max(0, alt + jitter);
    const history = [...(prevSensors.GNSS.history || [])];
    if (history.length > 600) history.shift();
    history.push({
      timestamp: parseFloat(timeSec.toFixed(1)),
      value: parseFloat(currentAlt.toFixed(1)),
      quality: prevSensors.GNSS.qualityScore,
      status: prevSensors.GNSS.status,
      nominalMin: 445,
      nominalMax: 460,
      baseline: 452.4,
    });

    nextSensors.GNSS = {
      ...prevSensors.GNSS,
      primaryValue: parseFloat(currentAlt.toFixed(1)),
      timestamp: timeSec,
      lastUpdateEpoch: (faultType === 'STALE_DATA' && fault?.targetSensor === 'GNSS') ? prevSensors.GNSS.lastUpdateEpoch : now,
      history,
    };
  }

  // 3. PRESSURE / Barometer (Baseline: 961.2 hPa, Nominal: [957, 965] hPa)
  {
    const stepSeed = timeSec * 15;
    const { fault, isRecovering, recoveryFactor } = getFaultInfo('PRESSURE');
    const faultType = fault?.type;
    const elapsedFaultSec = fault?.injectionSimTime ? Math.max(0, timeSec - fault.injectionSimTime) : 0;

    let jitter = pseudoNoise(stepSeed + 20) * 0.14 * noiseScale;
    const harmonic = (Math.sin(timeSec * 1.5) * 2.2 + Math.cos(timeSec * 3.8) * 0.8) * driftScale;
    let press = 961.2 + harmonic;

    if (faultType === 'STALE_DATA') {
      press = prevSensors.PRESSURE.primaryValue;
      jitter = 0;
    } else if (faultType === 'SENSOR_BIAS' && fault?.targetSensor === 'PRESSURE') {
      const bias = isRecovering ? -12.0 * recoveryFactor : -12.0;
      press += bias; // Shifts to ~949.2 hPa
    } else if (faultType === 'SENSOR_DRIFT' && fault?.targetSensor === 'PRESSURE') {
      const drift = isRecovering ? (-elapsedFaultSec * 1.5) * recoveryFactor : -elapsedFaultSec * 1.5;
      press += drift;
    } else if (faultType === 'NOISE_INCREASE' && fault?.targetSensor === 'PRESSURE') {
      const noiseAmp = isRecovering ? 4.2 * recoveryFactor : 4.2;
      jitter = pseudoNoise(stepSeed + 20) * noiseAmp;
    } else if (faultType === 'SENSOR_DROPOUT' && fault?.targetSensor === 'PRESSURE') {
      press = isRecovering ? 961.2 * (1 - recoveryFactor) : 0.0;
      jitter = 0;
    } else if (faultType === 'SENSOR_DISAGREEMENT' && fault?.targetSensor === 'PRESSURE') {
      press += (isRecovering ? -15.0 * recoveryFactor : -15.0);
    }

    const currentPress = Math.max(0, press + jitter);
    const history = [...(prevSensors.PRESSURE.history || [])];
    if (history.length > 600) history.shift();
    history.push({
      timestamp: parseFloat(timeSec.toFixed(1)),
      value: parseFloat(currentPress.toFixed(1)),
      quality: prevSensors.PRESSURE.qualityScore,
      status: prevSensors.PRESSURE.status,
      nominalMin: 957,
      nominalMax: 965,
      baseline: 961.2,
    });

    nextSensors.PRESSURE = {
      ...prevSensors.PRESSURE,
      primaryValue: parseFloat(currentPress.toFixed(1)),
      timestamp: timeSec,
      lastUpdateEpoch: (faultType === 'STALE_DATA') ? prevSensors.PRESSURE.lastUpdateEpoch : now,
      history,
    };
  }

  // 4. TEMPERATURE (Baseline: 34.6 °C, Nominal: [25, 48] °C)
  {
    const stepSeed = timeSec * 5;
    const { fault, isRecovering, recoveryFactor } = getFaultInfo('TEMPERATURE');
    const faultType = fault?.type;
    const elapsedFaultSec = fault?.injectionSimTime ? Math.max(0, timeSec - fault.injectionSimTime) : 0;

    let jitter = pseudoNoise(stepSeed + 30) * 0.2 * noiseScale;
    const harmonic = (Math.sin(timeSec * 0.9) * 4.2 + Math.cos(timeSec * 2.2) * 1.5) * driftScale;
    let temp = 34.6 + harmonic;

    if (faultType === 'TEMPERATURE_SPIKE' || (faultType === 'SENSOR_BIAS' && fault?.targetSensor === 'TEMPERATURE')) {
      const spike = isRecovering ? 38.0 * recoveryFactor : 38.0;
      temp += spike; // Jumps to ~72.6°C
    } else if (faultType === 'SENSOR_DRIFT' && fault?.targetSensor === 'TEMPERATURE') {
      const drift = isRecovering ? (elapsedFaultSec * 2.2) * recoveryFactor : elapsedFaultSec * 2.2;
      temp += drift;
    } else if (faultType === 'NOISE_INCREASE' && fault?.targetSensor === 'TEMPERATURE') {
      const noiseAmp = isRecovering ? 8.0 * recoveryFactor : 8.0;
      jitter = pseudoNoise(stepSeed + 30) * noiseAmp;
    } else if (faultType === 'SENSOR_DROPOUT' && fault?.targetSensor === 'TEMPERATURE') {
      temp = isRecovering ? 34.6 * (1 - recoveryFactor) : 0.0;
      jitter = 0;
    } else if (faultType === 'STALE_DATA' && fault?.targetSensor === 'TEMPERATURE') {
      temp = prevSensors.TEMPERATURE.primaryValue;
      jitter = 0;
    }

    const currentTemp = temp + jitter;
    const history = [...(prevSensors.TEMPERATURE.history || [])];
    if (history.length > 600) history.shift();
    history.push({
      timestamp: parseFloat(timeSec.toFixed(1)),
      value: parseFloat(currentTemp.toFixed(1)),
      quality: prevSensors.TEMPERATURE.qualityScore,
      status: prevSensors.TEMPERATURE.status,
      nominalMin: 25,
      nominalMax: 48,
      baseline: 34.6,
    });

    nextSensors.TEMPERATURE = {
      ...prevSensors.TEMPERATURE,
      primaryValue: parseFloat(currentTemp.toFixed(1)),
      timestamp: timeSec,
      lastUpdateEpoch: (faultType === 'STALE_DATA' && fault?.targetSensor === 'TEMPERATURE') ? prevSensors.TEMPERATURE.lastUpdateEpoch : now,
      history,
    };
  }

  // 5. POWER (Baseline: 24.1 V, Nominal: [22, 26] V)
  {
    const stepSeed = timeSec * 8;
    const { fault, isRecovering, recoveryFactor } = getFaultInfo('POWER');
    const faultType = fault?.type;

    let jitter = pseudoNoise(stepSeed + 40) * 0.06 * noiseScale;
    const harmonic = (Math.sin(timeSec * 1.8) * 0.85 + Math.cos(timeSec * 4.2) * 0.3) * driftScale;
    let vBus = 24.1 + harmonic;

    if (faultType === 'POWER_DEGRADATION' || (faultType === 'SENSOR_BIAS' && fault?.targetSensor === 'POWER')) {
      const drop = isRecovering ? 4.7 * recoveryFactor : 4.7;
      vBus -= drop; // Drops to 19.4V
    }

    const currentV = Math.max(0, vBus + jitter);
    const history = [...(prevSensors.POWER.history || [])];
    if (history.length > 600) history.shift();
    history.push({
      timestamp: parseFloat(timeSec.toFixed(1)),
      value: parseFloat(currentV.toFixed(2)),
      quality: prevSensors.POWER.qualityScore,
      status: prevSensors.POWER.status,
      nominalMin: 22.0,
      nominalMax: 26.0,
      baseline: 24.1,
    });

    nextSensors.POWER = {
      ...prevSensors.POWER,
      primaryValue: parseFloat(currentV.toFixed(2)),
      timestamp: timeSec,
      lastUpdateEpoch: now,
      history,
    };
  }

  // 6. MAGNETOMETER (Baseline: 142.5 deg, Nominal: [135, 150] deg)
  {
    const stepSeed = timeSec * 7;
    const { fault, isRecovering, recoveryFactor } = getFaultInfo('MAGNETOMETER');
    const faultType = fault?.type;
    const elapsedFaultSec = fault?.injectionSimTime ? Math.max(0, timeSec - fault.injectionSimTime) : 0;

    let jitter = pseudoNoise(stepSeed + 50) * 0.3 * noiseScale;
    const harmonic = (Math.sin(timeSec * 1.4) * 4.2 + Math.cos(timeSec * 3.2) * 1.6) * driftScale;
    let heading = 142.5 + harmonic;

    if (faultType === 'SENSOR_DISAGREEMENT' || (faultType === 'SENSOR_BIAS' && fault?.targetSensor === 'MAGNETOMETER')) {
      const shift = isRecovering ? 45.0 * recoveryFactor : 45.0;
      heading += shift; // Shifts to 187.5 deg
    } else if (faultType === 'SENSOR_DRIFT' && fault?.targetSensor === 'MAGNETOMETER') {
      const drift = isRecovering ? (elapsedFaultSec * 4.5) * recoveryFactor : elapsedFaultSec * 4.5;
      heading += drift;
    } else if (faultType === 'NOISE_INCREASE' && fault?.targetSensor === 'MAGNETOMETER') {
      const noiseAmp = isRecovering ? 18.0 * recoveryFactor : 18.0;
      jitter = pseudoNoise(stepSeed + 50) * noiseAmp;
    } else if (faultType === 'SENSOR_DROPOUT' && fault?.targetSensor === 'MAGNETOMETER') {
      heading = isRecovering ? 142.5 * (1 - recoveryFactor) : 0.0;
      jitter = 0;
    } else if (faultType === 'STALE_DATA' && fault?.targetSensor === 'MAGNETOMETER') {
      heading = prevSensors.MAGNETOMETER.primaryValue;
      jitter = 0;
    }

    const currentHeading = Math.max(0, heading + jitter);
    const history = [...(prevSensors.MAGNETOMETER.history || [])];
    if (history.length > 600) history.shift();
    history.push({
      timestamp: parseFloat(timeSec.toFixed(1)),
      value: parseFloat(currentHeading.toFixed(1)),
      quality: prevSensors.MAGNETOMETER.qualityScore,
      status: prevSensors.MAGNETOMETER.status,
      nominalMin: 135,
      nominalMax: 150,
      baseline: 142.5,
    });

    nextSensors.MAGNETOMETER = {
      ...prevSensors.MAGNETOMETER,
      primaryValue: parseFloat(currentHeading.toFixed(1)),
      timestamp: timeSec,
      lastUpdateEpoch: (faultType === 'STALE_DATA' && fault?.targetSensor === 'MAGNETOMETER') ? prevSensors.MAGNETOMETER.lastUpdateEpoch : now,
      history,
    };
  }

  // 7. ENVIRONMENT / MMW Proximity (Baseline: 12.4 m, Nominal: [8.0, 16.0] m)
  {
    const stepSeed = timeSec * 4;
    const { fault, isRecovering, recoveryFactor } = getFaultInfo('ENVIRONMENT');
    const faultType = fault?.type;
    const elapsedFaultSec = fault?.injectionSimTime ? Math.max(0, timeSec - fault.injectionSimTime) : 0;

    let jitter = pseudoNoise(stepSeed + 60) * 0.15 * noiseScale;
    const harmonic = (Math.sin(timeSec * 1.5) * 2.4 + Math.cos(timeSec * 3.6) * 1.0) * driftScale;
    let standoff = 12.4 + harmonic;

    if (faultType === 'COMMUNICATION_INTERRUPTION' || (faultType === 'SENSOR_DROPOUT' && fault?.targetSensor === 'ENVIRONMENT')) {
      standoff = isRecovering ? 12.4 * (1 - recoveryFactor) : 0.0;
      jitter = 0;
    } else if (faultType === 'SENSOR_BIAS' && fault?.targetSensor === 'ENVIRONMENT') {
      const bias = isRecovering ? 12.0 * recoveryFactor : 12.0;
      standoff += bias; // Shifts to 24.4 m
    } else if (faultType === 'SENSOR_DRIFT' && fault?.targetSensor === 'ENVIRONMENT') {
      const drift = isRecovering ? (elapsedFaultSec * 1.5) * recoveryFactor : elapsedFaultSec * 1.5;
      standoff += drift;
    } else if (faultType === 'NOISE_INCREASE' && fault?.targetSensor === 'ENVIRONMENT') {
      const noiseAmp = isRecovering ? 3.5 * recoveryFactor : 3.5;
      jitter = pseudoNoise(stepSeed + 60) * noiseAmp;
    } else if (faultType === 'STALE_DATA' && fault?.targetSensor === 'ENVIRONMENT') {
      standoff = prevSensors.ENVIRONMENT.primaryValue;
      jitter = 0;
    } else if (faultType === 'SENSOR_DISAGREEMENT' && fault?.targetSensor === 'ENVIRONMENT') {
      standoff += (isRecovering ? 10.0 * recoveryFactor : 10.0);
    }

    const currentStandoff = Math.max(0, standoff + jitter);
    const history = [...(prevSensors.ENVIRONMENT.history || [])];
    if (history.length > 600) history.shift();
    history.push({
      timestamp: parseFloat(timeSec.toFixed(1)),
      value: parseFloat(currentStandoff.toFixed(1)),
      quality: prevSensors.ENVIRONMENT.qualityScore,
      status: prevSensors.ENVIRONMENT.status,
      nominalMin: 8.0,
      nominalMax: 16.0,
      baseline: 12.4,
    });

    nextSensors.ENVIRONMENT = {
      ...prevSensors.ENVIRONMENT,
      primaryValue: parseFloat(currentStandoff.toFixed(1)),
      timestamp: timeSec,
      lastUpdateEpoch: (faultType === 'STALE_DATA' && fault?.targetSensor === 'ENVIRONMENT') ? prevSensors.ENVIRONMENT.lastUpdateEpoch : now,
      history,
    };
  }

  return nextSensors;
}
