import React, { useState, useEffect } from 'react';
import { useApp, NavigationPage } from '../../context/AppContext';
import { CommandPalette } from './CommandPalette';
import {
  Play,
  Pause,
  RotateCcw,
  Search,
  Menu,
  Shield,
  Activity,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  StepForward,
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const {
    activePage,
    setActivePage,
    isRunning,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    timeSeconds,
    simulationSpeed,
    setSpeed,
    activeFaults,
    recoverAllFaults,
    sensors,
    operatorProfile,
    annunciator,
    flightTelemetry,
  } = useApp();

  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Global hotkey: Cmd+K or Ctrl+K opens Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeFaultCount = activeFaults.filter((f) => f.active).length;

  // Primary navigation workspaces
  const navItems: Array<{ id: NavigationPage; label: string }> = [
    { id: 'overview', label: 'Flight Cockpit' },
    { id: 'sensors', label: 'Sensors' },
    { id: 'telemetry', label: 'Telemetry' },
    { id: 'state-estimation', label: 'State (EKF)' },
    { id: 'diagnostics', label: 'Diagnostics' },
    { id: 'simulation', label: 'Simulation' },
    { id: 'validation', label: 'Verification' },
  ];

  const handleStepForward = () => {
    if (isRunning) pauseSimulation();
    startSimulation();
    setTimeout(() => {
      pauseSimulation();
    }, 200);
  };

  return (
    <>
      <header className="bg-[#0e1118] border-b border-[#1f2533] text-slate-100 sticky top-0 z-40 select-none">
        <div className="max-w-[1780px] mx-auto px-3 sm:px-5 h-13 flex items-center justify-between gap-3 sm:gap-5">
          
          {/* ZONE 1: AVIONICS UNIT IDENTIFICATION */}
          <div className="flex items-center gap-3 shrink-0">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="lg:hidden p-1.5 rounded-sm bg-[#161b26] border border-[#273042] text-slate-300 hover:text-white transition-colors"
                aria-label="Toggle navigation menu"
              >
                <Menu size={15} />
              </button>
            )}

            <button
              onClick={() => setActivePage('overview')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-7 h-7 rounded-sm bg-[#182030] border border-sky-600/40 flex items-center justify-center text-sky-400">
                <Shield size={15} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-xs tracking-wide text-white uppercase font-mono">
                    AEROSHIELD-155
                  </span>
                  <span className="hidden sm:inline text-[10px] text-slate-400 font-mono">
                    SN-4092-B
                  </span>
                </div>
                <span className="hidden sm:inline text-[10px] text-slate-500 font-mono tracking-tight leading-none">
                  GNC Telemetry Console
                </span>
              </div>
            </button>

            {/* Operator Station Badge */}
            <div className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-[#121722] border border-[#212c3f] font-mono text-[10px] text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sky-400 font-bold">{operatorProfile.callsign}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">{flightTelemetry.phaseCode}</span>
            </div>
          </div>

          {/* ZONE 2: PRIMARY WORKSPACES */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#090b10] p-0.5 rounded-sm border border-[#1d2330] text-xs">
            {navItems.map((item) => {
              const isSelected = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`px-3 py-1 rounded-sm whitespace-nowrap transition-colors text-xs ${
                    isSelected
                      ? 'bg-[#1b2230] text-white font-semibold border border-[#2e3b52]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#121620]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* ZONE 3: FLIGHT TELEMETRY CLOCK & CONTROLS */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Command Palette Trigger */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#121620] border border-[#202736] hover:border-slate-500 text-slate-300 text-xs transition-colors"
              title="Search modules and commands (Cmd+K)"
            >
              <Search size={12} className="text-slate-400" />
              <span className="font-mono text-[11px] text-slate-400">⌘K</span>
            </button>

            {/* Flight Clock Deck */}
            <div className="flex items-center bg-[#090b10] p-0.5 rounded-sm border border-[#1f2533]">
              {/* Play / Pause Toggle */}
              {isRunning ? (
                <button
                  onClick={pauseSimulation}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-mono font-medium bg-amber-950/60 text-amber-300 hover:bg-amber-900/70 border border-amber-600/50 transition-colors"
                  title="Pause Telemetry Clock"
                >
                  <Pause size={11} />
                  <span className="font-semibold text-[11px]">PAUSE</span>
                </button>
              ) : (
                <button
                  onClick={startSimulation}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-mono font-medium bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/70 border border-emerald-600/50 transition-colors"
                  title="Run Telemetry Clock"
                >
                  <Play size={11} />
                  <span className="font-semibold text-[11px]">RUN</span>
                </button>
              )}

              {/* Step +1s */}
              <button
                onClick={handleStepForward}
                className="hidden sm:flex items-center p-1 rounded-sm text-slate-400 hover:text-white hover:bg-[#151a24] transition-colors ml-0.5"
                title="Step forward +1s"
              >
                <StepForward size={12} />
              </button>

              {/* Simulation Clock Display */}
              <div className="px-2.5 py-0.5 text-xs font-mono text-sky-300 tabular-nums border-l border-[#1f2533] ml-1">
                T+{timeSeconds.toFixed(1)}s
              </div>

              {/* Speed Multiplier Segmented Tabs */}
              <div className="hidden sm:flex items-center border-l border-[#1f2533] pl-1 ml-1 text-xs font-mono">
                {[1, 2].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setSpeed(spd)}
                    className={`px-1.5 py-0.5 rounded-xs text-[10px] transition-colors ${
                      simulationSpeed === spd
                        ? 'bg-sky-700 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Emergency Fault Status & Clear */}
            {activeFaultCount > 0 ? (
              <button
                onClick={recoverAllFaults}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-mono font-semibold bg-rose-950/70 border border-rose-600 text-rose-300 hover:bg-rose-900/80 transition-colors"
                title="Clear active fault injections"
              >
                <AlertTriangle size={12} />
                <span>FAULT ({activeFaultCount})</span>
              </button>
            ) : (
              <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#121620] border border-[#202736] text-[11px] font-mono text-emerald-400">
                <CheckCircle2 size={12} />
                <span>LINK OK</span>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Global Command Palette Dialog */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </>
  );
};
