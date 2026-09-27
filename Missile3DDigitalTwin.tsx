import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  Play,
  Pause,
  Cpu,
  Eye,
  Flame,
  Zap,
  Search,
  Crosshair,
  Radio,
  Shield,
  Layers,
  Compass,
  Radar,
  Activity,
  Target,
  Gauge,
  Thermometer,
  HardDrive,
  Tv,
  Network,
  BatteryCharging,
  Sliders,
  Expand,
  Sparkles,
} from 'lucide-react';
import { soundFX } from '../../utils/audioFeedback';

export type AeroShieldLayer = 'ALL' | 'SENSOR' | 'PROCESSING' | 'PERIPHERAL' | 'POWER';

export interface Internal3DPart {
  id: string;
  name: string;
  category: string;
  diagramLayer: 'SENSOR' | 'PROCESSING' | 'PERIPHERAL' | 'POWER';
  badge: string;
  color: string;
  offsetZ: number;
  description: string;
  specs: string;
  voltage: string;
  current: string;
  temp: string;
  status: 'ONLINE' | 'ACTIVE' | 'STANDBY';
  isSensor?: boolean;
}

// Exactly matches the User's uploaded "AEROSHIELD CONCEPTUAL MODEL" Architecture:
// 1. Sensor Layer: GNSS, IMU, MMW/Proximity, Barometer, Magnetometer, Temperature
// 2. Processing: STM32 / MCU, Data Processing, Health Monitor, Diagnostics
// 3. Communication Interface, Data Log / MicroSD, Status/OLED Display
// 4. Power Management
export const INTERNAL_3D_PARTS: Internal3DPart[] = [
  // ==========================================
  // SENSOR LAYER (6 Primary Sensors from diagram)
  // ==========================================
  {
    id: 'part-mmw',
    name: '77 GHz MMW / Proximity Radar Sensor',
    category: 'SENSOR LAYER: MMW / PROXIMITY',
    diagramLayer: 'SENSOR',
    badge: 'MMW / PROX',
    color: '#ef4444',
    offsetZ: 2.75,
    description: 'Millimeter-wave FMCW proximity altimeter sensor with 4-patch conformal antenna arrays. Measures sub-decimeter surface proximity altitude for airburst detonation.',
    specs: '77.0 GHz FMCW · 4-Patch Conformal Array · 0.15m Precision',
    voltage: '3.3 V',
    current: '420 mA',
    temp: '41.2 °C',
    status: 'ONLINE',
    isSensor: true,
  },
  {
    id: 'part-baro',
    name: 'Precision Barometer & Dynamic Pressure Sensor',
    category: 'SENSOR LAYER: BAROMETER',
    diagramLayer: 'SENSOR',
    badge: 'BAROMETER',
    color: '#38bdf8',
    offsetZ: 2.25,
    description: 'Piezoresistive static air pressure barometer and differential pitot transducer calculating Mach velocity, barometric altitude, and aerodynamic dynamic pressure (Q).',
    specs: '260-1260 hPa Range · 0.01 hPa (±10cm) Precision · High-G Shock Sealed',
    voltage: '3.3 V',
    current: '45 mA',
    temp: '37.1 °C',
    status: 'ONLINE',
    isSensor: true,
  },
  {
    id: 'part-temp',
    name: 'Multi-Point Avionics & Thermal Sensor Array',
    category: 'SENSOR LAYER: TEMPERATURE',
    diagramLayer: 'SENSOR',
    badge: 'TEMPERATURE',
    color: '#fb923c',
    offsetZ: 1.75,
    description: 'Eight-channel platinum RTD & thermocouple monitoring network sampling nose stagnation heat, battery temperature, motor wall thermal gradient, and MCU junction core.',
    specs: '-55 °C to +850 °C · 8-Channel Thermal Bridge · ±0.2°C Accuracy',
    voltage: '3.3 V',
    current: '28 mA',
    temp: '42.8 °C',
    status: 'ACTIVE',
    isSensor: true,
  },
  {
    id: 'part-imu',
    name: 'Tactical High-G MEMS IMU Sensor',
    category: 'SENSOR LAYER: IMU',
    diagramLayer: 'SENSOR',
    badge: 'IMU',
    color: '#10b981',
    offsetZ: 0.95,
    description: 'Shock-hardened tri-axis silicon vibratory ring gyroscopes and capacitive accelerometers encapsulated in gold-bonded potting to survive 20,000g setback launch shock.',
    specs: '20,000g Shock Hardened · 2,400 Hz Sampling · 0.05°/hr Drift',
    voltage: '3.3 V',
    current: '95 mA',
    temp: '36.8 °C',
    status: 'ONLINE',
    isSensor: true,
  },
  {
    id: 'part-mag',
    name: 'Tri-Axis Digital Magnetometer Compass',
    category: 'SENSOR LAYER: MAGNETOMETER',
    diagramLayer: 'SENSOR',
    badge: 'MAGNETOMETER',
    color: '#06b6d4',
    offsetZ: 0.35,
    description: 'Anisotropic Magnetoresistive (AMR) 3-axis geomagnetic sensor delivering true heading reference and hard/soft iron anomaly compensation during GPS-denied tactical phases.',
    specs: '±8 Gauss Full Scale · 16-Bit ADC · 400 Hz EKF Heading Feed',
    voltage: '3.3 V',
    current: '65 mA',
    temp: '37.4 °C',
    status: 'ONLINE',
    isSensor: true,
  },
  {
    id: 'part-gnss',
    name: 'CRPA Anti-Jam GNSS Satellite Sensor Array',
    category: 'SENSOR LAYER: GNSS',
    diagramLayer: 'SENSOR',
    badge: 'GNSS SATELLITE',
    color: '#8b5cf6',
    offsetZ: -0.25,
    description: 'Controlled Reception Pattern Antenna (CRPA) multi-constellation receiver (GPS L1/L2, Galileo E1/E5a) with spatial adaptive null-steering against hostile electronic jamming.',
    specs: 'Multi-Frequency L1/L2/E5 · 55 dB Jamming Suppression · 10 Hz PVT',
    voltage: '3.3 V',
    current: '310 mA',
    temp: '39.6 °C',
    status: 'ONLINE',
    isSensor: true,
  },

  // ==========================================
  // PROCESSING: STM32 / MCU, DATA PROCESSING, HEALTH & DIAGNOSTICS
  // ==========================================
  {
    id: 'part-mcu',
    name: 'STM32 / MCU Flight Computer & Health Diagnostics Core',
    category: 'PROCESSING: STM32 / MCU',
    diagramLayer: 'PROCESSING',
    badge: 'STM32 MCU CORE',
    color: '#3b82f6',
    offsetZ: 1.35,
    description: 'ARM Cortex-M7 radiation-tolerant dual-core lockstep processor executing real-time 400Hz Extended Kalman Filter (EKF) sensor fusion, canard fin guidance, and autonomous OBDS diagnostics.',
    specs: 'ARM Cortex-M7 @ 480 MHz · Dual-Core Lockstep · MIL-STD-1553B & CAN-FD',
    voltage: '3.3 V',
    current: '480 mA',
    temp: '44.5 °C',
    status: 'ACTIVE',
  },

  // ==========================================
  // PERIPHERALS: COMM INTERFACE, DATA LOG, STATUS/OLED DISPLAY
  // ==========================================
  {
    id: 'part-comm',
    name: 'Tactical Communication Interface Bus',
    category: 'PERIPHERAL: COMMUNICATION INTERFACE',
    diagramLayer: 'PERIPHERAL',
    badge: 'COMM BUS',
    color: '#ec4899',
    offsetZ: -0.85,
    description: 'S-band encrypted telemetry downlink and redundant dual CAN-FD avionics interconnect bus streaming 200 Hz navigation state vectors to ground station.',
    specs: 'S-Band 2.2 GHz · AES-256 Crypto · Dual CAN-FD 5 Mbps Bus',
    voltage: '5.0 V',
    current: '520 mA',
    temp: '43.2 °C',
    status: 'ONLINE',
  },
  {
    id: 'part-log',
    name: 'Black-Box Data Logger / MicroSD Flash Deck',
    category: 'PERIPHERAL: DATA LOG / MICROSD',
    diagramLayer: 'PERIPHERAL',
    badge: 'DATA LOGGER',
    color: '#a855f7',
    offsetZ: -1.35,
    description: 'Crash-survivable SLC NAND flash solid-state memory array continuously recording 1,000 parameters/sec for post-flight aerodynamic analysis and diagnostic verification.',
    specs: '64 GB High-G SLC NAND · 20,000g Impact Potting · 100 MB/s Bus',
    voltage: '3.3 V',
    current: '85 mA',
    temp: '38.0 °C',
    status: 'ONLINE',
  },
  {
    id: 'part-oled',
    name: 'Avionics Status / OLED Diagnostic Display Port',
    category: 'PERIPHERAL: STATUS / OLED DISPLAY',
    diagramLayer: 'PERIPHERAL',
    badge: 'STATUS / OLED',
    color: '#06b6d4',
    offsetZ: -1.85,
    description: 'Ground-crew pre-flight diagnostic port and status OLED display showing battery SOC, bit-check codes, inertial alignment status, and launch interlock readiness.',
    specs: '1.3" Micro-OLED Preflight HUD · I2C Telemetry Tap · Self-Test Codes',
    voltage: '3.3 V',
    current: '40 mA',
    temp: '35.5 °C',
    status: 'ONLINE',
  },

  // ==========================================
  // POWER MANAGEMENT
  // ==========================================
  {
    id: 'part-pmu',
    name: 'GaN Power Management Unit (PMU) & Thermal Battery',
    category: 'POWER MANAGEMENT: PMU & BATTERY',
    diagramLayer: 'POWER',
    badge: 'PMU & BATTERY',
    color: '#eab308',
    offsetZ: -2.35,
    description: 'Molten-salt pyrotechnic thermal battery with GaN synchronous buck-boost PMU delivering isolated 28V, 5V, and 3.3V power rails with 96% efficiency under 40G lateral loads.',
    specs: 'Thermal Battery 28V / 85W · GaN Buck-Boost PMU · 400ms Fast Activation',
    voltage: '28.4 V',
    current: '3.1 A',
    temp: '58.2 °C',
    status: 'ONLINE',
  },
];

interface Missile3DDigitalTwinProps {
  selectedPartId?: string;
  onSelectPart?: (part: Internal3DPart) => void;
  flightPhase?: string;
  explodedFactorProp?: number;
  onExplodedFactorChange?: (factor: number) => void;
  canardPitch?: number;
  canardYaw?: number;
  canardRoll?: number;
  showRadarBeam?: boolean;
  onToggleRadarBeam?: (show: boolean) => void;
  showThrusterFlame?: boolean;
  onToggleThrusterFlame?: (show: boolean) => void;
  showTargetVector?: boolean;
  showAirburstEnvelope?: boolean;
}

export const Missile3DDigitalTwin: React.FC<Missile3DDigitalTwinProps> = ({
  selectedPartId,
  onSelectPart,
  flightPhase,
  explodedFactorProp,
  onExplodedFactorChange,
  canardPitch = 0,
  canardYaw = 0,
  canardRoll = 0,
  showRadarBeam: externalRadarBeam,
  onToggleRadarBeam,
  showThrusterFlame: externalThrusterFlame,
  onToggleThrusterFlame,
  showTargetVector = false,
  showAirburstEnvelope = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'GUARD' | 'CUTAWAY' | 'INSPECT'>('CUTAWAY');
  const [activeLayerFilter, setActiveLayerFilter] = useState<AeroShieldLayer>('ALL');
  const [explodedFactor, setExplodedFactor] = useState<number>(explodedFactorProp ?? 0);
  const [isWireframe, setIsWireframe] = useState<boolean>(false);
  const [localRadarBeam, setLocalRadarBeam] = useState<boolean>(false);
  const [localThrusterFlame, setLocalThrusterFlame] = useState<boolean>(true);

  const effectiveRadar = externalRadarBeam ?? localRadarBeam;
  const effectiveThruster = externalThrusterFlame ?? localThrusterFlame;

  const [activePart, setActivePart] = useState<Internal3DPart>(() => {
    if (selectedPartId) {
      const found = INTERNAL_3D_PARTS.find((p) => p.id === selectedPartId);
      if (found) return found;
    }
    return INTERNAL_3D_PARTS[0];
  });

  // Keep activePart synchronized with incoming selectedPartId prop
  useEffect(() => {
    if (selectedPartId && selectedPartId !== activePart.id) {
      const found = INTERNAL_3D_PARTS.find((p) => p.id === selectedPartId);
      if (found) {
        setActivePart(found);
      }
    }
  }, [selectedPartId]);

  // Keep explodedFactor synchronized
  useEffect(() => {
    if (explodedFactorProp !== undefined && explodedFactorProp !== explodedFactor) {
      setExplodedFactor(explodedFactorProp);
    }
  }, [explodedFactorProp]);

  // 2D Screen-space coordinates for Sensor HUD Marker Tags
  const [sensorHudTags, setSensorHudTags] = useState<
    Array<{
      id: string;
      badge: string;
      name: string;
      screenX: number;
      screenY: number;
      color: string;
      visible: boolean;
      status: string;
      diagramLayer: string;
    }>
  >([]);

  // Three.js object references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rootGroupRef = useRef<THREE.Group | null>(null);
  
  // Modular Subsystem Groups for Exploded Assembly
  const noseConeGroupRef = useRef<THREE.Group | null>(null);
  const tailMotorGroupRef = useRef<THREE.Group | null>(null);
  const cutawayShellMeshesRef = useRef<THREE.Mesh[]>([]);
  const guardShellGroupRef = useRef<THREE.Group | null>(null);
  const internalGroupRef = useRef<THREE.Group | null>(null);
  const spinalBusMeshRef = useRef<THREE.Mesh | null>(null);
  const internalMeshesRef = useRef<{ id: string; mesh: THREE.Object3D; baseZ: number; isSensor?: boolean; layer: string }[]>([]);
  const sensorBeaconsRef = useRef<THREE.Mesh[]>([]);
  const canardMeshesRef = useRef<THREE.Mesh[]>([]);
  const exhaustPlumeRef = useRef<THREE.Mesh | null>(null);
  const flameLightRef = useRef<THREE.PointLight | null>(null);
  const radarGroupRef = useRef<THREE.Group | null>(null);
  const targetingGroupRef = useRef<THREE.Group | null>(null);
  const airburstGroupRef = useRef<THREE.Group | null>(null);
  const animFrameRef = useRef<number>(0);

  // Mouse orbit
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 9.8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 2. High-Performance WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.45;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 2.5);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 3.8);
    sunLight.position.set(7, 10, 8);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 2.4);
    fillLight.position.set(-6, 5, 7);
    scene.add(fillLight);

    const noseLight = new THREE.DirectionalLight(0x06b6d4, 3.5);
    noseLight.position.set(9, 2, 4);
    scene.add(noseLight);

    const tailExhaustLight = new THREE.PointLight(0xf97316, 5.0, 8.5);
    tailExhaustLight.position.set(0, 0, -3.8);
    scene.add(tailExhaustLight);
    flameLightRef.current = tailExhaustLight;

    const interiorGlow = new THREE.PointLight(0x06b6d4, 3.5, 7.0);
    interiorGlow.position.set(0, 0.4, 0.5);
    scene.add(interiorGlow);

    // Aerospace Ground Grid
    const gridHelper = new THREE.GridHelper(18, 36, 0x0284c7, 0x1e293b);
    gridHelper.position.y = -2.2;
    scene.add(gridHelper);

    // Root Missile Group
    const rootGroup = new THREE.Group();
    rootGroup.rotation.y = -Math.PI / 2 + 0.32;
    rootGroup.rotation.x = 0.15;
    scene.add(rootGroup);
    rootGroupRef.current = rootGroup;

    cutawayShellMeshesRef.current = [];
    internalMeshesRef.current = [];
    sensorBeaconsRef.current = [];
    canardMeshesRef.current = [];

    // ==============================================================
    // MATERIALS
    // ==============================================================
    const cutawayMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f2942,
      metalness: 0.8,
      roughness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
    });

    const guardArmorMat = new THREE.MeshStandardMaterial({
      color: 0x243242,
      metalness: 0.76,
      roughness: 0.32,
      side: THREE.DoubleSide,
    });

    const titaniumMat = new THREE.MeshStandardMaterial({
      color: 0x71717a,
      metalness: 0.95,
      roughness: 0.22,
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      metalness: 0.98,
      roughness: 0.12,
    });

    const heatShieldMat = new THREE.MeshStandardMaterial({
      color: 0x1e222d,
      metalness: 0.92,
      roughness: 0.35,
    });

    const hazardYellowMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.3,
      metalness: 0.4,
    });

    const sensorNeonCyan = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.9,
    });

    const bodyRadius = 0.92;
    const bodyLength = 3.8;
    const noseLength = 2.8;

    // Supersonic Tangent-Ogive Lathe Equation
    const buildForwardNoseOgivePoints = (radius: number, length: number, segments: number) => {
      const points: THREE.Vector2[] = [];
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const zOffset = length * t;
        const y = radius * Math.sqrt(Math.max(0, 1 - (t * (2 - t))));
        points.push(new THREE.Vector2(Math.max(0.005, y), zOffset));
      }
      return points;
    };

    // ==============================================================
    // 1. CUTAWAY AIRFRAME
    // ==============================================================
    const cutawayAngle = Math.PI * 1.15;
    const cutawayBodyGeo = new THREE.CylinderGeometry(bodyRadius, bodyRadius, bodyLength, 64, 1, false, 0, cutawayAngle);
    cutawayBodyGeo.rotateX(Math.PI / 2);
    cutawayBodyGeo.rotateZ(Math.PI * 0.92);
    const cutawayBodyMesh = new THREE.Mesh(cutawayBodyGeo, cutawayMat);
    rootGroup.add(cutawayBodyMesh);
    cutawayShellMeshesRef.current.push(cutawayBodyMesh);

    for (let r = 0; r < 5; r++) {
      const zPos = -bodyLength / 2 + 0.45 + (r * (bodyLength - 0.9)) / 4;
      const ribGeo = new THREE.TorusGeometry(bodyRadius + 0.015, 0.02, 16, 64, cutawayAngle);
      ribGeo.rotateY(Math.PI / 2);
      ribGeo.rotateX(Math.PI * 0.92);
      const ribMesh = new THREE.Mesh(ribGeo, titaniumMat);
      ribMesh.position.set(0, 0, zPos);
      rootGroup.add(ribMesh);
      cutawayShellMeshesRef.current.push(ribMesh as unknown as THREE.Mesh);
    }

    // ==============================================================
    // 2. NOSE CONE ASSEMBLY GROUP (Separates forward in Exploded CAD)
    // ==============================================================
    const noseGroup = new THREE.Group();
    noseGroup.position.set(0, 0, bodyLength / 2);
    rootGroup.add(noseGroup);
    noseConeGroupRef.current = noseGroup;

    const cutawayOgivePts = buildForwardNoseOgivePoints(bodyRadius, noseLength, 24);
    const cutawayNoseGeo = new THREE.LatheGeometry(cutawayOgivePts, 32, 0, cutawayAngle);
    cutawayNoseGeo.rotateX(Math.PI / 2);
    cutawayNoseGeo.rotateZ(Math.PI * 0.92);
    const cutawayNoseMesh = new THREE.Mesh(cutawayNoseGeo, cutawayMat);
    noseGroup.add(cutawayNoseMesh);
    cutawayShellMeshesRef.current.push(cutawayNoseMesh);

    // ==============================================================
    // 3. SOLID MILITARY ARMOR GUARD
    // ==============================================================
    const guardGroup = new THREE.Group();
    rootGroup.add(guardGroup);
    guardShellGroupRef.current = guardGroup;
    guardGroup.visible = false; // Default Cutaway

    const solidBodyGeo = new THREE.CylinderGeometry(bodyRadius + 0.008, bodyRadius + 0.008, bodyLength, 64);
    solidBodyGeo.rotateX(Math.PI / 2);
    const solidBodyMesh = new THREE.Mesh(solidBodyGeo, guardArmorMat);
    guardGroup.add(solidBodyMesh);

    const ogivePoints = buildForwardNoseOgivePoints(bodyRadius + 0.008, noseLength, 48);
    const solidOgiveGeo = new THREE.LatheGeometry(ogivePoints, 64);
    solidOgiveGeo.rotateX(Math.PI / 2);
    const solidOgiveMesh = new THREE.Mesh(solidOgiveGeo, guardArmorMat);
    solidOgiveMesh.position.set(0, 0, bodyLength / 2);
    guardGroup.add(solidOgiveMesh);

    // Guidance Band
    const bandGeo = new THREE.TorusGeometry(bodyRadius + 0.02, 0.03, 16, 64);
    bandGeo.rotateY(Math.PI / 2);
    const bandMesh = new THREE.Mesh(bandGeo, hazardYellowMat);
    bandMesh.position.set(0, 0, bodyLength / 2 + 0.2);
    guardGroup.add(bandMesh);

    // ==============================================================
    // 4. STEERING CANARDS (CRUCIFORM)
    // ==============================================================
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const canardShape = new THREE.Shape();
      canardShape.moveTo(0, 0);
      canardShape.lineTo(0.65, -0.28);
      canardShape.lineTo(0.8, -0.55);
      canardShape.lineTo(0.1, -0.55);
      canardShape.lineTo(0, 0);

      const canardGeo = new THREE.ExtrudeGeometry(canardShape, {
        depth: 0.035,
        bevelEnabled: true,
        bevelThickness: 0.015,
        bevelSize: 0.015,
      });
      const canardMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        metalness: 0.92,
        roughness: 0.18,
      });
      const canardMesh = new THREE.Mesh(canardGeo, canardMat);
      canardMesh.position.set(0, 0, bodyLength / 2 - 0.2);
      canardMesh.rotation.z = angle;
      rootGroup.add(canardMesh);
      canardMeshesRef.current.push(canardMesh);
    }

    // ==============================================================
    // 5. TAIL MOTOR & FINS ASSEMBLY GROUP (Separates rearward in Exploded CAD)
    // ==============================================================
    const tailGroup = new THREE.Group();
    rootGroup.add(tailGroup);
    tailMotorGroupRef.current = tailGroup;

    const boatTailGeo = new THREE.CylinderGeometry(bodyRadius, bodyRadius * 0.72, 1.1, 64);
    boatTailGeo.rotateX(Math.PI / 2);
    const boatTailMesh = new THREE.Mesh(boatTailGeo, heatShieldMat);
    boatTailMesh.position.set(0, 0, -bodyLength / 2 - 0.55);
    tailGroup.add(boatTailMesh);

    const nozzleBellGeo = new THREE.CylinderGeometry(bodyRadius * 0.45, bodyRadius * 0.9, 0.95, 64);
    nozzleBellGeo.rotateX(Math.PI / 2);
    const nozzleBellMesh = new THREE.Mesh(nozzleBellGeo, heatShieldMat);
    nozzleBellMesh.position.set(0, 0, -bodyLength / 2 - 1.45);
    tailGroup.add(nozzleBellMesh);

    // Dynamic Rocket Plume
    const exhaustPlumeGeo = new THREE.ConeGeometry(bodyRadius * 0.65, 2.2, 32);
    exhaustPlumeGeo.rotateX(Math.PI / 2);
    const exhaustPlumeMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.85,
    });
    const exhaustPlumeMesh = new THREE.Mesh(exhaustPlumeGeo, exhaustPlumeMat);
    exhaustPlumeMesh.position.set(0, 0, -bodyLength / 2 - 2.8);
    tailGroup.add(exhaustPlumeMesh);
    exhaustPlumeRef.current = exhaustPlumeMesh;

    // Tail Fins
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const finShape = new THREE.Shape();
      finShape.moveTo(0, 0);
      finShape.lineTo(1.45, -0.85);
      finShape.lineTo(1.65, -1.55);
      finShape.lineTo(0.25, -1.55);
      finShape.lineTo(0, 0);

      const finGeo = new THREE.ExtrudeGeometry(finShape, {
        depth: 0.06,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
      });
      const finMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        metalness: 0.9,
        roughness: 0.22,
      });
      const finMesh = new THREE.Mesh(finGeo, finMat);
      finMesh.position.set(0, 0, -bodyLength / 2 - 0.25);
      finMesh.rotation.z = angle;
      tailGroup.add(finMesh);
    }

    // ==============================================================
    // 6. AEROSHIELD INTERNAL LAYERS (MATCHES YOUR DIAGRAM)
    // ==============================================================
    const internalGroup = new THREE.Group();
    rootGroup.add(internalGroup);
    internalGroupRef.current = internalGroup;

    // Central Glowing Data Bus Spine (Links modules in exploded mode)
    const busGeo = new THREE.CylinderGeometry(0.04, 0.04, 7.5, 16);
    busGeo.rotateX(Math.PI / 2);
    const busMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.65,
    });
    const busMesh = new THREE.Mesh(busGeo, busMat);
    busMesh.position.set(0, 0, 0.2);
    internalGroup.add(busMesh);
    spinalBusMeshRef.current = busMesh;

    // Helper to register an internal module
    const registerModule = (
      id: string,
      mesh: THREE.Object3D,
      baseZ: number,
      layer: 'SENSOR' | 'PROCESSING' | 'PERIPHERAL' | 'POWER',
      isSensor?: boolean
    ) => {
      internalGroup.add(mesh);
      internalMeshesRef.current.push({ id, mesh, baseZ, isSensor, layer });
    };

    // SENSOR 1: 77 GHz MMW / Proximity (+Z = 2.75)
    const mmwGroup = new THREE.Group();
    const mmwHousing = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.12, 0.55),
      new THREE.MeshStandardMaterial({ color: 0xb91c1c, metalness: 0.85, roughness: 0.2, emissive: 0x7f1d1d, emissiveIntensity: 0.35 })
    );
    mmwGroup.add(mmwHousing);
    for (let p = 0; p < 4; p++) {
      const patch = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.22), goldMat);
      patch.position.set(-0.42 + p * 0.28, 0.08, 0);
      mmwGroup.add(patch);
    }
    const beaconMmw = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.04, 16, 48), sensorNeonCyan);
    mmwGroup.add(beaconMmw);
    sensorBeaconsRef.current.push(beaconMmw);
    mmwGroup.position.set(0, 0.2, 2.75);
    registerModule('part-mmw', mmwGroup, 2.75, 'SENSOR', true);

    // SENSOR 2: Barometer & Dynamic Pressure (+Z = 2.25)
    const baroGroup = new THREE.Group();
    const baroChamber = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.28, 32),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.85, roughness: 0.25, emissive: 0x082f49, emissiveIntensity: 0.3 })
    );
    baroChamber.rotateX(Math.PI / 2);
    baroGroup.add(baroChamber);
    const pitotPort = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.4, 16), titaniumMat);
    pitotPort.rotateX(Math.PI / 2);
    pitotPort.position.set(0, 0, 0.2);
    baroGroup.add(pitotPort);
    const beaconBaro = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.035, 16, 48), sensorNeonCyan);
    baroGroup.add(beaconBaro);
    sensorBeaconsRef.current.push(beaconBaro);
    baroGroup.position.set(0, 0, 2.25);
    registerModule('part-baro', baroGroup, 2.25, 'SENSOR', true);

    // SENSOR 3: Temperature Sensor Network (+Z = 1.75)
    const tempGroup = new THREE.Group();
    const tempRing = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.06, 16, 32), new THREE.MeshStandardMaterial({ color: 0xea580c, metalness: 0.8 }));
    tempRing.rotateY(Math.PI / 2);
    tempGroup.add(tempRing);
    for (let t = 0; t < 6; t++) {
      const tAngle = (t * Math.PI) / 3;
      const probe = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), new THREE.MeshBasicMaterial({ color: 0xfb923c }));
      probe.position.set(Math.cos(tAngle) * 0.76, Math.sin(tAngle) * 0.76, 0);
      tempGroup.add(probe);
    }
    const beaconTemp = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.035, 16, 48), sensorNeonCyan);
    tempGroup.add(beaconTemp);
    sensorBeaconsRef.current.push(beaconTemp);
    tempGroup.position.set(0, 0, 1.75);
    registerModule('part-temp', tempGroup, 1.75, 'SENSOR', true);

    // PROCESSING: STM32 / MCU (+Z = 1.35)
    const mcuGroup = new THREE.Group();
    const mcuBoard = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.75), new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.35 }));
    mcuGroup.add(mcuBoard);
    const stmChip = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.12, 0.55),
      new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x1d4ed8, emissiveIntensity: 0.45, metalness: 0.9 })
    );
    stmChip.position.set(0, 0.08, 0);
    mcuGroup.add(stmChip);
    for (let s = 0; s < 8; s++) {
      const pinLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.04), goldMat);
      pinLeft.position.set(-0.32, 0.06, -0.2 + s * 0.06);
      mcuGroup.add(pinLeft);
      const pinRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.04), goldMat);
      pinRight.position.set(0.32, 0.06, -0.2 + s * 0.06);
      mcuGroup.add(pinRight);
    }
    mcuGroup.position.set(0, 0, 1.35);
    registerModule('part-mcu', mcuGroup, 1.35, 'PROCESSING');

    // SENSOR 4: Tactical IMU (+Z = 0.95)
    const imuGroup = new THREE.Group();
    const imuBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.72, 0.72, 0.32, 32),
      new THREE.MeshStandardMaterial({ color: 0x047857, metalness: 0.85, roughness: 0.2, emissive: 0x064e3b, emissiveIntensity: 0.35 })
    );
    imuBase.rotateX(Math.PI / 2);
    imuGroup.add(imuBase);
    const ringGyro = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.05, 16, 32), goldMat);
    ringGyro.position.set(0, 0.12, 0.14);
    imuGroup.add(ringGyro);
    const beaconImu = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.04, 16, 48), sensorNeonCyan);
    beaconImu.position.set(0, 0, 0.14);
    imuGroup.add(beaconImu);
    sensorBeaconsRef.current.push(beaconImu);
    imuGroup.position.set(0, 0, 0.95);
    registerModule('part-imu', imuGroup, 0.95, 'SENSOR', true);

    // SENSOR 5: Magnetometer (+Z = 0.35)
    const magGroup = new THREE.Group();
    const magBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.08, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x0891b2, roughness: 0.3, emissive: 0x164e63, emissiveIntensity: 0.35 })
    );
    magGroup.add(magBoard);
    const magSensorChip = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.25), goldMat);
    magSensorChip.position.set(0, 0.06, 0);
    magGroup.add(magSensorChip);
    const beaconMag = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.035, 16, 48), sensorNeonCyan);
    magGroup.add(beaconMag);
    sensorBeaconsRef.current.push(beaconMag);
    magGroup.position.set(0, 0, 0.35);
    registerModule('part-mag', magGroup, 0.35, 'SENSOR', true);

    // SENSOR 6: GNSS Array (-Z = -0.25)
    const gnssGroup = new THREE.Group();
    const gnssRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.82, 0.06, 16, 48),
      new THREE.MeshStandardMaterial({ color: 0x6d28d9, metalness: 0.9, emissive: 0x4c1d95, emissiveIntensity: 0.35 })
    );
    gnssRing.rotateY(Math.PI / 2);
    gnssGroup.add(gnssRing);
    for (let g = 0; g < 4; g++) {
      const gAngle = (g * Math.PI) / 2;
      const patch = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.06, 0.25), goldMat);
      patch.position.set(Math.cos(gAngle) * 0.82, Math.sin(gAngle) * 0.82, 0);
      gnssGroup.add(patch);
    }
    const beaconGnss = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.035, 16, 48), sensorNeonCyan);
    gnssGroup.add(beaconGnss);
    sensorBeaconsRef.current.push(beaconGnss);
    gnssGroup.position.set(0, 0, -0.25);
    registerModule('part-gnss', gnssGroup, -0.25, 'SENSOR', true);

    // PERIPHERAL: Communication Interface (-Z = -0.85)
    const commGroup = new THREE.Group();
    const commShield = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.35, 0.65),
      new THREE.MeshStandardMaterial({ color: 0xdb2777, metalness: 0.85, roughness: 0.25, emissive: 0x831843, emissiveIntensity: 0.3 })
    );
    commGroup.add(commShield);
    const rfDiplexer = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.45, 16), goldMat);
    rfDiplexer.rotateX(Math.PI / 2);
    rfDiplexer.position.set(0, 0.15, 0);
    commGroup.add(rfDiplexer);
    commGroup.position.set(0, 0, -0.85);
    registerModule('part-comm', commGroup, -0.85, 'PERIPHERAL');

    // PERIPHERAL: Data Logger MicroSD Flash (-Z = -1.35)
    const logGroup = new THREE.Group();
    const logCan = new THREE.Mesh(
      new THREE.CylinderGeometry(0.68, 0.68, 0.45, 32),
      new THREE.MeshStandardMaterial({ color: 0x7c3aed, metalness: 0.9, roughness: 0.2, emissive: 0x5b21b6, emissiveIntensity: 0.3 })
    );
    logCan.rotateX(Math.PI / 2);
    logGroup.add(logCan);
    const sdSlot = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.05, 0.3), goldMat);
    sdSlot.position.set(0, 0.22, 0);
    logGroup.add(sdSlot);
    logGroup.position.set(0, 0, -1.35);
    registerModule('part-log', logGroup, -1.35, 'PERIPHERAL');

    // PERIPHERAL: Status/OLED Display Port (-Z = -1.85)
    const oledGroup = new THREE.Group();
    const oledBezel = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.45, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 })
    );
    oledGroup.add(oledBezel);
    const oledScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.65, 0.3),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    oledScreen.position.set(0, 0, 0.07);
    oledGroup.add(oledScreen);
    oledGroup.position.set(0, 0.5, -1.85);
    registerModule('part-oled', oledGroup, -1.85, 'PERIPHERAL');

    // POWER MANAGEMENT: PMU & Battery (-Z = -2.35)
    const pmuGroup = new THREE.Group();
    const thermalBatt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.78, 0.78, 0.85, 32),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.92, roughness: 0.15, emissive: 0x78350f, emissiveIntensity: 0.4 })
    );
    thermalBatt.rotateX(Math.PI / 2);
    pmuGroup.add(thermalBatt);
    const pmuInductors = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.4), goldMat);
    pmuInductors.position.set(0, 0.35, 0);
    pmuGroup.add(pmuInductors);
    pmuGroup.position.set(0, 0, -2.35);
    registerModule('part-pmu', pmuGroup, -2.35, 'POWER');

    // ==============================================================
    // 7. FMCW RADAR PULSE CONE & CONCENTRIC RINGS
    // ==============================================================
    const radarGroup = new THREE.Group();
    radarGroup.position.set(0, 0, bodyLength / 2 + noseLength);
    rootGroup.add(radarGroup);
    radarGroupRef.current = radarGroup;

    const radarConeGeo = new THREE.ConeGeometry(2.4, 4.8, 32, 1, true);
    radarConeGeo.rotateX(-Math.PI / 2);
    const radarConeMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.32,
    });
    const radarConeMesh = new THREE.Mesh(radarConeGeo, radarConeMat);
    radarConeMesh.position.set(0, 0, 2.4);
    radarGroup.add(radarConeMesh);

    for (let w = 1; w <= 3; w++) {
      const ringGeo = new THREE.RingGeometry(w * 0.75, w * 0.75 + 0.05, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set(0, 0, w * 1.5);
      radarGroup.add(ringMesh);
    }
    radarGroup.visible = effectiveRadar;

    // ==============================================================
    // 7B. TARGET INTERCEPT VECTOR & AIRBURST DETONATION ENVELOPE
    // ==============================================================
    const targetingGroup = new THREE.Group();
    targetingGroup.position.set(0, 0, bodyLength / 2 + noseLength);
    rootGroup.add(targetingGroup);
    targetingGroupRef.current = targetingGroup;

    // Collimated Laser/Guidance Line
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 5.5),
    ]);
    const lineMat = new THREE.LineDashedMaterial({
      color: 0xef4444,
      dashSize: 0.2,
      gapSize: 0.1,
    });
    const targetLine = new THREE.Line(lineGeo, lineMat);
    targetLine.computeLineDistances();
    targetingGroup.add(targetLine);

    // Forward Targeting Crosshair Reticle
    const reticleGroup = new THREE.Group();
    reticleGroup.position.set(0, 0, 5.5);
    const reticleRing = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.6, 32),
      new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })
    );
    reticleGroup.add(reticleRing);
    const reticleDot = new THREE.Mesh(
      new THREE.CircleGeometry(0.08, 16),
      new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })
    );
    reticleGroup.add(reticleDot);
    targetingGroup.add(reticleGroup);
    targetingGroup.visible = showTargetVector;

    // Airburst Lethal Frag Envelope Sphere
    const airburstGroup = new THREE.Group();
    airburstGroup.position.set(0, 0, bodyLength / 2 + noseLength);
    rootGroup.add(airburstGroup);
    airburstGroupRef.current = airburstGroup;

    const fragSphereGeo = new THREE.SphereGeometry(1.6, 24, 16);
    const fragSphereMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const fragSphereMesh = new THREE.Mesh(fragSphereGeo, fragSphereMat);
    fragSphereMesh.position.set(0, 0, 1.2);
    airburstGroup.add(fragSphereMesh);
    airburstGroup.visible = showAirburstEnvelope;

    // ==============================================================
    // 8. INTERACTIVE MOUSE / TOUCH EVENTS
    // ==============================================================
    const domElement = renderer.domElement;

    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !rootGroupRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      rootGroupRef.current.rotation.y += deltaX * 0.007;
      rootGroupRef.current.rotation.x += deltaY * 0.007;

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      const newZ = cameraRef.current.position.z + e.deltaY * 0.006;
      cameraRef.current.position.z = Math.max(4.0, Math.min(16.0, newZ));
    };

    domElement.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('wheel', onWheel, { passive: false });

    const onResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // ==============================================================
    // 9. ANIMATION LOOP
    // ==============================================================
    const clock = new THREE.Clock();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Continuous auto-orbit when not dragging
      if (isRotating && !isDraggingRef.current && rootGroupRef.current) {
        rootGroupRef.current.rotation.y += 0.0035;
      }

      // Dynamic Canard Fin Actuation
      canardMeshesRef.current.forEach((canard, idx) => {
        const pitchRad = (canardPitch * Math.PI) / 180;
        const yawRad = (canardYaw * Math.PI) / 180;
        const rollRad = (canardRoll * Math.PI) / 180;
        const autoOsc = Math.sin(elapsedTime * 2.8 + idx) * 0.06;
        canard.rotation.x = autoOsc + pitchRad + (idx % 2 === 0 ? yawRad : rollRad);
      });

      // Dynamic Exhaust Plume Simulation
      if (exhaustPlumeRef.current) {
        if (effectiveThruster) {
          exhaustPlumeRef.current.visible = true;
          const flicker = Math.sin(elapsedTime * 18) * 0.12;
          exhaustPlumeRef.current.scale.set(1 + flicker, 1 + flicker, 1 + Math.cos(elapsedTime * 24) * 0.22);
        } else {
          exhaustPlumeRef.current.visible = false;
        }
      }
      if (flameLightRef.current) {
        flameLightRef.current.intensity = effectiveThruster ? 4.8 + Math.sin(elapsedTime * 15) * 1.5 : 0;
      }

      // Radar Pulse Wave Motion
      if (radarGroupRef.current && radarGroupRef.current.visible) {
        radarGroupRef.current.rotation.z = elapsedTime * 1.5;
        const scalePulse = 1.0 + Math.sin(elapsedTime * 5.0) * 0.08;
        radarGroupRef.current.scale.set(scalePulse, scalePulse, 1.0);
      }

      // Sensor Beacons Pulse
      sensorBeaconsRef.current.forEach((beacon, idx) => {
        const pulse = 1.0 + Math.sin(elapsedTime * 4.5 + idx * 1.4) * 0.09;
        beacon.scale.set(pulse, pulse, 1);
      });

      // Update 2D Screen-space HUD Coordinates for Sensors in Cutaway/Inspect
      if (container && cameraRef.current && viewMode !== 'GUARD') {
        const rect = container.getBoundingClientRect();
        const visibleParts = INTERNAL_3D_PARTS.filter(
          (p) => activeLayerFilter === 'ALL' || p.diagramLayer === activeLayerFilter
        );

        const newTags = visibleParts.map((part) => {
          const item = internalMeshesRef.current.find((m) => m.id === part.id);
          if (!item) {
            return {
              id: part.id,
              badge: part.badge,
              name: part.name,
              screenX: 0,
              screenY: 0,
              color: part.color,
              visible: false,
              status: part.status,
              diagramLayer: part.diagramLayer,
            };
          }

          const worldPos = new THREE.Vector3();
          item.mesh.getWorldPosition(worldPos);
          worldPos.y += 0.85;

          const proj = worldPos.clone().project(cameraRef.current!);
          const screenX = ((proj.x + 1) * rect.width) / 2;
          const screenY = ((-proj.y + 1) * rect.height) / 2;
          const isVisible = proj.z < 1.0;

          return {
            id: part.id,
            badge: part.badge,
            name: part.name.split(' ')[0] + ' ' + (part.name.split(' ')[1] || ''),
            screenX,
            screenY,
            color: part.color,
            visible: isVisible,
            status: part.status,
            diagramLayer: part.diagramLayer,
          };
        });

        setSensorHudTags(newTags);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', onResize);
      domElement.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domElement.removeEventListener('wheel', onWheel);
      if (rendererRef.current?.domElement && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();
    };
  }, [isRotating, viewMode, activeLayerFilter, effectiveThruster, effectiveRadar, canardPitch, canardYaw, canardRoll]);

  // Handle View Mode Switching (GUARD vs CUTAWAY vs INSPECT)
  useEffect(() => {
    if (guardShellGroupRef.current) {
      guardShellGroupRef.current.visible = viewMode === 'GUARD';
    }

    cutawayShellMeshesRef.current.forEach((mesh) => {
      if (mesh.material instanceof THREE.MeshPhysicalMaterial) {
        if (viewMode === 'GUARD') {
          mesh.visible = false;
        } else if (viewMode === 'CUTAWAY') {
          mesh.visible = true;
          mesh.material.opacity = 0.28;
          mesh.material.transparent = true;
        } else if (viewMode === 'INSPECT') {
          mesh.visible = true;
          mesh.material.opacity = 0.05;
          mesh.material.transparent = true;
        }
      }
    });

    if (internalGroupRef.current) {
      internalGroupRef.current.visible = viewMode !== 'GUARD';
    }

    if (viewMode === 'INSPECT' && cameraRef.current) {
      cameraRef.current.position.set(0, 0.7, 6.2);
    } else if (cameraRef.current && (viewMode === 'GUARD' || viewMode === 'CUTAWAY')) {
      cameraRef.current.position.set(0, 1.2, 9.8);
    }
  }, [viewMode]);

  // Handle Exploded Assembly Separation
  useEffect(() => {
    const factor = explodedFactor;

    // Shift Nose Cone & Radome Forward
    if (noseConeGroupRef.current) {
      noseConeGroupRef.current.position.z = 1.9 + factor * 2.8;
    }

    // Shift Tail Motor Group Rearward
    if (tailMotorGroupRef.current) {
      tailMotorGroupRef.current.position.z = -factor * 2.8;
    }

    // Scale / Stretch Spinal Bus
    if (spinalBusMeshRef.current) {
      spinalBusMeshRef.current.scale.set(1.0, 1.0, 1.0 + factor * 0.9);
    }

    // Shift Internal Modules Along Z Axis
    internalMeshesRef.current.forEach((item) => {
      let shift = 0;
      if (item.id === 'part-mmw') shift = factor * 2.5;
      else if (item.id === 'part-baro') shift = factor * 2.0;
      else if (item.id === 'part-temp') shift = factor * 1.5;
      else if (item.id === 'part-mcu') shift = factor * 0.9;
      else if (item.id === 'part-imu') shift = factor * 0.4;
      else if (item.id === 'part-mag') shift = factor * 0.1;
      else if (item.id === 'part-gnss') shift = -factor * 0.4;
      else if (item.id === 'part-comm') shift = -factor * 0.8;
      else if (item.id === 'part-log') shift = -factor * 1.3;
      else if (item.id === 'part-oled') shift = -factor * 1.8;
      else if (item.id === 'part-pmu') shift = -factor * 2.3;

      item.mesh.position.z = item.baseZ + shift;
    });
  }, [explodedFactor]);

  // Handle Wireframe Hologram Mode
  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => {
            if ('wireframe' in m) m.wireframe = isWireframe;
          });
        } else if ('wireframe' in child.material) {
          child.material.wireframe = isWireframe;
        }
      }
    });
  }, [isWireframe]);

  // Handle Layer Filtering
  useEffect(() => {
    internalMeshesRef.current.forEach((item) => {
      if (activeLayerFilter === 'ALL') {
        item.mesh.visible = true;
      } else {
        item.mesh.visible = item.layer === activeLayerFilter;
      }
    });
  }, [activeLayerFilter]);

  // Handle Radar Cone Visibility
  useEffect(() => {
    if (radarGroupRef.current) {
      radarGroupRef.current.visible = effectiveRadar;
    }
  }, [effectiveRadar]);

  // Handle Target Intercept Vector Visibility
  useEffect(() => {
    if (targetingGroupRef.current) {
      targetingGroupRef.current.visible = showTargetVector;
    }
  }, [showTargetVector]);

  // Handle Airburst Envelope Visibility
  useEffect(() => {
    if (airburstGroupRef.current) {
      airburstGroupRef.current.visible = showAirburstEnvelope;
    }
  }, [showAirburstEnvelope]);

  const handleSelectSubassembly = (part: Internal3DPart) => {
    soundFX.chipSelect();
    setActivePart(part);
    onSelectPart?.(part);

    if (cameraRef.current && rootGroupRef.current) {
      cameraRef.current.position.set(0, 0.6, 6.2);
      cameraRef.current.lookAt(0, 0, part.offsetZ * 0.35);
    }
  };

  const handleResetCamera = () => {
    soundFX.click();
    if (!cameraRef.current || !rootGroupRef.current) return;
    cameraRef.current.position.set(0, 1.2, 9.8);
    cameraRef.current.lookAt(0, 0, 0);
    rootGroupRef.current.rotation.set(0.15, -Math.PI / 2 + 0.32, 0);
  };

  const handleExplodeChange = (newFactor: number) => {
    setExplodedFactor(newFactor);
    onExplodedFactorChange?.(newFactor);
  };

  return (
    <div className="relative w-full h-[580px] sm:h-[640px] bg-[#080d1a] rounded-sm overflow-hidden border border-white/[0.08] shadow-2xl flex flex-col select-none">
      {/* ============================================================== */}
      {/* 1. TOP HEADER: VIEW MODES, EXPLODED CAD SLIDER & WIREFRAME    */}
      {/* ============================================================== */}
      <div className="absolute top-0 inset-x-0 z-20 flex flex-col xl:flex-row items-center justify-between gap-2.5 px-3.5 py-2.5 bg-gradient-to-b from-[#080d1a]/95 via-[#080d1a]/85 to-transparent backdrop-blur-sm">
        {/* Left: View Mode Segmented Switch */}
        <div className="flex items-center p-0.5 rounded-sm bg-[#0d1322] border border-white/[0.08] gap-1 text-xs font-mono">
          <button
            onClick={() => {
              soundFX.click();
              setViewMode('GUARD');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-sm font-semibold transition-all ${
              viewMode === 'GUARD'
                ? 'bg-amber-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield size={13} />
            <span>ARMOR GUARD</span>
          </button>

          <button
            onClick={() => {
              soundFX.click();
              setViewMode('CUTAWAY');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-sm font-semibold transition-all ${
              viewMode === 'CUTAWAY'
                ? 'bg-cyan-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers size={13} />
            <span>CUTAWAY TWIN</span>
          </button>

          <button
            onClick={() => {
              soundFX.click();
              setViewMode('INSPECT');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-sm font-semibold transition-all ${
              viewMode === 'INSPECT'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search size={13} />
            <span>INSPECT INSIDE</span>
          </button>
        </div>

        {/* Center: Interactive Exploded View Controls */}
        <div className="flex items-center gap-2 p-1 bg-[#0d1322] rounded-sm border border-white/[0.08] text-xs font-mono">
          <div className="flex items-center gap-1.5 px-1.5 text-cyan-300 font-semibold text-[11px]">
            <Expand size={12} className="text-cyan-400" />
            <span>EXPLODE CAD:</span>
          </div>

          <div className="flex items-center gap-1">
            {[0, 0.5, 1].map((lvl) => {
              const isActive = Math.abs(explodedFactor - lvl) < 0.15;
              const label = lvl === 0 ? '0% (LOCK)' : lvl === 0.5 ? '50%' : '100% (CAD)';
              return (
                <button
                  key={lvl}
                  onClick={() => {
                    soundFX.phaseStep();
                    handleExplodeChange(lvl);
                  }}
                  className={`px-2 py-0.5 rounded-sm text-[10px] font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-600 text-white'
                      : 'bg-[#080d1a] text-slate-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={explodedFactor}
            onChange={(e) => handleExplodeChange(parseFloat(e.target.value))}
            className="w-20 h-1.5 bg-slate-800 rounded-sm appearance-none cursor-pointer accent-cyan-400"
            title="Drag to separate missile sections in 3D"
          />
        </div>

        {/* Right Tools: Hologram Wireframe, Radar, Plume & Camera Reset */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <button
            onClick={() => {
              soundFX.click();
              setIsWireframe(!isWireframe);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-sm border text-[11px] font-medium transition-colors ${
              isWireframe
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300'
                : 'bg-[#0d1322] hover:bg-[#152238] text-slate-300 border-white/[0.08]'
            }`}
            title="Toggle Holographic Wireframe"
          >
            <Sparkles size={12} className={isWireframe ? 'text-cyan-400' : 'text-slate-400'} />
            <span className="hidden sm:inline">HOLO</span>
          </button>

          <button
            onClick={() => {
              soundFX.click();
              if (onToggleRadarBeam) {
                onToggleRadarBeam(!effectiveRadar);
              } else {
                setLocalRadarBeam(!localRadarBeam);
              }
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-sm border text-[11px] font-medium transition-colors ${
              effectiveRadar
                ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                : 'bg-[#0d1322] hover:bg-[#152238] text-slate-300 border-white/[0.08]'
            }`}
            title="Toggle 77 GHz FMCW Radar Emission Cone"
          >
            <Radar size={12} className={effectiveRadar ? 'text-rose-400 animate-spin' : 'text-slate-400'} />
            <span className="hidden sm:inline">RADAR</span>
          </button>

          <button
            onClick={() => {
              soundFX.click();
              setIsRotating(!isRotating);
            }}
            className="p-1.5 rounded-sm bg-[#0d1322] hover:bg-[#152238] text-slate-300 border border-white/[0.08] transition-colors"
            title={isRotating ? 'Pause Rotation' : 'Auto Rotate'}
          >
            {isRotating ? <Pause size={13} /> : <Play size={13} />}
          </button>

          <button
            onClick={handleResetCamera}
            className="p-1.5 rounded-sm bg-[#0d1322] hover:bg-[#152238] text-slate-300 border border-white/[0.08] transition-colors"
            title="Reset Camera Angle"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Main 3D Canvas */}
      <div ref={mountRef} className="w-full flex-1 relative cursor-grab active:cursor-grabbing" />

      {/* ============================================================== */}
      {/* 2. FLOATING 2D HUD SENSOR MARKERS (When in CUTAWAY / INSPECT)  */}
      {/* ============================================================== */}
      {viewMode !== 'GUARD' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          {sensorHudTags.map((tag) => {
            if (!tag.visible) return null;
            const isSelected = activePart.id === tag.id;
            const x = tag.screenX;
            const y = tag.screenY;

            if (x < 15 || x > 1200 || y < 50 || y > 580) return null;

            return (
              <div
                key={tag.id}
                style={{ left: `${x}px`, top: `${y}px` }}
                className="absolute -translate-x-1/2 -translate-y-full pointer-events-auto cursor-pointer group"
                onClick={() => {
                  const part = INTERNAL_3D_PARTS.find((p) => p.id === tag.id);
                  if (part) handleSelectSubassembly(part);
                }}
              >
                <div
                  className={`px-2 py-0.5 rounded-sm border text-[10px] font-mono font-semibold flex items-center gap-1.5 shadow-xl transition-transform ${
                    isSelected
                      ? 'bg-cyan-600 text-white border-white scale-105'
                      : 'bg-[#090e1a]/95 text-cyan-300 border-cyan-500/50 hover:bg-[#0f172a] hover:scale-105'
                  }`}
                >
                  <Target size={11} className={isSelected ? 'text-white' : 'text-cyan-400'} />
                  <span>{tag.badge}</span>
                </div>

                <div className="w-0.5 h-4 bg-cyan-400 mx-auto opacity-75" />
                <div className="w-2 h-2 rounded-full bg-cyan-400 mx-auto -mt-1 ring-2 ring-cyan-300 animate-ping" />
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. AEROSHIELD SENSOR LAYER & ARCHITECTURE DOCK AT BOTTOM       */}
      {/* ============================================================== */}
      <div className="absolute bottom-3 inset-x-4 z-20 flex flex-col md:flex-row items-center justify-between gap-2 pointer-events-none">
        {/* Sensor Quick-Selectors matching the Diagram's 6 Sensors */}
        <div className="flex items-center gap-1.5 bg-[#0d1322]/95 backdrop-blur-md border border-white/[0.08] rounded-sm p-1 pointer-events-auto shadow-xl overflow-x-auto max-w-full">
          <span className="text-[10px] font-mono text-cyan-300 font-semibold px-2 flex items-center gap-1.5 shrink-0">
            <Radio size={12} className="text-cyan-400 animate-pulse" />
            <span>TRANSDUCERS:</span>
          </span>

          {INTERNAL_3D_PARTS.filter((p) => p.diagramLayer === 'SENSOR').map((sensor) => {
            const isSelected = activePart.id === sensor.id;
            return (
              <button
                key={sensor.id}
                onClick={() => {
                  if (viewMode === 'GUARD') setViewMode('CUTAWAY');
                  handleSelectSubassembly(sensor);
                }}
                className={`px-2 py-0.5 rounded-sm text-[10px] font-mono font-medium transition-all border flex items-center gap-1 shrink-0 ${
                  isSelected
                    ? 'bg-cyan-600 text-white border-cyan-300 shadow-md'
                    : 'bg-[#080d1a] text-slate-300 border-white/[0.08] hover:text-white hover:bg-[#121c30]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sensor.color }} />
                <span>{sensor.badge}</span>
              </button>
            );
          })}
        </div>

        {/* 4-Layer Architecture Segmented Filter */}
        <div className="flex items-center gap-0.5 p-0.5 bg-[#0d1322]/95 backdrop-blur-md border border-white/[0.08] rounded-sm pointer-events-auto text-[10px] font-mono font-semibold shadow-md">
          <button
            onClick={() => {
              soundFX.click();
              setActiveLayerFilter('ALL');
            }}
            className={`px-2 py-1 rounded-sm transition-all ${
              activeLayerFilter === 'ALL' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ALL
          </button>
          <button
            onClick={() => {
              soundFX.click();
              setActiveLayerFilter('SENSOR');
            }}
            className={`px-2 py-1 rounded-sm transition-all ${
              activeLayerFilter === 'SENSOR' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1. SENSORS
          </button>
          <button
            onClick={() => {
              soundFX.click();
              setActiveLayerFilter('PROCESSING');
            }}
            className={`px-2 py-1 rounded-sm transition-all ${
              activeLayerFilter === 'PROCESSING' ? 'bg-cyan-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2. MCU
          </button>
          <button
            onClick={() => {
              soundFX.click();
              setActiveLayerFilter('PERIPHERAL');
            }}
            className={`px-2 py-1 rounded-sm transition-all ${
              activeLayerFilter === 'PERIPHERAL' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3. PERIPH
          </button>
          <button
            onClick={() => {
              soundFX.click();
              setActiveLayerFilter('POWER');
            }}
            className={`px-2 py-1 rounded-sm transition-all ${
              activeLayerFilter === 'POWER' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            4. POWER
          </button>
        </div>
      </div>
    </div>
  );
};
