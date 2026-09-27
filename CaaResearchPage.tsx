import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { soundFX } from '../utils/audioFeedback';
import {
  Layers,
  Cpu,
  Zap,
  Activity,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Info,
  CheckCircle2,
  Box,
  RotateCcw,
} from 'lucide-react';

export const CaaResearchPage: React.FC = () => {
  const { setActivePage, sensors } = useApp();

  // Simulated Canard Fin Angle Test State
  const [finAngles, setFinAngles] = useState<[number, number, number, number]>([0.0, 0.0, 0.0, 0.0]);
  const [motorTempC, setMotorTempC] = useState<number>(38.4);
  const [stallDetected, setStallDetected] = useState<boolean>(false);

  const handleTestStep = (delta: number) => {
    soundFX.phaseStep();
    setFinAngles((prev) => [
      parseFloat((Math.max(-15, Math.min(15, prev[0] + delta))).toFixed(1)),
      parseFloat((Math.max(-15, Math.min(15, prev[1] - delta * 0.8))).toFixed(1)),
      parseFloat((Math.max(-15, Math.min(15, prev[2] + delta * 0.5))).toFixed(1)),
      parseFloat((Math.max(-15, Math.min(15, prev[3] - delta * 0.5))).toFixed(1)),
    ]);
  };

  const handleResetFins = () => {
    soundFX.click();
    setFinAngles([0.0, 0.0, 0.0, 0.0]);
    setStallDetected(false);
  };

  return (
    <div className="space-y-6 max-w-[1640px] mx-auto font-sans">
      {/* 1. HEADER */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1 font-semibold tracking-wider uppercase">
            <Layers size={15} />
            <span>13 · Canard Actuation Assembly (CAA) · Integration Architecture</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>Canard Actuation Assembly (CAA) Interface</span>
            <span className="text-xs font-mono text-cyan-400 font-normal">
              · Conceptual Architecture
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-4xl">
            Mechanical layout, electromechanical actuation interfaces, power consumption envelopes, and aerodynamic canard steering constraints.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <DataSourceBadge source="ELECTROMECHANICAL SPECIFICATION" />
        </div>
      </section>

      {/* 2. PERSISTENT SAFETY DISCLAIMER */}
      <div className="bg-[#0b101d] border border-cyan-500/30 rounded-xl p-4 text-xs space-y-1.5 text-slate-300">
        <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase font-mono tracking-wider">
          <ShieldCheck size={16} />
          <span>Mechanical Scope Disclosure</span>
        </div>
        <p className="text-slate-300 leading-relaxed font-sans text-xs">
          The CAA module presents mechanical form-factor dimensions, electrical bus interconnects, and motor drive protocols as an R&amp;D design concept. Physical aerodynamic fin deployment requires dedicated shock-isolated actuators and wind-tunnel calibration.
        </p>
      </div>

      {/* 3. FOUR CANARD FINS TEST & TELEMETRY RACK */}
      <div className="bg-[#0d1322] border border-white/[0.08] rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
          <div>
            <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider block">
              Actuator Telemetry &amp; Slew Response
            </span>
            <h2 className="text-base font-bold text-white mt-0.5">
              4-Axis Independent Aerodynamic Fin Steering Rack
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTestStep(1.5)}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-semibold transition-colors"
            >
              Step Trim (+1.5°)
            </button>
            <button
              onClick={() => handleTestStep(-1.5)}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-semibold transition-colors"
            >
              Step Trim (-1.5°)
            </button>
            <button
              onClick={handleResetFins}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/[0.08] text-slate-300 text-xs font-mono transition-colors"
            >
              <RotateCcw size={12} className="inline mr-1" />
              Center
            </button>
          </div>
        </div>

        {/* 4 Canard Fin Visual Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: 1, label: 'Fin 1 (Dorsal +Y)', angle: finAngles[0], motor: 'BLDC-M1', draw: '0.45 A' },
            { id: 2, label: 'Fin 2 (Starboard +X)', angle: finAngles[1], motor: 'BLDC-M2', draw: '0.38 A' },
            { id: 3, label: 'Fin 3 (Ventral -Y)', angle: finAngles[2], motor: 'BLDC-M3', draw: '0.42 A' },
            { id: 4, label: 'Fin 4 (Port -X)', angle: finAngles[3], motor: 'BLDC-M4', draw: '0.40 A' },
          ].map((fin) => (
            <div
              key={fin.id}
              className="p-4 rounded-xl bg-[#070b14] border border-white/[0.06] space-y-2 text-xs font-mono"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-semibold text-slate-200">{fin.label}</span>
                <span className="text-[10px] text-cyan-400 font-bold">{fin.motor}</span>
              </div>

              <div className="flex items-baseline justify-between py-1">
                <span className="text-slate-400">Deflection (δ):</span>
                <span className={`text-2xl font-bold font-mono tabular-nums ${
                  Math.abs(fin.angle) > 10 ? 'text-amber-400' : 'text-cyan-300'
                }`}>
                  {fin.angle > 0 ? `+${fin.angle}` : fin.angle}°
                </span>
              </div>

              {/* Graphical Deflection Gauge */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden relative">
                <div
                  className="bg-cyan-400 h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${Math.min(100, Math.max(5, ((fin.angle + 15) / 30) * 100))}%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/[0.04]">
                <span>Current: {fin.draw}</span>
                <span className="text-emerald-400">ENCODER LOCKED</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. PHYSICAL & ELECTRICAL SPECIFICATIONS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Specification 1: Mechanical & Thermal Packaging */}
        <div className="bg-[#0d1322] border border-white/[0.08] rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
            <Box size={16} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Mechanical Architecture &amp; Integration
            </h3>
          </div>
          <ul className="space-y-2 text-xs font-mono text-slate-300">
            <li className="flex justify-between p-2 rounded-lg bg-[#070b14] border border-white/[0.04]">
              <span className="text-slate-400">Outer Envelope:</span>
              <span className="text-white font-semibold">Ø 155 mm Standard NATO</span>
            </li>
            <li className="flex justify-between p-2 rounded-lg bg-[#070b14] border border-white/[0.04]">
              <span className="text-slate-400">Canard Span (Deployed):</span>
              <span className="text-white font-semibold">240 mm Tip-to-Tip</span>
            </li>
            <li className="flex justify-between p-2 rounded-lg bg-[#070b14] border border-white/[0.04]">
              <span className="text-slate-400">Stowed Configuration:</span>
              <span className="text-emerald-400 font-semibold">Conformal Folded Slots</span>
            </li>
            <li className="flex justify-between p-2 rounded-lg bg-[#070b14] border border-white/[0.04]">
              <span className="text-slate-400">Deployment Mechanism:</span>
              <span className="text-white font-semibold">Centrifugal Spring Unlatch</span>
            </li>
            <li className="flex justify-between p-2 rounded-lg bg-[#070b14] border border-white/[0.04]">
              <span className="text-slate-400">Gearbox Ratio:</span>
              <span className="text-white font-semibold">64:1 Harmonic Drive (Zero Backlash)</span>
            </li>
          </ul>
        </div>

        {/* Specification 2: Electrical & Power Interface */}
        <div className="bg-[#0d1322] border border-white/[0.08] rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
            <Zap size={16} className="text-amber-400" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Electrical Drive &amp; Control Interfaces
            </h3>
          </div>
          <ul className="space-y-2 text-xs font-mono text-slate-300">
            <li className="flex justify-between p-2 rounded-lg bg-[#070b14] border border-white/[0.04]">
              <span className="text-slate-400">Motor Bus Voltage:</span>
              <span className="text-white font-semibold">24.0 V - 28.0 V Regulated Rail</span>
            </li>
            <li className="flex justify-between p-2 rounded-lg bg-[#070b14] border border-white/[0.04]">
              <span className="text-slate-400">Peak Dynamic Power:</span>
              <span className="text-amber-300 font-semibold">18.5 W (4 Motors Slew)</span>
            </li>
            <li className="flex justify-between p-2 rounded-lg bg-[#070b14] border border-white/[0.04]">
              <span className="text-slate-400">Control Protocol:</span>
              <span className="text-cyan-300 font-semibold">Isolated CAN-FD (1 Mbps)</span>
            </li>
            <li className="flex justify-between p-2 rounded-lg bg-[#070b14] border border-white/[0.04]">
              <span className="text-slate-400">Position Feedback:</span>
              <span className="text-white font-semibold">14-Bit Magnetic Hall Rotary</span>
            </li>
            <li className="flex justify-between p-2 rounded-lg bg-[#070b14] border border-white/[0.04]">
              <span className="text-slate-400">Thermal Cutoff:</span>
              <span className="text-rose-400 font-semibold">85 °C Automatic Limiter</span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
};
