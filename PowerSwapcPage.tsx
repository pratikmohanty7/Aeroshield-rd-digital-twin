import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { soundFX } from '../utils/audioFeedback';
import {
  Zap,
  BatteryCharging,
  DollarSign,
  Scale,
  Maximize2,
  Activity,
  Layers,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface SubsystemSwapc {
  subsystem: string;
  category: string;
  sizeEnvelope: string;
  weightGrams: number;
  powerWatts: number;
  costUsd: number;
  designStatus: 'ESTIMATED' | 'CONCEPTUAL' | 'PROPOSED' | 'TBD';
  optimizationIdea: string;
}

const SWAPC_ITEMS: SubsystemSwapc[] = [
  {
    subsystem: 'Central STM32 / MCU Processing',
    category: 'Avionics Computer',
    sizeEnvelope: '40 × 40 × 6 mm',
    weightGrams: 35,
    powerWatts: 0.8,
    costUsd: 45,
    designStatus: 'ESTIMATED',
    optimizationIdea: 'Migrate to dual-core lockstep ARM Cortex-M7 with integrated high-speed CAN-FD transceiver.',
  },
  {
    subsystem: 'Tactical Sensor Suite (IMU, GNSS, Baro, Mag, Temp)',
    category: 'Sensors',
    sizeEnvelope: '55 × 35 × 12 mm',
    weightGrams: 65,
    powerWatts: 2.8,
    costUsd: 180,
    designStatus: 'ESTIMATED',
    optimizationIdea: 'Single rigid-flex multi-sensor MCM (multi-chip module) with direct copper thermal dissipation pads.',
  },
  {
    subsystem: '77 GHz MMW Radar / Proximity Altimeter',
    category: 'Sensors',
    sizeEnvelope: '30 × 30 × 8 mm',
    weightGrams: 42,
    powerWatts: 1.4,
    costUsd: 95,
    designStatus: 'ESTIMATED',
    optimizationIdea: 'Conformal patch antenna printed directly on interior ogive radome wall.',
  },
  {
    subsystem: 'Regulated Power Management & Reserve Battery',
    category: 'Power',
    sizeEnvelope: '70 × 45 × 25 mm',
    weightGrams: 280,
    powerWatts: 0.6,
    costUsd: 120,
    designStatus: 'ESTIMATED',
    optimizationIdea: 'High-G setback-activated thermal battery with integrated ultra-low ESR hybrid supercapacitor bank.',
  },
  {
    subsystem: 'Telemetry Transceiver & Antenna Bay',
    category: 'Communication',
    sizeEnvelope: '45 × 30 × 10 mm',
    weightGrams: 48,
    powerWatts: 3.5,
    costUsd: 85,
    designStatus: 'ESTIMATED',
    optimizationIdea: 'Wrap-around conformal microstrip antenna integrated into projectile rotating band collar.',
  },
  {
    subsystem: 'Flight Data Flash Logger & Memory',
    category: 'Storage',
    sizeEnvelope: '25 × 20 × 4 mm',
    weightGrams: 15,
    powerWatts: 0.3,
    costUsd: 25,
    designStatus: 'ESTIMATED',
    optimizationIdea: 'BGA eMMC 32GB industrial high-g memory potted in high-density polyurethane resin.',
  },
  {
    subsystem: 'Mechanical Enclosure & Shock Isolators',
    category: 'Mechanical',
    sizeEnvelope: 'Ø 155 mm × 180 mm',
    weightGrams: 950,
    powerWatts: 0.0,
    costUsd: 210,
    designStatus: 'ESTIMATED',
    optimizationIdea: 'Aerospace-grade 7075-T6 anodized aluminum alloy housing with silicone-gel shock potting dampers.',
  },
  {
    subsystem: 'Canard Actuation Assembly (CAA Interface)',
    category: 'Actuation',
    sizeEnvelope: 'Ø 140 mm × 85 mm',
    weightGrams: 620,
    powerWatts: 18.0,
    costUsd: 380,
    designStatus: 'CONCEPTUAL',
    optimizationIdea: 'Dual-phase brushless slotless motors with harmonic drive gearing to minimize gear backlash.',
  },
  {
    subsystem: 'Smart Electronic Fuze (ESAD Interface)',
    category: 'Safety & Fuze',
    sizeEnvelope: '50 × 40 × 18 mm',
    weightGrams: 110,
    powerWatts: 0.5,
    costUsd: 140,
    designStatus: 'CONCEPTUAL',
    optimizationIdea: 'Dual-gated silicon carbide (SiC) optical fire-switch with zero quiescent leakage.',
  },
];

export const PowerSwapcPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'POWER' | 'SWAPC'>('POWER');

  const PMCU = 0.8;
  const PIMU = 0.45;
  const PGNSS = 1.2;
  const PComm = 3.5;
  const PSensorsOther = 1.15;
  const PActuation = 18.0;
  const PTotalWatts = PMCU + PIMU + PGNSS + PComm + PSensorsOther + PActuation;

  const flightDurationSec = 110;
  const requiredEnergyWh = PTotalWatts * (flightDurationSec / 3600);
  const batteryReserveWh = 3.2;
  const engineeringMarginPercent = Math.round(((batteryReserveWh - requiredEnergyWh) / batteryReserveWh) * 100);

  const totalWeightG = SWAPC_ITEMS.reduce((sum, item) => sum + item.weightGrams, 0);
  const totalCostUsd = SWAPC_ITEMS.reduce((sum, item) => sum + item.costUsd, 0);

  return (
    <div className="space-y-6 max-w-[1640px] mx-auto font-sans">
      {/* 1. HEADER */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1 font-semibold tracking-wider uppercase">
            <Zap size={15} />
            <span>15 · Power Architecture &amp; SWaP-C Feasibility Analysis</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>Electrical Power Distribution &amp; SWaP-C Budget</span>
            <span className="text-xs font-mono text-cyan-400 font-normal">
              · Estimated / Feasibility Budget
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-4xl">
            Power distribution architecture, reserve battery budget calculation, and Size, Weight, Power &amp; Cost (SWaP-C) optimization matrix.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-[#050811] border border-white/[0.08] rounded-xl p-1 text-xs">
            <button
              onClick={() => {
                soundFX.click();
                setActiveTab('POWER');
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'POWER'
                  ? 'bg-cyan-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Power Architecture
            </button>
            <button
              onClick={() => {
                soundFX.click();
                setActiveTab('SWAPC');
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'SWAPC'
                  ? 'bg-cyan-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              SWaP-C Matrix
            </button>
          </div>
          <DataSourceBadge source="PARAMETRIC SWaP-C MODEL" />
        </div>
      </section>

      {/* 2. SUMMARY METRICS TILES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0d1322] border border-white/[0.08] rounded-xl p-4 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Peak Power Draw</span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums">
            {PTotalWatts.toFixed(1)} <span className="text-xs text-slate-400 font-normal">W</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">During canard slew trim</p>
        </div>

        <div className="bg-[#0d1322] border border-white/[0.08] rounded-xl p-4 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Energy Required</span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-cyan-300 tabular-nums">
            {requiredEnergyWh.toFixed(2)} <span className="text-xs text-slate-400 font-normal">Wh</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">110s flight duration</p>
        </div>

        <div className="bg-[#0d1322] border border-white/[0.08] rounded-xl p-4 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Battery Reserve</span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 tabular-nums">
            {batteryReserveWh.toFixed(1)} <span className="text-xs text-slate-400 font-normal">Wh</span>
          </div>
          <p className="text-[11px] text-emerald-400 font-mono">+{engineeringMarginPercent}% margin</p>
        </div>

        <div className="bg-[#0d1322] border border-white/[0.08] rounded-xl p-4 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Estimated BOM Cost</span>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-300 tabular-nums">
            ${totalCostUsd.toLocaleString()} <span className="text-xs text-slate-400 font-normal">USD</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">Retrofit kit electronics</p>
        </div>
      </div>

      {activeTab === 'POWER' ? (
        /* POWER ARCHITECTURE BREAKDOWN */
        <div className="space-y-6">
          <div className="bg-[#0d1322] border border-white/[0.08] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-amber-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Primary Power Flow &amp; Regulation Stages
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400">28V Thermal Reserve Main Rail</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-lg bg-[#070b14] border border-white/[0.06] space-y-1">
                <span className="text-cyan-400 font-bold block text-[10px]">STAGE 1: SOURCE</span>
                <div className="text-white font-bold">Thermal Battery</div>
                <p className="text-[11px] text-slate-400 font-sans">Setback squib activated. 24-28V unbuffered output.</p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#070b14] border border-white/[0.06] space-y-1">
                <span className="text-cyan-400 font-bold block text-[10px]">STAGE 2: FILTER</span>
                <div className="text-white font-bold">TVS &amp; EMI Protection</div>
                <p className="text-[11px] text-slate-400 font-sans">Transient suppression diodes &amp; common-mode chokes.</p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#070b14] border border-white/[0.06] space-y-1">
                <span className="text-cyan-400 font-bold block text-[10px]">STAGE 3: 24V ACTUATORS</span>
                <div className="text-amber-300 font-bold">CAA Motor Rail</div>
                <p className="text-[11px] text-slate-400 font-sans">Direct filtered 24V supply to BLDC motor H-bridges.</p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#070b14] border border-white/[0.06] space-y-1">
                <span className="text-cyan-400 font-bold block text-[10px]">STAGE 4: 5.0V BUCK</span>
                <div className="text-white font-bold">Avionics Step-Down</div>
                <p className="text-[11px] text-slate-400 font-sans">High-efficiency synchronous buck converter (94%).</p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#070b14] border border-white/[0.06] space-y-1">
                <span className="text-cyan-400 font-bold block text-[10px]">STAGE 5: 3.3V LDO</span>
                <div className="text-emerald-400 font-bold">Sensors &amp; MCU</div>
                <p className="text-[11px] text-slate-400 font-sans">Ultra-low-noise LDOs powering IMU, GNSS &amp; ADC.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* SWAPC MATRIX TABLE */
        <div className="bg-[#0d1322] border border-white/[0.08] rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                SWaP-C Optimization Matrix (BOM Rollup)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Total weight: <strong className="text-white font-mono">{totalWeightG} g ({((totalWeightG) / 1000).toFixed(2)} kg)</strong> · Total Estimated Cost: <strong className="text-white font-mono">${totalCostUsd} USD</strong>
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/[0.08] text-slate-400 text-[11px] uppercase tracking-wider">
                  <th className="pb-2.5">Subsystem</th>
                  <th className="pb-2.5">Category</th>
                  <th className="pb-2.5">Size Envelope</th>
                  <th className="pb-2.5">Weight</th>
                  <th className="pb-2.5">Power</th>
                  <th className="pb-2.5">Est. Cost</th>
                  <th className="pb-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {SWAPC_ITEMS.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 font-bold text-white">{item.subsystem}</td>
                    <td className="py-2.5 text-slate-400">{item.category}</td>
                    <td className="py-2.5 text-slate-300">{item.sizeEnvelope}</td>
                    <td className="py-2.5 text-slate-200 tabular-nums">{item.weightGrams} g</td>
                    <td className="py-2.5 text-amber-300 tabular-nums">{item.powerWatts} W</td>
                    <td className="py-2.5 text-cyan-300 tabular-nums">${item.costUsd}</td>
                    <td className="py-2.5 text-[10px] text-slate-400">{item.designStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
