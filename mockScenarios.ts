import { FaultType } from '../types/sensor';

export interface ScenarioDefinition {
  id: string;
  name: string;
  description: string;
  primaryFault: FaultType;
  expectedBehavior: string;
  recommendedValidation: string;
}

export const MOCK_SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'SCEN-NORMAL',
    name: 'Normal Operation',
    description: 'All 6 simulated sensor streams operate within normal bounds. Dual-sensor weighted fusion active.',
    primaryFault: 'NONE',
    expectedBehavior: 'System health index > 92, OBDS status NORMAL, 0 active diagnostic alerts.',
    recommendedValidation: 'General health baseline verification.',
  },
  {
    id: 'SCEN-GNSS-LOSS',
    name: 'GNSS Degradation',
    description: 'Simulates signal dropout, satellites fall to 0, HDOP invalidates.',
    primaryFault: 'GNSS_LOSS',
    expectedBehavior: 'GNSS transitions to FAILED, state estimator activates baro-altimetric fallback, OBDS issues ERROR alert.',
    recommendedValidation: 'TEST-002: GNSS Loss Detection',
  },
  {
    id: 'SCEN-DROPOUT',
    name: 'Sensor Dropout',
    description: 'Simulates peripheral disconnection resulting in complete frame loss on sensor bus.',
    primaryFault: 'SENSOR_DROPOUT',
    expectedBehavior: 'Target sensor status transitions to UNAVAILABLE/DROPOUT. OBDS flags interface failure.',
    recommendedValidation: 'TEST-002: Sensor Dropout Isolation',
  },
  {
    id: 'SCEN-IMU-BIAS',
    name: 'IMU Bias',
    description: 'Inertial Z-axis accelerometer experiences unphysical 1.8G baseline offset.',
    primaryFault: 'IMU_BIAS',
    expectedBehavior: 'Validation flags rate-of-change/physical limit violation. Position confidence decreases.',
    recommendedValidation: 'TEST-003: IMU Bias Detection',
  },
  {
    id: 'SCEN-STALE-DATA',
    name: 'Stale Sensor Data',
    description: 'Sensor sample timestamp freeze exceeds 1800ms refresh threshold.',
    primaryFault: 'STALE_DATA',
    expectedBehavior: 'Sensor status becomes STALE. OBDS triggers latency timeout warning.',
    recommendedValidation: 'TEST-001: Stale Sensor Detection',
  },
  {
    id: 'SCEN-POWER-SAG',
    name: 'Power Degradation',
    description: 'Main 24V supply drops to 19.4V under high simulated electrical load.',
    primaryFault: 'POWER_DEGRADATION',
    expectedBehavior: 'Power supervisor alerts brownout condition. Health index drops proportionally.',
    recommendedValidation: 'TEST-006: Power Degradation Response',
  },
  {
    id: 'SCEN-COMM-LOSS',
    name: 'Communication Loss',
    description: 'Simulates RF interference causing telemetry packet loss rate to exceed 80%.',
    primaryFault: 'COMMUNICATION_INTERRUPTION',
    expectedBehavior: 'Telemetry state becomes INTERRUPTED, packet buffer queues, warning logged.',
    recommendedValidation: 'TEST-005: Communication Interruption Detection',
  },
];
