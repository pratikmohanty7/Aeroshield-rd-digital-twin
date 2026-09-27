import React, { useState, useEffect } from 'react';
import { GUN_LAUNCH_SHOCK_PROFILE } from '../../data/missileArchitectureData';
import { MISSILE_CHIPS } from '../../data/missileChipsData';
import {
  Flame,
  Shield,
  Gauge,
  RotateCw,
  Play,
  RotateCcw,
  AlertOctagon,
  CheckCircle2,
  TrendingUp,
  Activity,
  Zap,
} from 'lucide-react';
import { soundFX } from '../../utils/audioFeedback';

export const GunLaunchShockSimulator: React.FC = () => {
  const [profileStepIndex, setProfileStepIndex] = useState<number>(4); // Default to peak setback (8.2ms)
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedChipId, setSelectedChipId] = useState<string>(MISSILE_CHIPS[1].id); // TMS320C6748

  const currentSample = GUN_LAUNCH_SHOCK_PROFILE[profileStepIndex];

  // Playback timer across the 20ms impulse profile
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setProfileStepIndex((prev) => {
          if (prev >= GUN_LAUNCH_SHOCK_PROFILE.length - 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 400); // 400ms per step for smooth visual inspection
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const handleStartSim = () => {
    soundFX.click();
    setProfileStepIndex(0);
    setIsPlaying(true);
  };

  const selectedChip = MISSILE_CHIPS.find((c) => c.id === selectedChipId) || MISSILE_CHIPS[0];

  return (
    <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-2xl font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-950/80 border border-amber-700/60 text-amber-400">
            <Flame size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                15,500g Artillery Setback Shock &amp; Gun-Launch Environmental Stress
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-mono font-bold">
                MIL-STD-810H METHOD 516.8
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Deterministic 20ms in-bore gun explosion impulse: 450 MPa chamber pressure, 18,000 RPM rifling spin-up, and setback deceleration.
            </p>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleStartSim}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isPlaying
                ? 'bg-amber-600 text-white animate-pulse'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/40'
            }`}
          >
            <Play size={13} />
            <span>{isPlaying ? 'Simulating Setback...' : 'Run Gun-Launch Test'}</span>
          </button>

          <button
            onClick={() => {
              soundFX.click();
              setIsPlaying(false);
              setProfileStepIndex(4);
            }}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
            title="Reset to Peak Setback (8.2ms)"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Real-Time Telemetry Gauges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* Setback Acceleration Gauge */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <TrendingUp size={13} className="text-rose-400" />
            Setback Acceleration
          </span>
          <div className="text-2xl font-bold text-rose-400 font-mono mt-1 tabular-nums">
            {currentSample.setbackG.toLocaleString()} g
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Max Limit: 20,000 g (Margin: +29.0%)
          </div>
        </div>

        {/* Chamber Pressure Gauge */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <Gauge size={13} className="text-amber-400" />
            Bore Chamber Pressure
          </span>
          <div className="text-2xl font-bold text-amber-400 font-mono mt-1 tabular-nums">
            {currentSample.chamberPressureMpa.toFixed(1)} MPa
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {(currentSample.chamberPressureMpa * 145.038).toFixed(0)} PSI
          </div>
        </div>

        {/* Rifling Spin Rate */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <RotateCw size={13} className="text-cyan-400" />
            Rifling Spin Velocity
          </span>
          <div className="text-2xl font-bold text-cyan-400 font-mono mt-1 tabular-nums">
            {currentSample.spinRpm.toLocaleString()} RPM
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {(currentSample.spinRpm / 60).toFixed(1)} rev/sec
          </div>
        </div>

        {/* Transient State Indicator */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <Activity size={13} className="text-emerald-400" />
            Bore Transit Status
          </span>
          <div className="text-xs font-bold text-emerald-400 font-mono mt-2 truncate">
            {currentSample.stressStatus}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-1">
            Time: T+{currentSample.timeMs.toFixed(1)} ms
          </div>
        </div>
      </div>

      {/* Interactive Timeline Scrubber (0.0ms to 20.0ms) */}
      <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="font-semibold text-slate-200">Gun Barrel Shot Time Profile:</span>
          <span className="font-mono text-cyan-300 font-bold">
            T + {currentSample.timeMs.toFixed(1)} ms / 20.0 ms
          </span>
        </div>

        <input
          type="range"
          min="0"
          max={GUN_LAUNCH_SHOCK_PROFILE.length - 1}
          value={profileStepIndex}
          onChange={(e) => {
            soundFX.click();
            setProfileStepIndex(Number(e.target.value));
          }}
          className="w-full accent-blue-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
        />

        {/* Milestone Tick Marks */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
          <span>T+0.0ms (Deflagration)</span>
          <span>T+8.2ms (15.5k g Peak)</span>
          <span>T+14.5ms (Muzzle Blast)</span>
          <span>T+20.0ms (De-spin Release)</span>
        </div>
      </div>

      {/* Chip Qualification Stress Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">
            Avionics Silicon Survival &amp; Packaging Integrity (All 10 ICs Verified):
          </span>
          <span className="text-[11px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
            <CheckCircle2 size={13} />
            <span>100% Hermetic &amp; Bond-Wire Qualified</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {MISSILE_CHIPS.map((chip) => {
            const isSelected = selectedChipId === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => {
                  soundFX.click();
                  setSelectedChipId(chip.id);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-slate-900 border-blue-500 text-white ring-1 ring-blue-500/50'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] font-mono" style={{ color: chip.color }}>
                    {chip.refDes}
                  </span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                    20k g OK
                  </span>
                </div>
                <div className="font-semibold text-[11px] truncate mt-1 text-slate-200">
                  {chip.shortName}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                  {chip.packageType.split(' ')[0]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Chip Setback Resilience Detail */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <Shield size={16} className="text-emerald-400 shrink-0" />
          <span className="text-slate-300">
            <strong className="text-white">{selectedChip.refDes} ({selectedChip.name})</strong>: Ceramic/Hermetic gold-plated packaging potted in aerospace syntactic foam. Certified to endure 20,000g setback blast with zero solder fatigue.
          </span>
        </div>
        <span className="font-mono text-emerald-400 text-[11px] shrink-0 font-semibold">
          PASSED (Margin: 1.29x)
        </span>
      </div>
    </div>
  );
};
