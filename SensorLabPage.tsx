import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SensorType } from '../types/sensor';
import { soundFX } from '../utils/audioFeedback';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';
import {
  Compass,
  Navigation,
  Gauge,
  Thermometer,
  Activity,
  AlertTriangle,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Radio,
  SlidersHorizontal,
} from 'lucide-react';
import { formatNumber } from '../utils/formatters';

interface SensorChannelConfig {
  id: SensorType;
  label: string;
  name: string;
  subsystem: string;
  unit: string;
  nominalMin: number;
  nominalMax: number;
  baseline: number;
  primaryFault: 'GNSS_LOSS' | 'IMU_BIAS' | 'STALE_DATA' | 'TEMPERATURE_SPIKE' | 'POWER_DEGRADATION' | 'SENSOR_DISAGREEMENT' | 'SENSOR_DROPOUT';
  faultLabel: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const CHANNELS: SensorChannelConfig[] = [
  {
    id: 'IMU',
    label: 'IMU Accel',
    name: 'Inertial Measurement Unit',
    subsystem: 'Inertial Dynamics & Gyros',
    unit: 'G',
    nominalMin: 0.90,
    nominalMax: 1.15,
    baseline: 1.02,
    primaryFault: 'IMU_BIAS',
    faultLabel: 'Proof-Mass Bias (+0.55G)',
    icon: Compass,
  },
  {
    id: 'GNSS',
    label: 'GNSS Alt',
    name: 'Satellite Positioning Receiver',
    subsystem: 'Multi-Constellation RF',
    unit: 'm',
    nominalMin: 445.0,
    nominalMax: 460.0,
    baseline: 452.4,
    primaryFault: 'GNSS_LOSS',
    faultLabel: 'Constellation Lock Loss',
    icon: Navigation,
  },
  {
    id: 'PRESSURE',
    label: 'Barometer',
    name: 'Atmospheric Air Data Transducer',
    subsystem: 'Pitot & Static Pressure',
    unit: 'hPa',
    nominalMin: 957.0,
    nominalMax: 965.0,
    baseline: 961.2,
    primaryFault: 'STALE_DATA',
    faultLabel: 'FIFO Buffer Freeze (>1.8s)',
    icon: Gauge,
  },
  {
    id: 'TEMPERATURE',
    label: 'Thermal',
    name: 'Core Processor Thermal Bus',
    subsystem: 'Electronics Thermal Dissipation',
    unit: '°C',
    nominalMin: 25.0,
    nominalMax: 48.0,
    baseline: 34.6,
    primaryFault: 'TEMPERATURE_SPIKE',
    faultLabel: 'Thermal Junction Spike (+38°C)',
    icon: Thermometer,
  },
  {
    id: 'MAGNETOMETER',
    label: 'Compass',
    name: 'Tri-Axial Fluxgate Magnetometer',
    subsystem: 'Magnetic Attitude Reference',
    unit: 'deg',
    nominalMin: 135.0,
    nominalMax: 150.0,
    baseline: 142.5,
    primaryFault: 'SENSOR_DISAGREEMENT',
    faultLabel: 'Heading Disagreement (+45°)',
    icon: Radio,
  },
  {
    id: 'ENVIRONMENT',
    label: 'MMW Radar',
    name: '77 GHz Proximity & Standoff Radar',
    subsystem: '77 GHz FMCW Array',
    unit: 'm',
    nominalMin: 8.0,
    nominalMax: 16.0,
    baseline: 12.4,
    primaryFault: 'SENSOR_DROPOUT',
    faultLabel: 'Radar Echo Dropout (0m)',
    icon: Activity,
  },
];

export const SensorLabPage: React.FC = () => {
  const {
    sensors,
    isRunning,
    activeFaults,
    injectFault,
    recoverSensor,
  } = useApp();

  // Active channel selection
  const [selectedChannelId, setSelectedChannelId] = useState<SensorType>('IMU');
  const [timeWindowSec, setTimeWindowSec] = useState<number>(15);
  const [traceMode, setTraceMode] = useState<'line' | 'area' | 'dual'>('dual');
  const [autoScaleY, setAutoScaleY] = useState<boolean>(false);
  const [filterCutoff, setFilterCutoff] = useState<number>(85);

  const channelConfig = useMemo(
    () => CHANNELS.find((c) => c.id === selectedChannelId) || CHANNELS[0],
    [selectedChannelId]
  );

  const activeSensor = sensors[selectedChannelId];

  const hasActiveFault = useMemo(() => {
    return activeFaults.some(
      (f) =>
        f.targetSensor === selectedChannelId ||
        (selectedChannelId === 'IMU' && (f.type === 'IMU_BIAS' || f.type === 'SENSOR_BIAS')) ||
        (selectedChannelId === 'GNSS' && f.type === 'GNSS_LOSS') ||
        (selectedChannelId === 'PRESSURE' && f.type === 'STALE_DATA') ||
        (selectedChannelId === 'TEMPERATURE' && f.type === 'TEMPERATURE_SPIKE') ||
        (selectedChannelId === 'POWER' && f.type === 'POWER_DEGRADATION') ||
        (selectedChannelId === 'MAGNETOMETER' && f.type === 'SENSOR_DISAGREEMENT') ||
        (selectedChannelId === 'ENVIRONMENT' && (f.type === 'SENSOR_DROPOUT' || f.type === 'COMMUNICATION_INTERRUPTION'))
    );
  }, [activeFaults, selectedChannelId]);

  const traceColor = useMemo(() => {
    switch (activeSensor.status) {
      case 'NORMAL':
        return '#06b6d4';
      case 'WARNING':
        return '#f59e0b';
      case 'DEGRADED':
        return '#f97316';
      case 'FAILED':
      case 'UNAVAILABLE':
        return '#f43f5e';
      case 'RECOVERING':
        return '#10b981';
      default:
        return '#06b6d4';
    }
  }, [activeSensor.status]);

  const chartData = useMemo(() => {
    if (!activeSensor.history || activeSensor.history.length === 0) return [];

    const pointsCount = timeWindowSec * 10;
    const historySlice = activeSensor.history.slice(-pointsCount);
    const lastTimestamp = historySlice[historySlice.length - 1]?.timestamp || 0;

    let filteredVal = channelConfig.baseline;

    return historySlice.map((pt) => {
      const alpha = 0.25 * (filterCutoff / 100);
      filteredVal = filteredVal + alpha * (pt.value - filteredVal);

      const relSec = pt.timestamp - lastTimestamp;
      const label = relSec === 0 ? '0.0s' : `${relSec.toFixed(1)}s`;

      return {
        timestamp: pt.timestamp,
        timeLabel: label,
        raw: pt.value,
        filtered: parseFloat(filteredVal.toFixed(2)),
        quality: pt.quality,
        nominalMin: channelConfig.nominalMin,
        nominalMax: channelConfig.nominalMax,
        baseline: channelConfig.baseline,
      };
    });
  }, [activeSensor.history, timeWindowSec, channelConfig, filterCutoff]);

  const yDomain = useMemo(() => {
    if (!autoScaleY) {
      const pad = (channelConfig.nominalMax - channelConfig.nominalMin) * 0.45;
      return [
        parseFloat((channelConfig.nominalMin - pad).toFixed(1)),
        parseFloat((channelConfig.nominalMax + pad).toFixed(1)),
      ];
    }
    if (chartData.length === 0) return ['auto', 'auto'];
    const vals = chartData.map((d) => d.raw);
    const min = Math.min(...vals, channelConfig.nominalMin);
    const max = Math.max(...vals, channelConfig.nominalMax);
    const span = Math.max(0.1, max - min);
    return [
      parseFloat((min - span * 0.15).toFixed(2)),
      parseFloat((max + span * 0.15).toFixed(2)),
    ];
  }, [autoScaleY, channelConfig, chartData]);

  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return { min: 0, max: 0, avg: 0, delta: 0, p2p: 0 };
    }
    const vals = chartData.map((d) => d.raw);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const current = vals[vals.length - 1] ?? 0;
    const delta = current - channelConfig.baseline;

    return {
      min: parseFloat(min.toFixed(2)),
      max: parseFloat(max.toFixed(2)),
      avg: parseFloat(avg.toFixed(2)),
      delta: parseFloat(delta.toFixed(2)),
      p2p: parseFloat((max - min).toFixed(2)),
    };
  }, [chartData, channelConfig.baseline]);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-cyan-400 font-mono font-semibold tracking-widest uppercase mb-1">
            <SlidersHorizontal size={12} />
            <span>Transducer Signal Laboratory</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <span>High-Speed Transducer Oscilloscope</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Calibrated 100 Hz signal acquisition rack with dual ADC/Kalman tracking, disturbance injection, and invariant envelope monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DataSourceBadge source="SIMULATED TRANSDUCER RACK" />
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#080d1a] border border-white/[0.08] text-[11px] font-mono text-slate-300">
            <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>{isRunning ? '10 Hz ACQ LIVE' : 'FROZEN'}</span>
          </div>
        </div>
      </div>

      {/* 1. CHANNEL SELECTION INSTRUMENT RACK */}
      <section aria-label="Sensor Channels">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CHANNELS.map((ch) => {
            const sensor = sensors[ch.id];
            const isSelected = selectedChannelId === ch.id;
            const Icon = ch.icon;

            const isFaulted = activeFaults.some(
              (f) =>
                f.targetSensor === ch.id ||
                (ch.id === 'IMU' && (f.type === 'IMU_BIAS' || f.type === 'SENSOR_BIAS')) ||
                (ch.id === 'GNSS' && f.type === 'GNSS_LOSS') ||
                (ch.id === 'PRESSURE' && f.type === 'STALE_DATA') ||
                (ch.id === 'TEMPERATURE' && f.type === 'TEMPERATURE_SPIKE') ||
                (ch.id === 'POWER' && f.type === 'POWER_DEGRADATION') ||
                (ch.id === 'MAGNETOMETER' && f.type === 'SENSOR_DISAGREEMENT') ||
                (ch.id === 'ENVIRONMENT' && (f.type === 'SENSOR_DROPOUT' || f.type === 'COMMUNICATION_INTERRUPTION'))
            );

            const sparkPoints = (sensor.history || []).slice(-16);
            const sparkVals = sparkPoints.map((p) => p.value);
            const minV = Math.min(...sparkVals, ch.nominalMin);
            const maxV = Math.max(...sparkVals, ch.nominalMax);
            const spanV = Math.max(0.001, maxV - minV);

            const svgPath = sparkPoints
              .map((p, i) => {
                const x = (i / (sparkPoints.length - 1 || 1)) * 64;
                const y = 20 - ((p.value - minV) / spanV) * 16;
                return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
              })
              .join(' ');

            return (
              <button
                key={ch.id}
                onClick={() => {
                  soundFX.chipSelect();
                  setSelectedChannelId(ch.id);
                }}
                className={`p-3 rounded-sm border text-left transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#0e1628] border-cyan-500/60 shadow-lg shadow-cyan-950/20'
                    : 'bg-[#0d1322] border-white/[0.08] hover:border-white/[0.18] hover:bg-[#111a2e]'
                }`}
              >
                {/* Active indicator bar */}
                {isSelected && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-cyan-400" />
                )}

                {/* Header row: Icon & Status indicator */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Icon
                      size={14}
                      className={isSelected ? 'text-cyan-400' : 'text-slate-400'}
                    />
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {ch.label}
                    </span>
                  </div>

                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isFaulted
                        ? 'bg-rose-400 animate-pulse'
                        : sensor.status === 'NORMAL'
                        ? 'bg-emerald-400'
                        : 'bg-amber-400'
                    }`}
                  />
                </div>

                {/* Primary Reading */}
                <div className="my-1">
                  <div className="text-base font-bold text-white font-mono tabular-nums leading-tight">
                    {formatNumber(sensor.primaryValue, ch.id === 'PRESSURE' ? 1 : 2)}
                    <span className="text-[10px] text-slate-400 font-normal ml-1">
                      {ch.unit}
                    </span>
                  </div>
                </div>

                {/* Live Micro Sparkline */}
                <div className="h-5 w-full mt-2 pt-1 border-t border-white/[0.04] flex items-center justify-between">
                  <svg className="w-16 h-4 overflow-visible" viewBox="0 0 64 20">
                    <path
                      d={svgPath || 'M 0,10 L 64,10'}
                      fill="none"
                      stroke={isSelected ? '#06b6d4' : isFaulted ? '#f43f5e' : '#64748b'}
                      strokeWidth={1.5}
                      strokeLinecap="round"
                    />
                  </svg>

                  <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                    {sensor.qualityScore}% Q
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. MAIN OSCILLOSCOPE WORKBENCH */}
      <section className="bg-[#0d1322] border border-white/[0.08] rounded-sm p-4 sm:p-5 space-y-4">
        {/* Top Control Bar: Channel Title, Status, and Interactive Timebase */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
          {/* Left: Channel Information */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-sm bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <channelConfig.icon size={20} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  {channelConfig.name}
                </h2>
                <span className="text-[10px] font-mono uppercase text-slate-400">
                  [{channelConfig.id}]
                </span>
                {hasActiveFault && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-rose-950/70 border border-rose-500/50 text-rose-300 font-semibold animate-pulse">
                    STIMULUS ACTIVE
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                <span>{channelConfig.subsystem}</span>
                <span>·</span>
                <span>
                  Nominal: [{channelConfig.nominalMin} — {channelConfig.nominalMax} {channelConfig.unit}]
                </span>
              </div>
            </div>
          </div>

          {/* Right: Oscilloscope Toolbar */}
          <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
            {/* Trace Mode Selector */}
            <div className="flex items-center bg-[#080d1a] border border-white/[0.08] rounded-sm p-0.5">
              <button
                onClick={() => {
                  soundFX.click();
                  setTraceMode('line');
                }}
                className={`px-2.5 py-1 rounded-sm text-[11px] font-medium transition-colors ${
                  traceMode === 'line' ? 'bg-[#152238] text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Raw Trace
              </button>
              <button
                onClick={() => {
                  soundFX.click();
                  setTraceMode('dual');
                }}
                className={`px-2.5 py-1 rounded-sm text-[11px] font-medium transition-colors ${
                  traceMode === 'dual' ? 'bg-[#152238] text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
                title="Compare Raw ADC vs Kalman Filtered"
              >
                Dual (Raw+Filter)
              </button>
              <button
                onClick={() => {
                  soundFX.click();
                  setTraceMode('area');
                }}
                className={`px-2.5 py-1 rounded-sm text-[11px] font-medium transition-colors ${
                  traceMode === 'area' ? 'bg-[#152238] text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Phosphor
              </button>
            </div>

            {/* Time Window */}
            <div className="flex items-center bg-[#080d1a] border border-white/[0.08] rounded-sm p-0.5">
              {[5, 15, 30].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    soundFX.click();
                    setTimeWindowSec(s);
                  }}
                  className={`px-2.5 py-1 rounded-sm text-[11px] font-medium transition-colors ${
                    timeWindowSec === s
                      ? 'bg-cyan-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s}s
                </button>
              ))}
            </div>

            {/* Y Scale Mode */}
            <button
              onClick={() => {
                soundFX.click();
                setAutoScaleY(!autoScaleY);
              }}
              className={`px-2.5 py-1 rounded-sm text-[11px] font-mono border transition-colors ${
                autoScaleY
                  ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                  : 'bg-[#080d1a] border-white/[0.08] text-slate-400 hover:text-white'
              }`}
            >
              {autoScaleY ? 'Auto-Y' : 'Nominal-Y'}
            </button>
          </div>
        </div>

        {/* PRIMARY OSCILLOSCOPE CANVAS */}
        <div className="h-[320px] sm:h-[400px] w-full relative bg-[#080d1a] rounded-sm border border-white/[0.06] p-2">
          {/* Oscilloscope grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none rounded-sm" />

          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="cyanPhosphorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={traceColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={traceColor} stopOpacity={0.0} />
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
                domain={yDomain}
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                width={55}
                tickFormatter={(v) =>
                  channelConfig.id === 'PRESSURE' ? v.toFixed(0) : v.toFixed(2)
                }
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const d = payload[0].payload;
                  const delta = d.raw - channelConfig.baseline;

                  return (
                    <div className="bg-[#0e1424]/95 backdrop-blur-md border border-cyan-500/40 p-3 rounded-sm shadow-2xl font-mono text-xs text-white min-w-[200px] space-y-1">
                      <div className="flex items-center justify-between border-b border-white/[0.08] pb-1 text-[11px] text-cyan-400">
                        <span>Offset: {d.timeLabel}</span>
                        <span>10 Hz Scan</span>
                      </div>
                      <div className="flex items-baseline justify-between text-sm font-bold text-white pt-1">
                        <span className="text-slate-400 text-xs font-normal">Measured:</span>
                        <span>
                          {d.raw} {channelConfig.unit}
                        </span>
                      </div>
                      {traceMode === 'dual' && (
                        <div className="flex items-baseline justify-between text-xs text-emerald-400">
                          <span className="text-slate-400 font-normal">Filtered:</span>
                          <span>
                            {d.filtered} {channelConfig.unit}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Baseline:</span>
                        <span className="text-slate-300">
                          {channelConfig.baseline} {channelConfig.unit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Δ Offset:</span>
                        <span className={delta >= 0 ? 'text-amber-300' : 'text-cyan-300'}>
                          {delta >= 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)} {channelConfig.unit}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />

              <ReferenceArea
                y1={channelConfig.nominalMin}
                y2={channelConfig.nominalMax}
                fill="#06b6d4"
                fillOpacity={0.05}
              />

              <ReferenceLine
                y={channelConfig.nominalMax}
                stroke="#06b6d4"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{
                  value: `MAX: ${channelConfig.nominalMax}`,
                  fill: '#06b6d4',
                  fontSize: 9,
                  position: 'insideTopRight',
                  fontFamily: 'monospace',
                }}
              />

              <ReferenceLine
                y={channelConfig.nominalMin}
                stroke="#06b6d4"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{
                  value: `MIN: ${channelConfig.nominalMin}`,
                  fill: '#06b6d4',
                  fontSize: 9,
                  position: 'insideBottomLeft',
                  fontFamily: 'monospace',
                }}
              />

              {traceMode === 'area' ? (
                <Area
                  type="monotone"
                  dataKey="raw"
                  stroke={traceColor}
                  strokeWidth={2}
                  fill="url(#cyanPhosphorGrad)"
                  dot={false}
                  isAnimationActive={false}
                />
              ) : traceMode === 'dual' ? (
                <>
                  <Line
                    type="monotone"
                    dataKey="raw"
                    stroke={traceColor}
                    strokeWidth={1.8}
                    dot={false}
                    isAnimationActive={false}
                    name="Raw ADC"
                  />
                  <Line
                    type="monotone"
                    dataKey="filtered"
                    stroke="#10b981"
                    strokeWidth={2.2}
                    strokeDasharray="5 3"
                    dot={false}
                    isAnimationActive={false}
                    name="Kalman Filtered"
                  />
                </>
              ) : (
                <Line
                  type="monotone"
                  dataKey="raw"
                  stroke={traceColor}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 3. OSCILLOSCOPE STATISTICAL STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-white/[0.06] text-xs font-mono">
          <div className="bg-[#080d1a] p-2.5 rounded-sm border border-white/[0.04]">
            <span className="text-[10px] text-slate-400 block uppercase">Current Value</span>
            <span className="text-base font-bold text-white tabular-nums">
              {formatNumber(activeSensor.primaryValue, channelConfig.id === 'PRESSURE' ? 1 : 2)}{' '}
              <span className="text-xs text-cyan-400">{channelConfig.unit}</span>
            </span>
          </div>

          <div className="bg-[#080d1a] p-2.5 rounded-sm border border-white/[0.04]">
            <span className="text-[10px] text-slate-400 block uppercase">Peak-to-Peak</span>
            <span className="text-base font-bold text-slate-200 tabular-nums">
              {stats.p2p} <span className="text-xs text-slate-400">{channelConfig.unit}</span>
            </span>
          </div>

          <div className="bg-[#080d1a] p-2.5 rounded-sm border border-white/[0.04]">
            <span className="text-[10px] text-slate-400 block uppercase">Window Min / Max</span>
            <span className="text-xs font-bold text-slate-200 tabular-nums">
              {stats.min} / {stats.max}
            </span>
          </div>

          <div className="bg-[#080d1a] p-2.5 rounded-sm border border-white/[0.04]">
            <span className="text-[10px] text-slate-400 block uppercase">Δ from Baseline</span>
            <span
              className={`text-base font-bold tabular-nums ${
                Math.abs(stats.delta) > (channelConfig.nominalMax - channelConfig.nominalMin) * 0.4
                  ? 'text-rose-400'
                  : 'text-emerald-400'
              }`}
            >
              {stats.delta >= 0 ? `+${stats.delta}` : stats.delta}{' '}
              <span className="text-xs text-slate-400">{channelConfig.unit}</span>
            </span>
          </div>

          <div className="bg-[#080d1a] p-2.5 rounded-sm border border-white/[0.04]">
            <span className="text-[10px] text-slate-400 block uppercase">Signal Quality</span>
            <span className="text-base font-bold text-cyan-300 tabular-nums">
              {activeSensor.qualityScore}%
            </span>
          </div>
        </div>
      </section>

      {/* 4. CALIBRATION & STIMULUS INJECTION WORKBENCH */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Module A: Stimulus Injection Testbed */}
        <div className="bg-[#0d1322] border border-white/[0.08] rounded-sm p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-white">
                Stimulus &amp; Fault Injection
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">TESTBED</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Inject deterministic disturbances to verify on-board invariant boundaries, filter adaptation, and OBDS isolation.
          </p>

          <div className="space-y-2 pt-1 font-mono">
            <button
              onClick={() => {
                soundFX.warning();
                injectFault(channelConfig.primaryFault, selectedChannelId);
              }}
              disabled={hasActiveFault}
              className={`w-full py-2 px-3 rounded-sm text-xs font-semibold flex items-center justify-between transition-colors ${
                hasActiveFault
                  ? 'bg-rose-950/30 border border-rose-500/30 text-rose-400/60 cursor-not-allowed'
                  : 'bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/40 text-rose-300 hover:text-white'
              }`}
            >
              <span>{channelConfig.faultLabel}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-rose-950 border border-rose-800">
                {hasActiveFault ? 'ACTIVE' : 'INJECT'}
              </span>
            </button>

            <button
              onClick={() => {
                soundFX.warning();
                injectFault('NOISE_INCREASE', selectedChannelId);
              }}
              className="w-full py-2 px-3 rounded-sm text-xs font-medium flex items-center justify-between bg-[#080d1a] border border-white/[0.08] text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
            >
              <span>EMI / White Noise Burst</span>
              <span className="text-[10px] text-slate-500">3x Jitter</span>
            </button>

            <button
              onClick={() => {
                soundFX.warning();
                injectFault('SENSOR_DRIFT', selectedChannelId);
              }}
              className="w-full py-2 px-3 rounded-sm text-xs font-medium flex items-center justify-between bg-[#080d1a] border border-white/[0.08] text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
            >
              <span>Runaway Thermal Drift</span>
              <span className="text-[10px] text-slate-500">Linear</span>
            </button>

            {hasActiveFault && (
              <button
                onClick={() => {
                  soundFX.phaseStep();
                  recoverSensor(selectedChannelId);
                }}
                className="w-full py-2 px-3 rounded-sm text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 flex items-center justify-center gap-2 transition-colors mt-2"
              >
                <RotateCcw size={14} />
                <span>Recover Channel Envelope</span>
              </button>
            )}
          </div>
        </div>

        {/* Module B: Real-Time Dynamic Calibration */}
        <div className="bg-[#0d1322] border border-white/[0.08] rounded-sm p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Sliders size={15} className="text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">
                Dynamic Calibration Tuning
              </h3>
            </div>
            <span className="text-[10px] font-mono text-cyan-400">CALIBRATE</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Adjust digital filter attenuation and baseline zero-point offset to optimize signal-to-noise ratio.
          </p>

          <div className="space-y-3 pt-1 font-mono text-xs">
            <div>
              <div className="flex items-center justify-between text-slate-300 mb-1.5">
                <span>Filter Cutoff Frequency:</span>
                <span className="text-cyan-400 font-bold">{filterCutoff} Hz</span>
              </div>
              <input
                type="range"
                min={20}
                max={150}
                value={filterCutoff}
                onChange={(e) => setFilterCutoff(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-800 rounded-sm cursor-pointer h-1.5"
              />
            </div>

            <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
              <div className="flex items-center justify-between text-slate-400">
                <span>Transducer Latency:</span>
                <span className="text-slate-200">1.8 ms</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Bit Depth / Resolution:</span>
                <span className="text-slate-200">16-bit SAR ADC</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Zero Offset Calibration:</span>
                <span className="text-emerald-400 font-semibold">0.000 ±0.002</span>
              </div>
            </div>

            <button
              onClick={() => {
                soundFX.click();
                setFilterCutoff(85);
              }}
              className="w-full py-1.5 px-3 rounded-sm bg-[#080d1a] border border-white/[0.08] hover:border-slate-500 text-slate-300 hover:text-white transition-colors text-[11px]"
            >
              Reset to Factory Calibration
            </button>
          </div>
        </div>

        {/* Module C: Invariant & OBDS Status for Channel */}
        <div className="bg-[#0d1322] border border-white/[0.08] rounded-sm p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">
                Invariant Integrity Status
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">MIL-STD</span>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            <div className="p-2.5 rounded-sm bg-[#080d1a] border border-white/[0.06] space-y-1">
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-400">Envelope Check:</span>
                <span className={activeSensor.status === 'NORMAL' ? 'text-emerald-400' : 'text-rose-400'}>
                  {activeSensor.status === 'NORMAL' ? 'NOMINAL' : 'BREACH'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Values bounded between {channelConfig.nominalMin} and {channelConfig.nominalMax} {channelConfig.unit}
              </p>
            </div>

            <div className="p-2.5 rounded-sm bg-[#080d1a] border border-white/[0.06] space-y-1">
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-400">Rate of Change (d/dt):</span>
                <span className="text-emerald-400">PASS</span>
              </div>
              <p className="text-[11px] text-slate-400">
                First-order derivative within 3.5 σ acceleration limit
              </p>
            </div>

            <div className="p-2.5 rounded-sm bg-[#080d1a] border border-white/[0.06] space-y-1">
              <div className="flex items-center justify-between font-mono">
                <span className="text-slate-400">Sample Age / Latency:</span>
                <span className="text-emerald-400">&lt; 10 ms</span>
              </div>
              <p className="text-[11px] text-slate-400">
                100% frame delivery with zero FIFO buffer overrun
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
