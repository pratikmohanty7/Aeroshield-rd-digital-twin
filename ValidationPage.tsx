import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ValidationStatus, ValidationTestCase } from '../types/validation';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { soundFX } from '../utils/audioFeedback';
import {
  CheckSquare,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Download,
  Filter,
  Copy,
} from 'lucide-react';

export const ValidationPage: React.FC = () => {
  const {
    validationTests,
    testHistory,
    runValidationTest,
    runAllValidationTests,
    resetValidationSuite,
    exportValidationData,
    activeFaults,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedTestId, setSelectedTestId] = useState<string>('VT-01');
  const [copiedEvidence, setCopiedEvidence] = useState<string | null>(null);

  // Compute test summary counts
  const summaryCounts = useMemo(() => {
    const total = validationTests.length;
    const passed = validationTests.filter((t) => t.status === 'SIMULATED PASS').length;
    const failed = validationTests.filter((t) => t.status === 'SIMULATED FAIL').length;
    const running = validationTests.filter((t) => t.status === 'RUNNING').length;
    const pending = validationTests.filter((t) => t.status === 'PENDING').length;
    const notTested = validationTests.filter((t) => t.status === 'NOT TESTED').length;
    return { total, passed, failed, running, pending, notTested };
  }, [validationTests]);

  const filteredTests = useMemo(() => {
    if (statusFilter === 'ALL') return validationTests;
    return validationTests.filter((t) => t.status === statusFilter);
  }, [validationTests, statusFilter]);

  const handleCopyEvidence = (evidenceId: string) => {
    navigator.clipboard?.writeText(evidenceId);
    setCopiedEvidence(evidenceId);
    setTimeout(() => setCopiedEvidence(null), 2000);
  };

  const renderStatusBadge = (status: ValidationStatus) => {
    switch (status) {
      case 'SIMULATED PASS':
        return (
          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
            SIMULATED PASS
          </span>
        );
      case 'SIMULATED FAIL':
        return (
          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-rose-400 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.7)]" />
            SIMULATED FAIL
          </span>
        );
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-amber-400 uppercase tracking-wider">
            <Loader2 size={12} className="animate-spin text-amber-400" />
            RUNNING
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-cyan-400 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            PENDING
          </span>
        );
      case 'REQUIRES HARDWARE TEST':
        return (
          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-purple-400 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            REQUIRES HW TEST
          </span>
        );
      case 'NOT TESTED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            NOT TESTED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 font-sans max-w-[1640px] mx-auto text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono font-semibold uppercase tracking-wider mb-1">
            <CheckSquare size={14} />
            <span>Software Verification &amp; Invariants Suite</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>Formal Software Invariant Verification</span>
            <span className="text-xs text-slate-400 font-mono font-normal">
              · 7 Formal Safety Proofs
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-4xl">
            Software-in-the-Loop simulation tests. Deterministic mathematical evaluation of sensor anomalies and recovery with cryptographic SHA-256 evidence.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <DataSourceBadge source="SOFTWARE INVARIANT TESTS" />
          <button
            onClick={() => {
              soundFX.click();
              runAllValidationTests();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            <Play size={12} className="fill-current" />
            <span>Run All Tests</span>
          </button>
          <button
            onClick={() => {
              soundFX.click();
              resetValidationSuite();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/[0.08] text-slate-300 text-xs transition-colors"
            title="Reset all test cases to NOT TESTED"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
          <button
            onClick={exportValidationData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/[0.08] text-slate-300 text-xs transition-colors"
          >
            <Download size={12} />
            <span>Export Evidence</span>
          </button>
        </div>
      </div>

      {/* Epistemological Integrity Notice */}
      <div className="bg-[#0b101d] border border-cyan-500/20 rounded-xl p-3.5 flex items-start gap-3">
        <ShieldCheck size={18} className="text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-semibold text-cyan-300 tracking-wide uppercase font-mono text-[11px]">
            Validation Boundary: Software Simulation Tests Only
          </div>
          <p className="text-slate-300 leading-relaxed font-sans text-xs">
            Results marked as <strong className="text-emerald-400 font-mono">SIMULATED PASS</strong> confirm algorithm and software logic integrity against deterministic inputs within the simulated environment. They do not constitute military flight clearance or physical environmental qualification.
          </p>
        </div>
      </div>

      {/* Test Summary Dashboard Card */}
      <div className="bg-[#0d1322] border border-white/[0.08] rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider">
              7 Core Invariants
            </div>
            <div className="text-sm font-semibold text-slate-200 font-mono">
              <span className="text-emerald-400 font-bold">{summaryCounts.passed}</span> / 7 SIMULATED PASS
            </div>
          </div>

          {/* Status Indicators (Zero-Pill discipline) */}
          <div className="flex items-center gap-4 flex-wrap text-xs font-mono">
            <span className="text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {summaryCounts.passed} PASS
            </span>
            <span className="text-rose-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              {summaryCounts.failed} FAIL
            </span>
            <span className="text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {summaryCounts.running} RUNNING
            </span>
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              {summaryCounts.notTested} NOT TESTED
            </span>
          </div>
        </div>

        {/* Linear Suite Progress Bar */}
        <div className="mt-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Suite Execution Completion</span>
            <span className="font-bold text-cyan-400">
              {Math.round(((summaryCounts.passed + summaryCounts.failed) / summaryCounts.total) * 100)}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-[#070b14] rounded-full overflow-hidden flex border border-white/[0.04]">
            <div
              className="bg-emerald-500 transition-all duration-300"
              style={{ width: `${(summaryCounts.passed / summaryCounts.total) * 100}%` }}
            />
            <div
              className="bg-rose-500 transition-all duration-300"
              style={{ width: `${(summaryCounts.failed / summaryCounts.total) * 100}%` }}
            />
            <div
              className="bg-amber-500 transition-all duration-300 animate-pulse"
              style={{ width: `${(summaryCounts.running / summaryCounts.total) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs">
          <Filter size={14} className="text-slate-400" />
          <span className="text-slate-400 mr-1">Filter:</span>
          {['ALL', 'SIMULATED PASS', 'SIMULATED FAIL', 'RUNNING', 'NOT TESTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors ${
                statusFilter === st
                  ? 'bg-cyan-600 text-white font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-white/[0.06]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing <span className="text-cyan-300 font-bold">{filteredTests.length}</span> of 7 tests
        </div>
      </div>

      {/* 7 Core Test Cases Grid */}
      <div className="space-y-4">
        {filteredTests.map((test) => {
          const isSelected = selectedTestId === test.testId;
          const isRunning = test.status === 'RUNNING';

          const isStimulusActive =
            (test.testId === 'VT-01' && activeFaults.length === 0) ||
            (test.testId === 'VT-02' && activeFaults.some((f) => f.type === 'GNSS_LOSS' || f.type === 'SENSOR_DROPOUT')) ||
            (test.testId === 'VT-03' && activeFaults.some((f) => f.type === 'STALE_DATA')) ||
            (test.testId === 'VT-04' && activeFaults.some((f) => f.type === 'IMU_BIAS' || f.type === 'SENSOR_BIAS' || f.type === 'SENSOR_DRIFT')) ||
            (test.testId === 'VT-05' && activeFaults.some((f) => f.type === 'SENSOR_DISAGREEMENT')) ||
            (test.testId === 'VT-06' && activeFaults.some((f) => f.type === 'COMMUNICATION_INTERRUPTION' || f.type === 'POWER_DEGRADATION')) ||
            (test.testId === 'VT-07' && activeFaults.length > 0);

          return (
            <div
              key={test.testId}
              onClick={() => setSelectedTestId(test.testId)}
              className={`bg-[#0d1322] border rounded-xl p-4 sm:p-5 transition-all ${
                isSelected
                  ? 'border-cyan-500/80 shadow-xs ring-1 ring-cyan-500/30'
                  : isStimulusActive
                  ? 'border-amber-500/40 bg-[#0f1526]'
                  : 'border-white/[0.08] hover:border-slate-700'
              }`}
            >
              {/* Card Top: ID, Name, Status, Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono font-bold text-xs">
                    {test.testId}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2 flex-wrap">
                      <span>{test.name}</span>
                      {isStimulusActive && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-400 font-medium">
                          <AlertTriangle size={11} className="text-amber-400" />
                          Live Stimulus Active
                        </span>
                      )}
                    </h3>
                    <div className="text-[11px] text-slate-400 uppercase tracking-wider font-mono mt-0.5">
                      Category: <span className="text-cyan-400">{test.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {renderStatusBadge(test.status)}

                  <button
                    disabled={isRunning}
                    onClick={(e) => {
                      e.stopPropagation();
                      soundFX.click();
                      runValidationTest(test.testId);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                      isRunning
                        ? 'bg-amber-950 border border-amber-700 text-amber-300 cursor-not-allowed'
                        : isStimulusActive
                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-xs'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs'
                    }`}
                  >
                    {isRunning ? (
                      <>
                        <Loader2 size={12} className="animate-spin text-amber-300" />
                        <span>RUNNING...</span>
                      </>
                    ) : (
                      <>
                        <Play size={12} className="fill-current" />
                        <span>RUN TEST</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Card Body: Objective, Input, Expected, Observed */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Objective */}
                <div className="bg-[#070b14] border border-white/[0.04] rounded-lg p-3 space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    OBJECTIVE
                  </div>
                  <p className="text-slate-300 leading-relaxed text-xs">{test.objective}</p>
                </div>

                {/* Input Condition */}
                <div className="bg-[#070b14] border border-white/[0.04] rounded-lg p-3 space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    INPUT CONDITION
                  </div>
                  <p className="text-slate-300 leading-relaxed text-xs font-mono">{test.inputCondition}</p>
                </div>

                {/* Expected Result */}
                <div className="bg-[#070b14] border border-white/[0.04] rounded-lg p-3 space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    EXPECTED RESULT
                  </div>
                  <p className="text-slate-300 leading-relaxed text-xs font-mono">{test.expectedResult}</p>
                </div>

                {/* Observed Result */}
                <div
                  className={`rounded-lg p-3 space-y-1 border ${
                    test.status === 'SIMULATED PASS'
                      ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                      : test.status === 'SIMULATED FAIL'
                      ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                      : test.status === 'RUNNING'
                      ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                      : 'bg-[#070b14] border-white/[0.04] text-slate-400'
                  }`}
                >
                  <div className="text-[10px] font-mono uppercase tracking-wider font-bold flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          test.status === 'SIMULATED PASS'
                            ? 'bg-emerald-400'
                            : test.status === 'SIMULATED FAIL'
                            ? 'bg-rose-400'
                            : test.status === 'RUNNING'
                            ? 'bg-amber-400 animate-ping'
                            : 'bg-slate-500'
                        }`}
                      />
                      OBSERVED RESULT
                    </div>
                    {test.timestamp && (
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(test.timestamp).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-xs leading-relaxed">{test.observedResult}</p>
                </div>
              </div>

              {/* Card Footer: Timestamp, Evidence ID, Proof Tag */}
              <div className="mt-3.5 pt-3 border-t border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-slate-400">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-slate-500" />
                    <span>Run Time:</span>
                    <span className="text-slate-300">
                      {test.timestamp ? new Date(test.timestamp).toLocaleTimeString() : 'Not executed'}
                    </span>
                  </div>

                  {test.evidenceId && (
                    <div className="flex items-center gap-1.5">
                      <FileText size={12} className="text-cyan-400" />
                      <span>Evidence ID:</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyEvidence(test.evidenceId!);
                        }}
                        className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200 bg-slate-900 px-1.5 py-0.5 rounded border border-white/[0.08]"
                        title="Click to copy evidence identifier"
                      >
                        <span>{test.evidenceId}</span>
                        <Copy size={10} />
                      </button>
                      {copiedEvidence === test.evidenceId && (
                        <span className="text-[10px] text-emerald-400">Copied!</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-400">
                  SIL Simulation Invariant Proof
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Test History Section */}
      <div className="bg-[#0d1322] border border-white/[0.08] rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <FileText size={16} className="text-cyan-400" />
              <span>Test Execution History</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">
              Audit trail of every software verification test executed during this session.
            </p>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Total Executions: <span className="text-cyan-300 font-bold">{testHistory.length}</span>
          </div>
        </div>

        {testHistory.length === 0 ? (
          <div className="text-center py-8 text-slate-400 font-sans text-xs space-y-2">
            <Clock size={24} className="mx-auto text-slate-500" />
            <p>No tests have been executed in this session yet.</p>
            <p className="text-slate-400 font-mono">
              Click <strong className="text-cyan-400">RUN TEST</strong> on any of the 7 test cases above to evaluate simulation invariants.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/[0.08] text-slate-400 text-[11px] uppercase tracking-wider">
                  <th className="pb-2.5 font-semibold">Test ID</th>
                  <th className="pb-2.5 font-semibold">Test Name / Scenario</th>
                  <th className="pb-2.5 font-semibold">Run Time</th>
                  <th className="pb-2.5 font-semibold">Result</th>
                  <th className="pb-2.5 font-semibold">Evidence ID</th>
                  <th className="pb-2.5 font-semibold">Observed Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {testHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 font-bold text-cyan-300">{item.testId}</td>
                    <td className="py-2.5 text-slate-200">
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-[10px] text-slate-400">{item.scenario}</div>
                    </td>
                    <td className="py-2.5 text-slate-400">
                      {new Date(item.runTime).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5">{renderStatusBadge(item.result)}</td>
                    <td className="py-2.5 font-mono text-cyan-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-white/[0.08] text-[11px]">
                        {item.evidenceId}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-300 max-w-[340px] truncate text-[11px]" title={item.observed}>
                      {item.observed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
