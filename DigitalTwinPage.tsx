import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SubsystemId } from '../types/digitalTwin';
import { StatusBadge } from '../components/common/StatusBadge';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { Missile3DOperatorConsole } from '../components/missile/Missile3DOperatorConsole';
import { soundFX } from '../utils/audioFeedback';
import {
  Binary,
  Layers,
  Cpu,
  ShieldCheck,
  Radio,
  Zap,
  Activity,
  Compass,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  Box,
  Crosshair,
  Shield,
  CheckSquare,
} from 'lucide-react';
import { formatNumber, formatPercent } from '../utils/formatters';

interface DigitalTwinPageProps {
  initialView?: '3d' | 'subsystems';
}

export const DigitalTwinPage: React.FC<DigitalTwinPageProps> = ({ initialView = '3d' }) => {
  const {
    digitalTwin,
    selectedSubsystem,
    setSelectedSubsystem,
    timeSeconds,
    injectFault,
    recoverAllFaults,
    activeFaults,
    setActivePage,
  } = useApp();

  const [activeView, setActiveView] = useState<'3d' | 'subsystems'>(initialView);

  const activeSubsystemData = selectedSubsystem ? digitalTwin.subsystems[selectedSubsystem] : null;

  const subsystemList: { id: SubsystemId; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { id: 'ACQUISITION', icon: Cpu },
    { id: 'VALIDATION_UNIT', icon: ShieldCheck },
    { id: 'STATE_ESTIMATOR', icon: Compass },
    { id: 'OBDS_DIAGNOSTICS', icon: AlertTriangle },
    { id: 'TELEMETRY_LINK', icon: Radio },
    { id: 'POWER_BUS', icon: Zap },
    { id: 'ENVIRONMENTAL_SHIELD', icon: Layers },
  ];

  return (
    <div className="space-y-6 font-sans max-w-[1640px] mx-auto">
      {/* Top Header & View Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono font-semibold tracking-wider uppercase mb-1">
            <Box size={14} />
            <span>Digital Twin &amp; System State Replication</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>Digital Twin Representation</span>
            <span className="text-xs text-cyan-400 font-mono font-normal">
              · {activeView === '3d' ? '3D CAD Spatial Model' : 'State Estimation & Subsystems'}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-4xl">
            Virtual system state representation — physical geometry, actuator deflection, avionics bus subsystems, and Extended Kalman Filter estimation.
          </p>
        </div>

        {/* View Switcher Segmented Control */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-[#050811] border border-white/[0.08] rounded-xl p-1 text-xs shadow-xs">
            <button
              onClick={() => {
                soundFX.click();
                setActiveView('3d');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeView === '3d'
                  ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <Crosshair size={13} />
              <span>3D CAD Model</span>
            </button>
            <button
              onClick={() => {
                soundFX.click();
                setActiveView('subsystems');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeView === 'subsystems'
                  ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <Binary size={13} />
              <span>Subsystems &amp; EKF</span>
            </button>
          </div>

          <DataSourceBadge source="200 Hz REFERENCE HARDWARE BUS" />
        </div>
      </div>

      {/* VIEW 1: 3D CAD Spatial Model & Flight Dynamics */}
      {activeView === '3d' && (
        <div className="space-y-6">
          {/* Engineering Specifications Bar */}
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono flex-wrap bg-[#0a0f1d] border border-white/[0.06] rounded-xl p-3">
            <span className="text-cyan-400 font-semibold">Calibre: 155 mm NATO</span>
            <span className="text-slate-600">·</span>
            <span>Length: 980 mm</span>
            <span className="text-slate-600">·</span>
            <span>Mass: 47.5 kg</span>
            <span className="text-slate-600">·</span>
            <span className="text-cyan-300 font-semibold">Bus: 200 Hz Deterministic</span>
            <span className="text-slate-600">·</span>
            <span className="text-emerald-400 font-semibold">&lt; 0.15 m Dynamic Sensor Resolution</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-300">MIL-STD-810H / 1316F Compliant</span>
          </div>

          {/* Unified 3D Digital Twin Operator Console */}
          <Missile3DOperatorConsole />

          {/* Aerospace Physical Engineering Safeguards */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#0d1322] border border-white/[0.08] space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold font-mono uppercase tracking-wider text-[11px]">
                <Shield size={14} />
                <span>20,000g Setback Survival</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                All silicon packages potted in high-modulus syntactic foam with gold-bonded hermetic encapsulation, compliant with MIL-STD-810H Method 516.8 gun launch setback shock.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0d1322] border border-white/[0.08] space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold font-mono uppercase tracking-wider text-[11px]">
                <Shield size={14} />
                <span>Thermal Battery Rapid Activation</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Fast-pyrotechnic squib reaches 28.4V stabilized rail output within 400 milliseconds of setback trigger, delivering 85W sustained avionics power with 320W peak surge.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0d1322] border border-white/[0.08] space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono uppercase tracking-wider text-[11px]">
                <Shield size={14} />
                <span>Dual-Band Anti-Jam Resilience</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Adaptive null-steering CRPA antenna suppresses high-power RF interference by up to 55 dB, maintaining sub-meter navigation accuracy during simulated GPS outages.
              </p>
            </div>
          </section>

          {/* Interconnected System Hub: Direct links to related active modules */}
          <section className="p-5 rounded-xl bg-[#0d1322] border border-white/[0.08] space-y-3 font-sans">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Layers className="text-cyan-400" size={16} />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Interconnected Engineering Modules
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">One Connected R&amp;D Platform</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div
                onClick={() => {
                  soundFX.chipSelect();
                  setActivePage('validation');
                }}
                className="p-3.5 rounded-lg bg-[#070b14] border border-white/[0.06] hover:border-cyan-400 cursor-pointer group transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                    <CheckSquare size={14} className="text-cyan-400" />
                    <span>Validation</span>
                  </span>
                  <ArrowRight size={12} className="text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-[11px] text-slate-400">
                  7-of-7 automated layer-by-layer software safety proofs &amp; SHA-256 evidence.
                </p>
              </div>

              <div
                onClick={() => {
                  soundFX.chipSelect();
                  setActivePage('sensors');
                }}
                className="p-3.5 rounded-lg bg-[#070b14] border border-white/[0.06] hover:border-emerald-400/50 cursor-pointer group transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                    <Cpu size={14} className="text-emerald-400" />
                    <span>Sensor Lab</span>
                  </span>
                  <ArrowRight size={12} className="text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Fine-grain signal waveforms, noise density &amp; physical transduction bounds.
                </p>
              </div>

              <div
                onClick={() => {
                  soundFX.chipSelect();
                  setActivePage('telemetry');
                }}
                className="p-3.5 rounded-lg bg-[#070b14] border border-white/[0.06] hover:border-purple-400/50 cursor-pointer group transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-purple-300 transition-colors flex items-center gap-1.5">
                    <Radio size={14} className="text-purple-400" />
                    <span>Telemetry</span>
                  </span>
                  <ArrowRight size={12} className="text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Downlink packets, channel jitter, byte frames &amp; CRC-32 checksum checks.
                </p>
              </div>

              <div
                onClick={() => {
                  soundFX.chipSelect();
                  setActivePage('diagnostics');
                }}
                className="p-3.5 rounded-lg bg-[#070b14] border border-white/[0.06] hover:border-amber-400/50 cursor-pointer group transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                    <Activity size={14} className="text-amber-400" />
                    <span>Diagnostics</span>
                  </span>
                  <ArrowRight size={12} className="text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Built-In-Test isolation trees, fault containment &amp; safety interlocks.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* VIEW 2: State Estimation & Subsystems (EKF) */}
      {activeView === 'subsystems' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* LEFT PANEL (5 cols): Conceptual AeroShield System Model & Interactive Subsystems */}
            <div className="lg:col-span-5 bg-[#0d1322] border border-white/[0.08] rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2 font-mono">
                  <Layers size={15} className="text-cyan-400" />
                  Subsystem Structural Architecture
                </h2>
                <span className="text-[10px] text-slate-400 font-mono">Click a node to inspect</span>
              </div>

              {/* Interactive Subsystem Architecture Map */}
              <div className="space-y-2">
                {subsystemList.map(({ id, icon: IconComponent }) => {
                  const sub = digitalTwin.subsystems[id];
                  const isSelected = selectedSubsystem === id;

                  return (
                    <div
                      key={id}
                      onClick={() => setSelectedSubsystem(id)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200 shadow-xs'
                          : 'bg-[#070b14] hover:bg-slate-900 border-white/[0.06] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded ${
                            sub.status === 'NORMAL'
                              ? 'bg-slate-800 text-cyan-400'
                              : sub.status === 'WARNING'
                              ? 'bg-amber-950 text-amber-400'
                              : 'bg-rose-950 text-rose-400'
                          }`}
                        >
                          <IconComponent size={16} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-100">{sub.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                            <span>Health: {sub.health}%</span>
                            <span>•</span>
                            <span>Confidence: {sub.confidence}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusBadge status={sub.status} size="sm" />
                        <ArrowRight
                          size={14}
                          className={isSelected ? 'text-cyan-400' : 'text-slate-600'}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Physical Boundary Disclaimer Card */}
              <div className="p-3 rounded-lg bg-[#070b14] border border-white/[0.06] text-[11px] text-slate-400 space-y-1">
                <div className="text-cyan-300 font-bold flex items-center gap-1.5 font-mono text-[11px]">
                  <Info size={13} />
                  <span>State Estimation Invariant</span>
                </div>
                <p className="leading-snug">
                  Every state transformation traces directly to incoming deterministic sensor frames, validation checks, and health weighting. No unverified state overrides are permitted.
                </p>
              </div>
            </div>

            {/* RIGHT PANEL (7 cols): Current Subsystem Inspector & Overall Digital State */}
            <div className="lg:col-span-7 space-y-5">
              {/* Subsystem Deep Dive (Active Selection) */}
              {activeSubsystemData ? (
                <div className="bg-[#0d1322] border border-white/[0.08] rounded-xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
                    <div>
                      <div className="text-[10px] text-cyan-400 uppercase font-semibold font-mono">
                        Subsystem Inspector [{activeSubsystemData.id}]
                      </div>
                      <h3 className="text-base font-bold text-slate-100 mt-0.5">
                        {activeSubsystemData.name}
                      </h3>
                      <div className="text-xs text-slate-400 font-mono">Category: {activeSubsystemData.category}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={activeSubsystemData.status} size="md" />
                    </div>
                  </div>

                  {/* Health & Confidence Gauge */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#070b14] rounded-lg p-3.5 border border-white/[0.06] font-mono">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Subsystem Health</div>
                      <div className="text-2xl font-bold text-slate-100 mt-0.5 tabular-nums">
                        {activeSubsystemData.health}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Estimation Confidence</div>
                      <div className="text-2xl font-bold text-emerald-400 mt-0.5 tabular-nums">
                        {activeSubsystemData.confidence}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Implementation</div>
                      <div className="text-xs font-bold text-cyan-300 mt-2">
                        {activeSubsystemData.implementationStatus}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Last Cycle Update</div>
                      <div className="text-xs font-bold text-slate-300 mt-2 tabular-nums">
                        t = {timeSeconds.toFixed(1)} s
                      </div>
                    </div>
                  </div>

                  {/* Inputs & Outputs Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-[#070b14] border border-white/[0.06] space-y-1.5">
                      <span className="text-slate-400 uppercase font-semibold text-[10px] font-mono">
                        Subsystem Input Streams:
                      </span>
                      <ul className="space-y-1 text-slate-200 text-[11px] font-mono">
                        {activeSubsystemData.inputs.map((inp, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <span className="text-cyan-400">→</span>
                            <span>{inp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-lg bg-[#070b14] border border-white/[0.06] space-y-1.5">
                      <span className="text-slate-400 uppercase font-semibold text-[10px] font-mono">
                        Subsystem Output Vectors:
                      </span>
                      <ul className="space-y-1 text-slate-200 text-[11px] font-mono">
                        {activeSubsystemData.outputs.map((out, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <span className="text-emerald-400">←</span>
                            <span>{out}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Key Metrics Table */}
                  <div className="bg-[#070b14] rounded-lg p-3 border border-white/[0.06] space-y-2">
                    <span className="text-slate-400 uppercase font-semibold text-[10px] font-mono">
                      Real-time Operational Metrics:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono">
                      {Object.entries(activeSubsystemData.keyMetrics).map(([k, v]) => (
                        <div key={k} className="p-2 bg-slate-900 rounded border border-white/[0.04]">
                          <div className="text-[10px] text-slate-400 truncate">{k}</div>
                          <div className="text-xs font-bold text-slate-200 mt-0.5 tabular-nums">{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Last Event Banner */}
                  <div className="p-2.5 rounded-lg bg-[#070b14] border border-white/[0.06] text-xs flex items-center justify-between text-slate-300">
                    <span>
                      <strong className="text-slate-400 font-mono">Latest Subsystem Event:</strong>{' '}
                      {activeSubsystemData.lastEvent}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-white/[0.08] rounded-xl bg-[#0d1322]">
                  Select a subsystem on the left to inspect its real-time digital twin state.
                </div>
              )}

              {/* Current Overall Digital Twin State Summary */}
              <div className="bg-[#0d1322] border border-white/[0.08] rounded-xl p-4 font-mono space-y-3">
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <Binary size={15} className="text-cyan-400" />
                  Unified Digital Twin Snapshot
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-[#070b14] border border-white/[0.06]">
                    <div className="text-[10px] text-slate-400">System Mode</div>
                    <div className="font-bold text-cyan-300 mt-0.5">{digitalTwin.systemMode}</div>
                  </div>

                  <div className="p-2 rounded-lg bg-[#070b14] border border-white/[0.06]">
                    <div className="text-[10px] text-slate-400">Sensor Availability</div>
                    <div className="font-bold text-slate-100 mt-0.5 tabular-nums">{digitalTwin.sensorAvailability}%</div>
                  </div>

                  <div className="p-2 rounded-lg bg-[#070b14] border border-white/[0.06]">
                    <div className="text-[10px] text-slate-400">Data Quality</div>
                    <div className="font-bold text-emerald-400 mt-0.5 tabular-nums">{digitalTwin.dataQuality}%</div>
                  </div>

                  <div className="p-2 rounded-lg bg-[#070b14] border border-white/[0.06]">
                    <div className="text-[10px] text-slate-400">Health Index</div>
                    <div className="font-bold text-amber-300 mt-0.5 tabular-nums">{digitalTwin.systemHealthIndex}/100</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
