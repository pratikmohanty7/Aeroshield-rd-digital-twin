import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SensorType } from '../types/sensor';
import { StatusBadge } from '../components/common/StatusBadge';
import { Missile3DDigitalTwin, Internal3DPart, INTERNAL_3D_PARTS } from '../components/missile/Missile3DDigitalTwin';
import {
  Compass,
  Navigation,
  Gauge,
  Thermometer,
  Radio,
  Activity,
  Cpu,
  ShieldCheck,
  Zap,
  Box,
  RotateCcw,
  Play,
  Pause,
  ArrowRight,
  Crosshair,
  Sliders,
  Layers,
  AlertTriangle,
  Clock,
  CheckSquare,
  Search,
  SlidersHorizontal,
  Flame,
  ChevronRight,
  Terminal,
  Target,
  Wind,
  Eye,
  RefreshCw,
  X,
  FastForward,
  Rewind,
  Radar,
  Sparkles,
} from 'lucide-react';
import { formatNumber, formatElapsedSeconds } from '../utils/formatters';

type CockpitViewMode = 'PFD' | 'CAD_3D' | 'TRAJECTORY';

interface FlightPhaseConfig {
  id: string;
  name: string;
  code: string;
  duration: string;
  startSec: number;
  endSec: number;
  status: string;
  summary: string;
  dynamics: {
    gLoad: number;
    spinRateHz: number;
    mach: number;
    altM: number;
    canardTrimDeg: number;
  };
}

const FLIGHT_PHASES: FlightPhaseConfig[] = [
  {
    id: 'PHASE_GUN_LAUNCH',
    name: 'Launch Setback',
    code: 'PH-01',
    duration: '0.00 - 0.05 s',
    startSec: 0.0,
    endSec: 0.05,
    status: 'SURVIVED',
    summary: 'In-bore setback acceleration (28,400 g) and barrel pressure transient in 155mm ordnance tube.',
    dynamics: { gLoad: 28400, spinRateHz: 280, mach: 0.85, altM: 120, canardTrimDeg: 0 },
  },
  {
    id: 'PHASE_DESPIN',
    name: 'Muzzle Exit & Despin',
    code: 'PH-02',
    duration: '0.05 - 2.50 s',
    startSec: 0.05,
    endSec: 2.5,
    status: 'ACTIVE',
    summary: 'Aerodynamic brake deployment despinning forward guidance fuze from 280 Hz to < 20 Hz roll rate.',
    dynamics: { gLoad: 1.2, spinRateHz: 18.5, mach: 2.15, altM: 850, canardTrimDeg: 0 },
  },
  {
    id: 'PHASE_MIDCOURSE',
    name: 'Midcourse Guidance',
    code: 'PH-03',
    duration: '2.50 - 55.00 s',
    startSec: 2.5,
    endSec: 55.0,
    status: 'IN_FLIGHT',
    summary: 'Coupled GPS/INS Extended Kalman Filter navigation maintaining optimal ballistic corridor.',
    dynamics: { gLoad: 1.0, spinRateHz: 1.2, mach: 1.75, altM: 8400, canardTrimDeg: 1.4 },
  },
  {
    id: 'PHASE_TERMINAL',
    name: 'Terminal Divert',
    code: 'PH-04',
    duration: '55.00 - 72.00 s',
    startSec: 55.0,
    endSec: 72.0,
    status: 'STANDBY',
    summary: 'High-rate canard actuation correcting wind drift and trajectory dispersion to achieve CEP ≤ 30 m.',
    dynamics: { gLoad: 4.8, spinRateHz: 0.2, mach: 1.10, altM: 1200, canardTrimDeg: 4.2 },
  },
  {
    id: 'PHASE_FUZE',
    name: 'Proximity Burst',
    code: 'PH-05',
    duration: '72.00 - 74.00 s',
    startSec: 72.0,
    endSec: 74.0,
    status: 'ARMED',
    summary: '77 GHz FMCW millimeter-wave radar height-of-burst trigger for precision airburst initiation.',
    dynamics: { gLoad: 1.0, spinRateHz: 0.0, mach: 0.95, altM: 12.5, canardTrimDeg: 0.5 },
  },
];

export const OverviewPage: React.FC = () => {
  const {
    sensors,
    healthBreakdown,
    obdsState,
    telemetryStats,
    validationTests,
    setActivePage,
    recoverAllFaults,
    activeFaults,
    auditLogs,
    session,
    isRunning,
    startSimulation,
    pauseSimulation,
    timeSeconds,
    setTimeSeconds,
    injectFault,
    flightTelemetry,
    setFlightPhase,
    setCanardTrim,
    setCanardMode,
    toggleEccmAntiJam,
    annunciator,
    tacticalTarget,
    smartFuze,
  } = useApp();

  // Top level view & phase states
  const [cockpitView, setCockpitView] = useState<CockpitViewMode>('PFD');
  const [auditFilter, setAuditFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');
  const [auditSearch, setAuditSearch] = useState<string>('');

  // Interactive Canard Actuation (CAS) Flight Steering - Synced with flightTelemetry
  const canardMode: 'AUTO' | 'MANUAL' = flightTelemetry.canardMode;
  const canardPitch = flightTelemetry.canards.pitch;
  const canardYaw = flightTelemetry.canards.yaw;
  const canardRoll = flightTelemetry.canards.roll;

  // Interactive 3D CAD Controls
  const [explodedViewFactor, setExplodedViewFactor] = useState<number>(0);
  const [showRadarBeam, setShowRadarBeam] = useState<boolean>(true);
  const [showThrusterFlame, setShowThrusterFlame] = useState<boolean>(true);
  const [selectedCadPart, setSelectedCadPart] = useState<Internal3DPart | null>(null);

  // Interactive Target Radar & CEP Simulator
  const [crosswindKnots, setCrosswindKnots] = useState<number>(18);
  const [crosswindAzimuth, setCrosswindAzimuth] = useState<number>(270); // From West
  const gpsJammingActive = activeFaults.some((f) => f.type === 'GNSS_LOSS');
  const closedLoopCasActive = canardMode === 'AUTO';
  const [targetOffset, setTargetOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Interactive Transducer Inspector Modal
  const [inspectingSensorId, setInspectingSensorId] = useState<SensorType | null>(null);
  const [simulatedBiasOffset, setSimulatedBiasOffset] = useState<number>(0);

  const selectedPhaseId = flightTelemetry.phaseId;

  const activePhase = useMemo(
    () => FLIGHT_PHASES.find((p) => p.id === selectedPhaseId) || FLIGHT_PHASES[2],
    [selectedPhaseId]
  );

  const passedTests = validationTests.filter((t) => t.status === 'SIMULATED PASS').length;
  const activeFaultCount = activeFaults.filter((f) => f.active).length;

  // 6 Primary Transducer Channels
  const transducerChannels = [
    {
      id: 'IMU' as const,
      code: 'IMU-01',
      name: 'Triaxial Accelerometer & Gyro',
      subsystem: 'Inertial Navigation (INS)',
      icon: Compass,
      nominalMin: 0.90,
      nominalMax: 1.15,
      baseline: 1.02,
      spec: '±50g MEMS · 6-DOF',
      faultToInject: 'IMU_BIAS' as const,
    },
    {
      id: 'GNSS' as const,
      code: 'GNSS-01',
      name: 'Multi-Constellation Satellite Receiver',
      subsystem: 'Satellite Positioning',
      icon: Navigation,
      nominalMin: 445.0,
      nominalMax: 460.0,
      baseline: 452.4,
      spec: 'L1/L5 Dual Band · NavIC',
      faultToInject: 'GNSS_LOSS' as const,
    },
    {
      id: 'PRESSURE' as const,
      code: 'BARO-01',
      name: 'Static Air Data Barometer',
      subsystem: 'Pitot-Static Altimetry',
      icon: Gauge,
      nominalMin: 957.0,
      nominalMax: 965.0,
      baseline: 961.2,
      spec: 'Piezoresistive Sealed · 0.01 hPa',
      faultToInject: 'STALE_DATA' as const,
    },
    {
      id: 'TEMPERATURE' as const,
      code: 'THRM-01',
      name: 'Avionics Core Thermal Monitor',
      subsystem: 'Thermal Management',
      icon: Thermometer,
      nominalMin: 25.0,
      nominalMax: 52.0,
      baseline: 34.6,
      spec: 'Multi-Point RTD Bridge',
      faultToInject: 'TEMPERATURE_SPIKE' as const,
    },
    {
      id: 'MAGNETOMETER' as const,
      code: 'MAG-01',
      name: 'Triaxial Fluxgate Compass',
      subsystem: 'Magnetic Heading Reference',
      icon: Radio,
      nominalMin: 135.0,
      nominalMax: 150.0,
      baseline: 142.5,
      spec: 'Triaxial Fluxgate · Calibrated',
      faultToInject: 'SENSOR_DISAGREEMENT' as const,
    },
    {
      id: 'ENVIRONMENT' as const,
      code: 'RDR-01',
      name: '77 GHz Proximity Altimeter',
      subsystem: 'RF Radar Altimetry',
      icon: Activity,
      nominalMin: 8.0,
      nominalMax: 16.0,
      baseline: 12.4,
      spec: '4-Patch Conformal FMCW Array',
      faultToInject: 'SENSOR_DROPOUT' as const,
    },
  ];

  // Dynamic CEP Calculation based on interactive controls
  const calculatedCep = useMemo(() => {
    let base = 14.2;
    // Crosswind impact
    base += (crosswindKnots / 40.0) * 4.8;
    // GPS Jamming impact
    if (gpsJammingActive) {
      base += 6.5; // Falls back to INS only
    }
    // Manual Trim influence
    if (canardMode === 'MANUAL') {
      const manualDivert = Math.hypot(canardPitch, canardYaw);
      base += manualDivert * 0.4 + 5.0;
    }
    return base.toFixed(1);
  }, [crosswindKnots, gpsJammingActive, canardMode, canardPitch, canardYaw]);

  // Monte-Carlo round clusters for radar target visualization
  const simulatedImpactRounds = useMemo(() => {
    const rounds: Array<{ x: number; y: number; id: number }> = [];
    const cepRadius = parseFloat(calculatedCep);
    const count = 16;
    // Pseudo-random deterministic offsets centered around targetOffset + wind vector
    const windRad = (crosswindAzimuth * Math.PI) / 180;
    const windDriftX = (crosswindKnots / 40.0) * 8.0 * Math.sin(windRad);
    const windDriftY = -(crosswindKnots / 40.0) * 8.0 * Math.cos(windRad);

    const effectiveDriftX = closedLoopCasActive ? windDriftX * 0.15 : windDriftX * 4.0;
    const effectiveDriftY = closedLoopCasActive ? windDriftY * 0.15 : windDriftY * 4.0;

    for (let i = 0; i < count; i++) {
      const angle = (i * 137.5 * Math.PI) / 180;
      const rFraction = Math.sqrt((i + 0.5) / count);
      const r = rFraction * (cepRadius * 0.85);
      rounds.push({
        id: i,
        x: targetOffset.x + effectiveDriftX + r * Math.cos(angle),
        y: targetOffset.y + effectiveDriftY + r * Math.sin(angle),
      });
    }
    return rounds;
  }, [calculatedCep, crosswindKnots, crosswindAzimuth, closedLoopCasActive, targetOffset]);

  // Filtered audit logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSeverity =
        auditFilter === 'ALL' ||
        (auditFilter === 'CRITICAL' && (log.severity === 'CRITICAL' || log.severity === 'ERROR')) ||
        (auditFilter === 'WARNING' && log.severity === 'WARNING') ||
        (auditFilter === 'INFO' && log.severity === 'INFO');

      const matchesSearch =
        !auditSearch ||
        log.message.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.module.toLowerCase().includes(auditSearch.toLowerCase());

      return matchesSeverity && matchesSearch;
    });
  }, [auditLogs, auditFilter, auditSearch]);

  const activeInspectingConfig = useMemo(
    () => transducerChannels.find((c) => c.id === inspectingSensorId),
    [inspectingSensorId]
  );

  return (
    <div className="space-y-4 max-w-[1780px] mx-auto text-slate-100 font-sans">
      
      {/* 1. STATUS BAR & CONSOLE IDENTIFIERS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#1f2533]">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-0.5">
            <span>PGK-155 GNC Telemetry</span>
            <span>·</span>
            <span className="text-slate-300">Unit S/N 4092-B</span>
            <span>·</span>
            <span className="text-emerald-400">10 Hz Link Active</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span>Primary Flight Display &amp; Telemetry Console</span>
          </h1>
        </div>

        {/* Real-Time Operational Context Metrics */}
        <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-sm bg-[#121620] border border-[#1f2635]">
            <span className="text-slate-400 text-[11px]">System Health:</span>
            <span
              className={`font-bold tabular-nums ${
                healthBreakdown.systemHealthIndex >= 85
                  ? 'text-emerald-400'
                  : healthBreakdown.systemHealthIndex >= 70
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {healthBreakdown.systemHealthIndex}%
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-300 font-medium">{healthBreakdown.status}</span>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 rounded-sm bg-[#121620] border border-[#1f2635] text-[11px]">
            <span className="text-slate-400">Battery Rail:</span>
            <span className="text-white font-bold tabular-nums">
              {sensors.POWER.primaryValue.toFixed(1)} V
            </span>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 rounded-sm bg-[#121620] border border-[#1f2635] text-[11px]">
            <span className="text-slate-400">Timebase:</span>
            <span className="text-sky-300 font-bold tabular-nums">
              T+{timeSeconds.toFixed(1)}s
            </span>
          </div>

          <button
            onClick={() => setActivePage('simulation')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-sm bg-[#1a2334] hover:bg-[#222e44] border border-[#2c3d59] text-sky-300 text-xs transition-colors"
          >
            <Sliders size={12} />
            <span>Simulation Testbed</span>
            <ArrowRight size={11} />
          </button>
        </div>
      </div>

      {/* 2. INTERACTIVE TRAJECTORY PROFILE & FLIGHT TIME SCRUBBER */}
      <section className="bg-[#11141c] border border-[#1e2330] rounded-sm p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Flame size={13} className="text-amber-400" />
            <span className="font-semibold text-slate-200 uppercase text-[11px] font-mono tracking-wide">
              Flight Phase Profile (155mm Extended-Range Trajectory)
            </span>
          </div>
          
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="text-slate-400">
              Active: <strong className="text-sky-300">{activePhase.name}</strong> [{activePhase.code}]
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300 tabular-nums">
              T+{timeSeconds.toFixed(1)}s / 74.0s
            </span>
          </div>
        </div>

        {/* 5-Step Phase Stepper Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 font-mono">
          {FLIGHT_PHASES.map((phase) => {
            const isSelected = selectedPhaseId === phase.id;
            return (
              <button
                key={phase.id}
                onClick={() => {
                  setFlightPhase(phase.id as any);
                  setTimeSeconds(phase.startSec);
                }}
                className={`p-2.5 rounded-sm border text-left transition-colors relative ${
                  isSelected
                    ? 'bg-[#182130] border-sky-600 text-white shadow-sm'
                    : 'bg-[#0d1017] border-[#1d2330] text-slate-400 hover:text-slate-200 hover:bg-[#121622]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-sky-400 font-bold">{phase.code}</span>
                  <span className="text-slate-400">{phase.duration}</span>
                </div>
                <div className="text-xs font-semibold text-white truncate block">
                  {phase.name}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-1.5 border-t border-[#1a202c]">
                  <span>Mach {phase.dynamics.mach}</span>
                  <span>{phase.dynamics.gLoad > 100 ? `${(phase.dynamics.gLoad / 1000).toFixed(0)}k g` : `${phase.dynamics.gLoad} g`}</span>
                  <span className="text-emerald-400">{phase.status}</span>
                </div>
                {isSelected && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-sky-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tactile Trajectory Timeline Scrubber & Quick Seek Milestones */}
        <div className="p-2.5 rounded-sm bg-[#0d1017] border border-[#1b202c] space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="uppercase font-semibold text-slate-300">Tactile Flight Clock Scrubber</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setTimeSeconds(Math.max(0, parseFloat((timeSeconds - 1.0).toFixed(1))))}
                className="px-1.5 py-0.5 rounded-xs bg-[#161b26] hover:bg-[#202736] text-slate-300 border border-[#242c3d] flex items-center gap-0.5 transition-colors"
                title="Step back 1 second"
              >
                <Rewind size={10} />
                <span>-1s</span>
              </button>

              <button
                onClick={() => {
                  if (isRunning) pauseSimulation();
                  else startSimulation();
                }}
                className={`px-2 py-0.5 rounded-xs font-bold transition-colors ${
                  isRunning
                    ? 'bg-amber-950 text-amber-300 border border-amber-700'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                }`}
              >
                {isRunning ? 'PAUSE' : 'PLAY'}
              </button>

              <button
                onClick={() => setTimeSeconds(Math.min(74, parseFloat((timeSeconds + 1.0).toFixed(1))))}
                className="px-1.5 py-0.5 rounded-xs bg-[#161b26] hover:bg-[#202736] text-slate-300 border border-[#242c3d] flex items-center gap-0.5 transition-colors"
                title="Step forward 1 second"
              >
                <span>+1s</span>
                <FastForward size={10} />
              </button>
            </div>
          </div>

          {/* Interactive Range Slider */}
          <div className="relative flex items-center">
            <input
              type="range"
              min="0"
              max="74"
              step="0.1"
              value={timeSeconds % 74}
              onChange={(e) => setTimeSeconds(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#1a202c] rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Quick Flight Milestones */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-[#161a24] overflow-x-auto gap-2">
            <span className="text-slate-500 uppercase shrink-0">Milestones:</span>
            {[
              { label: '0.0s Setback', t: 0.0 },
              { label: '1.2s Despin', t: 1.2 },
              { label: '25.0s Midcourse', t: 25.0 },
              { label: '58.0s Terminal', t: 58.0 },
              { label: '73.0s Burst', t: 73.0 },
            ].map((m) => (
              <button
                key={m.label}
                onClick={() => setTimeSeconds(m.t)}
                className={`px-1.5 py-0.5 rounded-xs transition-colors shrink-0 ${
                  Math.abs((timeSeconds % 74) - m.t) < 1.0
                    ? 'bg-sky-900/60 text-sky-300 border border-sky-600 font-bold'
                    : 'bg-[#121620] hover:bg-[#1a202c] text-slate-400 hover:text-white border border-[#1e2533]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. HERO COCKPIT INSTRUMENT WORKSTATION */}
      <section className="bg-[#11141c] border border-[#1e2330] rounded-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-[#1b202c]">
          <div className="flex items-center gap-2.5">
            <Crosshair size={16} className="text-sky-400" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wide">
                {cockpitView === 'PFD' && 'Primary Flight Display (PFD) · Attitude & Air Data'}
                {cockpitView === 'CAD_3D' && 'Airframe 3D Spatial Assembly Model'}
                {cockpitView === 'TRAJECTORY' && 'Guidance Dispersion & Radar Target Reticle'}
              </h2>
            </div>
          </div>

          {/* Mode Switcher Segmented Control */}
          <div className="flex items-center gap-1 bg-[#0d1017] border border-[#1d2330] rounded-sm p-0.5 text-xs font-mono">
            <button
              onClick={() => setCockpitView('PFD')}
              className={`px-3 py-1 rounded-sm transition-colors ${
                cockpitView === 'PFD'
                  ? 'bg-[#1b2333] text-white font-semibold border border-[#2d3a50]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Flight PFD
            </button>
            <button
              onClick={() => setCockpitView('CAD_3D')}
              className={`px-3 py-1 rounded-sm transition-colors ${
                cockpitView === 'CAD_3D'
                  ? 'bg-[#1b2333] text-white font-semibold border border-[#2d3a50]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              3D CAD Model
            </button>
            <button
              onClick={() => setCockpitView('TRAJECTORY')}
              className={`px-3 py-1 rounded-sm transition-colors ${
                cockpitView === 'TRAJECTORY'
                  ? 'bg-[#1b2333] text-white font-semibold border border-[#2d3a50]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dispersion (CEP)
            </button>
          </div>
        </div>

        {/* CANARD ACTUATION (CAS) INTERACTIVE TRIM CONTROLS (Always available across cockpit views) */}
        <div className="p-2.5 rounded-sm bg-[#0d1017] border border-[#1c2230] font-mono text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={13} className="text-sky-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide">
              Canard Actuation (CAS) Trim:
            </span>
            <div className="flex items-center bg-[#131822] rounded-xs border border-[#202738] p-0.5">
              <button
                onClick={() => setCanardMode('AUTO')}
                className={`px-2 py-0.5 rounded-xs text-[10px] font-medium transition-colors ${
                  canardMode === 'AUTO'
                    ? 'bg-sky-700 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                AUTONOMOUS GNC
              </button>
              <button
                onClick={() => setCanardMode('MANUAL')}
                className={`px-2 py-0.5 rounded-xs text-[10px] font-medium transition-colors ${
                  canardMode === 'MANUAL'
                    ? 'bg-amber-700 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                MANUAL STIMULUS
              </button>
            </div>
          </div>

          {/* Fin Deflection Sliders */}
          <div className="flex items-center gap-4 flex-wrap text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Pitch:</span>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.5"
                value={canardPitch}
                onChange={(e) => {
                  setCanardMode('MANUAL');
                  setCanardTrim(parseFloat(e.target.value), canardYaw, canardRoll);
                }}
                className="w-20 h-1 bg-[#1e2638] rounded-xs accent-sky-400 cursor-pointer"
              />
              <span className="w-9 text-right font-bold tabular-nums text-white">
                {canardPitch > 0 ? `+${canardPitch.toFixed(1)}` : canardPitch.toFixed(1)}°
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Yaw:</span>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.5"
                value={canardYaw}
                onChange={(e) => {
                  setCanardMode('MANUAL');
                  setCanardTrim(canardPitch, parseFloat(e.target.value), canardRoll);
                }}
                className="w-20 h-1 bg-[#1e2638] rounded-xs accent-sky-400 cursor-pointer"
              />
              <span className="w-9 text-right font-bold tabular-nums text-white">
                {canardYaw > 0 ? `+${canardYaw.toFixed(1)}` : canardYaw.toFixed(1)}°
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setCanardTrim(0, 0, 0);
                  setCanardMode('AUTO');
                }}
                className="px-2 py-0.5 rounded-xs bg-[#161c28] hover:bg-[#202738] text-slate-300 border border-[#242e42] text-[10px] transition-colors"
                title="Reset canards to zero neutral trim"
              >
                RESET
              </button>
            </div>
          </div>
        </div>

        {/* VIEW 1: AERONAUTICAL PRIMARY FLIGHT DISPLAY (PFD) */}
        {cockpitView === 'PFD' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 font-mono">
            
            {/* Left Instrument Tape: Calibrated Airspeed & G-Load */}
            <div className="bg-[#0d1017] border border-[#1c212c] rounded-sm p-3.5 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#181d27]">
                <span className="text-slate-400 uppercase font-semibold text-[10px]">Air Data &amp; Inertial Acceleration</span>
                <span className="text-sky-400 text-[10px]">PITOT / INS</span>
              </div>

              <div className="space-y-2.5">
                <div className="p-2.5 rounded-sm bg-[#090b10] border border-[#161a24]">
                  <span className="text-[10px] text-slate-400 uppercase block">Calibrated Airspeed</span>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <span className="text-xl font-bold text-white tabular-nums">
                      Mach {activePhase.dynamics.mach}
                    </span>
                    <span className="text-xs text-slate-400">
                      ~{(activePhase.dynamics.mach * 343).toFixed(0)} m/s
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-sm bg-[#090b10] border border-[#161a24]">
                  <span className="text-[10px] text-slate-400 uppercase block">Inertial G-Load Vector</span>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <span className="text-xl font-bold text-sky-300 tabular-nums">
                      {formatNumber(sensors.IMU.primaryValue, 2)} G
                    </span>
                    <span className="text-xs text-emerald-400 font-semibold">
                      {sensors.IMU.status === 'NORMAL' ? 'NOMINAL' : 'LIMIT BREACH'}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-sm bg-[#090b10] border border-[#161a24] text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Axial Accel (X):</span>
                    <span className="text-white tabular-nums">+{sensors.IMU.fields?.['accelX']?.value || '0.04'} G</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Lateral Accel (Y):</span>
                    <span className="text-white tabular-nums">-{sensors.IMU.fields?.['accelY']?.value || '0.02'} G</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Normal Accel (Z):</span>
                    <span className="text-white tabular-nums">+{formatNumber(sensors.IMU.primaryValue, 2)} G</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Center Instrument: Artificial Horizon Gyro Visualizer (Reactive to Canard Trim) */}
            <div className="bg-[#0d1017] border border-[#1c212c] rounded-sm p-4 flex flex-col items-center justify-center relative min-h-[290px]">
              {/* Pitch & Roll Horizon Circle */}
              <div className="w-52 h-52 rounded-full border border-slate-700 relative overflow-hidden bg-slate-900 shadow-inner">
                {/* Sky */}
                <div className="absolute inset-0 bg-[#1e3a5f]" />
                {/* Ground */}
                <div
                  className="absolute inset-x-0 bottom-0 h-1/2 bg-[#5c3826] border-t-2 border-white/80 transition-transform duration-200"
                  style={{
                    transform: `translateY(${-(
                      (sensors.IMU.primaryValue - 1.0) * 18 +
                      canardPitch * 3.5
                    )}px) rotate(${
                      (sensors.MAGNETOMETER.primaryValue > 140 ? -2 : 2) + canardYaw * 1.8
                    }deg)`,
                  }}
                />

                {/* Horizon Pitch Ladder */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none space-y-3 opacity-60">
                  <div className="w-14 h-[1px] bg-white" />
                  <div className="w-20 h-[1px] bg-white" />
                  <div className="w-10 h-[1px] bg-white" />
                </div>

                {/* Fixed Aircraft Reticle Symbol */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-8 h-1 bg-amber-400" />
                  <div className="w-2 h-2 rounded-full border-2 border-amber-400 bg-transparent" />
                  <div className="w-8 h-1 bg-amber-400" />
                </div>

                {/* Compass Heading Indicator at Top */}
                <div className="absolute top-2 inset-x-0 flex justify-center">
                  <span className="px-1.5 py-0.2 rounded-xs bg-black/80 text-[10px] font-mono text-sky-300 border border-slate-700">
                    HDG {formatNumber(sensors.MAGNETOMETER.primaryValue + canardYaw * 2, 1)}°
                  </span>
                </div>
              </div>

              <div className="mt-3 text-center text-xs">
                <span className="text-slate-400 block text-[10px]">Attitude Direction Indicator (ADI)</span>
                <span className="text-slate-200 font-semibold text-xs">
                  Pitch {(4.2 + canardPitch).toFixed(1)}° · Bank {(canardYaw * 1.5).toFixed(1)}° · Yaw Rate {activePhase.dynamics.spinRateHz} Hz
                </span>
              </div>
            </div>

            {/* Right Instrument Tape: Barometric & GPS Altitude */}
            <div className="bg-[#0d1017] border border-[#1c212c] rounded-sm p-3.5 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#181d27]">
                <span className="text-slate-400 uppercase font-semibold text-[10px]">Altimetry &amp; Atmosphere</span>
                <span className="text-sky-400 text-[10px]">GNSS / BARO</span>
              </div>

              <div className="space-y-2.5">
                <div className="p-2.5 rounded-sm bg-[#090b10] border border-[#161a24]">
                  <span className="text-[10px] text-slate-400 uppercase block">GNSS Geodetic Altitude</span>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <span className="text-xl font-bold text-white tabular-nums">
                      {formatNumber(sensors.GNSS.primaryValue, 1)} m
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      MSL Elevation
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-sm bg-[#090b10] border border-[#161a24]">
                  <span className="text-[10px] text-slate-400 uppercase block">Barometric Static Pressure</span>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <span className="text-xl font-bold text-sky-300 tabular-nums">
                      {formatNumber(sensors.PRESSURE.primaryValue, 1)} hPa
                    </span>
                    <span className="text-xs text-emerald-400 font-semibold">
                      {sensors.PRESSURE.status}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-sm bg-[#090b10] border border-[#161a24] text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">77 GHz Standoff Height:</span>
                    <span className="text-white tabular-nums">{formatNumber(sensors.ENVIRONMENT.primaryValue, 2)} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Core Electronic Temp:</span>
                    <span className="text-white tabular-nums">{formatNumber(sensors.TEMPERATURE.primaryValue, 1)} °C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Telemetry Downlink:</span>
                    <span className="text-emerald-400 tabular-nums">{telemetryStats.averageLatencyMs.toFixed(1)} ms</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 2: 3D CAD MODEL (Fully Interactive Orbit, Explode Slider & Parts) */}
        {cockpitView === 'CAD_3D' && (
          <div className="space-y-2">
            {/* 3D CAD Toolbar */}
            <div className="p-2 rounded-sm bg-[#0d1017] border border-[#1c2230] font-mono text-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Exploded View:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={explodedViewFactor}
                  onChange={(e) => setExplodedViewFactor(parseFloat(e.target.value))}
                  className="w-28 h-1 bg-[#1e2638] rounded-xs accent-sky-400 cursor-pointer"
                />
                <span className="text-xs font-bold text-sky-300 tabular-nums w-10">
                  {Math.round(explodedViewFactor * 100)}%
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRadarBeam(!showRadarBeam)}
                  className={`px-2.5 py-1 rounded-xs text-[10px] font-medium border transition-colors ${
                    showRadarBeam
                      ? 'bg-sky-950/70 border-sky-600 text-sky-300'
                      : 'bg-[#121620] border-[#1d2330] text-slate-400 hover:text-white'
                  }`}
                >
                  Radar Lobe
                </button>

                <button
                  onClick={() => setShowThrusterFlame(!showThrusterFlame)}
                  className={`px-2.5 py-1 rounded-xs text-[10px] font-medium border transition-colors ${
                    showThrusterFlame
                      ? 'bg-amber-950/70 border-amber-600 text-amber-300'
                      : 'bg-[#121620] border-[#1d2330] text-slate-400 hover:text-white'
                  }`}
                >
                  Plume
                </button>

                {selectedCadPart && (
                  <button
                    onClick={() => setSelectedCadPart(null)}
                    className="px-2 py-1 rounded-xs bg-[#161c28] text-slate-300 border border-[#242e42] text-[10px]"
                  >
                    Clear Focus
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
              <div className="lg:col-span-3 h-[460px] w-full rounded-sm border border-[#1c212c] overflow-hidden relative">
                <Missile3DDigitalTwin
                  flightPhase={activePhase.name}
                  canardPitch={canardPitch}
                  canardYaw={canardYaw}
                  canardRoll={canardRoll}
                  explodedFactorProp={explodedViewFactor}
                  onExplodedFactorChange={setExplodedViewFactor}
                  showRadarBeam={showRadarBeam}
                  showThrusterFlame={showThrusterFlame}
                  selectedPartId={selectedCadPart?.id}
                  onSelectPart={(part) => setSelectedCadPart(part)}
                />
              </div>

              {/* Internal Component Quick Inspector */}
              <div className="bg-[#0d1017] border border-[#1c212c] rounded-sm p-3 font-mono text-xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block pb-1 border-b border-[#181d27] mb-2">
                    Assembly Components
                  </span>
                  <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                    {INTERNAL_3D_PARTS.slice(0, 6).map((part) => (
                      <button
                        key={part.id}
                        onClick={() => setSelectedCadPart(part)}
                        className={`w-full text-left p-1.5 rounded-xs text-[11px] truncate transition-colors ${
                          selectedCadPart?.id === part.id
                            ? 'bg-[#182335] text-sky-300 border border-sky-600 font-semibold'
                            : 'hover:bg-[#121620] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {part.badge}: {part.name.split('/')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedCadPart ? (
                  <div className="p-2 rounded-xs bg-[#121620] border border-[#1e2536] text-[10px] space-y-1 mt-2">
                    <span className="text-sky-300 font-bold block">{selectedCadPart.name}</span>
                    <span className="text-slate-400 block">{selectedCadPart.specs}</span>
                    <div className="flex justify-between text-slate-300 pt-1 border-t border-[#1a202c]">
                      <span>{selectedCadPart.voltage}</span>
                      <span>{selectedCadPart.temp}</span>
                      <span className="text-emerald-400 font-bold">{selectedCadPart.status}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-2 text-center text-[10px] text-slate-500 mt-2">
                    Click any internal component to inspect telemetry specifications.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: INTERACTIVE TARGET RADAR RETICLE & CEP CONVERGENCE SIMULATOR */}
        {cockpitView === 'TRAJECTORY' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-mono text-xs">
            
            {/* Left: Interactive Radar Standoff Reticle Display (7 cols) */}
            <div className="lg:col-span-7 bg-[#0d1017] border border-[#1c212c] rounded-sm p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#181d27]">
                <div className="flex items-center gap-2">
                  <Radar size={15} className="text-sky-400" />
                  <span className="text-slate-200 font-bold uppercase text-[11px]">
                    Impact Standoff Radar Reticle (Aimpoint Verification)
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">
                  CEP: {calculatedCep} m
                </span>
              </div>

              {/* Interactive Radar Screen SVG */}
              <div
                className="w-full h-72 rounded-sm bg-[#06080d] border border-[#182030] relative overflow-hidden flex items-center justify-center cursor-crosshair select-none"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left - rect.width / 2;
                  const clickY = e.clientY - rect.top - rect.height / 2;
                  // Scale to meters (canvas width 280 = 80 meters)
                  const scale = 80 / rect.width;
                  setTargetOffset({ x: clickX * scale, y: clickY * scale });
                }}
              >
                <svg className="w-full h-full" viewBox="-50 -50 100 100">
                  {/* Range Rings: 10m, 20m, 30m CEP limit, 40m */}
                  <circle cx="0" cy="0" r="10" fill="none" stroke="#1f293d" strokeWidth="0.5" />
                  <circle cx="0" cy="0" r="20" fill="none" stroke="#1f293d" strokeWidth="0.5" />
                  
                  {/* 30m CEP Requirement Ring (Red dashed boundary) */}
                  <circle
                    cx="0"
                    cy="0"
                    r="30"
                    fill="rgba(244, 63, 94, 0.03)"
                    stroke="#f43f5e"
                    strokeWidth="0.8"
                    strokeDasharray="2,2"
                  />

                  {/* Dynamic Predicted CEP Circle */}
                  <circle
                    cx={targetOffset.x}
                    cy={targetOffset.y}
                    r={parseFloat(calculatedCep)}
                    fill="rgba(56, 189, 248, 0.08)"
                    stroke="#38bdf8"
                    strokeWidth="1.2"
                  />

                  {/* Grid Crosshairs */}
                  <line x1="-50" y1="0" x2="50" y2="0" stroke="#1c2436" strokeWidth="0.5" />
                  <line x1="0" y1="-50" x2="0" y2="50" stroke="#1c2436" strokeWidth="0.5" />

                  {/* Target Aimpoint Bullseye */}
                  <circle cx="0" cy="0" r="1.5" fill="#f59e0b" />
                  <circle cx="0" cy="0" r="3.5" fill="none" stroke="#f59e0b" strokeWidth="0.5" />

                  {/* Monte-Carlo Impact Rounds Cluster */}
                  {simulatedImpactRounds.map((rnd) => (
                    <circle
                      key={rnd.id}
                      cx={rnd.x}
                      cy={rnd.y}
                      r="0.8"
                      fill="#38bdf8"
                    />
                  ))}

                  {/* Wind Vector Arrow */}
                  {crosswindKnots > 0 && (
                    <line
                      x1="0"
                      y1="0"
                      x2={(crosswindKnots / 3.0) * Math.sin((crosswindAzimuth * Math.PI) / 180)}
                      y2={-(crosswindKnots / 3.0) * Math.cos((crosswindAzimuth * Math.PI) / 180)}
                      stroke="#f59e0b"
                      strokeWidth="1"
                      strokeDasharray="1,1"
                    />
                  )}
                </svg>

                {/* Legend Overlay on Reticle */}
                <div className="absolute top-2 left-2 text-[10px] font-mono text-slate-400 space-y-0.5 pointer-events-none">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-0.5 bg-rose-500 inline-block" />
                    <span>30m CEP Requirement Limit</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-0.5 bg-sky-400 inline-block" />
                    <span>Current Dispersion ({calculatedCep}m)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    <span>Target Bullseye (0,0)</span>
                  </div>
                </div>

                <div className="absolute bottom-2 right-2 text-[9px] text-slate-500 font-mono">
                  Click reticle to set alternate aimpoint
                </div>
              </div>
            </div>

            {/* Right: Interactive Disturbance & Environment Controls (5 cols) */}
            <div className="lg:col-span-5 bg-[#0d1017] border border-[#1c212c] rounded-sm p-4 space-y-3">
              <span className="text-slate-300 font-bold uppercase text-[11px] block pb-1 border-b border-[#181d27]">
                Guidance &amp; Environmental Disturbance
              </span>

              {/* Crosswind Slider */}
              <div className="p-2.5 rounded-sm bg-[#090b10] border border-[#161a24] space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Wind size={12} className="text-amber-400" />
                    Crosswind Velocity:
                  </span>
                  <span className="text-white font-bold tabular-nums">
                    {crosswindKnots} knots (~{(crosswindKnots * 0.514).toFixed(1)} m/s)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="45"
                  step="1"
                  value={crosswindKnots}
                  onChange={(e) => setCrosswindKnots(parseInt(e.target.value))}
                  className="w-full h-1 bg-[#1a202c] rounded-xs accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Closed-Loop CAS Toggle */}
              <div className="p-2.5 rounded-sm bg-[#090b10] border border-[#161a24] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-200 block">
                    Canard Actuation (CAS) Guidance Loop
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {closedLoopCasActive ? 'Active closed-loop aerodynamic trim' : 'Disabled (Ballistic Unguided)'}
                  </span>
                </div>
                <button
                  onClick={() => setCanardMode(canardMode === 'AUTO' ? 'MANUAL' : 'AUTO')}
                  className={`px-3 py-1 rounded-xs text-[10px] font-bold transition-colors ${
                    closedLoopCasActive
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                      : 'bg-rose-950 text-rose-300 border border-rose-600'
                  }`}
                >
                  {closedLoopCasActive ? 'ENGAGED' : 'UNITS OFF'}
                </button>
              </div>

              {/* GPS Jamming Environment Toggle */}
              <div className="p-2.5 rounded-sm bg-[#090b10] border border-[#161a24] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-200 block">
                    RF Satellite Jamming Standoff
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {gpsJammingActive ? 'GPS Denied / INS-Only Corridor' : 'Nominal L1/L5 Dual Band NavIC'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (gpsJammingActive) {
                      toggleEccmAntiJam();
                    } else {
                      injectFault('GNSS_LOSS');
                    }
                  }}
                  className={`px-3 py-1 rounded-xs text-[10px] font-bold transition-colors ${
                    gpsJammingActive
                      ? 'bg-rose-950 text-rose-300 border border-rose-600'
                      : 'bg-[#141b26] text-slate-300 border border-[#222c3e]'
                  }`}
                >
                  {gpsJammingActive ? 'JAMMED (ENGAGE CRPA)' : 'NOMINAL (INJECT JAM)'}
                </button>
              </div>

              {/* Statistical Accuracy Summary */}
              <div className="p-2.5 rounded-sm bg-[#090b10] border border-[#161a24] text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">PS Requirement Limit:</span>
                  <span className="text-white font-bold">CEP ≤ 30.0 m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Simulated 16-Round Spread:</span>
                  <span className={`font-bold ${parseFloat(calculatedCep) <= 30.0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {calculatedCep} m CEP
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Unguided Baseline:</span>
                  <span className="text-slate-400">~180.0 m CEP</span>
                </div>
              </div>

            </div>
          </div>
        )}
      </section>

      {/* 4. DATA-DENSE TRANSDUCER TELEMETRY TABLE (AIR FORCE / DEFENSE GRADE) */}
      <section className="bg-[#11141c] border border-[#1e2330] rounded-sm p-4 space-y-3 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#1b202c]">
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Cpu size={14} className="text-sky-400" />
              <span>Transducer Telemetry &amp; Invariant Limit Screening</span>
            </h2>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Click any channel row to open the live calibration drawer and inject calibrated disturbance stimulus.
            </p>
          </div>

          <span className="text-[11px] text-slate-400">
            6 Transducer Channels Active
          </span>
        </div>

        {/* Structured Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1b202c] text-[10px] text-slate-400 uppercase tracking-wider">
                <th className="py-2 px-2.5">Channel</th>
                <th className="py-2 px-2.5">Transducer &amp; Subsystem</th>
                <th className="py-2 px-2.5 text-right">Value</th>
                <th className="py-2 px-2.5">Nominal Limits</th>
                <th className="py-2 px-2.5 text-center">Quality / Conf</th>
                <th className="py-2 px-2.5">Status</th>
                <th className="py-2 px-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#161a24]">
              {transducerChannels.map((cfg) => {
                const sensor = sensors[cfg.id];
                const isFaulted = sensor.status !== 'NORMAL';
                const isSelected = inspectingSensorId === cfg.id;

                return (
                  <tr
                    key={cfg.id}
                    onClick={() => setInspectingSensorId(inspectingSensorId === cfg.id ? null : cfg.id)}
                    className={`hover:bg-[#141822] cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#182335]' : isFaulted ? 'bg-rose-950/20' : ''
                    }`}
                  >
                    <td className="py-2.5 px-2.5 font-bold text-sky-400 text-xs">
                      {cfg.code}
                    </td>
                    <td className="py-2.5 px-2.5">
                      <span className="text-white font-medium block">
                        {cfg.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-sans">
                        {cfg.subsystem} · {cfg.spec}
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-bold text-white tabular-nums text-sm">
                      {formatNumber(sensor.primaryValue, cfg.id === 'PRESSURE' ? 1 : 2)}{' '}
                      <span className="text-xs text-slate-400 font-normal">{sensor.unit}</span>
                    </td>
                    <td className="py-2.5 px-2.5 text-slate-300 text-[11px] tabular-nums">
                      [{cfg.nominalMin} .. {cfg.nominalMax}] {sensor.unit}
                    </td>
                    <td className="py-2.5 px-2.5 text-center text-[11px] text-slate-300 tabular-nums">
                      {sensor.qualityScore}% Q · {sensor.confidence}% Conf
                    </td>
                    <td className="py-2.5 px-2.5">
                      <StatusBadge status={sensor.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setInspectingSensorId(inspectingSensorId === cfg.id ? null : cfg.id)}
                          className="px-2 py-0.5 rounded-sm bg-[#161c28] hover:bg-[#1f2738] text-slate-300 border border-[#252e42] text-[11px] transition-colors"
                        >
                          {isSelected ? 'Close' : 'Inspect'}
                        </button>
                        <button
                          onClick={() => injectFault(cfg.faultToInject)}
                          disabled={isFaulted}
                          className={`px-2 py-0.5 rounded-sm text-[10px] transition-colors ${
                            isFaulted
                              ? 'bg-rose-950 text-rose-300 border border-rose-800 cursor-not-allowed'
                              : 'bg-[#121620] hover:bg-[#1a202c] text-slate-400 hover:text-white border border-[#202736]'
                          }`}
                        >
                          {isFaulted ? 'FAULT' : 'TEST'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* INTERACTIVE TRANSDUCER CALIBRATION & DISTURBANCE DRAWER */}
        {activeInspectingConfig && (
          <div className="mt-3 p-3.5 rounded-sm bg-[#090b10] border border-sky-800/40 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#181d27]">
              <div className="flex items-center gap-2">
                <Sliders size={14} className="text-sky-400" />
                <span className="font-bold text-white text-xs">
                  Transducer Calibration &amp; Packet Inspector: {activeInspectingConfig.name} [{activeInspectingConfig.code}]
                </span>
              </div>
              <button
                onClick={() => setInspectingSensorId(null)}
                className="p-1 rounded-sm text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Controls */}
              <div className="space-y-2 p-2.5 rounded-xs bg-[#0d1017] border border-[#1b202c]">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Simulated Disturbance Bias
                </span>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  value={simulatedBiasOffset}
                  onChange={(e) => setSimulatedBiasOffset(parseInt(e.target.value))}
                  className="w-full h-1 bg-[#1a202c] rounded-xs accent-sky-500 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span>Bias: {simulatedBiasOffset > 0 ? `+${simulatedBiasOffset}` : simulatedBiasOffset}%</span>
                  <button
                    onClick={() => setSimulatedBiasOffset(0)}
                    className="text-[10px] text-sky-400 hover:underline"
                  >
                    Reset Zero
                  </button>
                </div>
              </div>

              {/* Invariant Bounds */}
              <div className="p-2.5 rounded-xs bg-[#0d1017] border border-[#1b202c] space-y-1 text-[11px]">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Invariant Limits
                </span>
                <div className="flex justify-between text-slate-300">
                  <span>Safe Lower Bound:</span>
                  <span>{activeInspectingConfig.nominalMin}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Safe Upper Bound:</span>
                  <span>{activeInspectingConfig.nominalMax}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>OBDS Status:</span>
                  <span>VERIFIED FACT</span>
                </div>
              </div>

              {/* Raw Frame Hex View */}
              <div className="p-2.5 rounded-xs bg-[#0d1017] border border-[#1b202c] space-y-1 text-[10px]">
                <span className="text-slate-400 uppercase font-semibold block">
                  Raw Downlink Frame
                </span>
                <div className="p-1 rounded-xs bg-black text-emerald-400 font-mono text-[9px] break-all">
                  0x7E 0x06 0x{activeInspectingConfig.id === 'IMU' ? '41' : '8F'} 0x2A 0x90 0xFE [CRC-16 OK]
                </div>
                <span className="text-slate-500 block">Stream Sample Rate: 200 Hz SIL Base</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 5. SYSTEM HEALTH BREAKDOWN & DIAGNOSTIC SUPERVISOR (OBDS) */}
      <section className="bg-[#11141c] border border-[#1e2330] rounded-sm p-4 space-y-3 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#1b202c]">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Diagnostic Causality &amp; Health Composition</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              On-Board Diagnostic System (OBDS) fault isolation and mitigation supervisor.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Total System Health:</span>
            <span className="text-sm font-bold text-white tabular-nums">
              {healthBreakdown.systemHealthIndex} / 100
            </span>
          </div>
        </div>

        {/* 6 Subsystem Scoring Criteria */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          <div className="p-2.5 rounded-sm bg-[#0d1017] border border-[#1a1f2c] space-y-0.5">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Availability</span>
              <span>25% Wgt</span>
            </div>
            <span className="text-sm font-bold text-white tabular-nums block">
              {healthBreakdown.subscores.sensorAvailability}%
            </span>
          </div>

          <div className="p-2.5 rounded-sm bg-[#0d1017] border border-[#1a1f2c] space-y-0.5">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Data Quality</span>
              <span>20% Wgt</span>
            </div>
            <span className="text-sm font-bold text-sky-300 tabular-nums block">
              {healthBreakdown.subscores.dataQuality}%
            </span>
          </div>

          <div className="p-2.5 rounded-sm bg-[#0d1017] border border-[#1a1f2c] space-y-0.5">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Consistency</span>
              <span>20% Wgt</span>
            </div>
            <span className="text-sm font-bold text-emerald-400 tabular-nums block">
              {healthBreakdown.subscores.sensorConsistency}%
            </span>
          </div>

          <div className="p-2.5 rounded-sm bg-[#0d1017] border border-[#1a1f2c] space-y-0.5">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Power Bus</span>
              <span>15% Wgt</span>
            </div>
            <span className="text-sm font-bold text-amber-300 tabular-nums block">
              {healthBreakdown.subscores.powerHealth}%
            </span>
          </div>

          <div className="p-2.5 rounded-sm bg-[#0d1017] border border-[#1a1f2c] space-y-0.5">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Telemetry Link</span>
              <span>10% Wgt</span>
            </div>
            <span className="text-sm font-bold text-sky-300 tabular-nums block">
              {healthBreakdown.subscores.communicationHealth}%
            </span>
          </div>

          <div className="p-2.5 rounded-sm bg-[#0d1017] border border-[#1a1f2c] space-y-0.5">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>OBDS BIT Codes</span>
              <span>10% Wgt</span>
            </div>
            <span className="text-sm font-bold text-white tabular-nums block">
              {healthBreakdown.subscores.diagnosticStateScore}%
            </span>
          </div>
        </div>

        {/* Causality Trace Log */}
        <div className="p-2.5 rounded-sm bg-[#0d1017] border border-[#1a1f2c] text-xs text-slate-300 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-semibold">
            <span>Active Diagnostics Causality Factors</span>
            <span>Isolation Status: {obdsState.status}</span>
          </div>
          {healthBreakdown.activeCauses.map((cause, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs">
              <span className="text-sky-400 shrink-0 mt-0.5">•</span>
              <span>{cause}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 6. TELEMETRY LOG STREAM & RECENT DIAGNOSTIC EVENTS */}
      <section className="bg-[#11141c] border border-[#1e2330] rounded-sm p-4 space-y-3 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#1b202c]">
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Terminal size={14} className="text-sky-400" />
              <span>Telemetry Downlink Event Log</span>
            </h2>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              High-rate event sequence recorded on onboard non-volatile memory bus.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <div className="flex items-center bg-[#0d1017] border border-[#1d2330] rounded-sm p-0.5">
              {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setAuditFilter(sev)}
                  className={`px-2 py-0.5 rounded-xs text-[10px] transition-colors ${
                    auditFilter === sev
                      ? 'bg-sky-700 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            <button
              onClick={() => setActivePage('logs')}
              className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 transition-colors ml-1"
            >
              <span>Full Audit Log</span>
              <ArrowRight size={11} />
            </button>
          </div>
        </div>

        {/* Audit Log Entries List */}
        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {filteredLogs.length === 0 ? (
            <div className="p-4 rounded-sm bg-[#0d1017] text-center text-slate-500 text-xs font-sans">
              No log events recorded matching the current filter.
            </div>
          ) : (
            filteredLogs.slice(0, 8).map((log) => {
              const isCrit = log.severity === 'CRITICAL' || log.severity === 'ERROR';
              const isWarn = log.severity === 'WARNING';

              return (
                <div
                  key={log.id}
                  className="p-2 rounded-sm bg-[#0d1017] border border-[#181d27] flex items-center justify-between text-xs hover:border-[#222938] transition-colors gap-3"
                >
                  <div className="flex items-center gap-2.5 truncate min-w-0">
                    <span className="text-[10px] text-slate-500 tabular-nums shrink-0 font-mono">
                      {formatElapsedSeconds(log.timestamp / 1000)}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-xs shrink-0 ${
                        isCrit
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : isWarn
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-[#151922] text-slate-400 border border-[#202738]'
                      }`}
                    >
                      {log.severity}
                    </span>
                    <span className="text-slate-300 font-bold shrink-0">{log.module}:</span>
                    <span className="text-slate-400 truncate font-sans text-xs">{log.message}</span>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono shrink-0 hidden sm:inline">
                    {log.eventType}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>

    </div>
  );
};
