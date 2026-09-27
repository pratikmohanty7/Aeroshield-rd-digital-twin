import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { soundFX } from '../utils/audioFeedback';
import {
  FileCheck,
  Search,
  Filter,
} from 'lucide-react';

export type PsStatus = 'IMPLEMENTED' | 'SIMULATED' | 'PROPOSED' | 'PLANNED' | 'NOT TESTED';

export interface TraceabilityEntry {
  id: string;
  requirement: string;
  psScope: string;
  moduleName: string;
  pageRoute: string;
  implementationState: PsStatus;
  testCase: string;
  evidenceRef: string;
  maturityNotes: string;
}

export const PS_TRACEABILITY_ITEMS: TraceabilityEntry[] = [
  {
    id: 'REQ-01',
    requirement: 'Guidance & Navigation Methodology',
    psScope: 'Kinematic state estimation, trajectory tracking, and mid-course correction algorithms.',
    moduleName: 'GNC Research & State Estimation',
    pageRoute: 'gnc-research',
    implementationState: 'SIMULATED',
    testCase: 'VT-01, VT-02, VT-05',
    evidenceRef: 'EV-SIL-GNC-01',
    maturityNotes: 'Dual-sensor altitude & heading state estimator implemented in software; trajectory correction simulated.',
  },
  {
    id: 'REQ-02',
    requirement: 'Canard Actuation Assembly (CAA)',
    psScope: 'Aerodynamic steering surfaces, 4-axis actuator drive interfaces, and mechanical coupling.',
    moduleName: 'CAA Research & Integration',
    pageRoute: 'caa-research',
    implementationState: 'PROPOSED',
    testCase: 'Trim Loop Software Step',
    evidenceRef: 'EV-CAA-SPEC-02',
    maturityNotes: 'Mechanical envelope and CAN control signals designed; requires wind-tunnel and bench dyno.',
  },
  {
    id: 'REQ-03',
    requirement: 'Multi-Mode Electronic Fuze System',
    psScope: 'Proximity (MMW radar), Time/Delay, and Impact detonation modes with safe-and-arm (ESAD).',
    moduleName: 'Smart Fuze Research',
    pageRoute: 'smart-fuze',
    implementationState: 'SIMULATED',
    testCase: 'VT-01, VT-03, VT-04',
    evidenceRef: 'EV-FUZE-SIM-03',
    maturityNotes: 'Software state machine and sensor precondition gating implemented; strictly non-energetic prototype.',
  },
  {
    id: 'REQ-04',
    requirement: 'Sensor Selection & Redundancy',
    psScope: 'Selection of IMU, GNSS, Barometer, Temperature, Magnetometer, and Proximity radar.',
    moduleName: 'Sensor Lab',
    pageRoute: 'sensors',
    implementationState: 'IMPLEMENTED',
    testCase: 'VT-01 through VT-05',
    evidenceRef: 'EV-SENS-200HZ',
    maturityNotes: 'Deterministic 200 Hz mathematical model with range, freshness, noise, drift, and bias simulation.',
  },
  {
    id: 'REQ-05',
    requirement: 'Avionics Processing Architecture',
    psScope: 'Microcontroller selection (STM32-class), bus interfaces, framing, and memory partitioning.',
    moduleName: 'Hardware Architecture',
    pageRoute: 'architecture',
    implementationState: 'IMPLEMENTED',
    testCase: '10-Stage Pipeline Check',
    evidenceRef: 'EV-MCU-ARCH-05',
    maturityNotes: 'Sequential 10-stage avionics integrity verification and modular block diagram completed.',
  },
  {
    id: 'REQ-06',
    requirement: 'Telemetry & Downlink Communications',
    psScope: 'RF packet serialization, transmission parameters, and downlink data rate.',
    moduleName: 'Telemetry Bus',
    pageRoute: 'telemetry',
    implementationState: 'IMPLEMENTED',
    testCase: 'VT-06, Downlink Pkts',
    evidenceRef: 'EV-TELEM-LINK',
    maturityNotes: '200 Hz internal acquisition decimated to 10 Hz display stream; no return command path by safety mandate.',
  },
  {
    id: 'REQ-07',
    requirement: 'Digital Twin Flight Simulation',
    psScope: 'Interactive 3D projectile model, spatial orientation, and synthetic geospatial trajectory.',
    moduleName: 'Digital Twin & Geospatial Sim',
    pageRoute: 'digital-twin',
    implementationState: 'IMPLEMENTED',
    testCase: 'CAD Model Raycasting',
    evidenceRef: 'EV-TWIN-3D-07',
    maturityNotes: 'Three.js 3D projectile cutaway with internal component inspection and Leaflet geospatial simulation.',
  },
  {
    id: 'REQ-08',
    requirement: 'Fault Injection & Anomaly Evaluation',
    psScope: 'Harness to inject bias, drift, loss of signal, and evaluate graceful degradation.',
    moduleName: 'Simulation & Fault Matrix',
    pageRoute: 'simulation',
    implementationState: 'IMPLEMENTED',
    testCase: 'VT-01 - VT-07 Matrix',
    evidenceRef: 'EV-FAULT-INJECT',
    maturityNotes: 'Real-time fault propagation through validation engine, OBDS diagnostics, health, and twin.',
  },
  {
    id: 'REQ-09',
    requirement: 'Verification & Formal Validation',
    psScope: 'Automated test suite verifying deterministic invariants, expected vs observed results.',
    moduleName: 'Validation Suite',
    pageRoute: 'validation',
    implementationState: 'IMPLEMENTED',
    testCase: 'VT-01 through VT-07',
    evidenceRef: 'Deterministic SHA Signatures',
    maturityNotes: '7 primary test cases generating immutable evidence records with exportable JSON/CSV logs.',
  },
  {
    id: 'REQ-10',
    requirement: 'Manufacturability & Modularity',
    psScope: 'Design for Assembly (DFA), modular PCB replacement, and standard NATO thread coupling.',
    moduleName: 'Hardware Architecture',
    pageRoute: 'architecture',
    implementationState: 'PROPOSED',
    testCase: 'BOM & Cutaway Inspection',
    evidenceRef: 'EV-MFG-MOD-10',
    maturityNotes: 'Standard 2-inch threaded coupling and stacked circular PCB layout with blind mate headers.',
  },
  {
    id: 'REQ-11',
    requirement: 'SWaP-C Optimization',
    psScope: 'Size, Weight, Power, and Cost minimization for low-cost precision kit retrofits.',
    moduleName: 'Power & SWaP-C',
    pageRoute: 'power-swapc',
    implementationState: 'SIMULATED',
    testCase: 'SWaP-C Parametric Rollup',
    evidenceRef: 'EV-SWAPC-ROLLUP',
    maturityNotes: 'Total mass ~2.1 kg, estimated electronics BOM ~$1,280 USD; within retrofit cost targets.',
  },
  {
    id: 'REQ-12',
    requirement: 'Reliability & Safety Invariants',
    psScope: 'Continuous Built-In Test (BIT), watchdog supervision, and fail-safe neutral locking.',
    moduleName: 'Diagnostics / OBDS',
    pageRoute: 'diagnostics',
    implementationState: 'IMPLEMENTED',
    testCase: 'VT-02, VT-07',
    evidenceRef: 'EV-OBDS-DIAG',
    maturityNotes: 'OBDS with isolated sub-systems, root-cause tracing, and simulated detection latency metrics.',
  },
  {
    id: 'REQ-13',
    requirement: '3D CAD & Electronics Spatial Architecture',
    psScope: 'Component physical placement, ogive interior layout, and sensor orientations.',
    moduleName: 'Digital Twin 3D',
    pageRoute: 'digital-twin',
    implementationState: 'IMPLEMENTED',
    testCase: 'Internal Part Raycasting',
    evidenceRef: 'EV-CAD-PARTS-13',
    maturityNotes: '155 mm NATO projectile cutaway with clickable internal sensors, MCU, and battery bays.',
  },
  {
    id: 'REQ-14',
    requirement: 'Proof-of-Concept Software Prototype',
    psScope: 'Integrated browser-based engineering dashboard demonstrating full data pipeline.',
    moduleName: 'Overview & Full Platform',
    pageRoute: 'overview',
    implementationState: 'IMPLEMENTED',
    testCase: 'Automated 16-Step Demo',
    evidenceRef: 'EV-POC-MVP-14',
    maturityNotes: 'Unified connected system running at 10 Hz dashboard refresh over 200 Hz simulated stream.',
  },
  {
    id: 'REQ-15',
    requirement: 'CEP ≤ 30 m Performance Target',
    psScope: 'Precision trajectory correction capable of reducing unguided dispersion to ≤ 30 m CEP.',
    moduleName: 'Simulation Page',
    pageRoute: 'simulation',
    implementationState: 'SIMULATED',
    testCase: 'Monte-Carlo Dispersion Model',
    evidenceRef: 'EV-CEP-TARGET',
    maturityNotes: 'Labeled as SIMULATION ESTIMATE / TARGET; explicitly requires experimental range validation.',
  },
  {
    id: 'REQ-16',
    requirement: 'Epistemological Scope Disclosures',
    psScope: 'Honest distinction between verified facts, simulations, assumptions, and future hardware work.',
    moduleName: 'Prototype Status & Research',
    pageRoute: 'prototype-status',
    implementationState: 'IMPLEMENTED',
    testCase: 'Research Standards Review',
    evidenceRef: 'EV-TRL-DISCLOSE',
    maturityNotes: 'TRL-4 laboratory software scope; zero unevidenced flight-test or operational claims made.',
  },
];

export const TraceabilityPage: React.FC = () => {
  const { setActivePage } = useApp();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredItems = useMemo(() => {
    return PS_TRACEABILITY_ITEMS.filter((item) => {
      if (statusFilter !== 'ALL' && item.implementationState !== statusFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          item.requirement.toLowerCase().includes(q) ||
          item.psScope.toLowerCase().includes(q) ||
          item.moduleName.toLowerCase().includes(q) ||
          item.testCase.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [statusFilter, searchTerm]);

  const counts = useMemo(() => {
    const total = PS_TRACEABILITY_ITEMS.length;
    const implemented = PS_TRACEABILITY_ITEMS.filter((i) => i.implementationState === 'IMPLEMENTED').length;
    const simulated = PS_TRACEABILITY_ITEMS.filter((i) => i.implementationState === 'SIMULATED').length;
    const proposed = PS_TRACEABILITY_ITEMS.filter((i) => i.implementationState === 'PROPOSED').length;
    const planned = PS_TRACEABILITY_ITEMS.filter((i) => i.implementationState === 'PLANNED').length;
    const notTested = PS_TRACEABILITY_ITEMS.filter((i) => i.implementationState === 'NOT TESTED').length;
    return { total, implemented, simulated, proposed, planned, notTested };
  }, []);

  return (
    <div className="space-y-6 max-w-[1640px] mx-auto font-sans">
      {/* 1. HEADER */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1 font-semibold tracking-wider uppercase">
            <FileCheck size={15} />
            <span>17 · Requirements Traceability · SIH 2026 PS: 26098</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>PS 26098 Requirements Coverage Dashboard</span>
            <span className="text-xs font-mono text-emerald-400 font-normal">
              · 16 / 16 Requirements Addressed
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-4xl">
            End-to-end traceability matrix connecting Problem Statement objectives to software modules, verification tests, and evidence records.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <DataSourceBadge source="FORMAL PS: 26098 SPECIFICATION" />
        </div>
      </section>

      {/* 2. PS COVERAGE SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-[#0d1322] border border-emerald-500/30 rounded-xl p-4 space-y-1">
          <span className="text-[11px] font-mono text-emerald-400 uppercase font-semibold block">
            Implemented (SIL)
          </span>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {counts.implemented} <span className="text-xs text-slate-400 font-normal">/ {counts.total}</span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans">Software MVP complete</p>
        </div>

        <div className="bg-[#0d1322] border border-cyan-500/30 rounded-xl p-4 space-y-1">
          <span className="text-[11px] font-mono text-cyan-400 uppercase font-semibold block">
            Simulated Models
          </span>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {counts.simulated} <span className="text-xs text-slate-400 font-normal">/ {counts.total}</span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans">Mathematical models</p>
        </div>

        <div className="bg-[#0d1322] border border-blue-500/30 rounded-xl p-4 space-y-1">
          <span className="text-[11px] font-mono text-blue-400 uppercase font-semibold block">
            Proposed Arch
          </span>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {counts.proposed} <span className="text-xs text-slate-400 font-normal">/ {counts.total}</span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans">Hardware design complete</p>
        </div>

        <div className="bg-[#0d1322] border border-amber-500/30 rounded-xl p-4 space-y-1">
          <span className="text-[11px] font-mono text-amber-400 uppercase font-semibold block">
            Planned Physical
          </span>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {counts.planned} <span className="text-xs text-slate-400 font-normal">/ {counts.total}</span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans">Requires lab hardware</p>
        </div>

        <div className="bg-[#0d1322] border border-white/[0.08] rounded-xl p-4 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold block">
            Total Coverage
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            100%
          </div>
          <p className="text-[11px] text-slate-400 font-sans">16 of 16 mapped</p>
        </div>
      </div>

      {/* 3. SEARCH & FILTER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search requirements or scope..."
            className="w-full bg-[#070b14] border border-white/[0.08] rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={13} className="text-slate-400" />
          <span className="text-slate-400 mr-1">Status:</span>
          {['ALL', 'IMPLEMENTED', 'SIMULATED', 'PROPOSED', 'PLANNED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                statusFilter === st
                  ? 'bg-cyan-600 text-white font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* 4. TRACEABILITY TABLE */}
      <div className="bg-[#0d1322] border border-white/[0.08] rounded-xl p-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="pb-2.5">Req ID</th>
                <th className="pb-2.5">PS 26098 Scope &amp; Target</th>
                <th className="pb-2.5">Target Module</th>
                <th className="pb-2.5">Status</th>
                <th className="pb-2.5">Verification</th>
                <th className="pb-2.5">Maturity Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 font-bold text-cyan-400">{item.id}</td>
                  <td className="py-3 pr-4 max-w-xs">
                    <div className="font-bold text-white">{item.requirement}</div>
                    <div className="text-[11px] text-slate-400 font-sans mt-0.5">{item.psScope}</div>
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => {
                        soundFX.chipSelect();
                        setActivePage(item.pageRoute as any);
                      }}
                      className="text-cyan-300 hover:underline text-left font-semibold"
                    >
                      {item.moduleName}
                    </button>
                  </td>
                  <td className="py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      item.implementationState === 'IMPLEMENTED'
                        ? 'text-emerald-300 bg-emerald-950 border border-emerald-800'
                        : item.implementationState === 'SIMULATED'
                        ? 'text-cyan-300 bg-cyan-950 border border-cyan-800'
                        : 'text-amber-300 bg-amber-950 border border-amber-800'
                    }`}>
                      {item.implementationState}
                    </span>
                  </td>
                  <td className="py-3 text-slate-300">{item.testCase}</td>
                  <td className="py-3 text-[11px] text-slate-400 max-w-xs font-sans">{item.maturityNotes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
