import React, { useState, useEffect } from 'react';
import { MissileWorkflowPhase, AvionicsChip } from '../../types/missileArchitecture';
import { MISSILE_WORKFLOW_PHASES, MISSILE_CHIPS } from '../../data/missileChipsData';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ShieldCheck,
  Radio,
  Gauge,
  Activity,
  AlertOctagon,
  Cpu,
} from 'lucide-react';
import { soundFX } from '../../utils/audioFeedback';

interface MissileWorkflowStepperProps {
  currentPhase: MissileWorkflowPhase;
  onSelectPhase: (phase: MissileWorkflowPhase) => void;
  onSelectChip: (chip: AvionicsChip) => void;
}

export const MissileWorkflowStepper: React.FC<MissileWorkflowStepperProps> = ({
  currentPhase,
  onSelectPhase,
  onSelectChip,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Auto-play timer through workflow phases
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const currentIndex = MISSILE_WORKFLOW_PHASES.findIndex((p) => p.id === currentPhase.id);
      const nextIndex = (currentIndex + 1) % MISSILE_WORKFLOW_PHASES.length;
      onSelectPhase(MISSILE_WORKFLOW_PHASES[nextIndex]);
    }, 4500);

    return () => clearInterval(interval);
  }, [isPlaying, currentPhase.id, onSelectPhase]);

  // Find active chips for current phase
  const activeChips = MISSILE_CHIPS.filter((c) => currentPhase.activeChipIds.includes(c.id));

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 font-mono shadow-2xl space-y-4">
      {/* Top Header & Simulation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
            <h2 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">
              Artillery Missile Operational Compute Workflow
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Step through the end-to-end flight profile to observe real-time chip activations, bus loads, and safety gates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundFX.click();
              setIsPlaying(!isPlaying);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all border ${
              isPlaying
                ? 'bg-amber-950 border-amber-600 text-amber-300'
                : 'bg-cyan-950 hover:bg-cyan-900 border-cyan-600 text-cyan-300'
            }`}
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
            <span>{isPlaying ? 'Pause Workflow' : 'Auto-Run Profile'}</span>
          </button>

          <button
            onClick={() => {
              soundFX.click();
              onSelectPhase(MISSILE_WORKFLOW_PHASES[0]);
            }}
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200"
            title="Reset to Phase 1 Pre-Launch"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Stepper Phase Navigation Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {MISSILE_WORKFLOW_PHASES.map((phase) => {
          const isSelected = phase.id === currentPhase.id;
          return (
            <button
              key={phase.id}
              onClick={() => {
                soundFX.phaseStep();
                onSelectPhase(phase);
              }}
              className={`text-left p-2.5 rounded-md border transition-all ${
                isSelected
                  ? 'bg-cyan-950 border-cyan-500 text-cyan-200 shadow-md ring-1 ring-cyan-500'
                  : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500">PHASE 0{phase.stepNumber}</span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>}
              </div>
              <div className="text-xs font-bold mt-1 truncate">{phase.title.split(' ')[0]} {phase.title.split(' ')[1]}</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">{phase.timeRange}</div>
            </button>
          );
        })}
      </div>

      {/* Current Phase Detail View */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 space-y-4">
        {/* Title & Flight Envelope */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-800 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-cyan-400">PHASE 0{currentPhase.stepNumber} OF 06</span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400 font-mono">{currentPhase.timeRange}</span>
            </div>
            <h3 className="text-base font-black text-slate-100 mt-0.5">{currentPhase.title}</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{currentPhase.summary}</p>
          </div>

          {/* Telemetry Gauges */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-center px-3 py-1.5 rounded bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Velocity</div>
              <div className="text-sm font-black text-cyan-400">Mach {currentPhase.mach}</div>
            </div>
            <div className="text-center px-3 py-1.5 rounded bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Altitude</div>
              <div className="text-sm font-black text-emerald-400">{currentPhase.altitudeM.toLocaleString()} m</div>
            </div>
            <div className="text-center px-3 py-1.5 rounded bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase">Acceleration</div>
              <div className="text-sm font-black text-amber-400">
                {currentPhase.gForce >= 1000 ? `${(currentPhase.gForce / 1000).toLocaleString()}k g` : `${currentPhase.gForce} g`}
              </div>
            </div>
          </div>
        </div>

        {/* Active Chips in this Phase */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-bold uppercase text-[11px] flex items-center gap-1.5">
              <Cpu size={14} className="text-cyan-400" />
              <span>Active Processing Chips in this Phase (Tap to Inspect)</span>
            </span>
            <span className="text-[10px] text-cyan-400 font-bold">
              {activeChips.length} INTEGRATED CIRCUITS ENGAGED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {activeChips.map((chip) => (
              <button
                key={chip.id}
                onClick={() => onSelectChip(chip)}
                className="text-left p-2.5 rounded bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-600 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: chip.color }}
                  ></span>
                  <div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300">
                      {chip.shortName}
                    </div>
                    <div className="text-[10px] text-slate-400">{chip.section}</div>
                  </div>
                </div>
                <ChevronRight size={13} className="text-slate-600 group-hover:text-cyan-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Bus Communication Activity & Downlink Packet */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Bus Activity */}
          <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-300 font-bold text-[11px] uppercase">
              <Radio size={13} className="text-purple-400" />
              <span>Avionics Data Bus Communication Load</span>
            </div>
            <div className="space-y-1.5">
              {currentPhase.busActivity.map((bus, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{bus.bus}:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-200 font-mono">{bus.bandwidth}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${
                        bus.state === 'HIGH'
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : bus.state === 'NOMINAL'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}
                    >
                      {bus.state}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Telemetry Packet & Failsafe */}
          <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-300 font-bold text-[11px] uppercase">
              <ShieldCheck size={13} className="text-emerald-400" />
              <span>Safety &amp; Compliance Verification</span>
            </div>
            <div className="text-[11px] space-y-1">
              <div>
                <span className="text-slate-400">MIL-STD Standard:</span>{' '}
                <span className="text-cyan-300 font-mono">{currentPhase.milStdCompliance}</span>
              </div>
              <div>
                <span className="text-slate-400">Autonomous Failsafe:</span>{' '}
                <span className="text-slate-300">{currentPhase.failsafeProtocol}</span>
              </div>
              <div className="pt-1 border-t border-slate-800">
                <span className="text-slate-500">Live Downlink Packet:</span>
                <div className="text-[10px] text-emerald-400 font-mono truncate mt-0.5">
                  {currentPhase.telemetryPacket}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
