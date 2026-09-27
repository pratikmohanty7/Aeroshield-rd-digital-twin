import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { FaultType, SensorType } from '../types/sensor';
import { MOCK_SCENARIOS, ScenarioDefinition } from '../data/mockScenarios';
import { StatusBadge } from '../components/common/StatusBadge';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { soundFX } from '../utils/audioFeedback';
import {
  Play,
  Pause,
  RotateCcw,
  RefreshCw,
  Sliders,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Activity,
  Compass,
  Navigation,
  Gauge,
  Thermometer,
  Radio,
  ShieldCheck,
  Zap,
  SlidersHorizontal,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  Info,
  Maximize2,
} from 'lucide-react';
import { formatElapsedSeconds, formatNumber } from '../utils/formatters';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

type ActiveStreamKey = 'HEALTH' | SensorType;

interface SensorChannelConfig {
  id: SensorType;
  label: string;
  name: string;
  subsystem: string;
  unit: string;
  nominalMin: number;
  nominalMax: number;
  baseline: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const SENSOR_CHANNELS: SensorChannelConfig[] = [
  {
    id: 'IMU',
    label: 'IMU',
    name: 'Inertial Measurement Unit',
    subsystem: 'Inertial Dynamics',
    unit: 'G',
    nominalMin: 0.90,
    nominalMax: 1.15,
    baseline: 1.02,
    icon: Compass,
  },
  {
    id: 'GNSS',
    label: 'GNSS',
    name: 'Satellite Positioning Receiver',
    subsystem: 'RF Navigation',
    unit: 'm',
    nominalMin: 445.0,
    nominalMax: 460.0,
    baseline: 452.4,
    icon: Navigation,
  },
  {
    id: 'PRESSURE',
    label: 'Barometer',
    name: 'Air Data Barometer',
    subsystem: 'Pitot & Static Pressure',
    unit: 'hPa',
    nominalMin: 957.0,
    nominalMax: 965.0,
    baseline: 961.2,
    icon: Gauge,
  },
  {
    id: 'TEMPERATURE',
    label: 'Temperature',
    name: 'Core Electronics Thermal Bus',
    subsystem: 'Thermal Dissipation',
    unit: '°C',
    nominalMin: 25.0,
    nominalMax: 48.0,
    baseline: 34.6,
    icon: Thermometer,
  },
  {
    id: 'MAGNETOMETER',
    label: 'Magnetometer',
    name: 'Tri-Axial Fluxgate Compass',
    subsystem: 'Attitude Reference',
    unit: 'deg',
    nominalMin: 135.0,
    nominalMax: 150.0,
    baseline: 142.5,
    icon: Radio,
  },
  {
    id: 'ENVIRONMENT',
    label: 'MMW / Radar',
    name: '77 GHz Proximity Radar',
    subsystem: 'FMCW Standoff Array',
    unit: 'm',
    nominalMin: 8.0,
    nominalMax: 16.0,
    baseline: 12.4,
    icon: Activity,
  },
];

export const SimulationPage: React.FC = () => {
  const {
    isRunning,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    timeSeconds,
    simulationSpeed,
    setSpeed,
    config,
    setConfig,
    activeFaults,
    injectFault,
    recoverAllFaults,
    healthBreakdown,
    session,
    createSession,
    sensors,
    obdsState,
    diagnosticEvents,
    stateEstimation,
  } = useApp();

  // User State
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('SCEN-NORMAL');
  const [activeStream, setActiveStream] = useState<ActiveStreamKey>('HEALTH');
  const [timeWindowSec, setTimeWindowSec] = useState<number>(20);
  const [showDualTrace, setShowDualTrace] = useState<boolean>(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);
  const [showFaultInjection, setShowFaultInjection] = useState<boolean>(false);
  const [operatorInput, setOperatorInput] = useState<string>(session.operator);

  // Synchronized Health history buffer
  const [healthHistory, setHealthHistory] = useState<{ time: number; health: number; confidence: number }[]>([]);

  useEffect(() => {
    setHealthHistory((prev) => {
      const nowSec = parseFloat(timeSeconds.toFixed(1));
      if (prev.length > 0 && prev[prev.length - 1].time === nowSec) {
        return prev;
      }
      const newEntry = {
        time: nowSec,
        health: healthBreakdown.systemHealthIndex,
        confidence: stateEstimation.confidence,
      };
      return [...prev.slice(-60), newEntry];
    });
  }, [timeSeconds, healthBreakdown.systemHealthIndex, stateEstimation.confidence]);

  const selectedScenario = useMemo(
    () => MOCK_SCENARIOS.find((s) => s.id === selectedScenarioId) || MOCK_SCENARIOS[0],
    [selectedScenarioId]
  );

  // Execute Scenario
  const handleRunScenario = () => {
    soundFX.click();
    recoverAllFaults();

    if (selectedScenario.primaryFault !== 'NONE') {
      soundFX.warning();
      injectFault(selectedScenario.primaryFault);

      // Auto-focus trace on the affected stream so the operator immediately sees the impact
      if (selectedScenario.primaryFault === 'GNSS_LOSS') {
        setActiveStream('GNSS');
      } else if (selectedScenario.primaryFault === 'IMU_BIAS') {
        setActiveStream('IMU');
      } else if (selectedScenario.primaryFault === 'STALE_DATA') {
        setActiveStream('PRESSURE');
      } else if (selectedScenario.primaryFault === 'POWER_DEGRADATION') {
        setActiveStream('HEALTH');
      } else if (selectedScenario.primaryFault === 'SENSOR_DROPOUT') {
        setActiveStream('GNSS');
      } else if (selectedScenario.primaryFault === 'COMMUNICATION_INTERRUPTION') {
        setActiveStream('HEALTH');
      }
    } else {
      setActiveStream('HEALTH');
    }

    if (!isRunning) {
      startSimulation();
    }
  };

  // Recover to nominal envelope
  const handleRecover = () => {
    soundFX.phaseStep();
    recoverAllFaults();
    setSelectedScenarioId('SCEN-NORMAL');
    setActiveStream('HEALTH');
  };

  // Reset clock & baseline
  const handleReset = () => {
    soundFX.click();
    resetSimulation();
    recoverAllFaults();
    setSelectedScenarioId('SCEN-NORMAL');
    setActiveStream('HEALTH');
    setHealthHistory([]);
  };

  // Step simulation forward by 1 second
  const handleStepForward = () => {
    soundFX.click();
    if (isRunning) pauseSimulation();
    // Start temporarily and pause to advance state smoothly
    startSimulation();
    setTimeout(() => {
      pauseSimulation();
    }, 200);
  };

  // Active channel configuration
  const activeChannelConfig = useMemo(() => {
    if (activeStream === 'HEALTH') return null;
    return SENSOR_CHANNELS.find((c) => c.id === activeStream) || SENSOR_CHANNELS[0];
  }, [activeStream]);

  // Chart telemetry data
  const chartData = useMemo(() => {
    const pointsCount = timeWindowSec * 10;

    if (activeStream === 'HEALTH') {
      if (healthHistory.length === 0) {
        return [{ timeLabel: '0.0s', primary: healthBreakdown.systemHealthIndex, confidence: stateEstimation.confidence }];
      }
      const historySlice = healthHistory.slice(-pointsCount);
      const lastTime = historySlice[historySlice.length - 1]?.time || 0;
      return historySlice.map((item) => {
        const offset = (item.time - lastTime).toFixed(1);
        return {
          timeLabel: offset === '0.0' ? '0s' : `${offset}s`,
          primary: item.health,
          confidence: item.confidence,
        };
      });
    }

    const sensor = sensors[activeStream];
    if (!sensor || !sensor.history || sensor.history.length === 0) {
      return [{ timeLabel: '0.0s', primary: sensor ? sensor.primaryValue : 0 }];
    }

    const historySlice = sensor.history.slice(-pointsCount);
    const lastTimestamp = historySlice[historySlice.length - 1]?.timestamp || 0;

    return historySlice.map((pt, index) => {
      const relSec = ((pt.timestamp - lastTimestamp) / 1000).toFixed(1);
      // Synchronized health index for dual-trace mode
      const pairedHealth = healthHistory[Math.max(0, healthHistory.length - 1 - (historySlice.length - 1 - index))]?.health || healthBreakdown.systemHealthIndex;

      return {
        timeLabel: relSec === '0.0' ? '0s' : `${relSec}s`,
        primary: pt.value,
        quality: pt.quality,
        dualHealth: pairedHealth,
      };
    });
  }, [activeStream, timeWindowSec, healthHistory, healthBreakdown.systemHealthIndex, stateEstimation.confidence, sensors]);

  // Telemetry metadata
  const streamMeta = useMemo(() => {
    if (activeStream === 'HEALTH') {
      const isCritical = healthBreakdown.systemHealthIndex < 70;
      const isCaution = healthBreakdown.systemHealthIndex < 85;
      return {
        title: 'System Health & Confidence Trajectory',
        unit: '%',
        color: isCritical ? '#f43f5e' : isCaution ? '#f59e0b' : '#06b6d4',
        current: `${healthBreakdown.systemHealthIndex}%`,
        status: healthBreakdown.status,
      };
    }
    const ch = activeChannelConfig!;
    const sensor = sensors[ch.id];
    return {
      title: `${ch.name} Telemetry Stream`,
      unit: ch.unit,
      color: sensor.status === 'NORMAL' ? '#06b6d4' : sensor.status === 'WARNING' ? '#f59e0b' : '#f43f5e',
      current: `${formatNumber(sensor.primaryValue, ch.id === 'PRESSURE' ? 1 : 2)} ${ch.unit}`,
      status: sensor.status,
    };
  }, [activeStream, activeChannelConfig, healthBreakdown, sensors]);

  // Window statistics
  const windowStats = useMemo(() => {
    if (chartData.length === 0) return { min: 0, max: 0, delta: 0, p2p: 0 };
    const vals = chartData.map((d) => d.primary);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const last = vals[vals.length - 1] || 0;
    const base = activeChannelConfig ? activeChannelConfig.baseline : 95;
    return {
      min: parseFloat(min.toFixed(2)),
      max: parseFloat(max.toFixed(2)),
      delta: parseFloat((last - base).toFixed(2)),
      p2p: parseFloat((max - min).toFixed(2)),
    };
  }, [chartData, activeChannelConfig]);

  // Fault catalog for collapsible section
  const faultCatalog: { type: FaultType; label: string; severity: 'WARNING' | 'DEGRADED' | 'FAILED' }[] = [
    { type: 'GNSS_LOSS', label: 'GNSS Constellation Lock Loss', severity: 'FAILED' },
    { type: 'IMU_BIAS', label: 'IMU Bias (+0.85G)', severity: 'DEGRADED' },
    { type: 'STALE_DATA', label: 'Stale Sensor Data (>1.8s)', severity: 'WARNING' },
    { type: 'SENSOR_DROPOUT', label: 'Sensor Dropout (0.00)', severity: 'FAILED' },
    { type: 'TEMPERATURE_SPIKE', label: 'Thermal Spike (78°C)', severity: 'FAILED' },
    { type: 'POWER_DEGRADATION', label: 'Power Sag (19.4V)', severity: 'FAILED' },
    { type: 'COMMUNICATION_INTERRUPTION', label: 'Communication Loss (>80%)', severity: 'WARNING' },
    { type: 'SENSOR_DISAGREEMENT', label: 'Attitude Skew (+95°)', severity: 'DEGRADED' },
  ];

  return (
    <div className="space-y-4 font-sans max-w-[1780px] mx-auto text-slate-100">
      
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1f2533]">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 font-semibold tracking-wider uppercase mb-0.5">
            <SlidersHorizontal size={12} />
            <span>Hardware-in-the-Loop (HIL) Testbed</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span>Telemetry Emulation &amp; Scenario Runner</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Dynamic trajectory stimulus, calibrated sensor disturbance injection, and automated fault observer diagnostics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DataSourceBadge source="6 SIMULATED SENSOR STREAMS" />
        </div>
      </div>

      {/* 2. TOP STATUS DECK & CLOCK CONTROLS */}
      <div className="bg-[#11141c] border border-[#1e2330] rounded-sm p-3.5 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 font-mono">
        
        {/* Left: 4 Clear Metric Blocks */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
          {/* Block 1: Simulation Session */}
          <div className="border-l-2 border-sky-600/70 pl-3">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">
              Simulation Session
            </span>
            <span className="text-sm font-bold text-white block mt-0.5 truncate font-mono">
              {session.simulationId}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
              <Clock size={11} className="text-sky-400 shrink-0" />
              <span className="tabular-nums">{formatElapsedSeconds(timeSeconds)} elapsed</span>
            </div>
          </div>

          {/* Block 2: Active Scenario */}
          <div className="border-l-2 border-sky-600/70 pl-3">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">
              Active Scenario
            </span>
            <span className="text-sm font-bold text-sky-300 block mt-0.5 truncate">
              {selectedScenario.name}
            </span>
            <div className="text-[11px] mt-0.5 truncate">
              {activeFaults.filter((f) => f.active).length > 0 ? (
                <span className="text-rose-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  {activeFaults.filter((f) => f.active).length} Fault Active
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Nominal Envelope
                </span>
              )}
            </div>
          </div>

          {/* Block 3: Run Status */}
          <div className="border-l-2 border-sky-600/70 pl-3">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">
              Run Status
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isRunning ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span className={`text-sm font-bold ${isRunning ? 'text-emerald-300' : 'text-amber-300'}`}>
                {isRunning ? 'RUNNING' : 'PAUSED'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {simulationSpeed}x Speed Multiplier
            </span>
          </div>

          {/* Block 4: System Health */}
          <div className="border-l-2 border-sky-600/70 pl-3">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block tracking-wider">
              System Health
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span
                className={`text-base font-bold tabular-nums ${
                  healthBreakdown.systemHealthIndex >= 85
                    ? 'text-emerald-400'
                    : healthBreakdown.systemHealthIndex >= 70
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {healthBreakdown.systemHealthIndex}%
              </span>
              <span className="text-[10px] text-slate-400">/ 100</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              Status: <strong className="text-slate-200 font-semibold">{healthBreakdown.status}</strong>
            </span>
          </div>
        </div>

        {/* Right: Clock Execution Bar */}
        <div className="flex items-center gap-2 pt-2 xl:pt-0 xl:border-l xl:border-[#1e2330] xl:pl-4 justify-end flex-wrap">
          {isRunning ? (
            <button
              onClick={pauseSimulation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-amber-950/70 hover:bg-amber-900 border border-amber-600 text-amber-300 text-xs font-semibold transition-colors"
            >
              <Pause size={12} />
              <span>PAUSE</span>
            </button>
          ) : (
            <button
              onClick={startSimulation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 text-xs font-semibold transition-colors"
            >
              <Play size={12} />
              <span>RUN</span>
            </button>
          )}

          <button
            onClick={handleStepForward}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#0d1017] hover:bg-[#161a24] border border-[#1e2330] text-slate-300 hover:text-white text-xs font-medium transition-colors"
            title="Step simulation forward 1 second"
          >
            <span>+1s STEP</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#0d1017] hover:bg-[#161a24] border border-[#1e2330] text-slate-300 hover:text-white text-xs font-medium transition-colors"
            title="Reset simulation clock to t=0"
          >
            <RotateCcw size={12} />
            <span>RESET</span>
          </button>

          {/* Speed Multiplier Segmented Selector */}
          <div className="flex items-center bg-[#0d1017] border border-[#1e2330] rounded-sm p-0.5 text-xs">
            {[0.5, 1, 2].map((spd) => (
              <button
                key={spd}
                onClick={() => setSpeed(spd)}
                className={`px-2 py-0.5 rounded-xs text-[10px] font-medium transition-colors ${
                  simulationSpeed === spd
                    ? 'bg-sky-700 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. MIDDLE: ONE MAIN SIMULATION VISUALIZATION (HERO TELEMETRY SCOPE) */}
      <section className="bg-[#11141c] border border-[#1e2330] rounded-sm p-4 space-y-3">
        {/* Top Scope Control Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2.5 border-b border-[#1b202c]">
          {/* Left Title & Live Value */}
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-sm bg-[#141b28] border border-sky-800/40 text-sky-400">
              <Activity size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                  {streamMeta.title}
                </h2>
                <span className="text-xs font-mono font-bold text-sky-300 bg-[#141b28] border border-sky-800/60 px-2 py-0.5 rounded-sm">
                  {streamMeta.current}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Calibrated 10 Hz telemetry trace with nominal invariant threshold monitoring.
              </p>
            </div>
          </div>

          {/* Right: Stream Selector Tabs & Oscilloscope Controls */}
          <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
            {/* Stream Selector */}
            <div className="flex items-center gap-0.5 bg-[#0d1017] border border-[#1e2330] rounded-sm p-0.5 overflow-x-auto max-w-full">
              <button
                onClick={() => setActiveStream('HEALTH')}
                className={`px-2.5 py-0.5 rounded-xs text-[10px] font-medium transition-colors whitespace-nowrap ${
                  activeStream === 'HEALTH'
                    ? 'bg-sky-700 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Health Index
              </button>
              {SENSOR_CHANNELS.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setActiveStream(ch.id)}
                  className={`px-2.5 py-0.5 rounded-xs text-[10px] font-medium transition-colors whitespace-nowrap ${
                    activeStream === ch.id
                      ? 'bg-sky-700 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {ch.label}
                </button>
              ))}
            </div>

            {/* Time Window (10s, 20s, 40s) */}
            <div className="flex items-center bg-[#0d1017] border border-[#1e2330] rounded-sm p-0.5">
              {[10, 20, 40].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setTimeWindowSec(sec)}
                  className={`px-2 py-0.5 rounded-xs text-[10px] font-medium transition-colors ${
                    timeWindowSec === sec
                      ? 'bg-[#1b2333] text-sky-300 font-semibold border border-[#2d3a50]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>

            {/* Dual Trace Switch (Health Overlay) */}
            {activeStream !== 'HEALTH' && (
              <button
                onClick={() => setShowDualTrace(!showDualTrace)}
                className={`px-2.5 py-1 rounded-sm text-[10px] border transition-colors ${
                  showDualTrace
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 font-semibold'
                    : 'bg-[#0d1017] border-[#1e2330] text-slate-400 hover:text-white'
                }`}
                title="Overlay synchronized System Health Index"
              >
                Dual Trace
              </button>
            )}
          </div>
        </div>

        {/* Oscilloscope Canvas */}
        <div className="h-[280px] sm:h-[310px] w-full relative bg-[#090b10] rounded-sm border border-[#1a1f2c] p-2">
          {/* Scope grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none rounded-sm" />

          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 15, right: 15, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="scopeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={streamMeta.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={streamMeta.color} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />

              <XAxis
                dataKey="timeLabel"
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                interval={Math.max(1, Math.floor(chartData.length / 8))}
              />

              <YAxis
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                width={55}
                domain={activeStream === 'HEALTH' ? [0, 100] : ['auto', 'auto']}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-[#0e1424]/95 backdrop-blur-md border border-cyan-500/40 p-3 rounded-sm shadow-2xl font-mono text-xs text-white min-w-[190px] space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-cyan-400 border-b border-white/[0.08] pb-1">
                        <span>Time Offset: {d.timeLabel}</span>
                        <span>10 Hz Scan</span>
                      </div>
                      <div className="flex items-baseline justify-between text-sm font-bold text-white pt-0.5">
                        <span className="text-slate-400 text-xs font-normal">Measurement:</span>
                        <span>
                          {typeof d.primary === 'number' ? d.primary.toFixed(2) : d.primary} {streamMeta.unit}
                        </span>
                      </div>
                      {typeof d.quality === 'number' && (
                        <div className="flex items-center justify-between text-[11px] text-emerald-400">
                          <span className="text-slate-400 font-normal">Quality Score:</span>
                          <span>{d.quality}%</span>
                        </div>
                      )}
                      {showDualTrace && typeof d.dualHealth === 'number' && (
                        <div className="flex items-center justify-between text-[11px] text-cyan-300">
                          <span className="text-slate-400 font-normal">System Health:</span>
                          <span>{d.dualHealth}%</span>
                        </div>
                      )}
                    </div>
                  );
                }}
              />

              {activeStream === 'HEALTH' && (
                <>
                  <ReferenceLine
                    y={80}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                    label={{
                      value: 'CAUTION LIMIT: 80%',
                      fill: '#f59e0b',
                      fontSize: 9,
                      position: 'insideTopLeft',
                      fontFamily: 'monospace',
                    }}
                  />
                  <ReferenceLine
                    y={60}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                    label={{
                      value: 'CRITICAL THRESHOLD: 60%',
                      fill: '#f43f5e',
                      fontSize: 9,
                      position: 'insideBottomLeft',
                      fontFamily: 'monospace',
                    }}
                  />
                </>
              )}

              {activeChannelConfig && (
                <>
                  <ReferenceLine
                    y={activeChannelConfig.nominalMax}
                    stroke="#06b6d4"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                    label={{
                      value: `MAX: ${activeChannelConfig.nominalMax}`,
                      fill: '#06b6d4',
                      fontSize: 9,
                      position: 'insideTopRight',
                      fontFamily: 'monospace',
                    }}
                  />
                  <ReferenceLine
                    y={activeChannelConfig.nominalMin}
                    stroke="#06b6d4"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                    label={{
                      value: `MIN: ${activeChannelConfig.nominalMin}`,
                      fill: '#06b6d4',
                      fontSize: 9,
                      position: 'insideBottomLeft',
                      fontFamily: 'monospace',
                    }}
                  />
                </>
              )}

              <Area
                type="monotone"
                dataKey="primary"
                stroke={streamMeta.color}
                strokeWidth={2}
                fill="url(#scopeGrad)"
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="primary"
                stroke={streamMeta.color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />

              {showDualTrace && activeStream !== 'HEALTH' && (
                <Line
                  type="monotone"
                  dataKey="dualHealth"
                  stroke="#10b981"
                  strokeWidth={1.8}
                  strokeDasharray="4 3"
                  dot={false}
                  isAnimationActive={false}
                  name="System Health (%)"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Telemetry Window Statistics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#1b202c] text-xs font-mono">
          <div className="bg-[#0d1017] p-2.5 rounded-sm border border-[#171b24]">
            <span className="text-[10px] text-slate-400 uppercase block">Window Min / Max</span>
            <span className="text-xs font-bold text-slate-200 mt-0.5 block tabular-nums">
              {windowStats.min} / {windowStats.max} {streamMeta.unit}
            </span>
          </div>

          <div className="bg-[#0d1017] p-2.5 rounded-sm border border-[#171b24]">
            <span className="text-[10px] text-slate-400 uppercase block">Peak-to-Peak Span</span>
            <span className="text-xs font-bold text-slate-200 mt-0.5 block tabular-nums">
              {windowStats.p2p} {streamMeta.unit}
            </span>
          </div>

          <div className="bg-[#0d1017] p-2.5 rounded-sm border border-[#171b24]">
            <span className="text-[10px] text-slate-400 uppercase block">Δ from Nominal Baseline</span>
            <span
              className={`text-xs font-bold mt-0.5 block tabular-nums ${
                Math.abs(windowStats.delta) > 5 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {windowStats.delta >= 0 ? `+${windowStats.delta}` : windowStats.delta} {streamMeta.unit}
            </span>
          </div>

          <div className="bg-[#0d1017] p-2.5 rounded-sm border border-[#171b24]">
            <span className="text-[10px] text-slate-400 uppercase block">Invariant Limit Envelope</span>
            <span className="text-xs font-bold text-sky-300 mt-0.5 block">
              {streamMeta.status === 'NORMAL' ? 'NOMINAL' : 'LIMIT VIOLATION'}
            </span>
          </div>
        </div>
      </section>

      {/* 4. SENSOR STATUS (LEFT) | DIAGNOSTIC STATUS (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* LEFT COLUMN: SENSOR STATUS SUMMARY */}
        <div className="bg-[#11141c] border border-[#1e2330] rounded-sm p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1b202c]">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Compass size={14} className="text-sky-400" />
                <span>Transducer Channel Status</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
                6 primary transducer channels with online boundary checks.
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              6 Channels Synchronized
            </span>
          </div>

          <div className="divide-y divide-[#171b24]">
            {SENSOR_CHANNELS.map((ch) => {
              const sensor = sensors[ch.id];
              const Icon = ch.icon;
              const isSelected = activeStream === ch.id;

              // Sparkline points
              const sparkHistory = (sensor.history || []).slice(-14);
              const sparkVals = sparkHistory.map((h) => h.value);
              const minV = Math.min(...sparkVals, ch.nominalMin);
              const maxV = Math.max(...sparkVals, ch.nominalMax);
              const spanV = Math.max(0.001, maxV - minV);
              const sparkPath = sparkHistory
                .map((p, i) => {
                  const x = (i / (sparkHistory.length - 1 || 1)) * 48;
                  const y = 14 - ((p.value - minV) / spanV) * 11;
                  return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
                })
                .join(' ');

              return (
                <div
                  key={ch.id}
                  onClick={() => setActiveStream(ch.id)}
                  className={`py-2 px-2.5 rounded-sm flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#182335] border border-sky-600/70'
                      : 'hover:bg-[#151924] border border-transparent'
                  }`}
                >
                  {/* Left: Icon & Channel info */}
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-1.5 rounded-sm border ${
                        isSelected
                          ? 'bg-[#1e2d44] border-sky-500/60 text-sky-300'
                          : 'bg-[#0d1017] border-[#1b202c] text-slate-300'
                      }`}
                    >
                      <Icon size={13} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white">
                          {ch.label}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          [{ch.id}]
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {ch.subsystem}
                      </span>
                    </div>
                  </div>

                  {/* Center: Micro sparkline */}
                  <div className="hidden sm:flex items-center gap-2">
                    <svg className="w-12 h-3.5 overflow-visible" viewBox="0 0 48 14">
                      <path
                        d={sparkPath || 'M 0,7 L 48,7'}
                        fill="none"
                        stroke={sensor.status === 'NORMAL' ? '#38bdf8' : '#f43f5e'}
                        strokeWidth={1.5}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  {/* Right: Primary Reading & Status */}
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <span className="text-xs font-bold text-white font-mono tabular-nums block">
                        {formatNumber(sensor?.primaryValue || 0, ch.id === 'PRESSURE' ? 1 : 2)}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">{ch.unit}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {sensor?.qualityScore || 0}% Q
                      </span>
                    </div>
                    <div className="w-24 flex justify-end">
                      <StatusBadge status={sensor?.status || 'NORMAL'} size="sm" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: DIAGNOSTIC STATUS (OBDS) */}
        <div className="bg-[#11141c] border border-[#1e2330] rounded-sm p-4 space-y-3 font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-[#1b202c]">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>On-Board Diagnostic System (OBDS)</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
                Fault isolation, boundary mitigation, and estimator recovery.
              </p>
            </div>
            <StatusBadge status={obdsState.status} size="sm" />
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-2.5 rounded-sm bg-[#0d1017] border border-[#1b202c]">
              <span className="text-[10px] text-slate-400 uppercase block">Active Fault Codes</span>
              <span className="text-sm font-bold text-white mt-0.5 block tabular-nums">
                {obdsState.activeFaultCount} {obdsState.activeFaultCount === 1 ? 'Code' : 'Codes'}
              </span>
            </div>

            <div className="p-2.5 rounded-sm bg-[#0d1017] border border-[#1b202c]">
              <span className="text-[10px] text-slate-400 uppercase block">Navigation Estimator</span>
              <span className="text-sm font-bold text-sky-300 mt-0.5 block truncate">
                {Boolean(stateEstimation.degradationReason) ? 'Fallback Altimetric' : 'Coupled GPS/INS EKF'}
              </span>
            </div>
          </div>

          {/* Recommended Action Box */}
          <div className="p-2.5 rounded-sm bg-[#0d1017] border border-[#1b202c] text-xs space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 uppercase">Automated Mitigation:</span>
              <span className="text-emerald-400 font-semibold">OBDS SUPERVISOR</span>
            </div>
            <p className="text-slate-200 font-sans text-xs leading-relaxed">
              {diagnosticEvents.find((e) => e.status === 'ACTIVE')?.recommendedAction ||
                (obdsState.status === 'NORMAL'
                  ? 'All subsystems operating within nominal limits. Standard sensor fusion active.'
                  : 'Engage fallback state estimator; isolate anomalous transducer and review event log.')}
            </p>
          </div>

          {/* Active Diagnostic Events Log Strip */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-semibold">
              <span>Recent Diagnostic Events</span>
              <span>{diagnosticEvents.length} Total</span>
            </div>
            {diagnosticEvents.length === 0 ? (
              <div className="p-2.5 rounded-sm bg-[#0d1017] border border-[#171b24] text-[11px] text-slate-500 text-center font-sans">
                All subsystems operating nominally. Zero fault codes registered.
              </div>
            ) : (
              diagnosticEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className="p-2 rounded-sm bg-[#0d1017] border border-[#171b24] text-[11px] flex items-center justify-between gap-2 hover:border-[#222938] transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <AlertTriangle
                      size={12}
                      className={
                        event.severity === 'CRITICAL' || event.severity === 'ERROR'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }
                    />
                    <span className="font-semibold text-slate-200">{event.module}:</span>
                    <span className="text-slate-400 truncate font-sans">{event.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {formatElapsedSeconds(event.timestamp / 1000)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 5. BOTTOM: SCENARIO SELECTOR, RUN SCENARIO, RECOVER, RESET */}
      <section className="bg-[#11141c] border border-[#1e2330] rounded-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#1b202c]">
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Zap size={13} className="text-sky-400" />
              <span>Calibrated Trajectory Scenarios</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Execute calibrated disturbance scenarios to evaluate estimator resilience and automated OBDS recovery.
            </p>
          </div>
        </div>

        {/* Compact Scenario Selector Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {MOCK_SCENARIOS.map((scen) => {
            const isSelected = selectedScenarioId === scen.id;
            return (
              <button
                key={scen.id}
                onClick={() => setSelectedScenarioId(scen.id)}
                className={`p-2 rounded-sm border text-left transition-colors ${
                  isSelected
                    ? 'bg-[#182335] border-sky-600 text-white'
                    : 'bg-[#0d1017] border-[#1d2330] text-slate-400 hover:text-slate-200 hover:bg-[#131822]'
                }`}
              >
                <span className="text-[10px] font-mono text-sky-400 block mb-0.5">
                  {scen.primaryFault === 'NONE' ? 'NOMINAL' : scen.primaryFault}
                </span>
                <span className="text-xs font-semibold block truncate">
                  {scen.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Scenario Information & Action Deck */}
        <div className="p-3 rounded-sm bg-[#0d1017] border border-[#1b202c] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-xs font-sans">
                {selectedScenario.name}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-xs bg-[#162030] border border-[#233550] text-sky-300">
                {selectedScenario.primaryFault}
              </span>
            </div>
            <p className="text-slate-300 font-sans text-xs leading-relaxed max-w-3xl">
              {selectedScenario.description}
            </p>
            <div className="text-[11px] text-slate-400">
              <strong className="text-slate-300">Expected Behavior:</strong> {selectedScenario.expectedBehavior}
            </div>
          </div>

          {/* Action Buttons: RUN SCENARIO, RECOVER, RESET */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleRunScenario}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-sky-700 hover:bg-sky-600 text-white text-xs font-mono font-semibold transition-colors"
            >
              <Play size={12} />
              <span>RUN SCENARIO</span>
            </button>

            <button
              onClick={handleRecover}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 text-xs font-mono font-semibold transition-colors"
              title="Recover all sensors to nominal envelope"
            >
              <RefreshCw size={12} />
              <span>RECOVER</span>
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#0d1017] hover:bg-[#161a24] border border-[#1e2330] text-slate-300 text-xs font-mono font-medium transition-colors"
              title="Reset simulation"
            >
              <RotateCcw size={12} />
              <span>RESET</span>
            </button>
          </div>
        </div>

        {/* 6. COLLAPSIBLE ACCORDIONS: SPECIFIC FAULT INJECTION & ADVANCED SETTINGS */}
        <div className="space-y-2 pt-2 border-t border-[#1b202c]">
          
          {/* Collapsible Section 1: Specific Fault Injection */}
          <div className="border border-[#1e2330] rounded-sm bg-[#0d1017] overflow-hidden">
            <button
              onClick={() => setShowFaultInjection(!showFaultInjection)}
              className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-mono text-slate-300 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                {showFaultInjection ? <ChevronDown size={13} className="text-sky-400" /> : <ChevronRight size={13} className="text-slate-400" />}
                <span className="font-semibold uppercase tracking-wider text-[11px]">Fault Injection Matrix</span>
              </div>
              <span className="text-[11px] text-slate-500">
                {activeFaults.filter((f) => f.active).length} Injections Active
              </span>
            </button>

            {showFaultInjection && (
              <div className="p-3.5 border-t border-[#1a1f2c] space-y-3 font-mono text-xs">
                <p className="text-[11px] text-slate-400 font-sans">
                  Direct stimulus triggers exercising invariant envelopes, state estimator innovation residuals, and OBDS isolation codes.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {faultCatalog.map((fb) => {
                    const isActive = activeFaults.some((f) => f.active && f.type === fb.type);
                    return (
                      <button
                        key={fb.type}
                        onClick={() => injectFault(fb.type)}
                        disabled={isActive}
                        className={`p-2.5 rounded-sm border text-left text-xs flex items-center justify-between transition-colors ${
                          isActive
                            ? 'bg-rose-950/40 border-rose-600 text-rose-300 cursor-not-allowed'
                            : 'bg-[#121620] border-[#1d2330] text-slate-300 hover:border-slate-500 hover:text-white'
                        }`}
                      >
                        <span className="truncate">{fb.label}</span>
                        <span className="text-[10px] ml-1 shrink-0 font-mono">
                          {isActive ? 'ACTIVE' : 'INJECT'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Collapsible Section 2: Advanced Simulation Settings */}
          <div className="border border-[#1e2330] rounded-sm bg-[#0d1017] overflow-hidden">
            <button
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-mono text-slate-300 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                {showAdvancedSettings ? <ChevronDown size={13} className="text-sky-400" /> : <ChevronRight size={13} className="text-slate-400" />}
                <span className="font-semibold uppercase tracking-wider text-[11px]">Advanced Simulation Parameters</span>
              </div>
              <span className="text-[11px] text-slate-500">
                Noise Variance &amp; Sampling Rates
              </span>
            </button>

            {showAdvancedSettings && (
              <div className="p-3.5 border-t border-white/[0.04] space-y-4 font-mono text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Parameter 1: Noise Level */}
                  <div className="p-3 rounded-sm bg-[#0d1322] border border-white/[0.04] space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Noise Level:</span>
                      <span className="text-cyan-300 font-bold">{(config.noiseLevel * 100).toFixed(1)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.1"
                      step="0.005"
                      value={config.noiseLevel}
                      onChange={(e) => setConfig({ ...config, noiseLevel: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-sm"
                    />
                  </div>

                  {/* Parameter 2: Drift Scale */}
                  <div className="p-3 rounded-sm bg-[#0d1322] border border-white/[0.04] space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Drift Scale:</span>
                      <span className="text-cyan-300 font-bold">{(config.driftLevel * 100).toFixed(1)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.05"
                      step="0.005"
                      value={config.driftLevel}
                      onChange={(e) => setConfig({ ...config, driftLevel: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-sm"
                    />
                  </div>

                  {/* Parameter 3: Internal Stream Meta */}
                  <div className="p-3 rounded-sm bg-[#0d1322] border border-white/[0.04] space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Reference Ingest Rate:</span>
                      <span className="text-slate-200">200 Hz</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Display Sampling Rate:</span>
                      <span className="text-slate-200">10 Hz</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Signal Model:</span>
                      <span className="text-cyan-400 font-medium">Deterministic Ingestion</span>
                    </div>
                  </div>
                </div>

                {/* Operator Session Input */}
                <div className="pt-2 border-t border-white/[0.04] flex flex-col sm:flex-row items-center gap-3">
                  <span className="text-slate-400 text-xs">Operator Session Name:</span>
                  <input
                    type="text"
                    value={operatorInput}
                    onChange={(e) => setOperatorInput(e.target.value)}
                    placeholder="Operator Name"
                    className="bg-[#0d1322] border border-white/[0.08] rounded-sm px-2.5 py-1 text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500 font-mono w-full sm:w-64"
                  />
                  <button
                    onClick={() => {
                      soundFX.click();
                      createSession(operatorInput, selectedScenario.name);
                    }}
                    className="px-3 py-1 rounded-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/[0.08] text-xs transition-colors whitespace-nowrap"
                  >
                    Initialize New Session
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
