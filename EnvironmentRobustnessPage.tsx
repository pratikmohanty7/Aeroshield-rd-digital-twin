import React, { useState } from 'react';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface RobustnessEntry {
  category: 'MECHANICAL' | 'THERMAL' | 'ENVIRONMENTAL';
  item: string;
  requirement: string;
  designConsideration: string;
  verificationMethod: string;
  status: 'PLANNED' | 'NOT TESTED' | 'REQUIRES LAB TEST' | 'SIMULATED';
}

const ROBUSTNESS_DATA: RobustnessEntry[] = [
  // MECHANICAL
  {
    category: 'MECHANICAL',
    item: '155 mm Gun-Launch Setback Shock',
    requirement: 'Survive peak axial setback acceleration of 16,000G - 20,000G (8 - 14 ms duration).',
    designConsideration: 'Underfill encapsulation on all BGA/QFN chips, solid silicone elastomer potting, thick FR-4 multilayer PCB with staggered blind vias.',
    verificationMethod: 'Drop tower shock test and air-gun impact simulator (MIL-STD-810H Method 516.8).',
    status: 'SIMULATED',
  },
  {
    category: 'MECHANICAL',
    item: 'Centrifugal Balloting & Muzzle Exit Whip',
    requirement: 'Withstand transverse balloting loads of ±2,500G inside the gun tube and muzzle exit gas plume unbalance.',
    designConsideration: 'Perpendicular structural bulkheads, dual-ring threaded mechanical tie-rods connecting avionics stack to outer shell steel.',
    verificationMethod: 'Centrifuge spin table and gas-gun dynamic sabot launch.',
    status: 'REQUIRES LAB TEST',
  },
  {
    category: 'MECHANICAL',
    item: 'Rifling Spin Velocity',
    requirement: 'Operate reliably through spin rates up to 250 - 300 rev/sec (15,000 - 18,000 RPM) induced by barrel rifling.',
    designConsideration: 'Radially balanced component layout, low-mass quartz crystals, de-spun forward guidance section decoupling bearings.',
    verificationMethod: 'High-speed dynamic balancing spin rig with slip-ring telemetry extraction.',
    status: 'PLANNED',
  },
  {
    category: 'MECHANICAL',
    item: 'Aero-Acoustic Random Vibration',
    requirement: 'Endure broad-band structural vibration (20 - 2,000 Hz, 0.04 G²/Hz PSD) during transonic flight regimes.',
    designConsideration: 'Heavy polyurethane conformal coating, multi-point board edge stiffeners, zero floating wire harnesses.',
    verificationMethod: 'Electrodynamic shaker table 3-axis vibration testing.',
    status: 'NOT TESTED',
  },

  // THERMAL
  {
    category: 'THERMAL',
    item: 'Aerodynamic Stagnation Heating',
    requirement: 'Withstand Mach 2.5 aerodynamic friction skin temperatures reaching up to 320 °C on ogive radome surface.',
    designConsideration: 'Ceramic-matrix composite (CMC) nose tip, aerogel thermal barrier blanket isolating forward electronics stack.',
    verificationMethod: 'Thermal arc-jet plasma chamber and radiative heat lamp exposure.',
    status: 'SIMULATED',
  },
  {
    category: 'THERMAL',
    item: 'Sub-Zero Storage & Transport',
    requirement: 'Maintain readiness across operational temperature envelope of -46 °C to +71 °C (MIL-STD-810H Method 501/502).',
    designConsideration: 'Automotive and mil-grade temperature silicon (AEC-Q100 Grade 1: -40 °C to +125 °C), thermal squib heater pads.',
    verificationMethod: 'Environmental climatic chamber 72-hour thermal cycling dwell.',
    status: 'SIMULATED',
  },

  // ENVIRONMENTAL
  {
    category: 'ENVIRONMENTAL',
    item: 'Hermetic Sealing & Salt Fog Humidity',
    requirement: 'Prevent moisture ingress and corrosive degradation during 10-year shelf life in maritime coastal magazines.',
    designConsideration: 'Dual O-ring Viton seals on threaded joints, dry nitrogen purge prior to boattail crimping, nickel electroplating.',
    verificationMethod: 'Salt fog chamber testing (5% NaCl, 35 °C, 48 hours).',
    status: 'PLANNED',
  },
  {
    category: 'ENVIRONMENTAL',
    item: 'Electromagnetic Environmental Effects (E3 / EMI)',
    requirement: 'Operate without glitching in proximity to high-power tactical radar and RF jamming (50 V/m field strength).',
    designConsideration: '360° continuous Faraday cage chassis, copper-tape shielded cable runs, feedthrough capacitive filters on I/O lines.',
    verificationMethod: 'Anechoic chamber RF susceptibility testing (MIL-STD-461G).',
    status: 'REQUIRES LAB TEST',
  },
];

export const EnvironmentRobustnessPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredData = ROBUSTNESS_DATA.filter((item) =>
    selectedCategory === 'ALL' ? true : item.category === selectedCategory
  );

  return (
    <div className="space-y-6 max-w-[1640px] mx-auto font-sans">
      {/* 1. HEADER */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1 font-semibold tracking-wider uppercase">
            <ShieldAlert size={15} />
            <span>16 · Environment &amp; Robustness · 155 mm Operational Envelope</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>Severe Environment &amp; Robustness Matrix</span>
            <span className="text-xs font-mono text-cyan-400 font-normal">
              · Gun-Launch 20,000G Criteria
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-4xl">
            Mechanical shock survivability, aerodynamic thermal protection, and environmental screening for artillery projectile electronics.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <DataSourceBadge source="MIL-STD-810H &amp; STANAG 4187" />
        </div>
      </section>

      {/* 2. PERSISTENT DISCLAIMER BANNER */}
      <div className="bg-[#0b101d] border border-cyan-500/30 rounded-xl p-4 text-xs space-y-1.5 text-slate-300">
        <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase font-mono tracking-wider">
          <ShieldCheck size={16} />
          <span>Honesty in Environmental Status</span>
        </div>
        <p className="text-slate-300 leading-relaxed font-sans text-xs">
          Physical artillery munitions undergo severe mechanical and thermal environments. The design considerations below reflect established defense packaging methodologies. The software prototype validates software screening and resilience algorithms, and clearly designates physical tests as <strong className="text-white">PLANNED</strong> or <strong className="text-white">REQUIRES LAB TEST</strong>.
        </p>
      </div>

      {/* 3. CATEGORY SELECTOR & FILTER */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-[#050811] p-1 rounded-xl border border-white/[0.08] text-xs font-mono">
          {['ALL', 'MECHANICAL', 'THERMAL', 'ENVIRONMENTAL'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedCategory === cat
                  ? 'bg-cyan-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing <strong className="text-white">{filteredData.length}</strong> requirements
        </span>
      </div>

      {/* 4. ROBUSTNESS REQUIREMENTS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredData.map((entry, idx) => (
          <div
            key={idx}
            className="p-5 rounded-xl bg-[#0d1322] border border-white/[0.08] space-y-3 font-mono text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <span className="font-bold text-white text-sm">{entry.item}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                entry.status === 'SIMULATED'
                  ? 'text-cyan-400 bg-cyan-950 border border-cyan-800'
                  : entry.status === 'REQUIRES LAB TEST'
                  ? 'text-amber-400 bg-amber-950 border border-amber-800'
                  : 'text-slate-400 bg-slate-900 border border-white/[0.08]'
              }`}>
                {entry.status}
              </span>
            </div>

            <div className="space-y-1.5">
              <span className="text-slate-500 uppercase text-[10px] block">Operational Requirement:</span>
              <p className="text-slate-200 font-sans text-xs leading-relaxed">{entry.requirement}</p>
            </div>

            <div className="space-y-1.5">
              <span className="text-slate-500 uppercase text-[10px] block">Packaging Design Solution:</span>
              <p className="text-slate-300 font-sans text-xs leading-relaxed">{entry.designConsideration}</p>
            </div>

            <div className="pt-2 border-t border-white/[0.04] text-[11px] flex items-center justify-between text-slate-400">
              <span>Standard: {entry.verificationMethod.split(' ')[0]}</span>
              <span className="text-cyan-400">{entry.category}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
