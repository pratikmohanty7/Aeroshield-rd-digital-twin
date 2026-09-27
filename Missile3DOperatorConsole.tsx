import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Missile3DDigitalTwin,
  INTERNAL_3D_PARTS,
  Internal3DPart,
} from './Missile3DDigitalTwin';
import {
  Cpu,
  Flame,
  Radio,
  Zap,
  Terminal,
  Clock,
  Radar,
  ArrowRight,
  Sliders,
  RotateCw,
  Wind,
  ShieldCheck,
  Power,
  Layers,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Crosshair,
  Activity,
  Gauge,
  Compass,
  RadioTower,
  Eye,
  CheckSquare,
  Binary,
} from 'lucide-react';
import { soundFX } from '../../utils/audioFeedback';

export type RDWorkbench = 'AERO_ACTUATORS' | 'FMCW_SENSOR' | 'CRPA_RESILIENCE' | 'POWER_BIT';

export interface SystemTestPhase {
  id: string;
  phaseNumber: string;
  name: string;
  category: string;
  timeSec: number;
  objective: string;
  status: 'COMPLETED' | 'ACTIVE' | 'READY';
  subsystemTarget: string;
  defaultPitch: number;
  defaultYaw: number;
  defaultFlame: boolean;
  defaultRadar: boolean;
}

export const SYSTEM_TEST_PHASES: SystemTestPhase[] = [
  {
    id: 'stp-01',
    phaseNumber: '01',
    name: 'SENSOR INITIALIZATION',
    category: 'COLD START & BIAS',
    timeSec: 0.0,
    objective: 'Transducer bias calibration, MEMS proof-mass health verification, and boot self-test.',
    status: 'COMPLETED',
    subsystemTarget: 'ACQUISITION',
    defaultPitch: 0,
    defaultYaw: 0,
    defaultFlame: false,
    defaultRadar: false,
  },
  {
    id: 'stp-02',
    phaseNumber: '02',
    name: 'DATA ACQUISITION',
    category: '200 Hz STREAM',
    timeSec: 1.5,
    objective: 'Synchronous transducer sampling, circular buffer allocation, and monotonic timestamp check.',
    status: 'ACTIVE',
    subsystemTarget: 'ACQUISITION',
    defaultPitch: 1,
    defaultYaw: 0,
    defaultFlame: false,
    defaultRadar: false,
  },
  {
    id: 'stp-03',
    phaseNumber: '03',
    name: 'DATA VALIDATION',
    category: 'INVARIANT CHECKS',
    timeSec: 3.5,
    objective: 'Dynamic range boundaries, rate-of-change limits, freshness age limits, and cross-channel consistency.',
    status: 'READY',
    subsystemTarget: 'VALIDATION_UNIT',
    defaultPitch: 3,
    defaultYaw: 1,
    defaultFlame: true,
    defaultRadar: false,
  },
  {
    id: 'stp-04',
    phaseNumber: '04',
    name: 'STATE ESTIMATION',
    category: 'EKF SENSOR FUSION',
    timeSec: 7.0,
    objective: 'Extended Kalman Filter dual-core lockstep orientation, velocity, and altitude estimation.',
    status: 'READY',
    subsystemTarget: 'STATE_ESTIMATOR',
    defaultPitch: 6,
    defaultYaw: 2,
    defaultFlame: true,
    defaultRadar: false,
  },
  {
    id: 'stp-05',
    phaseNumber: '05',
    name: 'HEALTH MONITORING',
    category: 'MULTI-CRITERIA INDEX',
    timeSec: 12.0,
    objective: 'Weighted system health computation across availability, quality, consistency, power, and diagnostics.',
    status: 'READY',
    subsystemTarget: 'STATE_ESTIMATOR',
    defaultPitch: 4,
    defaultYaw: 0,
    defaultFlame: false,
    defaultRadar: false,
  },
  {
    id: 'stp-06',
    phaseNumber: '06',
    name: 'DIAGNOSTICS',
    category: 'OBDS & FAULT TREE',
    timeSec: 18.0,
    objective: 'On-Board Diagnostic System (OBDS) anomaly isolation, fault tree tracing, and rapid detection latency evaluation.',
    status: 'READY',
    subsystemTarget: 'OBDS_DIAGNOSTICS',
    defaultPitch: 2,
    defaultYaw: -1,
    defaultFlame: false,
    defaultRadar: true,
  },
  {
    id: 'stp-07',
    phaseNumber: '07',
    name: 'SIMULATED TELEMETRY',
    category: 'BUS PACKETIZATION',
    timeSec: 25.0,
    objective: 'Serializing 10 Hz downlink frames with CRC-32 checksums, channel jitter estimation, and byte statistics.',
    status: 'READY',
    subsystemTarget: 'TELEMETRY_LINK',
    defaultPitch: 0,
    defaultYaw: 0,
    defaultFlame: false,
    defaultRadar: true,
  },
  {
    id: 'stp-08',
    phaseNumber: '08',
    name: 'DIGITAL TWIN',
    category: 'KINEMATIC SYNCHRONIZATION',
    timeSec: 32.0,
    objective: 'High-fidelity 3D CAD spatial state mapping, actuator deflection tracking, and subsystem synchronization.',
    status: 'READY',
    subsystemTarget: 'STATE_ESTIMATOR',
    defaultPitch: -2,
    defaultYaw: 0,
    defaultFlame: false,
    defaultRadar: true,
  },
];

interface LogEntry {
  id: string;
  time: string;
  level: 'NOMINAL' | 'INFO' | 'SUCCESS';
  subsystem: string;
  message: string;
}

const INITIAL_LOGS: LogEntry[] = [
  {
    id: 'log-1',
    time: '00:00:00.12',
    level: 'NOMINAL',
    subsystem: 'PMU-28V',
    message: 'Power management unit stabilized: 28.42V rail online, 3.3V avionics rail nominal.',
  },
  {
    id: 'log-2',
    time: '00:00:00.35',
    level: 'INFO',
    subsystem: 'DSP-CORE',
    message: 'STM32 dual-core lockstep initialized: 400 Hz EKF sensor fusion loop running.',
  },
  {
    id: 'log-3',
    time: '00:00:00.80',
    level: 'NOMINAL',
    subsystem: 'IMU-MEMS',
    message: 'Shock-hardened tri-axis MEMS calibrated: bias offset verified, drift < 0.05°/hr.',
  },
  {
    id: 'log-4',
    time: '00:00:01.45',
    level: 'SUCCESS',
    subsystem: 'CANARDS',
    message: '4-axis cruciform canard servos initialized: 10 kHz PWM feedback loop locked.',
  },
  {
    id: 'log-5',
    time: '00:00:02.10',
    level: 'INFO',
    subsystem: 'VALIDATION',
    message: 'Invariant check suite initialized: rate-of-change and timestamp freshness active.',
  },
  {
    id: 'log-6',
    time: '00:00:03.25',
    level: 'NOMINAL',
    subsystem: 'CRPA-GPS',
    message: '4-element antenna array: adaptive null-steering spatial filter active.',
  },
  {
    id: 'log-7',
    time: '00:00:04.80',
    level: 'SUCCESS',
    subsystem: 'MMW-FMCW',
    message: '77 GHz radar proximity sensor verified: test chirp SNR +34.2 dB nominal.',
  },
];

export const Missile3DOperatorConsole: React.FC = () => {
  const {
    setActivePage,
    setSelectedSubsystem,
    session,
    healthBreakdown,
    sensors,
    stateEstimation,
    telemetryStats,
    obdsState,
  } = useApp();

  // Selected subassembly & phase
  const [selectedPhase, setSelectedPhase] = useState<SystemTestPhase>(SYSTEM_TEST_PHASES[1]);
  const [selectedPart, setSelectedPart] = useState<Internal3DPart>(INTERNAL_3D_PARTS[0]);
  const [activeWorkbench, setActiveWorkbench] = useState<RDWorkbench>('AERO_ACTUATORS');
  const [isSimPlaying, setIsSimPlaying] = useState<boolean>(false);
  const [timelineSec, setTimelineSec] = useState<number>(SYSTEM_TEST_PHASES[1].timeSec);

  // Dynamic Flight & Actuator Parameters (HIL Engineering Controls)
  const [canardPitch, setCanardPitch] = useState<number>(1);
  const [canardYaw, setCanardYaw] = useState<number>(0);
  const [canardRoll, setCanardRoll] = useState<number>(0);
  const [showRadarBeam, setShowRadarBeam] = useState<boolean>(false);
  const [showThrusterFlame, setShowThrusterFlame] = useState<boolean>(false);
  const [explodedFactor, setExplodedFactor] = useState<number>(0);

  // R&D Experiment Settings (Replaces legacy weapon controls)
  const [fmcwChirpBandwidth, setFmcwChirpBandwidth] = useState<number>(1.2); // GHz
  const [crpaInterferenceAngle, setCrpaInterferenceAngle] = useState<number>(45); // degrees
  const [crpaSuppressionPower, setCrpaSuppressionPower] = useState<number>(95); // watts ERP

  // Logs & History
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const logScrollRef = useRef<HTMLDivElement>(null);

  // Real-time dynamic oscillation for Oscilloscope
  const [oscHistory, setOscHistory] = useState<Array<{ t: number; pitch: number; yaw: number; staticMargin: number }>>([
    { t: 0, pitch: 1, yaw: 0, staticMargin: 4.2 },
  ]);

  // Handle System Test Phase Selection
  const handleSelectPhase = (phase: SystemTestPhase) => {
    soundFX.phaseStep();
    setSelectedPhase(phase);
    setTimelineSec(phase.timeSec);
    setShowThrusterFlame(phase.defaultFlame);
    setShowRadarBeam(phase.defaultRadar);
    setCanardPitch(phase.defaultPitch);
    setCanardYaw(phase.defaultYaw);
  };

  // Timeline Auto-Play Loop across System Test Phases
  useEffect(() => {
    if (!isSimPlaying) return;
    const interval = setInterval(() => {
      setTimelineSec((prev) => {
        const next = prev + 0.5;
        if (next >= 35) {
          setIsSimPlaying(false);
          return 35;
        }
        // Match phase automatically
        const matched = [...SYSTEM_TEST_PHASES].reverse().find((p) => next >= p.timeSec);
        if (matched && matched.id !== selectedPhase.id) {
          setSelectedPhase(matched);
          setShowThrusterFlame(matched.defaultFlame);
          setShowRadarBeam(matched.defaultRadar);
          setCanardPitch(matched.defaultPitch);
          setCanardYaw(matched.defaultYaw);
        }
        return next;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isSimPlaying, selectedPhase]);

  // Real-time dynamic oscillation for Oscilloscope
  useEffect(() => {
    const timer = setInterval(() => {
      setOscHistory((prev) => {
        const nextTime = (prev[prev.length - 1]?.t || 0) + 0.1;
        const pitchNoise = Math.sin(nextTime * 3.5) * 0.8;
        const newPitch = canardPitch + pitchNoise;
        const newYaw = canardYaw + Math.cos(nextTime * 2.8) * 0.4;
        const newMargin = 4.2 - Math.abs(canardPitch) * 0.08 + Math.sin(nextTime * 1.5) * 0.15;
        const updated = [...prev, { t: nextTime, pitch: newPitch, yaw: newYaw, staticMargin: newMargin }];
        if (updated.length > 32) updated.shift();
        return updated;
      });
    }, 200);

    return () => clearInterval(timer);
  }, [canardPitch, canardYaw]);

  // Auto-scroll log window
  useEffect(() => {
    if (logScrollRef.current) {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Inspect in specific lab
  const handleInspectInLab = () => {
    soundFX.chipSelect();
    if (selectedPart.diagramLayer === 'SENSOR') {
      setActivePage('sensors');
    } else if (selectedPart.diagramLayer === 'POWER') {
      setSelectedSubsystem('POWER_BUS');
      setActivePage('digital-twin');
    } else if (selectedPart.id === 'part-comm') {
      setSelectedSubsystem('TELEMETRY_LINK');
      setActivePage('telemetry');
    } else {
      setSelectedSubsystem('STATE_ESTIMATOR');
      setActivePage('digital-twin');
    }
  };

  const activeSensorsCount = Object.values(sensors).filter((s) => s.status === 'NORMAL').length;
  const totalSensorsCount = Object.keys(sensors).length;

  return (
    <div className="space-y-4 font-sans text-slate-100 max-w-[1640px] mx-auto">
      {/* ============================================================== */}
      {/* 1. R&D TEST SESSION & SYSTEM STATE STRIP                       */}
      {/* ============================================================== */}
      <div className="bg-[#080c16] border border-cyan-500/25 rounded-2xl p-3.5 shadow-xl space-y-3">
        {/* Top R&D Engineering Status Gauges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 font-mono text-xs">
          <div className="p-2.5 rounded-xl bg-[#050811] border border-white/[0.06] flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">R&amp;D Test Session</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm font-bold text-cyan-300 truncate">
                {session.sessionId}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold">ONLINE</span>
            </div>
            <span className="text-[9px] text-slate-500 truncate mt-0.5">{session.scenario}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#050811] border border-white/[0.06] flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">System State</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-base font-bold text-white tabular-nums">
                {healthBreakdown.systemHealthIndex}%
              </span>
              <span className={`text-[10px] font-bold ${healthBreakdown.status === 'NORMAL' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {healthBreakdown.status}
              </span>
            </div>
            <span className="text-[9px] text-slate-500">Multi-criteria index</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#050811] border border-white/[0.06] flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Sensor Health</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-base font-bold text-cyan-300 tabular-nums">
                {activeSensorsCount} / {totalSensorsCount}
              </span>
              <span className="text-[10px] text-slate-400">Transducers</span>
            </div>
            <span className="text-[9px] text-slate-500">Continuous sampling</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#050811] border border-white/[0.06] flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Data Quality</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-base font-bold text-emerald-400 tabular-nums">
                {healthBreakdown.subscores.dataQuality}%
              </span>
              <span className="text-[10px] text-emerald-500">Fidelity</span>
            </div>
            <span className="text-[9px] text-slate-500">Range &amp; rate checks</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#050811] border border-white/[0.06] flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">State Estimation</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-base font-bold text-purple-300 tabular-nums">
                {stateEstimation.confidence}%
              </span>
              <span className="text-[10px] text-slate-400">EKF Conf</span>
            </div>
            <span className="text-[9px] text-slate-500 truncate">{stateEstimation.fusionMethod}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#050811] border border-white/[0.06] flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Simulated Telemetry</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-base font-bold text-amber-300 tabular-nums">
                Seq #{telemetryStats.currentSequence}
              </span>
              <span className="text-[10px] text-amber-400">10 Hz Bus</span>
            </div>
            <span className="text-[9px] text-slate-500">{telemetryStats.effectiveDataRateKbps} kbps</span>
          </div>
        </div>

        {/* System Test Phases Scrubber Strip */}
        <div className="pt-2 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {SYSTEM_TEST_PHASES.map((p) => {
              const isSelected = selectedPhase.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPhase(p)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                    isSelected
                      ? 'bg-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-950/60 ring-1 ring-cyan-400'
                      : 'bg-[#0b101c] border-white/[0.06] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{p.phaseNumber}. {p.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isSelected ? 'bg-cyan-900 text-cyan-200' : 'bg-slate-800 text-slate-400'}`}>
                    T+{p.timeSec.toFixed(1)}s
                  </span>
                </button>
              );
            })}
          </div>

          {/* Scrubber & Simulation Playback */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end font-mono text-xs shrink-0">
            <button
              onClick={() => {
                soundFX.click();
                setIsSimPlaying(!isSimPlaying);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold transition-all ${
                isSimPlaying
                  ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                  : 'bg-[#0b101c] text-slate-300 border-white/[0.08] hover:text-white'
              }`}
            >
              {isSimPlaying ? <Pause size={13} /> : <Play size={13} />}
              <span>{isSimPlaying ? 'PAUSE TEST' : 'RUN TEST SEQUENCE'}</span>
            </button>

            <button
              onClick={() => {
                soundFX.click();
                setTimelineSec(0);
                handleSelectPhase(SYSTEM_TEST_PHASES[0]);
              }}
              className="p-2 rounded-xl bg-[#0b101c] hover:bg-slate-800 text-slate-400 hover:text-white border border-white/[0.08]"
              title="Reset Test Sequence to T+00.0s"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. MAIN 3D DIGITAL TWIN VIEWPORT & R&D INSPECTION BAR          */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (8 cols): 3D CAD Twin */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <Missile3DDigitalTwin
            selectedPartId={selectedPart.id}
            onSelectPart={(p) => setSelectedPart(p)}
            flightPhase={selectedPhase.id}
            explodedFactorProp={explodedFactor}
            onExplodedFactorChange={setExplodedFactor}
            canardPitch={canardPitch}
            canardYaw={canardYaw}
            canardRoll={canardRoll}
            showRadarBeam={showRadarBeam}
            onToggleRadarBeam={setShowRadarBeam}
            showThrusterFlame={showThrusterFlame}
            onToggleThrusterFlame={setShowThrusterFlame}
            showTargetVector={false}
            showAirburstEnvelope={false}
          />

          {/* R&D Engineering Inspection Switches (Replaced weapon/fire-control overlays) */}
          <div className="p-3 rounded-2xl bg-[#080c16] border border-cyan-500/20 shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold text-[11px] flex items-center gap-1.5">
                <Radar size={13} className="text-cyan-400" />
                <span>ENGINEERING OVERLAYS:</span>
              </span>

              <button
                onClick={() => {
                  soundFX.phaseStep();
                  setShowRadarBeam(!showRadarBeam);
                }}
                className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                  showRadarBeam
                    ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500 shadow-sm'
                    : 'bg-[#050811] text-slate-400 border-white/[0.06] hover:text-white'
                }`}
              >
                <Radar size={12} className={showRadarBeam ? 'text-cyan-400' : 'text-slate-500'} />
                <span>77 GHz FMCW BEAM</span>
              </button>

              <button
                onClick={() => {
                  soundFX.phaseStep();
                  setShowThrusterFlame(!showThrusterFlame);
                }}
                className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                  showThrusterFlame
                    ? 'bg-amber-950/90 text-amber-300 border-amber-500 shadow-sm'
                    : 'bg-[#050811] text-slate-400 border-white/[0.06] hover:text-white'
                }`}
              >
                <Flame size={12} className={showThrusterFlame ? 'text-amber-400' : 'text-slate-500'} />
                <span>THRUST SIMULATION</span>
              </button>
            </div>

            {/* Subassembly Exploded View Slider */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">CAD EXPLODE:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={explodedFactor}
                onChange={(e) => setExplodedFactor(parseFloat(e.target.value))}
                className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <span className="text-cyan-300 text-[11px] font-bold w-9 text-right">
                {Math.round(explodedFactor * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Active Subassembly Telemetry & Test Event Stream */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Subassembly Inspection Card */}
          <div className="p-4 rounded-2xl bg-[#080c16] border border-cyan-500/20 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedPart.color }}
                />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  SUBASSEMBLY TELEMETRY
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
                {selectedPart.status}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white">{selectedPart.name}</h3>
              <p className="text-[11px] text-cyan-400 font-mono mt-0.5">{selectedPart.category}</p>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">{selectedPart.description}</p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-xs">
              <div className="p-2 rounded-xl bg-[#050811] border border-white/[0.04] text-center">
                <span className="text-[9px] text-slate-500 block uppercase">Voltage</span>
                <span className="text-cyan-300 font-bold">{selectedPart.voltage}</span>
              </div>
              <div className="p-2 rounded-xl bg-[#050811] border border-white/[0.04] text-center">
                <span className="text-[9px] text-slate-500 block uppercase">Current</span>
                <span className="text-emerald-300 font-bold">{selectedPart.current}</span>
              </div>
              <div className="p-2 rounded-xl bg-[#050811] border border-white/[0.04] text-center">
                <span className="text-[9px] text-slate-500 block uppercase">Temp</span>
                <span className="text-amber-300 font-bold">{selectedPart.temp}</span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-400 pt-1 flex items-center justify-between border-b border-white/[0.04] pb-2">
              <span>RATING:</span>
              <span className="text-slate-200 font-semibold truncate ml-2 text-right">{selectedPart.specs}</span>
            </div>

            {/* Interconnected Link */}
            <button
              onClick={handleInspectInLab}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-950/90 to-blue-950/90 hover:from-cyan-900 hover:to-blue-900 border border-cyan-500/40 text-cyan-200 text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all group"
            >
              <span>Inspect in {selectedPart.diagramLayer === 'SENSOR' ? 'Sensor Lab' : selectedPart.diagramLayer === 'POWER' ? 'Electrical Bus' : 'Avionics Bus'}</span>
              <ArrowRight size={13} className="text-cyan-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Real-Time R&D Test & System Event Stream */}
          <div className="p-4 rounded-2xl bg-[#080c16] border border-cyan-500/20 shadow-lg space-y-2.5 flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  R&amp;D TEST SESSION LOG
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE STREAM
              </span>
            </div>

            <div
              ref={logScrollRef}
              className="h-52 overflow-y-auto space-y-1.5 font-mono text-[11px] pr-1"
            >
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-2 rounded-xl bg-[#050811] border border-white/[0.04] space-y-1 hover:border-cyan-500/30 transition-colors"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock size={10} />
                      {log.time}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-800/40 text-cyan-300 font-bold text-[9px]">
                      {log.subsystem}
                    </span>
                  </div>
                  <div className="text-slate-300 text-xs leading-snug">{log.message}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. FOUR R&D ENGINEERING WORKBENCHES                            */}
      {/* ============================================================== */}
      <div className="bg-[#080c16] border border-cyan-500/25 rounded-2xl p-4 shadow-xl space-y-4">
        {/* Workbench Tab Selector */}
        <div className="flex flex-col sm:flex-row items-center justify-between pb-3 border-b border-white/[0.08] gap-3">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              ENGINEERING R&amp;D TEST WORKBENCH
            </h3>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-[#050811] rounded-xl border border-white/[0.08] text-xs font-mono">
            <button
              onClick={() => {
                soundFX.click();
                setActiveWorkbench('AERO_ACTUATORS');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeWorkbench === 'AERO_ACTUATORS'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1. AERO &amp; ACTUATORS (HIL)
            </button>

            <button
              onClick={() => {
                soundFX.click();
                setActiveWorkbench('FMCW_SENSOR');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeWorkbench === 'FMCW_SENSOR'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2. 77GHz FMCW CHARACTERIZATION
            </button>

            <button
              onClick={() => {
                soundFX.click();
                setActiveWorkbench('CRPA_RESILIENCE');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeWorkbench === 'CRPA_RESILIENCE'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3. CRPA &amp; SENSOR RESILIENCE
            </button>

            <button
              onClick={() => {
                soundFX.click();
                setActiveWorkbench('POWER_BIT');
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeWorkbench === 'POWER_BIT'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              4. POWER BUS &amp; AVIONICS BIT
            </button>
          </div>
        </div>

        {/* WORKBENCH 1: AERO & CANARD ACTUATOR STABILITY (HIL) */}
        {activeWorkbench === 'AERO_ACTUATORS' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Canard Actuator Fin Deflection & Servos */}
            <div className="lg:col-span-6 p-4 rounded-xl bg-[#050811] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
                  <Wind size={14} className="text-cyan-400" />
                  <span>4-AXIS CRUCIFORM CANARD FIN SERVOS</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-400">10 kHz PWM Feedback Locked</span>
              </div>

              {/* 4 Canard Servos Matrix */}
              <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
                {[
                  { id: 'Fin 1 (Upper)', angle: canardPitch, duty: 44.2, temp: 42.1, torque: 3.4 },
                  { id: 'Fin 2 (Starboard)', angle: canardYaw, duty: 38.6, temp: 41.8, torque: 2.8 },
                  { id: 'Fin 3 (Ventral)', angle: -canardPitch, duty: 44.2, temp: 42.3, torque: 3.4 },
                  { id: 'Fin 4 (Port)', angle: -canardYaw, duty: 38.6, temp: 41.7, torque: 2.8 },
                ].map((fin) => (
                  <div key={fin.id} className="p-2.5 rounded-lg bg-[#080d1a] border border-white/[0.04] space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300 font-bold">{fin.id}</span>
                      <span className="text-cyan-300 font-bold">{fin.angle > 0 ? `+${fin.angle}°` : `${fin.angle}°`}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Torque: <strong className="text-slate-300">{fin.torque} N·m</strong></span>
                      <span>PWM: <strong className="text-slate-300">{fin.duty}%</strong></span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Real-Time Steer Sliders */}
              <div className="space-y-2 pt-2 border-t border-white/[0.06] font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Pitch Deflection:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="-20"
                      max="20"
                      step="1"
                      value={canardPitch}
                      onChange={(e) => setCanardPitch(parseInt(e.target.value, 10))}
                      className="w-32 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                    <span className="text-cyan-300 font-bold w-12 text-right">{canardPitch > 0 ? `+${canardPitch}°` : `${canardPitch}°`}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Yaw Deflection:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="-20"
                      max="20"
                      step="1"
                      value={canardYaw}
                      onChange={(e) => setCanardYaw(parseInt(e.target.value, 10))}
                      className="w-32 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                    <span className="text-cyan-300 font-bold w-12 text-right">{canardYaw > 0 ? `+${canardYaw}°` : `${canardYaw}°`}</span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      soundFX.click();
                      setCanardPitch(0);
                      setCanardYaw(0);
                      setCanardRoll(0);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#0b101c] hover:bg-slate-800 border border-white/[0.06] text-[10px] text-slate-300"
                  >
                    TRIM NEUTRAL (0°)
                  </button>
                  <button
                    onClick={() => {
                      soundFX.click();
                      setCanardPitch(8);
                      setCanardYaw(0);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#0b101c] hover:bg-slate-800 border border-white/[0.06] text-[10px] text-cyan-300"
                  >
                    CLIMB ANGLE (+8°)
                  </button>
                  <button
                    onClick={() => {
                      soundFX.click();
                      setCanardPitch(-6);
                      setCanardYaw(-3);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#0b101c] hover:bg-slate-800 border border-white/[0.06] text-[10px] text-amber-300"
                  >
                    DESCENT TRIM (-6°)
                  </button>
                </div>
              </div>
            </div>

            {/* Aerodynamic Stability & Live Telemetry Oscilloscope */}
            <div className="lg:col-span-6 p-4 rounded-xl bg-[#050811] border border-white/[0.06] space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                  <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
                    <Gauge size={14} className="text-cyan-400" />
                    <span>AERO STABILITY &amp; FLIGHT ENVELOPE OSCILLOSCOPE</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">Static Margin +4.2% (Stable)</span>
                </div>

                {/* Static Margin Metrics */}
                <div className="grid grid-cols-3 gap-2 font-mono text-xs pt-2">
                  <div className="p-2 rounded-lg bg-[#080d1a] border border-white/[0.04]">
                    <span className="text-[9px] text-slate-500 block uppercase">Center of Gravity</span>
                    <span className="text-white font-bold">Xcg = 0.58 L</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#080d1a] border border-white/[0.04]">
                    <span className="text-[9px] text-slate-500 block uppercase">Center of Pressure</span>
                    <span className="text-white font-bold">Xcp = 0.62 L</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#080d1a] border border-white/[0.04]">
                    <span className="text-[9px] text-slate-500 block uppercase">Zero-Lift Drag</span>
                    <span className="text-cyan-300 font-bold">CD0 = 0.28</span>
                  </div>
                </div>
              </div>

              {/* Mini SVG Telemetry Oscilloscope */}
              <div className="p-3 rounded-lg bg-[#080d1a] border border-white/[0.04] space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>CANARD DYNAMIC DEFLECTION TELEMETRY</span>
                  <span className="text-cyan-400">200 Hz Sampling</span>
                </div>

                <div className="h-24 w-full relative flex items-end">
                  <svg className="w-full h-full overflow-visible">
                    <polyline
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2"
                      points={oscHistory
                        .map((pt, idx) => {
                          const x = (idx / Math.max(1, oscHistory.length - 1)) * 340;
                          const y = 50 - (pt.pitch / 20.0) * 40;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />
                    <polyline
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                      points={oscHistory
                        .map((pt, idx) => {
                          const x = (idx / Math.max(1, oscHistory.length - 1)) * 340;
                          const y = 50 - (pt.staticMargin / 10.0) * 40;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />
                  </svg>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-white/[0.04]">
                  <span className="flex items-center gap-1 text-cyan-400">
                    <span className="w-2 h-0.5 bg-cyan-400" />
                    Pitch ({canardPitch > 0 ? `+${canardPitch}°` : `${canardPitch}°`})
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2 h-0.5 bg-emerald-400" />
                    Static Margin (+4.2%)
                  </span>
                  <span>Simulation HIL Mode</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WORKBENCH 2: 77 GHz FMCW SENSOR CHARACTERIZATION */}
        {activeWorkbench === 'FMCW_SENSOR' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* FMCW Radar Transceiver Bench */}
            <div className="lg:col-span-6 p-4 rounded-xl bg-[#050811] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
                  <Radar size={14} className="text-emerald-400" />
                  <span>77 GHz FMCW SENSOR CHARACTERIZATION</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400">Sub-Decimeter Precision</span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#080d1a] border border-white/[0.04]">
                  <span className="text-slate-400">Chirp Bandwidth (B):</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFmcwChirpBandwidth(0.8)}
                      className={`px-2 py-0.5 rounded text-[10px] ${fmcwChirpBandwidth === 0.8 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                    >
                      0.8 GHz (Std)
                    </button>
                    <button
                      onClick={() => setFmcwChirpBandwidth(1.2)}
                      className={`px-2 py-0.5 rounded text-[10px] ${fmcwChirpBandwidth === 1.2 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                    >
                      1.2 GHz (High-Res)
                    </button>
                    <button
                      onClick={() => setFmcwChirpBandwidth(2.0)}
                      className={`px-2 py-0.5 rounded text-[10px] ${fmcwChirpBandwidth === 2.0 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                    >
                      2.0 GHz (Ultra)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="p-2.5 rounded-lg bg-[#080d1a] border border-white/[0.04]">
                    <span className="text-[9px] text-slate-500 block">Center Frequency</span>
                    <span className="text-white font-bold">77.0 GHz</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#080d1a] border border-white/[0.04]">
                    <span className="text-[9px] text-slate-500 block">Range Resolution</span>
                    <span className="text-cyan-300 font-bold">ΔR = 0.12 m</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#080d1a] border border-white/[0.04]">
                    <span className="text-[9px] text-slate-500 block">Target SNR</span>
                    <span className="text-emerald-400 font-bold">+34.2 dB</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#080d1a] border border-emerald-500/20 text-xs text-slate-300 leading-relaxed">
                <p>
                  <strong>Proximity Transducer Theory:</strong> FMCW radar measures beat frequency fb = (2 · S · R) / c + (2 · fd). At a 1.2 GHz sweep across 256 chirps, the sensor provides sub-decimeter surface proximity measurement with multi-path clutter rejection.
                </p>
              </div>
            </div>

            {/* Signal Processing & Ranging Metrics */}
            <div className="lg:col-span-6 p-4 rounded-xl bg-[#050811] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
                  <Binary size={14} className="text-cyan-400" />
                  <span>DSP RADAR FFT &amp; RANGE PROFILE</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-400">1024-Point Complex FFT</span>
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-lg bg-[#080d1a] border border-white/[0.04]">
                    <span className="text-[9px] text-slate-500 block">Doppler Velocity</span>
                    <span className="text-white font-bold">-48.2 m/s</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#080d1a] border border-white/[0.04]">
                    <span className="text-[9px] text-slate-500 block">Estimated Proximity</span>
                    <span className="text-cyan-300 font-bold">14.6 m</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#080d1a] border border-white/[0.04]">
                    <span className="text-[9px] text-slate-500 block">Peak Correlation</span>
                    <span className="text-emerald-400 font-bold">99.4%</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#080d1a] border border-white/[0.04] text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Antenna Array Configuration:</span>
                  <span className="text-emerald-400 font-bold">4-Patch Conformal Microstrip</span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#080d1a] border border-white/[0.04] text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Transducer Layer Link:</span>
                  <span className="text-cyan-300 font-bold">Direct to Sensor Lab Channel 06</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WORKBENCH 3: CRPA ANTI-JAM & SENSOR RESILIENCE */}
        {activeWorkbench === 'CRPA_RESILIENCE' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-mono text-xs">
            {/* CRPA 4-Element GPS Antenna Array */}
            <div className="lg:col-span-6 p-4 rounded-xl bg-[#050811] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-xs font-bold text-white uppercase flex items-center gap-2">
                  <RadioTower size={14} className="text-purple-400" />
                  <span>CRPA 4-ELEMENT ADAPTIVE BEAMFORMING</span>
                </span>
                <span className="text-[10px] text-purple-400">54.8 dB Null Depth</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#080d1a] border border-white/[0.04]">
                  <span className="text-slate-400">Simulated Interference Angle:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="5"
                      value={crpaInterferenceAngle}
                      onChange={(e) => setCrpaInterferenceAngle(parseInt(e.target.value, 10))}
                      className="w-28 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
                    />
                    <span className="text-purple-300 font-bold w-12 text-right">{crpaInterferenceAngle}° N</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-[#080d1a] border border-white/[0.04]">
                  <span className="text-slate-400">Interference Power Test Level:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="10"
                      max="200"
                      step="5"
                      value={crpaSuppressionPower}
                      onChange={(e) => setCrpaSuppressionPower(parseInt(e.target.value, 10))}
                      className="w-28 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
                    />
                    <span className="text-purple-300 font-bold w-12 text-right">{crpaSuppressionPower} W</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="p-2 rounded-lg bg-[#080d1a] border border-white/[0.04]">
                    <span className="text-[9px] text-slate-500 block">Null Depth</span>
                    <span className="text-emerald-400 font-bold">54.8 dB</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#080d1a] border border-white/[0.04]">
                    <span className="text-[9px] text-slate-500 block">SV Constellation</span>
                    <span className="text-white font-bold">11 SVs Locked</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#080d1a] border border-white/[0.04]">
                    <span className="text-[9px] text-slate-500 block">Carrier/Noise Margin</span>
                    <span className="text-cyan-300 font-bold">+28 dB C/N0</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tactical INS Drift Survival */}
            <div className="lg:col-span-6 p-4 rounded-xl bg-[#050811] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-xs font-bold text-white uppercase flex items-center gap-2">
                  <Compass size={14} className="text-cyan-400" />
                  <span>INS DEAD-RECKONING RESILIENCE BENCHMARK</span>
                </span>
                <span className="text-[10px] text-emerald-400">&lt; 0.05°/hr Gyro Drift</span>
              </div>

              <div className="space-y-2 text-slate-300 text-xs leading-relaxed">
                <p>
                  <strong>GNSS-Denied Outage Performance:</strong> During induced satellite signal loss, the Extended Kalman Filter transitions to inertial dead-reckoning using shock-hardened MEMS gyros, accelerometers, and 3-axis magnetometer.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2 rounded-lg bg-[#080d1a] border border-white/[0.04]">
                    <span className="text-[9px] text-slate-500 block">Position Error (30s GNSS Loss)</span>
                    <span className="text-emerald-400 font-bold">&lt; 0.85 meters</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#080d1a] border border-white/[0.04]">
                    <span className="text-[9px] text-slate-500 block">Position Error (60s GNSS Loss)</span>
                    <span className="text-cyan-300 font-bold">&lt; 1.42 meters</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WORKBENCH 4: POWER BUS & AVIONICS BIT (BUILT-IN TEST) */}
        {activeWorkbench === 'POWER_BIT' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 font-mono text-xs">
            {/* Built-In Test (BIT) Check Table */}
            <div className="lg:col-span-6 p-4 rounded-xl bg-[#050811] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-xs font-bold text-white uppercase flex items-center gap-2">
                  <ShieldCheck size={14} className="text-amber-400" />
                  <span>SYSTEM BUILT-IN TEST (BIT) VERIFICATION</span>
                </span>
                <span className="text-[10px] text-emerald-400">Continuous POST Check</span>
              </div>

              <div className="space-y-1.5">
                {[
                  { name: 'Dual-Core Lockstep Sync Check', status: 'SYNCHRONIZED', ok: true },
                  { name: 'GaN PMU Power Rail Tolerance Check (28V ± 2%)', status: '28.42 V NOMINAL', ok: true },
                  { name: 'Transducer SPI/I2C Bus Continuity', status: 'ALL 7 DETECTED', ok: true },
                  { name: 'NAND Black-Box Flash Memory Ring Buffer', status: 'CIRCULAR PASS', ok: true },
                  { name: 'EKF Covariance Positivity Matrix', status: 'POSITIVE DEFINITE', ok: true },
                ].map((item, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-[#080d1a] border border-white/[0.04] flex items-center justify-between">
                    <span className="text-slate-300">{item.name}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold text-[10px]">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Power & Core Temperatures */}
            <div className="lg:col-span-6 p-4 rounded-xl bg-[#050811] border border-white/[0.06] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-xs font-bold text-white uppercase flex items-center gap-2">
                  <Zap size={14} className="text-amber-400" />
                  <span>POWER RAILS &amp; SILICON CORE TEMPERATURES</span>
                </span>
                <span className="text-[10px] text-cyan-400">28.42V GaN Bus</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-[#080d1a] border border-white/[0.04]">
                  <span className="text-[9px] text-slate-500 block uppercase">28V Primary Rail</span>
                  <span className="text-amber-300 font-bold text-sm">28.42 V · 3.1 A</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#080d1a] border border-white/[0.04]">
                  <span className="text-[9px] text-slate-500 block uppercase">3.3V Avionics Core Rail</span>
                  <span className="text-cyan-300 font-bold text-sm">3.31 V · 980 mA</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#080d1a] border border-white/[0.04]">
                  <span className="text-[9px] text-slate-500 block uppercase">MCU Junction Core Temp</span>
                  <span className="text-white font-bold text-sm">44.5 °C (Nominal)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#080d1a] border border-white/[0.04]">
                  <span className="text-[9px] text-slate-500 block uppercase">Power Converter Efficiency</span>
                  <span className="text-emerald-400 font-bold text-sm">96.2% (GaN Active)</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#080d1a] border border-white/[0.04] text-[11px] text-slate-400 flex items-center justify-between">
                <span>Power Bus Standby Hold Time:</span>
                <span className="text-emerald-400 font-bold">120+ s sustained</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
