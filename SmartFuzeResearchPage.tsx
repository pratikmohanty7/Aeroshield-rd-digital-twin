import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { soundFX } from '../utils/audioFeedback';
import {
  ShieldCheck,
  Zap,
  Clock,
  Activity,
  AlertTriangle,
  ArrowRight,
  Info,
  CheckCircle2,
  Lock,
  Radar,
  RotateCcw,
} from 'lucide-react';

export const SmartFuzeResearchPage: React.FC = () => {
  const { sensors, healthBreakdown, obdsState, smartFuze, setMasterArm, setHobPreset } = useApp();

  const [selectedMode, setSelectedMode] = useState<'PROXIMITY' | 'TIME_DELAY' | 'IMPACT'>('PROXIMITY');

  return (
    <div className="space-y-6 max-w-[1640px] mx-auto font-sans">
      {/* 1. HEADER */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1 font-semibold tracking-wider uppercase">
            <Lock size={15} />
            <span>14 · Smart Electronic Fuze System · Conceptual R&amp;D Model</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>Multi-Mode Smart Electronic Fuze Architecture</span>
            <span className="text-xs font-mono text-emerald-400 font-normal flex items-center gap-1">
              <Lock size={11} />
              · Safe State Locked (Non-Energetic)
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-4xl">
            Software state models, multi-sensor trigger criteria, Electronic Safe and Arm (ESAD) logic, and health preconditions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <DataSourceBadge source="CONCEPTUAL / SIMULATED R&amp;D MODEL" />
        </div>
      </section>

      {/* 2. STRICT SAFETY & NON-ENERGETIC SCOPE NOTICE */}
      <div className="bg-[#0b101d] border border-cyan-500/30 rounded-xl p-4 text-xs space-y-1.5 text-slate-300">
        <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase font-mono tracking-wider">
          <ShieldCheck size={16} />
          <span>Strict Non-Energetic Safety Boundary</span>
        </div>
        <p className="text-slate-300 leading-relaxed font-sans text-xs">
          This system is an academic software demonstration. <strong className="text-white">Under no circumstances</strong> are operational firing commands, high-voltage initiation capacitor charging, explosive squib activation, or weapon arming sequences implemented or exposed. All logic is presented purely as mathematical state machines and sensor precondition verifications.
        </p>
      </div>

      {/* 3. THREE DETONATION MODES SELECTOR */}
      <div className="bg-[#0d1322] border border-white/[0.08] rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
          <div>
            <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider block">
              Multi-Mode Precondition Logic
            </span>
            <h2 className="text-base font-bold text-white mt-0.5">
              Selectable Mission Trigger Gating Modes
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {(['PROXIMITY', 'TIME_DELAY', 'IMPACT'] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  soundFX.chipSelect();
                  setSelectedMode(m);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  selectedMode === m
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-white/[0.08]'
                }`}
              >
                {m.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Mode Detail Card */}
        <div className="p-4 rounded-xl bg-[#070b14] border border-white/[0.06] space-y-3">
          {selectedMode === 'PROXIMITY' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold font-mono text-xs uppercase">
                <Radar size={15} />
                <span>Mode 1: Proximity Height-of-Burst (HOB) Trigger</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Operates via 77 GHz Millimeter-Wave (MMW) radar altimeter sensor measuring true standoff ground distance. Trigger criteria gated at target height-of-burst (default: 5.0 - 15.0 m above ground level).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                <div className="p-2.5 rounded bg-slate-900 border border-white/[0.04]">
                  <span className="text-slate-400 text-[10px] block">Sensor Primary:</span>
                  <span className="text-white font-bold">77 GHz FMCW Radar</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-white/[0.04]">
                  <span className="text-slate-400 text-[10px] block">Current Standoff Range:</span>
                  <span className="text-cyan-300 font-bold">{Math.round(smartFuze.standoffRangeM)} m (Vc: {Math.round(smartFuze.closureVelocityMps)} m/s)</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-white/[0.04]">
                  <span className="text-slate-400 text-[10px] block">Precondition Status:</span>
                  <span className={`font-bold ${smartFuze.armState !== 'SAFE' ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                    {smartFuze.armState !== 'SAFE' ? `SYSTEM ${smartFuze.armState} (HOB: ${smartFuze.hobM}m)` : 'ARMING INHIBITED (SAFE)'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {selectedMode === 'TIME_DELAY' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold font-mono text-xs uppercase">
                <Clock size={15} />
                <span>Mode 2: Electronic Point-Detonating Time-Delay Trigger</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                High-precision quartz crystal chronometer initialized at muzzle exit (setback shock trigger). Fires delay counter programmed prior to launch via inductive setter coil.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                <div className="p-2.5 rounded bg-slate-900 border border-white/[0.04]">
                  <span className="text-slate-400 text-[10px] block">Timer Source:</span>
                  <span className="text-white font-bold">Dual Quartz Oscillators</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-white/[0.04]">
                  <span className="text-slate-400 text-[10px] block">Programmed Delay:</span>
                  <span className="text-amber-300 font-bold">68.4 s Nominal</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-white/[0.04]">
                  <span className="text-slate-400 text-[10px] block">Precision Tolerance:</span>
                  <span className="text-emerald-400 font-bold">± 2 ms Resolution</span>
                </div>
              </div>
            </div>
          )}

          {selectedMode === 'IMPACT' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold font-mono text-xs uppercase">
                <Activity size={15} />
                <span>Mode 3: Deceleration Shock Sensing Point-Impact Trigger</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Heavy deceleration threshold sensor coupled with piezoceramic nose ogive impact switch. Activates upon sudden negative acceleration excursion exceeding 50G.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                <div className="p-2.5 rounded bg-slate-900 border border-white/[0.04]">
                  <span className="text-slate-400 text-[10px] block">Transducer:</span>
                  <span className="text-white font-bold">High-G Piezoresistive Accel</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-white/[0.04]">
                  <span className="text-slate-400 text-[10px] block">Trigger Decel Threshold:</span>
                  <span className="text-rose-300 font-bold">&gt; 50.0 G Negative Peak</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-white/[0.04]">
                  <span className="text-slate-400 text-[10px] block">Backup Switch:</span>
                  <span className="text-emerald-400 font-bold">Mechanical Ogive Crush Tip</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. ESAD ELECTRONIC SAFE & ARM INTERLOCK MATRIX */}
      <div className="bg-[#0d1322] border border-white/[0.08] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Electronic Safe &amp; Arm Device (ESAD) Hardware Interlock Criteria
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">MIL-STD-1316F Compliance Model</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs font-mono">
          <div className="p-3.5 rounded-lg bg-[#070b14] border border-white/[0.06] space-y-1.5">
            <span className="text-slate-400 uppercase text-[10px] block">Interlock 1: Setback</span>
            <div className="text-white font-bold">Launch Acceleration</div>
            <p className="text-[11px] text-slate-400 font-sans">Requires sustained axial shock &gt; 10,000G for 8ms.</p>
            <span className="text-[10px] text-emerald-400 font-bold block pt-1">CRITERIA VERIFIED</span>
          </div>

          <div className="p-3.5 rounded-lg bg-[#070b14] border border-white/[0.06] space-y-1.5">
            <span className="text-slate-400 uppercase text-[10px] block">Interlock 2: Spin</span>
            <div className="text-white font-bold">Barrel Rifling Spin</div>
            <p className="text-[11px] text-slate-400 font-sans">Requires rotation rate &gt; 120 rev/sec (7,200 RPM).</p>
            <span className="text-[10px] text-emerald-400 font-bold block pt-1">CRITERIA VERIFIED</span>
          </div>

          <div className="p-3.5 rounded-lg bg-[#070b14] border border-white/[0.06] space-y-1.5">
            <span className="text-slate-400 uppercase text-[10px] block">Interlock 3: Safe Time</span>
            <div className="text-white font-bold">Muzzle Flight Delay</div>
            <p className="text-[11px] text-slate-400 font-sans">Enforces minimum safe separation time (2.0s post-launch).</p>
            <span className="text-[10px] text-emerald-400 font-bold block pt-1">CRITERIA VERIFIED</span>
          </div>

          <div className="p-3.5 rounded-lg bg-[#070b14] border border-white/[0.06] space-y-1.5">
            <span className="text-slate-400 uppercase text-[10px] block">Interlock 4: Energy</span>
            <div className="text-white font-bold">High-Voltage Discharge</div>
            <p className="text-[11px] text-slate-400 font-sans">Physical firing capacitor kept shorted until terminal phase.</p>
            <span className="text-[10px] text-rose-400 font-bold block pt-1">PERMANENTLY SAFE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
