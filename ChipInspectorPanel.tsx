import React from 'react';
import { AvionicsChip } from '../../types/missileArchitecture';
import {
  Cpu,
  Zap,
  Shield,
  Clock,
  Radio,
  Terminal,
  Activity,
  X,
} from 'lucide-react';

interface ChipInspectorPanelProps {
  chip: AvionicsChip;
  onClose?: () => void;
}

export const ChipInspectorPanel: React.FC<ChipInspectorPanelProps> = ({ chip, onClose }) => {
  return (
    <div className="bg-[#0b0e18] border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl space-y-5 transition-all">
      {/* Component Title & Metadata Header */}
      <div className="flex items-start justify-between pb-4 border-b border-white/[0.06] gap-3">
        <div className="flex items-start gap-3.5">
          <div
            className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0"
            style={{
              backgroundColor: `${chip.color}14`,
              borderColor: `${chip.color}40`,
              color: chip.color,
            }}
          >
            <Cpu size={20} />
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base font-bold text-white tracking-tight font-sans">
                {chip.name}
              </h2>
              <span className="text-xs font-mono text-slate-400 font-semibold">
                ({chip.refDes})
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400 font-medium">
                {chip.section}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-3xl">
              {chip.description}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white p-1.5 rounded-lg bg-slate-900/60 border border-white/[0.06] transition-colors"
            title="Close dossier"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Primary Aerospace Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-[#0e1322] border border-white/[0.05]">
          <div className="text-[10px] text-slate-400 uppercase font-semibold font-mono flex items-center gap-1.5">
            <Clock size={12} className="text-blue-400" />
            Clock Frequency
          </div>
          <div className="text-xs font-bold text-slate-100 font-mono mt-1">
            {chip.clockFreq}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#0e1322] border border-white/[0.05]">
          <div className="text-[10px] text-slate-400 uppercase font-semibold font-mono flex items-center gap-1.5">
            <Zap size={12} className="text-amber-400" />
            Power / Voltage
          </div>
          <div className="text-xs font-bold text-slate-100 font-mono mt-1">
            {chip.powerDraw} · {chip.operatingVoltage}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#0e1322] border border-white/[0.05]">
          <div className="text-[10px] text-slate-400 uppercase font-semibold font-mono flex items-center gap-1.5">
            <Shield size={12} className="text-emerald-400" />
            Setback Shock
          </div>
          <div className="text-xs font-bold text-emerald-400 font-mono mt-1">
            {chip.shockRating.split(' ')[0]}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#0e1322] border border-white/[0.05]">
          <div className="text-[10px] text-slate-400 uppercase font-semibold font-mono flex items-center gap-1.5">
            <Cpu size={12} className="text-purple-400" />
            Package Type
          </div>
          <div className="text-xs font-bold text-purple-300 font-mono mt-1">
            {chip.packageType.split(' ')[0]}
          </div>
        </div>
      </div>

      {/* Dual Column Architecture & Live Pin Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
        {/* Left Column: Architecture & Interfaces */}
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-[#0e1322] border border-white/[0.05] space-y-2">
            <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider font-mono">
              Silicon Architecture
            </div>
            <div className="flex items-center justify-between text-xs py-1 border-b border-white/[0.04]">
              <span className="text-slate-400">Core Architecture:</span>
              <span className="text-slate-200 font-semibold font-mono">{chip.architecture}</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1 border-b border-white/[0.04]">
              <span className="text-slate-400">Potting / Encapsulation:</span>
              <span className="text-slate-200 font-semibold font-mono">Syntactic Foam Underfill</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-slate-400">Radiation Tolerance:</span>
              <span className="text-purple-300 font-mono">{chip.radTolerance.split(',')[0]}</span>
            </div>
          </div>

          {/* Hardware Bus Interfaces */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-slate-300 font-bold text-[11px] uppercase tracking-wider font-mono">
              <Radio size={13} className="text-blue-400" />
              <span>Bus &amp; Physical Interfaces</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {chip.interfaces.map((intf, idx) => (
                <div
                  key={idx}
                  className="px-3 py-2 rounded-lg bg-[#0e1322] border border-white/[0.05] text-slate-300 font-mono text-[11px] flex items-center justify-between"
                >
                  <span className="truncate">{intf}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 ml-2" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Pinout Signals */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 font-bold uppercase text-[11px] tracking-wider flex items-center gap-1.5">
              <Activity size={13} className="text-amber-400" />
              <span>Real-Time Pinout Telemetry</span>
            </span>
            <span className="text-[10px] text-slate-500">SAMPLING 200 MS/s</span>
          </div>

          <div className="space-y-1.5">
            {chip.livePinoutTelemetry.map((pin, idx) => (
              <div
                key={idx}
                className="px-3 py-2 rounded-lg bg-[#0e1322] border border-white/[0.05] flex items-center justify-between font-mono text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-blue-400 font-semibold">{pin.pin}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-300 text-[11px]">{pin.function}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-amber-300 text-[11px]">{pin.liveValue}</span>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      pin.status === 'ACTIVE'
                        ? 'bg-emerald-400'
                        : pin.status === 'PULSING'
                        ? 'bg-blue-400 animate-pulse'
                        : 'bg-slate-600'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
