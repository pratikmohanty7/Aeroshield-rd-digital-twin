import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import {
  AlertTriangle,
  ShieldCheck,
  Activity,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { formatTimestamp } from '../utils/formatters';

export const DiagnosticsPage: React.FC = () => {
  const {
    obdsState,
    diagnosticEvents,
    healthBreakdown,
    recoverAllFaults,
  } = useApp();

  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const filteredEvents = diagnosticEvents.filter((e) => {
    if (filterSeverity === 'ALL') return true;
    return e.severity === filterSeverity;
  });

  // Compute average simulated detection latency
  const eventsWithLatency = diagnosticEvents.filter((e) => e.detectionLatencyMs !== undefined);
  const avgLatency =
    eventsWithLatency.length > 0
      ? eventsWithLatency.reduce((acc, e) => acc + (e.detectionLatencyMs || 0), 0) / eventsWithLatency.length
      : 24.5;

  return (
    <div className="space-y-6 font-sans max-w-[1640px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-mono font-semibold tracking-wider uppercase mb-1">
            <AlertTriangle size={14} />
            <span>On-Board Diagnostics &amp; Fault Isolation (OBDS)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Diagnostics &amp; Health Management (OBDS)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-4xl">
            Continuous anomaly screening, Built-In Test (BIT) execution, fault isolation, and detection latency tracking.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <DataSourceBadge source="OBDS REAL-TIME SUPERVISOR" />
          <button
            onClick={recoverAllFaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 text-xs font-semibold transition-colors"
          >
            <RotateCcw size={13} />
            <span>Clear / Resolve All Events</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          label="OBDS Status"
          value={obdsState.status}
          status={obdsState.status}
          definition="Aggregate onboard diagnostic health status derived from continuous Built-In Tests."
          subtext={`BIT Result: ${obdsState.builtInTestStatus}`}
        />

        <MetricCard
          label="Active Faults"
          value={obdsState.activeFaultCount}
          unit="ACTIVE"
          status={obdsState.activeFaultCount === 0 ? 'NORMAL' : 'WARNING'}
          definition="Number of currently unrecovered anomalous sensor or electrical conditions."
          subtext={`Isolation Confidence: ${obdsState.isolationConfidence}%`}
        />

        <MetricCard
          label="Simulated Detection Latency"
          value={`${avgLatency.toFixed(1)} ms`}
          unit="(Average)"
          status="NORMAL"
          definition="Simulated time delta between software fault injection and diagnostic engine classification: (detectionTime - faultInjectionTime). Strictly simulated."
          subtext="Illustrative simulated software benchmark"
        />

        <MetricCard
          label="System Health Index"
          value={`${healthBreakdown.systemHealthIndex}/100`}
          status={healthBreakdown.status}
          definition="Composite system health index incorporating diagnostic fault penalties."
          subtext={`Diagnostic penalty: ${100 - healthBreakdown.subscores.diagnosticStateScore} pts`}
        />
      </div>

      {/* Subsystem Built-In Test (BIT) Isolation Matrix */}
      <div className="bg-[#0d1322] border border-white/[0.08] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/[0.06]">
          <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 font-mono">
            <ShieldCheck size={15} className="text-cyan-400" />
            Continuous Built-In Test (BIT) Subsystem Status Matrix
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">
            Last BIT Sweep: {formatTimestamp(obdsState.lastBitTimestamp)}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {Object.entries(obdsState.subsystemStatuses).map(([subKey, st]) => (
            <div
              key={subKey}
              className={`p-2.5 rounded-lg border text-center font-mono ${
                st === 'HEALTHY'
                  ? 'bg-[#070b14] border-white/[0.06] text-slate-200'
                  : st === 'ANOMALY'
                  ? 'bg-amber-950/40 border-amber-800 text-amber-300'
                  : 'bg-rose-950/40 border-rose-800 text-rose-300'
              }`}
            >
              <div className="text-[10px] text-slate-400 font-semibold truncate mb-1">
                {subKey.replace(/_/g, ' ')}
              </div>
              <div className="text-xs font-bold flex items-center justify-center gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    st === 'HEALTHY'
                      ? 'bg-emerald-400'
                      : st === 'ANOMALY'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-rose-400 animate-pulse'
                  }`}
                />
                <span>{st}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Bar & Events Table */}
      <div className="bg-[#0d1322] border border-white/[0.08] rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Diagnostic Event Stream ({diagnosticEvents.length} Recorded)
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1 text-xs">
              <Filter size={13} /> Filter:
            </span>
            <div className="flex items-center bg-[#070b14] rounded-lg border border-white/[0.06] p-0.5">
              {['ALL', 'CRITICAL', 'ERROR', 'WARNING', 'INFO'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                    filterSeverity === sev
                      ? 'bg-cyan-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Event List */}
        {filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-white/[0.08] rounded-xl font-mono">
            No diagnostic events matching filter. Inject a fault scenario to generate diagnostic evidence.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredEvents.map((ev) => (
              <div
                key={ev.id}
                className="bg-[#070b14] border border-white/[0.06] rounded-lg p-3.5 space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <StatusBadge status={ev.severity} size="sm" />
                    <span className="text-sm font-semibold text-white">{ev.title}</span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-white/[0.06]">
                      {ev.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-slate-400">{formatTimestamp(ev.timestamp)}</span>
                    <StatusBadge status={ev.status} size="sm" showIcon={false} />
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">{ev.description}</p>

                {/* Metadata Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-white/[0.04] text-[11px] text-slate-400 font-mono">
                  <div>
                    <span className="text-slate-500">Module: </span>
                    <span className="text-slate-200 font-semibold">{ev.module}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Detection Latency: </span>
                    <span className="text-cyan-400 font-bold">
                      {ev.detectionLatencyMs !== undefined ? `${ev.detectionLatencyMs.toFixed(1)} ms` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Associated Test: </span>
                    <span className="text-amber-300 font-semibold">{ev.testId || 'N/A'}</span>
                  </div>
                </div>

                {/* Root Cause Trace */}
                {ev.rootCauseTrace && ev.rootCauseTrace.length > 0 && (
                  <div className="p-2 rounded bg-slate-900/60 border border-white/[0.04] text-[10px] space-y-0.5 font-mono">
                    <span className="text-slate-400 uppercase font-semibold">Diagnostic Root Cause Trace:</span>
                    {ev.rootCauseTrace.map((rc, idx) => (
                      <p key={idx} className="text-slate-300">
                        → {rc}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
