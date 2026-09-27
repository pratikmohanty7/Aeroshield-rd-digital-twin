import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { soundFX } from '../utils/audioFeedback';
import {
  Compass,
  Navigation,
  Activity,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  Layers,
  ArrowRight,
  Info,
  CheckCircle2,
  Clock,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

export const GncResearchPage: React.FC = () => {
  const { stateEstimation, timeSeconds, sensors } = useApp();

  // Illustrative R&D desired state vs simulated state error parameters
  const [targetAltitude, setTargetAltitude] = useState<number>(450.0);
  const [targetVelocity, setTargetVelocity] = useState<number>(18.0);
  const [targetHeading, setTargetHeading] = useState<number>(142.5);

  const altError = stateEstimation.positionEstimate.altitudeM - targetAltitude;
  const velError = stateEstimation.motionEstimate.velocityMps - targetVelocity;
  const headingError = stateEstimation.orientationEstimate.yawDeg - targetHeading;

  // Conceptual actuation command output (deflection in degrees)
  const canardPitchCmdDeg = parseFloat((-altError * 0.12).toFixed(2));
  const canardYawCmdDeg = parseFloat((-headingError * 0.15).toFixed(2));

  return (
    <div className="space-y-6 max-w-[1640px] mx-auto font-sans">
      {/* 1. HEADER */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1 font-semibold tracking-wider uppercase">
            <Compass size={15} />
            <span>12 · GNC Research · High-Level R&amp;D Architecture</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>Guidance, Navigation &amp; Control Methodology</span>
            <span className="text-xs font-mono text-cyan-400 font-normal">
              · TRL-4 Conceptual Model
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-4xl">
            High-level architecture decoupling state estimation (Navigation), trajectory corridor comparison (Guidance), and aerodynamic canard steering interfaces (Control).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <DataSourceBadge source="HIGH-LEVEL SIMULATED R&amp;D MODEL" />
        </div>
      </section>

      {/* 2. CRITICAL SAFETY NOTICE */}
      <div className="bg-[#0b101d] border border-cyan-500/30 rounded-xl p-4 text-xs space-y-1.5 text-slate-300">
        <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase font-mono tracking-wider">
          <ShieldCheck size={16} />
          <span>Non-Operational Research Boundary</span>
        </div>
        <p className="text-slate-300 leading-relaxed font-sans text-xs">
          This module defines only high-level conceptual interfaces, state representations, and academic software feedback models. It does <strong className="text-white">not</strong> implement or expose operational weapon targeting, ballistic firing tables, ordnance arming, or terminal engagement control laws.
        </p>
      </div>

      {/* 3. THREE PRIMARY PILLARS: GUIDANCE, NAVIGATION, CONTROL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PILLAR 1: NAVIGATION */}
        <div className="bg-[#0d1322] border border-white/[0.08] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div>
              <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">
                Pillar 01
              </span>
              <h2 className="text-base font-bold text-white">Navigation Subsystem</h2>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">
              SIMULATED
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Estimates current position, velocity vector, and spatial attitude by fusing asynchronous multi-sensor streams.
          </p>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-[#070b14] border border-white/[0.06] flex items-center justify-between">
              <span className="text-slate-400">Position Est:</span>
              <span className="text-white font-semibold">
                Z: {stateEstimation.positionEstimate.altitudeM.toFixed(1)} m
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#070b14] border border-white/[0.06] flex items-center justify-between">
              <span className="text-slate-400">Velocity Vector:</span>
              <span className="text-cyan-300 font-semibold">
                {stateEstimation.motionEstimate.velocityMps.toFixed(1)} m/s
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#070b14] border border-white/[0.06] flex items-center justify-between">
              <span className="text-slate-400">Heading (Yaw):</span>
              <span className="text-white font-semibold">
                {stateEstimation.orientationEstimate.yawDeg.toFixed(1)}°
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#070b14] border border-white/[0.06] flex items-center justify-between">
              <span className="text-slate-400">Confidence:</span>
              <span className="text-emerald-400 font-bold">
                {stateEstimation.confidence}%
              </span>
            </div>
          </div>
        </div>

        {/* PILLAR 2: GUIDANCE */}
        <div className="bg-[#0d1322] border border-white/[0.08] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div>
              <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">
                Pillar 02
              </span>
              <h2 className="text-base font-bold text-white">Guidance Subsystem</h2>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 font-semibold">
              CORRIDOR MODEL
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Compares observed state against reference ballistic corridor to compute error vectors for course correction.
          </p>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-[#070b14] border border-white/[0.06] flex items-center justify-between">
              <span className="text-slate-400">Target Altitude:</span>
              <span className="text-white font-semibold">{targetAltitude.toFixed(1)} m</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#070b14] border border-white/[0.06] flex items-center justify-between">
              <span className="text-slate-400">Altitude Error (Δz):</span>
              <span className={`font-semibold ${Math.abs(altError) > 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {altError > 0 ? `+${altError.toFixed(1)}` : altError.toFixed(1)} m
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#070b14] border border-white/[0.06] flex items-center justify-between">
              <span className="text-slate-400">Heading Error (Δψ):</span>
              <span className={`font-semibold ${Math.abs(headingError) > 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {headingError > 0 ? `+${headingError.toFixed(1)}` : headingError.toFixed(1)}°
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#070b14] border border-white/[0.06] flex items-center justify-between">
              <span className="text-slate-400">Correction Authority:</span>
              <span className="text-cyan-300 font-semibold">Bounded (±15° max)</span>
            </div>
          </div>
        </div>

        {/* PILLAR 3: CONTROL */}
        <div className="bg-[#0d1322] border border-white/[0.08] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div>
              <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">
                Pillar 03
              </span>
              <h2 className="text-base font-bold text-white">Control Subsystem</h2>
            </div>
            <span className="text-[10px] font-mono text-purple-400 font-semibold">
              CANARD STEERING
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Translates guidance demand into physical canard fin deflection commands sent over internal avionics bus.
          </p>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-[#070b14] border border-white/[0.06] flex items-center justify-between">
              <span className="text-slate-400">Pitch Command:</span>
              <span className="text-cyan-300 font-bold">δp = {canardPitchCmdDeg}°</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#070b14] border border-white/[0.06] flex items-center justify-between">
              <span className="text-slate-400">Yaw Command:</span>
              <span className="text-cyan-300 font-bold">δy = {canardYawCmdDeg}°</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#070b14] border border-white/[0.06] flex items-center justify-between">
              <span className="text-slate-400">Roll Stabilization:</span>
              <span className="text-emerald-400 font-semibold">De-Spun Bearings Locked</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#070b14] border border-white/[0.06] flex items-center justify-between">
              <span className="text-slate-400">Slew Rate Limit:</span>
              <span className="text-slate-300 font-semibold">45 deg/s max</span>
            </div>
          </div>
        </div>

      </div>

      {/* 4. CLOSED-LOOP SIMULATOR INTERFACE */}
      <section className="bg-[#0d1322] border border-white/[0.08] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Academic Parameter Tuning &amp; Sensitivity Analysis
            </h2>
          </div>
          <button
            onClick={() => {
              soundFX.click();
              setTargetAltitude(450.0);
              setTargetVelocity(18.0);
              setTargetHeading(142.5);
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/[0.08] text-slate-300 text-xs font-mono transition-colors"
          >
            <RotateCcw size={12} />
            <span>Reset Targets</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs font-mono">
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Target Altitude (m):</span>
              <span className="text-cyan-300 font-bold">{targetAltitude} m</span>
            </div>
            <input
              type="range"
              min="400"
              max="500"
              step="1"
              value={targetAltitude}
              onChange={(e) => setTargetAltitude(parseFloat(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Target Velocity (m/s):</span>
              <span className="text-cyan-300 font-bold">{targetVelocity} m/s</span>
            </div>
            <input
              type="range"
              min="10"
              max="30"
              step="0.5"
              value={targetVelocity}
              onChange={(e) => setTargetVelocity(parseFloat(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Target Heading (deg):</span>
              <span className="text-cyan-300 font-bold">{targetHeading}°</span>
            </div>
            <input
              type="range"
              min="120"
              max="160"
              step="0.5"
              value={targetHeading}
              onChange={(e) => setTargetHeading(parseFloat(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>
        </div>
      </section>
    </div>
  );
};
