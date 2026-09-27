import React from 'react';
import { AvionicsBusInfo, AvionicsChip } from '../../types/missileArchitecture';
import { MISSILE_CHIPS } from '../../data/missileChipsData';
import { Network, Activity, Cpu, ShieldCheck, Zap, X, Radio } from 'lucide-react';
import { soundFX } from '../../utils/audioFeedback';

interface BusInspectorCardProps {
  bus: AvionicsBusInfo;
  onClose: () => void;
  onSelectChip: (chip: AvionicsChip) => void;
}

export const BusInspectorCard: React.FC<BusInspectorCardProps> = ({
  bus,
  onClose,
  onSelectChip,
}) => {
  const masterChip = MISSILE_CHIPS.find((c) => c.refDes === bus.masterRefDes);
  const slaveChips = MISSILE_CHIPS.filter((c) => bus.slaveRefDes.includes(c.refDes));

  return (
    <div
      className="p-4 rounded-lg border font-mono shadow-2xl space-y-3 transition-all animate-fadeIn"
      style={{
        backgroundColor: '#050c1b',
        borderColor: `${bus.color}60`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-800 pb-2.5 gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded flex items-center justify-center font-bold text-xs shrink-0"
            style={{
              backgroundColor: `${bus.color}25`,
              color: bus.color,
              border: `1px solid ${bus.color}`,
            }}
          >
            <Network size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-slate-100 uppercase tracking-wide">
                {bus.name}
              </h3>
              <span
                className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase"
                style={{
                  backgroundColor: `${bus.color}20`,
                  color: bus.color,
                  border: `1px solid ${bus.color}60`,
                }}
              >
                {bus.maxThroughput}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{bus.description}</p>
          </div>
        </div>

        <button
          onClick={() => {
            soundFX.click();
            onClose();
          }}
          className="text-slate-500 hover:text-slate-200 text-xs px-2 py-1 rounded bg-slate-900 border border-slate-800 shrink-0"
        >
          ✕
        </button>
      </div>

      {/* Protocol & Physical Specs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2 rounded bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Standard</span>
          <div className="text-[11px] font-bold text-slate-200 truncate mt-0.5">{bus.protocol}</div>
        </div>
        <div className="p-2 rounded bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Max Rate</span>
          <div className="text-[11px] font-bold text-cyan-300 mt-0.5">{bus.maxThroughput}</div>
        </div>
        <div className="p-2 rounded bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Bus Topology</span>
          <div className="text-[11px] font-bold text-amber-300 mt-0.5">
            {bus.slaveRefDes.length > 0 ? `1 Master · ${bus.slaveRefDes.length} Slaves` : 'Direct Hardwire Line'}
          </div>
        </div>
        <div className="p-2 rounded bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Signal Integrity</span>
          <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            BER &lt; 10⁻¹²
          </div>
        </div>
      </div>

      {/* Connected Master & Slaves */}
      <div className="space-y-1.5">
        <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
          <span>Connected Avionics Nodes (Click to Inspect Chip)</span>
          <span className="text-[9px] text-slate-500">NETLIST CONNECTIONS</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {masterChip && (
            <button
              onClick={() => {
                soundFX.chipSelect();
                onSelectChip(masterChip);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-cyan-600 text-cyan-200 text-xs font-bold transition-all"
            >
              <span className="text-[9px] px-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-700">
                MASTER
              </span>
              <span>{masterChip.refDes}</span>
              <span className="text-[10px] text-slate-400 font-normal">({masterChip.shortName})</span>
            </button>
          )}

          {slaveChips.map((chip) => (
            <button
              key={chip.id}
              onClick={() => {
                soundFX.chipSelect();
                onSelectChip(chip);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs transition-all hover:border-slate-500"
            >
              <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
                SLAVE
              </span>
              <span className="font-bold">{chip.refDes}</span>
              <span className="text-[10px] text-slate-400">({chip.shortName})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Frame Structure & Hex Packet Telemetry */}
      <div className="p-2.5 rounded bg-black/60 border border-slate-800/80 text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
            <Activity size={11} className="text-cyan-400" />
            Live Frame Hex Capture
          </span>
          <span className="text-[10px] text-slate-500 font-mono">ENCRYPTED BUS STREAM</span>
        </div>
        <div className="text-[11px] text-emerald-400 font-mono tracking-wider bg-slate-950 px-2.5 py-1 rounded border border-slate-800/60">
          {bus.samplePacketHex}
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          <span className="text-slate-500">Frame Layout: </span>
          <strong className="text-slate-300">{bus.packetFormat}</strong>
        </div>
      </div>
    </div>
  );
};
