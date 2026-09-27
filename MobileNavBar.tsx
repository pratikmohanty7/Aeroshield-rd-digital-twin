import React, { useState } from 'react';
import { useApp, NavigationPage } from '../../context/AppContext';
import { soundFX } from '../../utils/audioFeedback';
import {
  LayoutDashboard,
  Cpu,
  Box,
  AlertTriangle,
  Menu,
  X,
  Radio,
  PlayCircle,
  CheckSquare,
  FileText,
  Network,
  BookOpen,
  FileCheck,
  ChevronRight,
  Shield,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface MobileNavBarProps {
  onOpenSidebar?: () => void;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({ onOpenSidebar }) => {
  const {
    activePage,
    setActivePage,
    obdsState,
    activeFaults,
    validationTests,
    recoverAllFaults,
    demoRunning,
    startDemo,
    stopDemo,
  } = useApp();

  const [showMoreSheet, setShowMoreSheet] = useState(false);

  const passedTests = validationTests.filter((t) => t.status === 'SIMULATED PASS').length;
  const activeFaultCount = activeFaults.filter((f) => f.active).length;

  const primaryTabs: Array<{
    id: NavigationPage;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    badge?: number;
  }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'sensors', label: 'Sensor Lab', icon: Cpu },
    { id: 'digital-twin', label: 'Digital Twin', icon: Box },
    {
      id: 'diagnostics',
      label: 'Diagnostics',
      icon: AlertTriangle,
      badge: obdsState.activeFaultCount > 0 ? obdsState.activeFaultCount : undefined,
    },
  ];

  const moreItems: Array<{
    id: NavigationPage;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    badge?: string;
  }> = [
    { id: 'architecture', label: '02 Hardware Arch', sublabel: '10-Stage check & block diagram', icon: Network },
    { id: 'telemetry', label: '04 Telemetry', sublabel: 'RF packet downlink & metrics', icon: Radio },
    { id: 'state-estimation', label: '05 State Estimation', sublabel: 'Complementary / EKF fusion', icon: Box },
    { id: 'map', label: '07 Geospatial Sim', sublabel: 'Synthetic trajectory visualization', icon: Box },
    {
      id: 'simulation',
      label: '09 Simulation & Faults',
      sublabel: 'Deterministic scenarios & faults',
      icon: PlayCircle,
      badge: activeFaultCount > 0 ? `${activeFaultCount} active` : undefined,
    },
    {
      id: 'validation',
      label: '10 Validation Suite',
      sublabel: 'Automated test suite & evidence',
      icon: CheckSquare,
      badge: `${passedTests}/7 Pass`,
    },
    { id: 'logs', label: '11 Evidence & Logs', sublabel: 'Deterministic audit event trail', icon: FileText },
    { id: 'gnc-research', label: '12 GNC Research', sublabel: 'Guidance, Nav & Control model', icon: Box },
    { id: 'caa-research', label: '13 CAA Assembly', sublabel: 'Canard actuation architecture', icon: Network },
    { id: 'smart-fuze', label: '14 Smart Fuze', sublabel: 'Multi-mode ESAD interlocks', icon: Shield },
    { id: 'power-swapc', label: '15 Power & SWaP-C', sublabel: 'Power budget & SWaP-C matrix', icon: RotateCcw },
    { id: 'environment', label: '16 Environment & Shock', sublabel: 'Gun-launch 20,000G envelope', icon: Shield },
    { id: 'traceability', label: '17 PS Traceability', sublabel: 'PS: 26098 coverage matrix', icon: FileCheck },
    { id: 'research', label: '18 Research & References', sublabel: 'Engineering papers & math models', icon: BookOpen },
    { id: 'prototype-status', label: '19 Prototype Status', sublabel: 'TRL & verification scope', icon: FileCheck },
  ];

  return (
    <>
      {/* Bottom Sticky Mobile Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080c16]/95 backdrop-blur-xl border-t border-white/[0.08] shadow-[0_-8px_30px_rgba(0,0,0,0.7)] px-2 py-1.5"
        style={{ paddingBottom: 'calc(0.375rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="grid grid-cols-5 gap-1 items-center max-w-md mx-auto">
          {primaryTabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activePage === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundFX.chipSelect();
                  setActivePage(tab.id);
                  setShowMoreSheet(false);
                }}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
                  isSelected
                    ? 'text-cyan-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 active:scale-95'
                }`}
              >
                {/* Active indicator bar */}
                {isSelected && (
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-[2.5px] bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                )}

                <div className="relative">
                  <Icon size={19} className={isSelected ? 'text-cyan-400' : 'text-slate-400'} />
                  {tab.badge && tab.badge > 0 ? (
                    <span className="absolute -top-1 -right-2 px-1.5 py-0.2 bg-rose-500 text-white text-[9px] font-bold rounded-full font-mono">
                      {tab.badge}
                    </span>
                  ) : null}
                </div>

                <span className="text-[10px] tracking-tight mt-1 truncate max-w-full font-sans">
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* More button */}
          <button
            onClick={() => {
              soundFX.click();
              setShowMoreSheet(!showMoreSheet);
            }}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
              showMoreSheet || !primaryTabs.some((t) => t.id === activePage)
                ? 'text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 active:scale-95'
            }`}
          >
            <div className="relative">
              {showMoreSheet ? <X size={19} /> : <Menu size={19} />}
              {activeFaultCount > 0 && !showMoreSheet && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-ping" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-1 font-sans">
              {showMoreSheet ? 'Close' : 'More'}
            </span>
          </button>
        </div>
      </nav>

      {/* Slide-Up Bottom Sheet for Additional Pages on Mobile */}
      {showMoreSheet && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-[#0b1020] border-t border-white/[0.12] rounded-t-3xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl safe-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle & Header */}
            <div className="p-4 pb-2 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Shield size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-sans">Engineering Workbenches</h3>
                  <p className="text-[11px] text-slate-400 font-mono">AeroShield R&amp;D Navigation</p>
                </div>
              </div>

              <button
                onClick={() => setShowMoreSheet(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Actions in Mobile Drawer */}
            <div className="px-4 py-2.5 bg-slate-900/60 border-b border-white/[0.06] flex items-center gap-2">
              {activeFaultCount > 0 && (
                <button
                  onClick={() => {
                    soundFX.phaseStep();
                    recoverAllFaults();
                    setShowMoreSheet(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-semibold"
                >
                  <RotateCcw size={13} />
                  <span>Recover All Faults</span>
                </button>
              )}

              <button
                onClick={() => {
                  soundFX.phaseStep();
                  if (demoRunning) {
                    stopDemo();
                  } else {
                    startDemo();
                  }
                  setShowMoreSheet(false);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold ${
                  demoRunning
                    ? 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
                    : 'bg-cyan-950/70 border border-cyan-500/40 text-cyan-300'
                }`}
              >
                <Sparkles size={13} />
                <span>{demoRunning ? 'Stop Interactive Demo' : 'Start 60s Demo'}</span>
              </button>
            </div>

            {/* Scrollable list of modules */}
            <div className="overflow-y-auto p-3 space-y-1.5 divide-y divide-white/[0.04]">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isSelected = activePage === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      soundFX.chipSelect();
                      setActivePage(item.id);
                      setShowMoreSheet(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-cyan-950/40 border border-cyan-500/50 text-white'
                        : 'bg-slate-900/40 hover:bg-slate-800/60 text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg border ${
                          isSelected
                            ? 'bg-cyan-600 text-white border-cyan-400'
                            : 'bg-slate-800/80 text-slate-400 border-white/[0.06]'
                        }`}
                      >
                        <Icon size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white font-sans">{item.label}</div>
                        <div className="text-[11px] text-slate-400 font-sans">{item.sublabel}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-white/[0.08]">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight size={14} className="text-slate-500" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
