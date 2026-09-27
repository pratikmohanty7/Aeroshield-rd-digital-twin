import React from 'react';
import { useApp } from '../context/AppContext';
import { Missile3DOperatorConsole } from '../components/missile/Missile3DOperatorConsole';
import { soundFX } from '../utils/audioFeedback';
import {
  Crosshair,
  Shield,
  Layers,
  Map as MapIcon,
  Cpu,
  Radio,
  Activity,
  ArrowRight,
  CheckSquare,
  Box,
} from 'lucide-react';

export const MissileArchitecturePage: React.FC = () => {
  const { setActivePage } = useApp();
  return (
    <div className="space-y-6 font-sans max-w-[1520px] mx-auto">
      {/* Top Header & Engineering Metadata */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono font-semibold tracking-wider uppercase mb-1">
            <Box size={14} />
            <span>R&amp;D TEST SESSION · 3D DIGITAL TWIN &amp; ENGINEERING CONSOLE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>Precision Munitions Digital Twin Console</span>
            <span className="text-xs text-cyan-400 font-mono font-normal">
              / 3D CAD ENGINE ONLINE
            </span>
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-2 flex-wrap">
            <span>Calibre: 155 mm NATO</span>
            <span className="text-slate-600">·</span>
            <span>Length: 980 mm</span>
            <span className="text-slate-600">·</span>
            <span>Mass: 47.5 kg</span>
            <span className="text-slate-600">·</span>
            <span className="text-cyan-400 font-semibold">Bus: 200 Hz Deterministic</span>
            <span className="text-slate-600">·</span>
            <span className="text-emerald-400 font-semibold">&lt; 0.15 m Dynamic Sensor Resolution</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-300">MIL-STD-810H / 1316F Compliant</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5 text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>200 HZ HARDWARE-IN-THE-LOOP BUS</span>
          </span>
        </div>
      </div>

      {/* Unified 3D Digital Twin Operator Console (Centerpiece with flight workflow, dials, histograms & diagnostics) */}
      <Missile3DOperatorConsole />

      {/* Aerospace Engineering Safeguards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
        <div className="p-4 rounded-2xl bg-[#090e1a] border border-white/[0.08] space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-bold font-mono">
            <Shield size={16} />
            <span>20,000g Setback Survival</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            All silicon packages potted in high-modulus syntactic foam with gold-bonded hermetic encapsulation, compliant with MIL-STD-810H Method 516.8 gun launch setback shock.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#090e1a] border border-white/[0.08] space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold font-mono">
            <Shield size={16} />
            <span>Thermal Battery Rapid Activation</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Fast-pyrotechnic squib reaches 28.4V stabilized rail output within 400 milliseconds of setback trigger, delivering 85W sustained avionics power with 320W peak surge.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#090e1a] border border-white/[0.08] space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono">
            <Shield size={16} />
            <span>Dual-Band Anti-Jam Resilience</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Adaptive null-steering CRPA antenna suppresses high-power RF interference by up to 55 dB, maintaining sub-meter navigation accuracy during simulated GPS outages.
          </p>
        </div>
      </section>

      {/* Interconnected System Hub: Direct links to related active modules */}
      <section className="p-5 rounded-2xl bg-[#080d1a] border border-cyan-500/20 shadow-xl space-y-3 font-sans">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Layers className="text-cyan-400" size={16} />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Interconnected Engineering Modules · Cross-System Navigation
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Synchronized 200Hz Hardware Bus</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div
            onClick={() => {
              soundFX.chipSelect();
              setActivePage('validation');
            }}
            className="p-3.5 rounded-xl bg-[#0c1222] border border-cyan-500/40 hover:border-cyan-400 cursor-pointer group transition-all"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                <CheckSquare size={14} className="text-cyan-400" />
                <span>Verification Suite</span>
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
              setActivePage('map');
            }}
            className="p-3.5 rounded-xl bg-[#0c1222] border border-white/[0.06] hover:border-cyan-400/50 cursor-pointer group transition-all"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                <MapIcon size={14} className="text-blue-400" />
                <span>Geospatial Radar</span>
              </span>
              <ArrowRight size={12} className="text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-[11px] text-slate-400">
              Live orbital satellite passes, RainViewer radar &amp; ballistic range calculation.
            </p>
          </div>

          <div
            onClick={() => {
              soundFX.chipSelect();
              setActivePage('sensors');
            }}
            className="p-3.5 rounded-xl bg-[#0c1222] border border-white/[0.06] hover:border-emerald-400/50 cursor-pointer group transition-all"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                <Cpu size={14} className="text-emerald-400" />
                <span>Transducer Lab</span>
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
            className="p-3.5 rounded-xl bg-[#0c1222] border border-white/[0.06] hover:border-purple-400/50 cursor-pointer group transition-all"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-200 group-hover:text-purple-300 transition-colors flex items-center gap-1.5">
                <Radio size={14} className="text-purple-400" />
                <span>Telemetry Bus</span>
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
            className="p-3.5 rounded-xl bg-[#0c1222] border border-white/[0.06] hover:border-amber-400/50 cursor-pointer group transition-all"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                <Activity size={14} className="text-amber-400" />
                <span>OBDS Diagnostics</span>
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
  );
};
