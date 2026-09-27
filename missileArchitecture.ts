export interface AvionicsChip {
  id: string;
  refDes: string; // e.g. "U101", "U102", "U201"
  name: string;
  shortName: string;
  zone: string;
  section: 'Nose GNC Bay' | 'Mid Avionics & Warhead' | 'Aft Propulsion & Actuation';
  color: string;
  packageType: string;
  role: string;
  architecture: string;
  clockFreq: string;
  operatingVoltage: string;
  powerDraw: string;
  radTolerance: string;
  shockRating: string;
  interfaces: string[];
  firmwareFunctions: string[];
  associatedSensorId?: string;
  cutawayCoords: { x: number; y: number; width: number; height: number }; // In 2D Cutaway SVG (0-1000 x 0-260 space)
  schematicCoords: { x: number; y: number; width: number; height: number }; // In 2D Schematic SVG (0-1000 x 0-400 space)
  livePinoutTelemetry: Array<{
    pin: string;
    function: string;
    liveValue: string;
    status: 'ACTIVE' | 'STANDBY' | 'PULSING';
  }>;
  description: string;
}

export interface MissileWorkflowPhase {
  id: string;
  stepNumber: number;
  title: string;
  timeRange: string;
  mach: number;
  altitudeM: number;
  gForce: number;
  downrangeKm: number;
  summary: string;
  activeChipIds: string[];
  busActivity: Array<{
    bus: string;
    bandwidth: string;
    state: 'HIGH' | 'NOMINAL' | 'IDLE';
  }>;
  telemetryPacket: string;
  failsafeProtocol: string;
  milStdCompliance: string;
}

export type BlueprintViewMode = '3d-digital-twin' | 'assembly-workflow' | 'cutaway' | 'schematic' | 'trajectory';

export interface MissileCrossSectionStation {
  id: string;
  stationCode: string; // e.g. "A-A", "B-B", "C-C", "D-D", "E-E"
  stationName: string;
  fuselageStationMm: number; // e.g. 75, 160, 320, 620, 860
  calibreDiameterMm: number; // 155mm standard
  innerDiameterMm: number;
  wallThicknessMm: number;
  shellMaterial: string;
  massKg: number;
  description: string;
  crossSectionComponents: Array<{
    id: string;
    name: string;
    refDes?: string;
    category: 'OPTICS' | 'AVIONICS' | 'MECHANICAL' | 'PROPULSION' | 'PAYLOAD' | 'WIRING';
    color: string;
    shape: 'circle' | 'rect' | 'annulus' | 'polygon';
    coords: { cx?: number; cy?: number; r?: number; x?: number; y?: number; w?: number; h?: number };
    description: string;
  }>;
  structuralNotes: string[];
  cableRacewayPassthrough: string;
}

export interface BusLogicAnalyzerChannel {
  id: string;
  name: string;
  busId: string;
  protocol: string;
  color: string;
  sampleFrequencyHz: number;
  activeRate: string;
  jitterNs: number;
  currentFrameHex: string;
  decodedFrame: string;
  waveformType: 'MANCHESTER' | 'DIFFERENTIAL_CAN' | 'SPI_CLOCK_DATA' | 'DISCRETE_INTERLOCK';
  status: 'ACTIVE' | 'PULSING' | 'STANDBY';
}

export interface PowerRailInfo {
  id: string;
  name: string;
  voltageNominalV: number;
  voltageLiveV: number;
  currentDrawA: number;
  maxCurrentA: number;
  powerWatts: number;
  color: string;
  source: string;
  destinations: string[];
  rippleMv: number;
  isTripped: boolean;
}

export interface AvionicsBusInfo {
  id: string;
  name: string;
  shortName: string;
  color: string;
  protocol: string;
  maxThroughput: string;
  description: string;
  masterRefDes: string;
  slaveRefDes: string[];
  samplePacketHex: string;
  packetFormat: string;
}

export interface CADLayerConfig {
  mechanicalShell: boolean;
  internalBays: boolean;
  chipsAndPCBs: boolean;
  busWiring: boolean;
  thermalOverlay: boolean;
  dimensions: boolean;
}
