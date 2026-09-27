import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import {
  FileText,
  Download,
  Search,
} from 'lucide-react';
import { formatTimestamp } from '../utils/formatters';

export const LogsPage: React.FC = () => {
  const { auditLogs, exportLogsData } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [moduleFilter, setModuleFilter] = useState('ALL');

  const filteredLogs = auditLogs.filter((log) => {
    if (severityFilter !== 'ALL' && log.severity !== severityFilter) return false;
    if (moduleFilter !== 'ALL' && log.module !== moduleFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        log.module.toLowerCase().includes(q) ||
        log.eventType.toLowerCase().includes(q) ||
        log.id.toLowerCase().includes(q) ||
        (log.testId && log.testId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const modules = Array.from(new Set(auditLogs.map((l) => l.module)));

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-cyan-400 font-mono font-semibold tracking-widest uppercase mb-1">
            <FileText size={12} />
            <span>08 · SYSTEM LOGS &amp; AUDIT TRAIL</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <span>Audit Trail &amp; Event History Logs</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographically structured event records tracking state transitions, fault triggers, sensor anomalies, and verification proofs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DataSourceBadge source="LOCAL LOG STORE" />
          <button
            onClick={exportLogsData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#0e1628] hover:bg-[#152238] border border-white/[0.12] text-slate-200 text-xs font-mono font-medium transition-colors"
          >
            <Download size={13} />
            <span>EXPORT CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0d1322] border border-white/[0.08] rounded-sm p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search message, module, log ID..."
            className="w-full bg-[#080d1a] border border-white/[0.08] rounded-sm pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-cyan-500 font-mono"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px] font-mono uppercase tracking-wider">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-[#080d1a] border border-white/[0.08] rounded-sm px-2.5 py-1 text-xs text-slate-200 focus:outline-hidden font-mono"
            >
              <option value="ALL">ALL SEVERITIES ({auditLogs.length})</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="ERROR">ERROR</option>
              <option value="WARNING">WARNING</option>
              <option value="NOTICE">NOTICE</option>
              <option value="INFO">INFO</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px] font-mono uppercase tracking-wider">Module:</span>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="bg-[#080d1a] border border-white/[0.08] rounded-sm px-2.5 py-1 text-xs text-slate-200 focus:outline-hidden font-mono"
            >
              <option value="ALL">ALL MODULES</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-[#0d1322] border border-white/[0.08] rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#080d1a] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/[0.08] font-mono">
              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">Log ID</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Module</th>
                <th className="p-3">Event Type</th>
                <th className="p-3">Message</th>
                <th className="p-3">State Transition</th>
                <th className="p-3">Ref ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 font-mono text-xs">
                    No log records match current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 text-slate-400 whitespace-nowrap text-[11px] font-mono tabular-nums">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="p-3 text-cyan-400 font-mono font-medium whitespace-nowrap text-[11px]">
                      {log.id}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <StatusBadge status={log.severity} size="sm" showIcon={false} />
                    </td>
                    <td className="p-3 text-slate-300 font-medium whitespace-nowrap text-xs">
                      {log.module}
                    </td>
                    <td className="p-3 text-slate-400 whitespace-nowrap text-[11px] font-mono">
                      {log.eventType}
                    </td>
                    <td className="p-3 text-slate-200 max-w-md text-xs leading-relaxed">
                      {log.message}
                    </td>
                    <td className="p-3 whitespace-nowrap text-[11px] font-mono">
                      {log.stateBefore && log.stateAfter ? (
                        <span className="text-slate-400">
                          {log.stateBefore} → <strong className="text-cyan-300 font-semibold">{log.stateAfter}</strong>
                        </span>
                      ) : (
                        <span className="text-slate-600">--</span>
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap text-[11px] font-mono">
                      {log.testId ? (
                        <span className="text-amber-400 font-semibold">{log.testId}</span>
                      ) : log.evidenceId ? (
                        <span className="text-emerald-400 font-semibold">{log.evidenceId}</span>
                      ) : (
                        <span className="text-slate-600">--</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
