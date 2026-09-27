import { DigitalTwinState, SubsystemId, SubsystemState } from '../types/digitalTwin';
import { SensorData, SensorType } from '../types/sensor';
import { StateEstimation } from '../types/digitalTwin';
import { ObdsState } from '../types/diagnostics';
import { CommState } from '../types/telemetry';

export function createInitialSubsystems(): Record<SubsystemId, SubsystemState> {
  return {
    ACQUISITION: {
      id: 'ACQUISITION',
      name: 'Simulated Sensor Acquisition Unit',
      category: 'Data Ingest',
      health: 98,
      confidence: 96,
      status: 'NORMAL',
      inputs: ['IMU 200Hz ADC', 'GNSS NMEA Frame', 'Baro SPI Stream', 'Thermal ADC'],
      outputs: ['Normalized Raw Sensor Telemetry Packets'],
      lastEvent: 'All 7 local mock transducers synchronized at 200 Hz reference baseline',
      implementationStatus: 'IMPLEMENTED',
      keyMetrics: { 'Sample Rate': '200 Hz ref', 'Active Channels': 7, 'Jitter': '< 0.2 ms' },
    },
    VALIDATION_UNIT: {
      id: 'VALIDATION_UNIT',
      name: 'Deterministic Data Validation Engine',
      category: 'Signal Integrity',
      health: 97,
      confidence: 95,
      status: 'NORMAL',
      inputs: ['Normalized Raw Sensor Samples', 'Nominal Calibration Bounds'],
      outputs: ['Quality Score', 'Confidence Metrics', 'Validation Rejection Flags'],
      lastEvent: 'Range, timestamp freshness, and rate-of-change screening nominal',
      implementationStatus: 'IMPLEMENTED',
      keyMetrics: { 'Rejection Rate': '0.0%', 'Check Cycle Time': '1.2 ms', 'Stale Timeout': '1800 ms' },
    },
    STATE_ESTIMATOR: {
      id: 'STATE_ESTIMATOR',
      name: 'State Estimation & Multi-Sensor Fusion',
      category: 'Navigation & Dynamics',
      health: 96,
      confidence: 94,
      status: 'NORMAL',
      inputs: ['Validated GNSS Fix', 'IMU Tri-Axis Dynamics', 'Barometric Static Air Data'],
      outputs: ['Position Vector', 'Motion Vector', 'Attitude / Orientation State'],
      lastEvent: 'Dual-sensor weighted fusion active with 94% confidence',
      implementationStatus: 'IMPLEMENTED',
      keyMetrics: { 'Fusion Mode': 'GNSS + Baro Weighted', 'Alt Uncertainty': '±0.8 m', 'Heading Error': '±1.2°' },
    },
    OBDS_DIAGNOSTICS: {
      id: 'OBDS_DIAGNOSTICS',
      name: 'On-Board Diagnostic System (OBDS)',
      category: 'Health & Fault Isolation',
      health: 99,
      confidence: 98,
      status: 'NORMAL',
      inputs: ['Subsystem Heartbeats', 'Sensor Validation Flags', 'Voltage/Thermal Monitors'],
      outputs: ['Diagnostic Event Stream', 'Fault Isolation Matrix', 'Built-In Test (BIT) State'],
      lastEvent: 'Periodic Built-In Test passed with 0 active anomalies',
      implementationStatus: 'IMPLEMENTED',
      keyMetrics: { 'Active Faults': 0, 'BIT Status': 'PASSED', 'Simulated Detection Latency': '34.2 ms' },
    },
    TELEMETRY_LINK: {
      id: 'TELEMETRY_LINK',
      name: 'Simulated Low-Power Wireless Telemetry Link',
      category: 'Communication',
      health: 98,
      confidence: 95,
      status: 'NORMAL',
      inputs: ['Telemetry Packets', 'Diagnostic Event Frames', 'Health Index Summaries'],
      outputs: ['Simulated 10 Hz Ground Monitoring Stream'],
      lastEvent: 'Telemetry packet stream connected with 0.05% packet loss',
      implementationStatus: 'SIMULATED',
      keyMetrics: { 'Downlink Rate': '115.2 kbps', 'Packet Loss': '0.05%', 'RSSI': '-68 dBm' },
    },
    POWER_BUS: {
      id: 'POWER_BUS',
      name: 'Regulated Electrical Power & Distribution',
      category: 'Electrical',
      health: 98,
      confidence: 98,
      status: 'NORMAL',
      inputs: ['Primary 24V Rail', 'Auxiliary Battery Backup'],
      outputs: ['Regulated 5V, 3.3V Logic Rails', 'Overcurrent Protection'],
      lastEvent: 'Main rail stable at 24.1V, current draw 1.45A',
      implementationStatus: 'IMPLEMENTED',
      keyMetrics: { 'Rail Voltage': '24.1 V', 'Current Draw': '1.45 A', 'Battery Reserve': '94.2%' },
    },
    ENVIRONMENTAL_SHIELD: {
      id: 'ENVIRONMENTAL_SHIELD',
      name: 'Environmental Thermal & Mechanical Envelope',
      category: 'Structural Protection',
      health: 99,
      confidence: 97,
      status: 'NORMAL',
      inputs: ['Chassis Thermistors', 'Proximity Acoustic Sensor', 'Vibration Envelope'],
      outputs: ['Thermal Margin Alerts', 'Shock/Clearance Advisory'],
      lastEvent: 'Core PCB temp at 34.6°C, within 65°C safe operating limit',
      implementationStatus: 'SIMULATED',
      keyMetrics: { 'Core PCB': '34.6 °C', 'Vibration': '0.08 G RMS', 'Clearance': '12.4 m' },
    },
  };
}

export function updateDigitalTwin(
  prevTwin: DigitalTwinState,
  sensors: Record<SensorType, SensorData>,
  stateEstimation: StateEstimation,
  obdsState: ObdsState,
  commState: CommState,
  systemHealthIndex: number,
  validationPassRate: number,
  timeSec: number
): DigitalTwinState {
  const subsystems = { ...prevTwin.subsystems };

  // Calculate sensor availability
  const sensorArray = Object.values(sensors);
  const availableSensors = sensorArray.filter((s) => s.status !== 'FAILED' && s.status !== 'UNAVAILABLE');
  const sensorAvailability = Math.round((availableSensors.length / sensorArray.length) * 100);

  // Calculate average data quality
  const avgDataQuality = Math.round(sensorArray.reduce((acc, s) => acc + s.qualityScore, 0) / sensorArray.length);

  // Update Acquisition Subsystem
  const acqHealth = Math.round((sensorAvailability * 0.6 + avgDataQuality * 0.4));
  subsystems.ACQUISITION = {
    ...subsystems.ACQUISITION,
    health: acqHealth,
    status: acqHealth < 60 ? 'FAILED' : acqHealth < 80 ? 'DEGRADED' : acqHealth < 90 ? 'WARNING' : 'NORMAL',
    keyMetrics: {
      ...subsystems.ACQUISITION.keyMetrics,
      'Available Sensors': `${availableSensors.length}/${sensorArray.length}`,
      'Average Quality': `${avgDataQuality}%`,
    },
    lastEvent: availableSensors.length < sensorArray.length ? 'Sensor channel dropout detected' : 'All channels active',
  };

  // Update State Estimator
  const estConf = stateEstimation.confidence;
  subsystems.STATE_ESTIMATOR = {
    ...subsystems.STATE_ESTIMATOR,
    health: estConf,
    confidence: estConf,
    status: estConf < 60 ? 'DEGRADED' : estConf < 85 ? 'WARNING' : 'NORMAL',
    lastEvent: stateEstimation.degradationReason || 'Dual-sensor state fusion nominal',
    keyMetrics: {
      'Fusion Mode': stateEstimation.fusionMethod.includes('FALLBACK') ? 'DEGRADED FALLBACK' : 'DUAL-SENSOR FUSION',
      'Position Conf': `${estConf}%`,
      'Estimated Alt': `${stateEstimation.positionEstimate.altitudeM} m`,
    },
  };

  // Update OBDS
  subsystems.OBDS_DIAGNOSTICS = {
    ...subsystems.OBDS_DIAGNOSTICS,
    health: obdsState.status === 'NORMAL' ? 99 : obdsState.status === 'WARNING' ? 82 : 60,
    status: obdsState.status,
    lastEvent: obdsState.activeFaultCount > 0 ? `${obdsState.activeFaultCount} active diagnostic fault(s) isolated` : 'Continuous Built-In Test passed',
    keyMetrics: {
      'Active Faults': obdsState.activeFaultCount,
      'BIT Status': obdsState.builtInTestStatus,
      'Isolation Confidence': `${obdsState.isolationConfidence}%`,
    },
  };

  // Update Telemetry Link
  const commHealth = commState === 'OPTIMAL' ? 98 : commState === 'DEGRADED' ? 65 : 20;
  subsystems.TELEMETRY_LINK = {
    ...subsystems.TELEMETRY_LINK,
    health: commHealth,
    status: commState === 'OPTIMAL' ? 'NORMAL' : commState === 'DEGRADED' ? 'WARNING' : 'FAILED',
    lastEvent: commState === 'INTERRUPTED' ? 'Downlink interrupted' : '10 Hz ground stream synchronized',
  };

  // Update Power Subsystem
  const vBus = sensors.POWER.fields.busVoltage?.value ?? 24.1;
  const powerHealth = vBus < 21.0 ? 35 : vBus < 22.5 ? 70 : 98;
  subsystems.POWER_BUS = {
    ...subsystems.POWER_BUS,
    health: powerHealth,
    status: powerHealth < 50 ? 'FAILED' : powerHealth < 80 ? 'WARNING' : 'NORMAL',
    keyMetrics: {
      'Rail Voltage': `${vBus.toFixed(2)} V`,
      'Current Draw': `${sensors.POWER.fields.currentA?.value ?? 1.45} A`,
      'Battery Reserve': `${sensors.POWER.fields.batteryLevel?.value ?? 94}%`,
    },
  };

  // Update Environmental Shield
  const pcbTemp = sensors.TEMPERATURE.fields.pcbTemp?.value ?? 34.6;
  const envHealth = pcbTemp > 65 ? 40 : pcbTemp > 50 ? 75 : 98;
  subsystems.ENVIRONMENTAL_SHIELD = {
    ...subsystems.ENVIRONMENTAL_SHIELD,
    health: envHealth,
    status: envHealth < 50 ? 'FAILED' : envHealth < 80 ? 'WARNING' : 'NORMAL',
    keyMetrics: {
      'Core PCB Temp': `${pcbTemp.toFixed(1)} °C`,
      'Safe Max': '65 °C',
      'Vibration': `${sensors.ENVIRONMENT.fields.chassisVibration?.value ?? 0.08} G RMS`,
    },
  };

  // Sensor Health map
  const sensorHealth: Record<SensorType, any> = {} as any;
  for (const [key, s] of Object.entries(sensors)) {
    sensorHealth[key as SensorType] = s.status;
  }

  let simState: 'IDLE' | 'RUNNING' | 'PAUSED' | 'FAULT_INJECTED' | 'RECOVERING' = 'RUNNING';
  if (obdsState.activeFaultCount > 0) {
    simState = 'FAULT_INJECTED';
  }

  return {
    timestamp: timeSec,
    systemMode: 'R&D_SIMULATION',
    sensorHealth,
    sensorAvailability,
    dataQuality: avgDataQuality,
    stateEstimation,
    powerState: {
      voltageV: vBus,
      currentA: sensors.POWER.fields.currentA?.value ?? 1.45,
      healthPercent: powerHealth,
    },
    communicationState: commState,
    diagnosticState: obdsState.status,
    systemHealthIndex,
    validationPassRate,
    simulationState: simState,
    subsystems,
  };
}
