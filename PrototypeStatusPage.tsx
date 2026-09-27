import React from 'react';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import {
  FileCheck,
  ShieldCheck,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Compass,
} from 'lucide-react';

export const PrototypeStatusPage: React.FC = () => {
  return (
    <div className="space-y-6 font-sans max-w-[1640px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono font-semibold tracking-wider uppercase mb-1">
            <FileCheck size={14} />
            <span>19 · Prototype Maturity &amp; Scope Disclosures</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Prototype Status &amp; Engineering Disclosures</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-4xl">
            Technical readiness level (TRL-4), implementation classifications (Implemented / Simulated / Proposed / Planned).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DataSourceBadge source="TECHNICAL READINESS REVIEW" />
        </div>
      </div>

      {/* Prominent Disclaimer Banner */}
      <div className="bg-[#0d1322] border border-cyan-500/30 rounded-xl p-4 sm:p-5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Prototype Scope Classification: Software-In-The-Loop (SIL) Digital Twin
            </h2>
          </div>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 font-bold">
            TRL-4 (LABORATORY VALIDATED)
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          AeroShield is an engineering software demonstration and research platform developed for the Smart India Hackathon. It exercises full-stack sensor acquisition logic, range-validation algorithms, multi-sensor Kalman-style fusion, and On-Board Diagnostic System (OBDS) monitoring over mathematically simulated reference data streams. It is <strong className="text-cyan-300">not</strong> connected to physical hardware in this environment.
        </p>
      </div>

      {/* 3-Column Categorization of Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-xs">
        {/* Col 1: Implemented */}
        <div className="bg-[#0d1322] border border-white/[0.08] rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06] text-emerald-400 font-mono font-bold">
            <CheckCircle2 size={16} />
            <span>Implemented Software Modules</span>
          </div>
          <p className="text-slate-400 font-sans">
            Fully implemented algorithms and reactive state machines operating deterministically:
          </p>
          <ul className="space-y-2 text-slate-200 font-mono text-[11px]">
            <li className="p-2 rounded-lg bg-[#070b14] border border-white/[0.04]">
              ✓ 200 Hz Sensor Streaming Engine &amp; Decimation
            </li>
            <li className="p-2 rounded-lg bg-[#070b14] border border-white/[0.04]">
              ✓ 5-Stage Range, Rate, Freshness &amp; Continuity Validation
            </li>
            <li className="p-2 rounded-lg bg-[#070b14] border border-white/[0.04]">
              ✓ 7 Executable Formal Safety Invariant Proofs (VT-01 to VT-07)
            </li>
            <li className="p-2 rounded-lg bg-[#070b14] border border-white/[0.04]">
              ✓ OBDS Built-In Test Fault Containment Engine
            </li>
            <li className="p-2 rounded-lg bg-[#070b14] border border-white/[0.04]">
              ✓ Real-Time Multi-Sensor Telemetry Downlink Bus
            </li>
          </ul>
        </div>

        {/* Col 2: Simulated */}
        <div className="bg-[#0d1322] border border-white/[0.08] rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06] text-cyan-400 font-mono font-bold">
            <Cpu size={16} />
            <span>Simulated Environmental Models</span>
          </div>
          <p className="text-slate-400 font-sans">
            Mathematical abstractions reflecting physical physics and aerodynamics:
          </p>
          <ul className="space-y-2 text-slate-200 font-mono text-[11px]">
            <li className="p-2 rounded-lg bg-[#070b14] border border-white/[0.04]">
              ~ Gun Launch Setback Shock Waveforms (20,000G)
            </li>
            <li className="p-2 rounded-lg bg-[#070b14] border border-white/[0.04]">
              ~ 155 mm High-G Ballistic Dispersion (CEP ≤ 30 m Target)
            </li>
            <li className="p-2 rounded-lg bg-[#070b14] border border-white/[0.04]">
              ~ GPS Jamming &amp; Dead-Reckoning Drift Simulation
            </li>
            <li className="p-2 rounded-lg bg-[#070b14] border border-white/[0.04]">
              ~ Canard Actuation Angle &amp; Motor Current Estimation
            </li>
            <li className="p-2 rounded-lg bg-[#070b14] border border-white/[0.04]">
              ~ Thermal Stagnation Friction Heat Diffusion (Mach 2.5)
            </li>
          </ul>
        </div>

        {/* Col 3: Proposed / Planned */}
        <div className="bg-[#0d1322] border border-white/[0.08] rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06] text-amber-400 font-mono font-bold">
            <AlertTriangle size={16} />
            <span>Proposed Hardware Future Work</span>
          </div>
          <p className="text-slate-400 font-sans">
            Physical items requiring defense manufacturing, shock tables, and firing ranges:
          </p>
          <ul className="space-y-2 text-slate-200 font-mono text-[11px]">
            <li className="p-2 rounded-lg bg-[#070b14] border border-white/[0.04]">
              ○ Drop-Tower 20,000G Packaging Qualification
            </li>
            <li className="p-2 rounded-lg bg-[#070b14] border border-white/[0.04]">
              ○ Wind-Tunnel Aerodynamic Canard Flutter Testing
            </li>
            <li className="p-2 rounded-lg bg-[#070b14] border border-white/[0.04]">
              ○ Pyrotechnic Thermal Battery Setback Activation Dyno
            </li>
            <li className="p-2 rounded-lg bg-[#070b14] border border-white/[0.04]">
              ○ MIL-STD-1316F Explosive Safe-and-Arm Barrier Testing
            </li>
            <li className="p-2 rounded-lg bg-[#070b14] border border-white/[0.04]">
              ○ Artillery Live-Fire Gun Tube Sabot Instrumented Test
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
