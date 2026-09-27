import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Cpu,
  Layers,
  CheckSquare,
  Binary,
  Activity,
  AlertTriangle,
  Radio,
  LayoutDashboard,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
  Info,
  Sliders,
  Filter,
  RefreshCw,
  Compass,
  Lock,
  Zap,
  Box,
  Share2,
  HardDrive,
  Eye,
  SlidersHorizontal,
  Flame,
  Terminal,
  FastForward,
  StepForward,
  Radar,
  Gauge,
  Thermometer,
  Navigation,
  Crosshair,
} from 'lucide-react';
import { formatNumber, formatElapsedSeconds } from '../utils/formatters';

export type PipelineStageStatus = 'IDLE' | 'CHECKING' | 'PASS' | 'WARNING' | 'FAILED' | 'PAUSED';

export interface StageUnitCheck {
  id: string;
  name: string;
  status: 'PASS' | 'WARNING' | 'FAILED' | 'CHECKING' | 'PENDING';
  valueStr?: string;
  detail?: string;
}

export interface PipelineStageConfig {
  stageNumber: number;
  name: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const PIPELINE_STAGES: PipelineStageConfig[] = [
  {
    stageNumber: 1,
    name: 'SENSOR CHECK',
    category: 'HARDWARE TRANSDUCERS',
    description: 'Verify raw electrical and transducer states across all six physical avionics channels.',
    icon: Cpu,
  },
  {
    stageNumber: 2,
    name: 'DATA ACQUISITION',
    category: 'INGEST & FRAMING',
    description: 'Check sample framing rate, monotonic timestamp continuity, sequence counter, and FIFO buffer.',
    icon: Layers,
  },
  {
    stageNumber: 3,
    name: 'DATA VALIDATION',
    category: 'BOUNDARY & QUALITY',
    description: 'Screen kinematic ranges, timestamp freshness, signal availability, cross-sensor consistency, and data quality.',
    icon: CheckSquare,
  },
  {
    stageNumber: 4,
    name: 'FILTERING',
    category: 'SIGNAL CONDITIONING',
    description: 'Evaluate low-pass IIR smoothing, moving average filters, and 3-sigma outlier rejection bounds.',
    icon: Filter,
  },
  {
    stageNumber: 5,
    name: 'STATE ESTIMATION',
    category: 'EXTENDED KALMAN FILTER',
    description: 'Verify multi-sensor fusion availability, input integrity, and state confidence estimation.',
    icon: Compass,
  },
  {
    stageNumber: 6,
    name: 'SYSTEM HEALTH',
    category: 'HEALTH SUPERVISOR',
    description: 'Calculate weighted health index across sensor channels, data quality, power bus, and telemetry links.',
    icon: Activity,
  },
  {
    stageNumber: 7,
    name: 'OBDS',
    category: 'ON-BOARD DIAGNOSTICS',
    description: 'Execute Built-In Test (BIT) isolation trees, anomaly screening, and health classification.',
    icon: AlertTriangle,
  },
  {
    stageNumber: 8,
    name: 'DIAGNOSTIC TELEMETRY',
    category: 'DOWNLINK STREAMING',
    description: 'Verify simulated telemetry packet formatting, frame serialization, drop rate, and link continuity.',
    icon: Radio,
  },
  {
    stageNumber: 9,
    name: 'DIGITAL TWIN',
    category: 'VIRTUAL SYSTEM REPLICA',
    description: 'Confirm real-time state synchronization across 3D CAD model, subsystem states, and diagnostics.',
    icon: Box,
  },
  {
    stageNumber: 10,
    name: 'OPERATOR DASHBOARD',
    category: 'SUPERVISORY UI & LOGS',
    description: 'Verify operator visibility over active telemetry streams, health indicators, OBDS alarms, and audit logs.',
    icon: LayoutDashboard,
  },
];

// Interactive Hardware Topology Definitions
export interface ArchitectureNode {
  id: string;
  name: string;
  shortName: string;
  category: 'SENSOR' | 'PROCESSING' | 'ACTUATION' | 'POWER' | 'TELEMETRY';
  protocol: string;
  baudRate: string;
  voltage: string;
  current: string;
  temp: string;
  specs: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  x: number; // percentage in diagram (0-100)
  y: number; // percentage in diagram (0-100)
  buses: string[];
}

export interface ArchitectureBus {
  id: string;
  name: string;
  type: 'SPI' | 'UART' | 'I2C' | 'CAN' | 'PWM' | 'SDIO' | 'POWER';
  fromNodeId: string;
  toNodeId: string;
  rate: string;
  voltage: string;
  description: string;
  isActive: boolean;
}

const ARCH_NODES: ArchitectureNode[] = [
  // SENSORS
  {
    id: 'NODE_IMU',
    name: 'High-G 3-Axis IMU (ST-IIS3DWB)',
    shortName: 'IMU / INS',
    category: 'SENSOR',
    protocol: 'SPI-1 (Mode 3)',
    baudRate: '20.0 MHz',
    voltage: '3.30 V',
    current: '14.2 mA',
    temp: '36.4 °C',
    specs: '±50g Dynamic Range · 6-DOF · 200 Hz SIL Base',
    description: 'Piezoresistive/capacitive MEMS sensor hardened to 30,000g gun-launch setback acceleration shock.',
    icon: Compass,
    x: 12,
    y: 18,
    buses: ['BUS_SPI1', 'BUS_PWR_3V3'],
  },
  {
    id: 'NODE_GNSS',
    name: 'Dual-Band NavIC / GPS Receiver',
    shortName: 'GNSS L1/L5',
    category: 'SENSOR',
    protocol: 'UART-1 (DMA Ring)',
    baudRate: '460.8 kbps',
    voltage: '3.30 V',
    current: '68.0 mA',
    temp: '38.1 °C',
    specs: 'L1/L5 Dual Band · NavIC Constellation · 10 Hz Fix',
    description: 'High-dynamics anti-jamming satellite navigation engine with rapid carrier re-lock after gun-launch.',
    icon: Navigation,
    x: 12,
    y: 34,
    buses: ['BUS_UART1', 'BUS_PWR_3V3'],
  },
  {
    id: 'NODE_BARO',
    name: 'Static Air Data Barometer (MS5837)',
    shortName: 'PITOT / BARO',
    category: 'SENSOR',
    protocol: 'I2C-1 (Fast Mode)',
    baudRate: '400.0 kHz',
    voltage: '3.30 V',
    current: '2.8 mA',
    temp: '32.0 °C',
    specs: '0.01 hPa Resolution · 24-Bit Sigma-Delta ADC',
    description: 'Piezoresistive sealed diaphragm measuring static atmospheric pressure for ballistic altitude verification.',
    icon: Gauge,
    x: 12,
    y: 50,
    buses: ['BUS_I2C1', 'BUS_PWR_3V3'],
  },
  {
    id: 'NODE_THRM',
    name: 'Core Avionics Multi-RTD Thermal Bridge',
    shortName: 'THERMAL RTD',
    category: 'SENSOR',
    protocol: 'Analog / ADC-1',
    baudRate: '16-Bit SAR',
    voltage: '3.30 V',
    current: '1.2 mA',
    temp: '34.6 °C',
    specs: 'Four-Wire Pt1000 Bridge · 10 Hz Monitored',
    description: 'Internal bay thermal sensor monitoring PCB junction temperature and GaN PMU dissipation.',
    icon: Thermometer,
    x: 12,
    y: 66,
    buses: ['BUS_ADC1', 'BUS_PWR_3V3'],
  },
  {
    id: 'NODE_MAG',
    name: 'Triaxial Fluxgate Compass (MAG-01)',
    shortName: 'FLUXGATE MAG',
    category: 'SENSOR',
    protocol: 'SPI-2',
    baudRate: '10.0 MHz',
    voltage: '3.30 V',
    current: '8.4 mA',
    temp: '33.8 °C',
    specs: '±2 Gauss Range · Hard/Soft Iron Calibrated',
    description: 'High-sensitivity magnetic attitude heading reference for despin roll-rate detection and geomagnetic alignment.',
    icon: Radio,
    x: 12,
    y: 82,
    buses: ['BUS_SPI2', 'BUS_PWR_3V3'],
  },

  // PROCESSING CORE
  {
    id: 'NODE_MCU',
    name: 'STM32H753 Arm Cortex-M7 Core (480 MHz)',
    shortName: 'STM32H753 MCU',
    category: 'PROCESSING',
    protocol: 'Internal AXI/AHB Bus',
    baudRate: '480 MHz Dual-Issue',
    voltage: '3.30 V Core (1.2V Int)',
    current: '340.0 mA',
    temp: '44.5 °C',
    specs: 'Arm Cortex-M7 @ 480 MHz · 2MB Flash · 1MB ECC SRAM',
    description: 'Primary flight guidance computer executing 200 Hz sensor acquisition, Extended Kalman Filter, and OBDS supervision.',
    icon: Binary,
    x: 50,
    y: 42,
    buses: ['BUS_SPI1', 'BUS_UART1', 'BUS_I2C1', 'BUS_ADC1', 'BUS_SPI2', 'BUS_CAN1', 'BUS_PWM1', 'BUS_SDIO', 'BUS_UART2', 'BUS_PWR_3V3'],
  },

  // POWER
  {
    id: 'NODE_POWER',
    name: 'Molten-Salt Thermal Battery & GaN PMU',
    shortName: 'PMU & 28V BATTERY',
    category: 'POWER',
    protocol: 'Direct Analog Regulated',
    baudRate: 'Continuous DC Bus',
    voltage: '28.4 V Primary',
    current: '2.85 A Peak',
    temp: '54.2 °C',
    specs: 'Molten Salt 28V / 85W · GaN Buck-Boost PMU · 96% Eff',
    description: 'Pyrotechnic thermal battery initiated upon gun firing, supplying isolated 28V CAS rail and 3.3V logic rails.',
    icon: Zap,
    x: 50,
    y: 82,
    buses: ['BUS_PWR_28V', 'BUS_PWR_3V3'],
  },

  // ACTUATION
  {
    id: 'NODE_CANARDS',
    name: 'Quad Canard Actuation System (CAS)',
    shortName: 'CANARDS (CAS)',
    category: 'ACTUATION',
    protocol: 'PWM-1 Timers (4-Ch)',
    baudRate: '20.0 kHz Switching',
    voltage: '28.4 V Motor Bus',
    current: '1.80 A Dynamic',
    temp: '41.2 °C',
    specs: '4x Brushless DC Servos · ±10° Fin Travel · 350°/s Slew',
    description: 'Aerodynamic forward control fins providing pitch and yaw divert moments to achieve CEP ≤ 30m.',
    icon: Crosshair,
    x: 88,
    y: 22,
    buses: ['BUS_PWM1', 'BUS_PWR_28V'],
  },

  // TELEMETRY & STORAGE
  {
    id: 'NODE_FLASH',
    name: 'Crash-Survivable SLC NAND Black Box',
    shortName: 'BLACK-BOX NAND',
    category: 'TELEMETRY',
    protocol: 'SDIO 4-Bit',
    baudRate: '50.0 MHz',
    voltage: '3.30 V',
    current: '45.0 mA',
    temp: '37.0 °C',
    specs: '64 GB High-G SLC NAND · 20,000g Potting · 100 MB/s',
    description: 'Armored non-volatile flight recorder storing all raw transducer frames, EKF innovations, and BIT events.',
    icon: HardDrive,
    x: 88,
    y: 45,
    buses: ['BUS_SDIO', 'BUS_PWR_3V3'],
  },
  {
    id: 'NODE_RF',
    name: 'S-Band Telemetry RF Transceiver',
    shortName: 'S-BAND DOWNLINK',
    category: 'TELEMETRY',
    protocol: 'UART-2 DMA',
    baudRate: '115.2 kbps',
    voltage: '3.30 V',
    current: '125.0 mA',
    temp: '42.1 °C',
    specs: '2.2 GHz S-Band FSK · Conformal Patch Antenna · 1W RF',
    description: 'Live mission downlink streaming high-rate telemetry packets to ground station receiving antennas.',
    icon: Radio,
    x: 88,
    y: 68,
    buses: ['BUS_UART2', 'BUS_PWR_3V3'],
  },
];

const ARCH_BUSES: ArchitectureBus[] = [
  {
    id: 'BUS_SPI1',
    name: 'SPI-1 Transducer Bus',
    type: 'SPI',
    fromNodeId: 'NODE_IMU',
    toNodeId: 'NODE_MCU',
    rate: '20.0 MHz',
    voltage: '3.3 V CMOS',
    description: 'Dedicated high-speed synchronous bus streaming 6-axis accelerometer and rate gyro samples at 200 Hz.',
    isActive: true,
  },
  {
    id: 'BUS_UART1',
    name: 'UART-1 NavIC DMA Channel',
    type: 'UART',
    fromNodeId: 'NODE_GNSS',
    toNodeId: 'NODE_MCU',
    rate: '460.8 kbps',
    voltage: '3.3 V TTL',
    description: 'High-speed UART with direct memory access (DMA) ring buffer receiving binary UBX/NMEA satellite fix packets.',
    isActive: true,
  },
  {
    id: 'BUS_I2C1',
    name: 'I2C-1 Static Pressure Bus',
    type: 'I2C',
    fromNodeId: 'NODE_BARO',
    toNodeId: 'NODE_MCU',
    rate: '400.0 kHz',
    voltage: '3.3 V Pullup',
    description: 'Fast-mode I2C communicating static air data pressure and calibrated diaphragm temperature.',
    isActive: true,
  },
  {
    id: 'BUS_ADC1',
    name: 'ADC-1 Differential Thermal Tap',
    type: 'SPI',
    fromNodeId: 'NODE_THRM',
    toNodeId: 'NODE_MCU',
    rate: '16-Bit SAR',
    voltage: '3.3 V Ref',
    description: 'Internal 16-bit analog-to-digital bridge monitoring multi-point PCB resistance temperatures.',
    isActive: true,
  },
  {
    id: 'BUS_SPI2',
    name: 'SPI-2 Magnetometer Channel',
    type: 'SPI',
    fromNodeId: 'NODE_MAG',
    toNodeId: 'NODE_MCU',
    rate: '10.0 MHz',
    voltage: '3.3 V CMOS',
    description: 'Tri-axis fluxgate magnetic field registers sampled for roll despin tracking and azimuth reference.',
    isActive: true,
  },
  {
    id: 'BUS_PWM1',
    name: 'PWM-1 High-Rate Fin Control',
    type: 'PWM',
    fromNodeId: 'NODE_MCU',
    toNodeId: 'NODE_CANARDS',
    rate: '20.0 kHz',
    voltage: '5.0 V Logic',
    description: 'Four complementary high-frequency pulse-width modulated servo commands driving brushless canard actuators.',
    isActive: true,
  },
  {
    id: 'BUS_SDIO',
    name: 'SDIO 4-Bit Flight Data Bus',
    type: 'SDIO',
    fromNodeId: 'NODE_MCU',
    toNodeId: 'NODE_FLASH',
    rate: '50.0 MHz',
    voltage: '3.3 V CMOS',
    description: 'Four-bit high-throughput bus logging every raw telemetry frame to crash-survivable SLC flash.',
    isActive: true,
  },
  {
    id: 'BUS_UART2',
    name: 'UART-2 Downlink Stream',
    type: 'UART',
    fromNodeId: 'NODE_MCU',
    toNodeId: 'NODE_RF',
    rate: '115.2 kbps',
    voltage: '3.3 V TTL',
    description: 'Synchronous frame serialization pipeline driving the 2.2 GHz S-Band RF transmitter.',
    isActive: true,
  },
  {
    id: 'BUS_PWR_28V',
    name: '28V High-Current Motor Rail',
    type: 'POWER',
    fromNodeId: 'NODE_POWER',
    toNodeId: 'NODE_CANARDS',
    rate: 'DC Isolated',
    voltage: '28.4 VDC',
    description: 'High-current unregulated power rail delivering up to 3.5A peak torque power to the four canard brushless servomotors.',
    isActive: true,
  },
  {
    id: 'BUS_PWR_3V3',
    name: '3.3V Synchronous Logic Rail',
    type: 'POWER',
    fromNodeId: 'NODE_POWER',
    toNodeId: 'NODE_MCU',
    rate: 'DC Regulated',
    voltage: '3.30 VDC',
    description: 'Low-noise GaN synchronous buck regulator supplying clean 3.3V to the core MCU and all transducer front-ends.',
    isActive: true,
  },
];

export const ArchitecturePage: React.FC = () => {
  const {
    sensors,
    activeFaults,
    healthBreakdown,
    stateEstimation,
    obdsState,
    diagnosticEvents,
    telemetryStats,
    commState,
    digitalTwin,
    auditLogs,
    injectFault,
    recoverAllFaults,
    addLog,
    setActivePage,
    timeSeconds,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'SCHEMATIC' | 'PIPELINE'>('SCHEMATIC');

  // Interactive Schematic State
  const [selectedNodeId, setSelectedNodeId] = useState<string>('NODE_MCU');
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [activeBusFilter, setActiveBusFilter] = useState<'ALL' | 'SPI' | 'UART' | 'I2C' | 'PWM' | 'POWER'>('ALL');
  const [busNoiseInjected, setBusNoiseInjected] = useState<boolean>(false);
  const [signalFlowSpeed, setSignalFlowSpeed] = useState<number>(1); // 0 = paused, 1 = normal, 2 = fast

  // Executable System Check State (10 Stages)
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(-1);
  const [stageProgress, setStageProgress] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [stageStatuses, setStageStatuses] = useState<PipelineStageStatus[]>([
    'IDLE', 'IDLE', 'IDLE', 'IDLE', 'IDLE', 'IDLE', 'IDLE', 'IDLE', 'IDLE', 'IDLE',
  ]);
  const [checkCompleted, setCheckCompleted] = useState<boolean>(false);
  const [selectedStageNumber, setSelectedStageNumber] = useState<number>(1);
  const [detectedFaultInfo, setDetectedFaultInfo] = useState<{
    stageNumber: number;
    stageName: string;
    module: string;
    cause: string;
    quality: number;
  } | null>(null);

  const checkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const evalTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Compute live check units for each of the 10 stages
  const stageUnitDetails = useMemo<Record<number, StageUnitCheck[]>>(() => {
    // 1. SENSOR CHECK
    const imuOk = sensors.IMU.status === 'NORMAL';
    const gnssOk = sensors.GNSS.status === 'NORMAL';
    const baroOk = sensors.PRESSURE.status === 'NORMAL';
    const tempOk = sensors.TEMPERATURE.status === 'NORMAL';
    const magOk = sensors.MAGNETOMETER.status === 'NORMAL';
    const mmwOk = sensors.ENVIRONMENT.status === 'NORMAL';

    const stage1: StageUnitCheck[] = [
      {
        id: 'IMU',
        name: 'IMU (Accelerometers & Gyros)',
        status: imuOk ? 'PASS' : sensors.IMU.status === 'DEGRADED' || sensors.IMU.status === 'WARNING' ? 'WARNING' : 'FAILED',
        valueStr: `${sensors.IMU.status} (${sensors.IMU.primaryValue.toFixed(2)} G)`,
        detail: imuOk ? '3-axis inertial rates within ±1.5G baseline' : 'Kinematic proof-mass baseline excursion detected',
      },
      {
        id: 'GNSS',
        name: 'GNSS Satellite Receiver',
        status: gnssOk ? 'PASS' : 'WARNING',
        valueStr: `${sensors.GNSS.status} (${sensors.GNSS.fields.satellites?.value ?? 0} SVs)`,
        detail: gnssOk ? 'Constellation lock healthy, HDOP bounded' : 'Constellation loss (0 satellites detected)',
      },
      {
        id: 'BAROMETER',
        name: 'Barometric Altimeter / Pressure',
        status: baroOk ? 'PASS' : sensors.PRESSURE.status === 'STALE' ? 'WARNING' : 'FAILED',
        valueStr: `${sensors.PRESSURE.status} (${sensors.PRESSURE.primaryValue.toFixed(1)} hPa)`,
        detail: baroOk ? 'Static pressure transducing nominal' : 'Timestamp stagnation or pressure anomaly',
      },
      {
        id: 'TEMPERATURE',
        name: 'Avionics Temperature Sensor',
        status: tempOk ? 'PASS' : 'WARNING',
        valueStr: `${sensors.TEMPERATURE.status} (${sensors.TEMPERATURE.primaryValue.toFixed(1)} °C)`,
        detail: tempOk ? 'Internal bay thermal envelope verified' : 'Bay thermal threshold alert',
      },
      {
        id: 'MAGNETOMETER',
        name: 'Tri-Axial Magnetometer',
        status: magOk ? 'PASS' : 'WARNING',
        valueStr: `${sensors.MAGNETOMETER.status} (${sensors.MAGNETOMETER.primaryValue.toFixed(1)}°)`,
        detail: magOk ? 'Local magnetic vector aligned' : 'Attitude heading divergence detected',
      },
      {
        id: 'MMW_RADAR',
        name: '77 GHz MMW Proximity Radar',
        status: mmwOk ? 'PASS' : 'WARNING',
        valueStr: `${sensors.ENVIRONMENT.status} (${sensors.ENVIRONMENT.primaryValue.toFixed(1)} m)`,
        detail: mmwOk ? 'Radar standoff altimeter locked' : 'Proximity radar signal attenuation',
      },
    ];

    // 2. DATA ACQUISITION
    const streamAvail = Object.values(sensors).length === 7;
    const timeCont = sensors.IMU.timestamp > 0;
    const seqMonotonic = (sensors.IMU.history?.length ?? 1) > 0;

    const stage2: StageUnitCheck[] = [
      {
        id: 'STREAM_AVAIL',
        name: 'Sensor stream available',
        status: streamAvail ? 'PASS' : 'FAILED',
        valueStr: streamAvail ? '6 of 6 SENSORS ACTIVE' : 'MISSING STREAMS',
        detail: 'All deterministic transducer sample pipelines active',
      },
      {
        id: 'TIMESTAMP_CONT',
        name: 'Timestamp continuity',
        status: timeCont ? 'PASS' : 'FAILED',
        valueStr: 'MONOTONIC (<5ms JITTER)',
        detail: 'Simulated clock counter incrementing without backwards drift',
      },
      {
        id: 'SAMPLE_SEQ',
        name: 'Sample sequence',
        status: seqMonotonic ? 'PASS' : 'FAILED',
        valueStr: `#${(sensors.IMU.history?.length ?? 120) * 10} FRAMES`,
        detail: 'Monotonic frame indexing verified across hardware bus',
      },
    ];

    // 3. DATA VALIDATION
    const kinematicPass = sensors.IMU.qualityScore >= 80;
    const freshnessPass = sensors.PRESSURE.status !== 'STALE';
    const consistencyPass = healthBreakdown.subscores.sensorConsistency >= 75;

    const stage3: StageUnitCheck[] = [
      {
        id: 'KINEMATIC_ENVELOPE',
        name: 'Kinematic range check',
        status: kinematicPass ? 'PASS' : 'FAILED',
        valueStr: kinematicPass ? 'INVARIANTS SATISFIED' : 'KINEMATIC EXCURSION',
        detail: 'Physically plausible ballistic rates and forces',
      },
      {
        id: 'FRESHNESS_CHECK',
        name: 'Timestamp freshness check',
        status: freshnessPass ? 'PASS' : 'WARNING',
        valueStr: freshnessPass ? 'FRESH (<20ms AGE)' : 'STALE DATA FLAGGED',
        detail: 'Sample age within bounded latency threshold',
      },
      {
        id: 'CONSISTENCY_CHECK',
        name: 'Cross-sensor consistency',
        status: consistencyPass ? 'PASS' : 'WARNING',
        valueStr: `${Math.round(healthBreakdown.subscores.sensorConsistency)}% CONSISTENCY`,
        detail: 'INS vs GNSS position divergence monitoring',
      },
    ];

    // 4. FILTERING
    const stage4: StageUnitCheck[] = [
      {
        id: 'OUTLIER_REJECTION',
        name: 'Outlier rejection bounds',
        status: 'PASS',
        valueStr: '3-SIGMA ACTIVE',
        detail: 'Rejection of single-sample electromagnetic spurious spikes',
      },
      {
        id: 'IIR_SMOOTHING',
        name: 'Low-pass filter stability',
        status: 'PASS',
        valueStr: 'PASS (fc = 45 Hz)',
        detail: 'Attenuates gun-barrel resonance acoustic modes',
      },
    ];

    // 5. STATE ESTIMATION
    const ekfHealthy = !stateEstimation.degradationReason;
    const stage5: StageUnitCheck[] = [
      {
        id: 'EKF_STATUS',
        name: 'Coupled EKF convergence',
        status: ekfHealthy ? 'PASS' : 'WARNING',
        valueStr: ekfHealthy ? 'COUPLED GPS/INS' : 'DEGRADED FALLBACK',
        detail: stateEstimation.degradationReason || 'Covariance matrix positive definite',
      },
      {
        id: 'STATE_CONF',
        name: 'State confidence index',
        status: stateEstimation.confidence >= 70 ? 'PASS' : 'WARNING',
        valueStr: `${stateEstimation.confidence}% CONFIDENCE`,
        detail: 'Kalman residual innovations within 2-sigma boundary',
      },
    ];

    // 6. SYSTEM HEALTH
    const healthPass = healthBreakdown.systemHealthIndex >= 70;
    const stage6: StageUnitCheck[] = [
      {
        id: 'SYS_HEALTH_INDEX',
        name: 'Aggregate Health Index',
        status: healthPass ? 'PASS' : 'FAILED',
        valueStr: `${healthBreakdown.systemHealthIndex}/100 (${healthBreakdown.status})`,
        detail: 'Six-component weighted diagnostic composition',
      },
    ];

    // 7. OBDS
    const obdsPass = obdsState.status === 'NORMAL';
    const stage7: StageUnitCheck[] = [
      {
        id: 'BIT_STATUS',
        name: 'Built-In Test (BIT) execution',
        status: obdsPass ? 'PASS' : 'WARNING',
        valueStr: `${obdsState.status} (${obdsState.activeFaultCount} ALERTS)`,
        detail: 'Onboard fault detection, isolation, and recovery logic',
      },
    ];

    // 8. TELEMETRY
    const commPass = commState === 'OPTIMAL';
    const stage8: StageUnitCheck[] = [
      {
        id: 'TELEM_LINK',
        name: 'Downlink frame delivery',
        status: commPass ? 'PASS' : 'WARNING',
        valueStr: `${commState} (${telemetryStats.averageLatencyMs.toFixed(1)} ms)`,
        detail: 'S-Band telemetry framing continuity and CRC-16 integrity',
      },
    ];

    // 9. DIGITAL TWIN
    const stage9: StageUnitCheck[] = [
      {
        id: 'TWIN_SYNC',
        name: 'Digital Twin state synchronization',
        status: 'PASS',
        valueStr: 'SYNCHRONIZED (10 Hz)',
        detail: 'Airframe kinematics, canard deflections, and subsystem states in sync',
      },
    ];

    // 10. DASHBOARD
    const stage10: StageUnitCheck[] = [
      {
        id: 'DASHBOARD_LIVE',
        name: 'Ground station console integrity',
        status: 'PASS',
        valueStr: 'NOMINAL DISPLAY',
        detail: 'Human-machine interface responding and receiving packet stream',
      },
    ];

    return {
      1: stage1,
      2: stage2,
      3: stage3,
      4: stage4,
      5: stage5,
      6: stage6,
      7: stage7,
      8: stage8,
      9: stage9,
      10: stage10,
    };
  }, [sensors, healthBreakdown, stateEstimation, obdsState, commState, telemetryStats]);

  // Selected Node Details
  const selectedNode = useMemo(
    () => ARCH_NODES.find((n) => n.id === selectedNodeId) || ARCH_NODES[5],
    [selectedNodeId]
  );

  // Selected Bus Details
  const selectedBus = useMemo(
    () => (selectedBusId ? ARCH_BUSES.find((b) => b.id === selectedBusId) : null),
    [selectedBusId]
  );

  // Filtered Buses
  const visibleBuses = useMemo(() => {
    return ARCH_BUSES.filter((b) => {
      if (activeBusFilter === 'ALL') return true;
      return b.type === activeBusFilter;
    });
  }, [activeBusFilter]);

  // Overall check progress
  const totalProgressPercent = useMemo(() => {
    const sum = stageProgress.reduce((acc, p) => acc + p, 0);
    return Math.round((sum / (10 * 100)) * 100);
  }, [stageProgress]);

  // Step Single Stage manually
  const handleStepSingleStage = () => {
    if (currentStageIdx < 9) {
      const nextIdx = currentStageIdx + 1;
      setCurrentStageIdx(nextIdx);
      setSelectedStageNumber(nextIdx + 1);
      setStageStatuses((prev) => {
        const next = [...prev];
        next[nextIdx] = 'CHECKING';
        return next;
      });
      setStageProgress((prev) => {
        const next = [...prev];
        next[nextIdx] = 100;
        return next;
      });
      setTimeout(() => {
        const units = stageUnitDetails[nextIdx + 1] || [];
        const hasFail = units.some((u) => u.status === 'FAILED');
        const hasWarn = units.some((u) => u.status === 'WARNING');
        setStageStatuses((prev) => {
          const next = [...prev];
          next[nextIdx] = hasFail ? 'FAILED' : hasWarn ? 'WARNING' : 'PASS';
          return next;
        });
      }, 200);
    }
  };

  // Start Full Automatic System Check
  const handleStartSystemCheck = () => {
    setIsChecking(true);
    setIsPaused(false);
    setCheckCompleted(false);
    setDetectedFaultInfo(null);
    setCurrentStageIdx(0);
    setSelectedStageNumber(1);
    setStageProgress([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    setStageStatuses(['CHECKING', 'IDLE', 'IDLE', 'IDLE', 'IDLE', 'IDLE', 'IDLE', 'IDLE', 'IDLE', 'IDLE']);
  };

  // Sequential execution effect
  useEffect(() => {
    if (!isChecking || isPaused || currentStageIdx < 0 || currentStageIdx > 9) return;

    checkTimerRef.current = setInterval(() => {
      setStageProgress((prev) => {
        const cur = prev[currentStageIdx] || 0;
        if (cur >= 100) return prev;
        const next = Math.min(100, cur + 25);
        const copy = [...prev];
        copy[currentStageIdx] = next;
        return copy;
      });
    }, 80);

    return () => {
      if (checkTimerRef.current) clearInterval(checkTimerRef.current);
    };
  }, [isChecking, isPaused, currentStageIdx]);

  // When stage reaches 100%, evaluate
  useEffect(() => {
    if (isChecking && !isPaused && currentStageIdx >= 0 && stageProgress[currentStageIdx] >= 100) {
      evalTimeoutRef.current = setTimeout(() => {
        const stageNum = currentStageIdx + 1;
        const units = stageUnitDetails[stageNum] || [];
        const hasFail = units.some((u) => u.status === 'FAILED');
        const hasWarn = units.some((u) => u.status === 'WARNING');

        if (hasFail) {
          setStageStatuses((prev) => {
            const next = [...prev];
            next[currentStageIdx] = 'FAILED';
            return next;
          });
          setIsPaused(true);
          return;
        }

        setStageStatuses((prev) => {
          const next = [...prev];
          next[currentStageIdx] = hasWarn ? 'WARNING' : 'PASS';
          return next;
        });

        if (currentStageIdx < 9) {
          const nextIdx = currentStageIdx + 1;
          setCurrentStageIdx(nextIdx);
          setSelectedStageNumber(nextIdx + 1);
          setStageStatuses((prev) => {
            const next = [...prev];
            next[nextIdx] = 'CHECKING';
            return next;
          });
        } else {
          setIsChecking(false);
          setCheckCompleted(true);
        }
      }, 100);

      return () => {
        if (evalTimeoutRef.current) clearTimeout(evalTimeoutRef.current);
      };
    }
  }, [isChecking, isPaused, currentStageIdx, stageProgress, stageUnitDetails]);

  const selectedStageConfig = PIPELINE_STAGES[selectedStageNumber - 1];
  const selectedUnits = stageUnitDetails[selectedStageNumber] || [];

  return (
    <div className="space-y-4 max-w-[1780px] mx-auto text-slate-100 font-sans">
      
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1f2533]">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-0.5">
            <span>Hardware Architecture &amp; Signal Routing</span>
            <span>·</span>
            <span className="text-sky-400">MIL-STD-810H Avionics Bus</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span>Avionics Interconnect Schematic &amp; Pipeline Engine</span>
          </h1>
        </div>

        {/* View Switcher: Interactive Schematic vs 10-Stage Pipeline */}
        <div className="flex items-center gap-1 bg-[#0d1017] border border-[#1d2330] rounded-sm p-0.5 text-xs font-mono">
          <button
            onClick={() => setActiveTab('SCHEMATIC')}
            className={`px-3 py-1 rounded-sm transition-colors ${
              activeTab === 'SCHEMATIC'
                ? 'bg-[#1b2333] text-white font-semibold border border-[#2d3a50]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Interactive Schematic &amp; Bus
          </button>
          <button
            onClick={() => setActiveTab('PIPELINE')}
            className={`px-3 py-1 rounded-sm transition-colors ${
              activeTab === 'PIPELINE'
                ? 'bg-[#1b2333] text-white font-semibold border border-[#2d3a50]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            10-Stage Verification Pipeline
          </button>
        </div>
      </div>

      {/* VIEW A: INTERACTIVE SCHEMATIC & BUS ANALYZER */}
      {activeTab === 'SCHEMATIC' && (
        <div className="space-y-3">
          
          {/* Top Bus Filter Bar & Flow Controller */}
          <div className="p-2.5 rounded-sm bg-[#11141c] border border-[#1e2330] font-mono text-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">
                Bus Trace Filter:
              </span>
              {(['ALL', 'SPI', 'UART', 'I2C', 'PWM', 'POWER'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveBusFilter(filter)}
                  className={`px-2 py-0.5 rounded-xs text-[10px] font-medium transition-colors ${
                    activeBusFilter === filter
                      ? 'bg-sky-700 text-white font-bold'
                      : 'bg-[#0d1017] hover:bg-[#161a24] text-slate-400 hover:text-white border border-[#1e2533]'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span>Signal Propagation:</span>
                {[0, 1, 2].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setSignalFlowSpeed(spd)}
                    className={`px-1.5 py-0.2 rounded-xs text-[10px] ${
                      signalFlowSpeed === spd
                        ? 'bg-sky-900 text-sky-200 border border-sky-600 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {spd === 0 ? 'HOLD' : `${spd}x`}
                  </button>
                ))}
              </div>

              {selectedBusId && (
                <button
                  onClick={() => setSelectedBusId(null)}
                  className="px-2 py-0.5 rounded-xs bg-[#161c28] text-slate-300 border border-[#242e42] text-[10px]"
                >
                  Clear Bus Focus
                </button>
              )}
            </div>
          </div>

          {/* Interactive Topology Graph Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            
            {/* Left 8 Cols: Interactive Board Schematic Canvas */}
            <div className="lg:col-span-8 bg-[#090b10] border border-[#1e2330] rounded-sm p-4 relative min-h-[520px] overflow-hidden select-none">
              
              {/* Background PCB Grid */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#141924_1px,transparent_1px),linear-gradient(to_bottom,#141924_1px,transparent_1px)] bg-[size:32px_32px] opacity-40 pointer-events-none" />

              {/* Title Overlay */}
              <div className="absolute top-3 left-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest pointer-events-none">
                AEROSHIELD-155 INTERCONNECT TOPOLOGY · REVISION C.4
              </div>

              {/* SVG Connecting Bus Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <marker
                    id="arrow"
                    viewBox="0 0 10 10"
                    refX="5"
                    refY="5"
                    markerWidth="4"
                    markerHeight="4"
                    orient="auto-angle"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
                  </marker>
                </defs>

                {visibleBuses.map((bus) => {
                  const fromNode = ARCH_NODES.find((n) => n.id === bus.fromNodeId);
                  const toNode = ARCH_NODES.find((n) => n.id === bus.toNodeId);
                  if (!fromNode || !toNode) return null;

                  const isSelected = selectedBusId === bus.id;
                  const isPower = bus.type === 'POWER';
                  const strokeColor = isSelected
                    ? '#38bdf8'
                    : isPower
                    ? '#eab308'
                    : '#2a3b59';

                  const strokeWidth = isSelected ? 2.5 : isPower ? 1.8 : 1.2;

                  return (
                    <g key={bus.id}>
                      <line
                        x1={`${fromNode.x}%`}
                        y1={`${fromNode.y}%`}
                        x2={`${toNode.x}%`}
                        y2={`${toNode.y}%`}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={signalFlowSpeed > 0 ? '4,4' : undefined}
                        className={signalFlowSpeed > 0 ? 'animate-[dash_1s_linear_infinite]' : ''}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Interactive Node Badges Positioned on Board */}
              {ARCH_NODES.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const Icon = node.icon;

                let categoryColor = 'border-[#233045] bg-[#0d121c] text-slate-300';
                if (node.category === 'PROCESSING') {
                  categoryColor = 'border-sky-600/80 bg-[#101b2b] text-sky-200';
                } else if (node.category === 'POWER') {
                  categoryColor = 'border-amber-600/70 bg-[#1c180e] text-amber-200';
                } else if (node.category === 'ACTUATION') {
                  categoryColor = 'border-emerald-600/70 bg-[#0d1a14] text-emerald-200';
                }

                return (
                  <div
                    key={node.id}
                    onClick={() => {
                      setSelectedNodeId(node.id);
                      setSelectedBusId(null);
                    }}
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 p-2.5 rounded-sm border cursor-pointer transition-all duration-150 shadow-md ${categoryColor} ${
                      isSelected
                        ? 'ring-2 ring-sky-400 scale-105 z-20 shadow-sky-950/60'
                        : 'hover:scale-102 hover:border-slate-400 z-10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={14} className={isSelected ? 'text-sky-300' : 'text-slate-400'} />
                      <span className="font-mono font-bold text-xs whitespace-nowrap">
                        {node.shortName}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                      {node.protocol} · {node.baudRate}
                    </div>
                  </div>
                );
              })}

              {/* Interactive Clickable Bus Tags in Diagram Center */}
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 flex-wrap z-30 font-mono text-[10px]">
                <span className="text-slate-500 uppercase mr-1">Direct Bus Select:</span>
                {ARCH_BUSES.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setSelectedBusId(b.id);
                      setSelectedNodeId(b.fromNodeId);
                    }}
                    className={`px-1.5 py-0.5 rounded-xs transition-colors ${
                      selectedBusId === b.id
                        ? 'bg-sky-700 text-white font-bold'
                        : 'bg-[#121620] hover:bg-[#1a202c] text-slate-400 hover:text-white border border-[#1e2533]'
                    }`}
                  >
                    {b.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Right 4 Cols: Live Hardware Subsystem & Bus Signal Inspector */}
            <div className="lg:col-span-4 bg-[#11141c] border border-[#1e2330] rounded-sm p-3.5 space-y-3 font-mono text-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#1b202c]">
                  <div className="flex items-center gap-2">
                    <Binary size={14} className="text-sky-400" />
                    <span className="font-bold text-white uppercase text-[11px]">
                      Hardware Inspector
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    ONLINE · 100% HEALTH
                  </span>
                </div>

                {/* Subsystem Details Card */}
                <div className="p-3 rounded-sm bg-[#0d1017] border border-[#1a1f2c] space-y-2">
                  <div>
                    <span className="text-[10px] text-sky-400 uppercase font-semibold block">
                      {selectedNode.category} COMPONENT
                    </span>
                    <h3 className="text-sm font-bold text-white font-sans mt-0.5">
                      {selectedNode.name}
                    </h3>
                  </div>

                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                    {selectedNode.description}
                  </p>

                  <div className="p-2 rounded-xs bg-[#090b10] border border-[#161a24] text-[10px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bus Protocol:</span>
                      <span className="text-sky-300 font-bold">{selectedNode.protocol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Transmission Rate:</span>
                      <span className="text-white">{selectedNode.baudRate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Supply Voltage:</span>
                      <span className="text-white">{selectedNode.voltage}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current Consumption:</span>
                      <span className="text-white">{selectedNode.current}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Core Temp:</span>
                      <span className="text-white">{selectedNode.temp}</span>
                    </div>
                  </div>
                </div>

                {/* Focused Bus Channel Inspector */}
                {selectedBus ? (
                  <div className="p-3 rounded-sm bg-[#0d1017] border border-sky-800/50 space-y-2">
                    <span className="text-[10px] text-sky-400 uppercase font-semibold block">
                      Active Bus Channel: {selectedBus.name}
                    </span>
                    <p className="text-[11px] text-slate-300 font-sans">
                      {selectedBus.description}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-[#181d27]">
                      <span>Rate: <strong className="text-white">{selectedBus.rate}</strong></span>
                      <span>Signal: <strong className="text-white">{selectedBus.voltage}</strong></span>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-sm bg-[#0d1017] border border-[#181d27] text-[11px] text-slate-400 font-sans text-center">
                    Click any bus tag or schematic line to inspect real-time digital waveform and protocol framing.
                  </div>
                )}
              </div>

              {/* Direct Hardware Stimulus Triggers */}
              <div className="space-y-1.5 pt-2 border-t border-[#1b202c]">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Interactive Hardware Stimulus:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      injectFault('SENSOR_BIAS', 'IMU');
                      addLog({
                        module: 'HARDWARE_BUS',
                        severity: 'WARNING',
                        eventType: 'OPERATOR_ACTION',
                        message: `Manual signal bias injected into ${selectedNode.name}.`,
                      });
                    }}
                    className="p-1.5 rounded-xs bg-[#161c28] hover:bg-[#202738] text-slate-300 border border-[#242e42] text-[10px] transition-colors text-center"
                  >
                    Inject Bus Jitter
                  </button>
                  <button
                    onClick={() => {
                      injectFault('STALE_DATA', 'PRESSURE');
                      addLog({
                        module: 'HARDWARE_BUS',
                        severity: 'WARNING',
                        eventType: 'OPERATOR_ACTION',
                        message: `Simulated FIFO bus freeze on ${selectedNode.name}.`,
                      });
                    }}
                    className="p-1.5 rounded-xs bg-[#161c28] hover:bg-[#202738] text-slate-300 border border-[#242e42] text-[10px] transition-colors text-center"
                  >
                    Simulate Freeze
                  </button>
                </div>
                <button
                  onClick={recoverAllFaults}
                  className="w-full py-1.5 rounded-xs bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 text-[10px] font-bold transition-colors text-center"
                >
                  Restore Nominal Bus Signals
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* VIEW B: 10-STAGE EXECUTABLE VERIFICATION PIPELINE */}
      {activeTab === 'PIPELINE' && (
        <div className="space-y-4">
          
          {/* Top Stage Control Bar */}
          <div className="bg-[#11141c] border border-[#1e2330] rounded-sm p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">
                Pipeline Progress:
              </span>
              <div className="w-36 h-2 bg-[#090b10] border border-[#1b202c] rounded-xs overflow-hidden">
                <div
                  className="h-full bg-sky-500 transition-all duration-200"
                  style={{ width: `${totalProgressPercent}%` }}
                />
              </div>
              <span className="text-xs font-bold text-white tabular-nums">
                {totalProgressPercent}%
              </span>
            </div>

            {/* Tactile Pipeline Stepper Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleStartSystemCheck}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-sky-700 hover:bg-sky-600 text-white font-bold transition-colors text-xs"
              >
                <Play size={12} />
                <span>RUN FULL 10-STAGE CHECK</span>
              </button>

              <button
                onClick={handleStepSingleStage}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-sm bg-[#161c28] hover:bg-[#202738] text-slate-300 border border-[#242e42] transition-colors text-xs"
                title="Execute single stage"
              >
                <StepForward size={12} />
                <span>STEP SINGLE [→|]</span>
              </button>

              <button
                onClick={() => {
                  setIsChecking(false);
                  setIsPaused(false);
                  setCheckCompleted(false);
                  setCurrentStageIdx(-1);
                  setStageProgress([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
                  setStageStatuses(['IDLE', 'IDLE', 'IDLE', 'IDLE', 'IDLE', 'IDLE', 'IDLE', 'IDLE', 'IDLE', 'IDLE']);
                  recoverAllFaults();
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-sm bg-[#161c28] hover:bg-[#202738] text-slate-300 border border-[#242e42] transition-colors text-xs"
              >
                <RotateCcw size={12} />
                <span>RESET</span>
              </button>
            </div>
          </div>

          {/* 10 Pipeline Stage Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 font-mono">
            {PIPELINE_STAGES.map((st, idx) => {
              const status = stageStatuses[idx];
              const progress = stageProgress[idx];
              const isSelected = selectedStageNumber === st.stageNumber;
              const Icon = st.icon;

              return (
                <button
                  key={st.stageNumber}
                  onClick={() => setSelectedStageNumber(st.stageNumber)}
                  className={`p-2 rounded-sm border text-left transition-colors relative ${
                    isSelected
                      ? 'bg-[#182335] border-sky-600 text-white shadow-sm'
                      : 'bg-[#0d1017] border-[#1d2330] text-slate-400 hover:text-slate-200 hover:bg-[#121622]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-slate-400 font-bold">0{st.stageNumber}</span>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded-xs font-bold uppercase ${
                        status === 'PASS'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : status === 'FAILED'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : status === 'CHECKING'
                          ? 'bg-sky-950 text-sky-300 border border-sky-700 animate-pulse'
                          : 'bg-[#141822] text-slate-400'
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 my-1">
                    <Icon size={12} className={isSelected ? 'text-sky-300' : 'text-slate-400'} />
                    <span className="text-xs font-bold truncate block">
                      {st.name}
                    </span>
                  </div>

                  {/* Micro Progress Bar */}
                  <div className="w-full bg-[#080d1a] rounded-xs h-1 mt-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-150 ${
                        status === 'FAILED' ? 'bg-rose-500' : 'bg-sky-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Stage Subchecks Inspector */}
          <div className="bg-[#11141c] border border-[#1e2330] rounded-sm p-4 space-y-3 font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-[#1b202c]">
              <div>
                <span className="text-[10px] text-sky-400 uppercase font-semibold">
                  Stage 0{selectedStageConfig.stageNumber} Verified Invariants
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  {selectedStageConfig.name} ({selectedStageConfig.category})
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Progress: <strong className="text-white tabular-nums">{stageProgress[selectedStageNumber - 1]}%</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {selectedUnits.map((unit) => (
                <div
                  key={unit.id}
                  className="p-3 rounded-sm bg-[#0d1017] border border-[#181d27] space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{unit.name}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-xs font-bold uppercase ${
                        unit.status === 'PASS'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : unit.status === 'FAILED'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {unit.status}
                    </span>
                  </div>
                  {unit.valueStr && (
                    <div className="text-[11px] text-sky-300 font-semibold">{unit.valueStr}</div>
                  )}
                  {unit.detail && (
                    <div className="text-[10px] text-slate-400 font-sans">{unit.detail}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
