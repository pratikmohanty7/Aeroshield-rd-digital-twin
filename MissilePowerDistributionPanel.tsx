import React, { useState } from 'react';
import { MISSILE_POWER_RAILS } from '../../data/missileArchitectureData';
import { PowerRailInfo } from '../../types/missileArchitecture';
import {
  Zap,
  BatteryCharging,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Cpu,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { soundFX } from '../../utils/audioFeedback';

export const MissilePowerDistributionPanel: React.FC = () => {
  const [rails, setRails] = useState<PowerRailInfo[]>(MISSILE_POWER_RAILS);

  const toggleRailTrip = (railId: string) => {
    soundFX.click();
    setRails((prev) =>
      prev.map((r) => {
        if (r.id === railId) {
          return {
            ...r,
            isTripped: !r.isTripped,
            voltageLiveV: !r.isTripped ? 0.0 : r.voltageNominalV,
            currentDrawA: !r.isTripped ? 0.0 : r.currentDrawA,
            powerWatts: !r.isTripped ? 0.0 : r.powerWatts,
          };
        }
        return r;
      })
    );
  };

  const resetAllBreakers = () => {
    soundFX.click();
    setRails(MISSILE_POWER_RAILS);
  };

  const totalPowerWatts = rails
    .filter((r) => !r.isTripped)
    .reduce((sum, r) => sum + r.powerWatts, 0);

  return (
    <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-2xl font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-950/80 border border-amber-700/60 text-amber-400">
            <Zap size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Electrical Power Distribution Unit (PDU) &amp; Rail Matrix
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-mono font-bold">
                THERMAL BATTERY BUS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Pyrotechnic lithium-iron disulfide thermal battery (setback activated at T-0) distributing 5 regulated DC voltage rails.
            </p>
          </div>
        </div>

        {/* Global Summary & Reset */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Avionics Load:</div>
            <div className="text-sm font-bold text-amber-400 font-mono">
              {totalPowerWatts.toFixed(1)} W <span className="text-slate-500 font-normal text-xs">/ 85.0 W Peak</span>
            </div>
          </div>

          <button
            onClick={resetAllBreakers}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <RotateCcw size={13} />
            <span>Reset All Breakers</span>
          </button>
        </div>
      </div>

      {/* Power Rails Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        {rails.map((rail) => {
          const loadPercentage = Math.min(100, Math.round((rail.currentDrawA / rail.maxCurrentA) * 100));

          return (
            <div
              key={rail.id}
              className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                rail.isTripped
                  ? 'bg-rose-950/20 border-rose-900/60 text-slate-400'
                  : 'bg-slate-900/80 border-slate-800 text-slate-200 shadow-sm'
              }`}
            >
              <div className="space-y-2">
                {/* Top Rail Header */}
                <div className="flex items-center justify-between">
                  <span
                    className="font-bold text-[11px] font-mono tracking-wider truncate"
                    style={{ color: rail.isTripped ? '#f43f5e' : rail.color }}
                  >
                    {rail.voltageNominalV >= 1000
                      ? `${rail.voltageNominalV}V`
                      : `${rail.voltageNominalV}V RAIL`}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                      rail.isTripped
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    {rail.isTripped ? 'TRIPPED' : 'ONLINE'}
                  </span>
                </div>

                <div className="font-semibold text-xs text-white leading-tight">
                  {rail.name.split(' ')[1] || rail.name}
                </div>

                {/* Metrics */}
                <div className="space-y-1 font-mono text-[11px] pt-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Voltage:</span>
                    <span className="font-bold text-white">
                      {rail.voltageLiveV.toFixed(rail.voltageNominalV >= 100 ? 0 : 2)} V
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Current:</span>
                    <span className="text-cyan-300">
                      {rail.currentDrawA.toFixed(rail.currentDrawA < 0.1 ? 3 : 2)} A
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Power:</span>
                    <span className="text-amber-400 font-semibold">{rail.powerWatts.toFixed(1)} W</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Ripple:</span>
                    <span className="text-slate-400">{rail.rippleMv} mV</span>
                  </div>
                </div>

                {/* Progress Bar of Max Capacity */}
                <div className="pt-1">
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-1">
                    <span>Rail Load</span>
                    <span>{loadPercentage}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className="h-full transition-all duration-300 rounded-full"
                      style={{
                        width: `${loadPercentage}%`,
                        backgroundColor: rail.isTripped ? '#f43f5e' : rail.color,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Toggle Circuit Breaker Switch */}
              <button
                onClick={() => toggleRailTrip(rail.id)}
                className={`mt-3 w-full py-1.5 rounded-lg font-mono text-[10px] font-bold transition-all border ${
                  rail.isTripped
                    ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-sm'
                    : 'bg-slate-950 hover:bg-slate-900 text-slate-300 border-slate-800'
                }`}
              >
                {rail.isTripped ? 'CLOSE BREAKER' : 'TRIP BREAKER'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Thermal Battery Specs Footer */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs flex items-center justify-between flex-wrap gap-2 text-slate-400">
        <div className="flex items-center gap-2">
          <BatteryCharging size={16} className="text-amber-400" />
          <span>
            Primary Energy Source: Molten-Salt LiFeS2 battery ignites in 150ms upon barrel setback, delivering 28V regulated power for 120s flight duration.
          </span>
        </div>
        <span className="font-mono text-emerald-400 text-[11px] font-semibold">
          Active Flight Endurance: 120s / 120s
        </span>
      </div>
    </div>
  );
};
