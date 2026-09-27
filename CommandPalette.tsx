import React, { useState, useEffect, useMemo } from 'react';
import { useApp, NavigationPage } from '../../context/AppContext';
import { SensorType } from '../../types/sensor';
import { soundFX } from '../../utils/audioFeedback';
import {
  Search,
  LayoutDashboard,
  Cpu,
  Radio,
  Box,
  AlertTriangle,
  PlayCircle,
  CheckSquare,
  FileText,
  Map,
  RotateCcw,
  Play,
  Pause,
  Zap,
  Download,
  X,
  ArrowRight,
  Compass,
  Navigation,
  Gauge,
  Thermometer,
  Flame,
  Target,
} from 'lucide-react';

interface CommandItem {
  id: string;
  category: 'NAVIGATION' | 'SENSORS' | 'SIMULATION' | 'DIAGNOSTICS' | 'ACTIONS';
  title: string;
  description: string;
  shortcut?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSensor?: (sensorId: SensorType) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectSensor,
}) => {
  const {
    setActivePage,
    isRunning,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    setSpeed,
    injectFault,
    recoverAllFaults,
    startDemo,
    stopDemo,
    demoRunning,
    runAllValidationTests,
    exportSessionData,
    exportLogsData,
    setFlightPhase,
    setGuidanceMode,
    setMasterArm,
    toggleEccmAntiJam,
    executeBuiltInTest,
    executeEmergencyFts,
    smartFuze,
    annunciator,
    setTacticalTarget,
    toggleAudioAnnunciator,
    acknowledgeMasterWarning,
  } = useApp();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Command inventory
  const commands: CommandItem[] = useMemo(() => {
    return [
      // Navigation
      {
        id: 'nav-overview',
        category: 'NAVIGATION',
        title: 'Go to Cockpit Overview',
        description: 'Flight trajectory, telemetry overview, and subsystem invariants',
        shortcut: 'G O',
        icon: LayoutDashboard,
        action: () => setActivePage('overview'),
      },
      {
        id: 'nav-sensors',
        category: 'NAVIGATION',
        title: 'Go to Sensor Laboratory',
        description: 'Live multi-channel oscilloscope, waveform analyzer, and calibrations',
        shortcut: 'G S',
        icon: Cpu,
        action: () => setActivePage('sensors'),
      },
      {
        id: 'nav-telemetry',
        category: 'NAVIGATION',
        title: 'Go to Telemetry Bus',
        description: 'MIL-STD-1553 / ARINC packet stream, frame rates, and latency',
        shortcut: 'G T',
        icon: Radio,
        action: () => setActivePage('telemetry'),
      },
      {
        id: 'nav-twin',
        category: 'NAVIGATION',
        title: 'Go to Digital Twin',
        description: 'Interactive 3D missile model, aerodynamic attitude, and EKF state',
        shortcut: 'G D',
        icon: Box,
        action: () => setActivePage('digital-twin'),
      },
      {
        id: 'nav-diagnostics',
        category: 'NAVIGATION',
        title: 'Go to Diagnostics & OBDS',
        description: 'On-Board Diagnostic System, fault isolation, and invariant verification',
        shortcut: 'G X',
        icon: AlertTriangle,
        action: () => setActivePage('diagnostics'),
      },
      {
        id: 'nav-simulation',
        category: 'NAVIGATION',
        title: 'Go to Simulation Control',
        description: 'Deterministic scenario engine and dynamic parameters',
        shortcut: 'G M',
        icon: PlayCircle,
        action: () => setActivePage('simulation'),
      },
      {
        id: 'nav-validation',
        category: 'NAVIGATION',
        title: 'Go to Formal Validation',
        description: 'MIL-STD-810H & DO-178C test suites and cryptographic proof hashes',
        shortcut: 'G V',
        icon: CheckSquare,
        action: () => setActivePage('validation'),
      },
      {
        id: 'nav-logs',
        category: 'NAVIGATION',
        title: 'Go to Audit Logs',
        description: 'Immutable system event log and operator audit trail',
        shortcut: 'G L',
        icon: FileText,
        action: () => setActivePage('logs'),
      },
      {
        id: 'nav-map',
        category: 'NAVIGATION',
        title: 'Go to Tactical Trajectory Map',
        description: 'Live geographic coordinates, waypoints, and flight corridor',
        shortcut: 'G P',
        icon: Map,
        action: () => setActivePage('map'),
      },

      // Sensor Switching
      {
        id: 'sensor-imu',
        category: 'SENSORS',
        title: 'Inspect IMU / Inertial Unit',
        description: 'Tri-axial accelerometer, rate gyros, and gravity vector',
        icon: Compass,
        action: () => {
          setActivePage('sensors');
          onSelectSensor?.('IMU');
        },
      },
      {
        id: 'sensor-gnss',
        category: 'SENSORS',
        title: 'Inspect GNSS Receiver',
        description: 'Constellation lock, 3D ellipsoid altitude, and HDOP precision',
        icon: Navigation,
        action: () => {
          setActivePage('sensors');
          onSelectSensor?.('GNSS');
        },
      },
      {
        id: 'sensor-pressure',
        category: 'SENSORS',
        title: 'Inspect Barometric Altimeter',
        description: 'Static air data transducer and baro altitude correlation',
        icon: Gauge,
        action: () => {
          setActivePage('sensors');
          onSelectSensor?.('PRESSURE');
        },
      },
      {
        id: 'sensor-temp',
        category: 'SENSORS',
        title: 'Inspect Thermal Bus',
        description: 'Processor PCB core temperature and chassis thermal gradient',
        icon: Thermometer,
        action: () => {
          setActivePage('sensors');
          onSelectSensor?.('TEMPERATURE');
        },
      },
      {
        id: 'sensor-power',
        category: 'SENSORS',
        title: 'Inspect 24V Power Bus',
        description: 'Main rail voltage, current consumption, and battery health',
        icon: Zap,
        action: () => {
          setActivePage('sensors');
          onSelectSensor?.('POWER');
        },
      },

      // Simulation Controls
      {
        id: 'sim-toggle',
        category: 'SIMULATION',
        title: isRunning ? 'Pause Simulation Clock' : 'Start / Resume Simulation Clock',
        description: isRunning ? 'Freeze real-time data streaming' : 'Stream at 10 Hz display / 200 Hz reference',
        shortcut: 'Space',
        icon: isRunning ? Pause : Play,
        action: () => (isRunning ? pauseSimulation() : startSimulation()),
      },
      {
        id: 'sim-speed-1',
        category: 'SIMULATION',
        title: 'Set Simulation Speed: 1x (Real-Time)',
        description: 'Standard 1.0x physical time step',
        icon: PlayCircle,
        action: () => setSpeed(1),
      },
      {
        id: 'sim-speed-2',
        category: 'SIMULATION',
        title: 'Set Simulation Speed: 2x (Accelerated)',
        description: 'Fast-forward simulation at double rate',
        icon: PlayCircle,
        action: () => setSpeed(2),
      },
      {
        id: 'sim-speed-5',
        category: 'SIMULATION',
        title: 'Set Simulation Speed: 5x (High-Speed)',
        description: 'Rapid stress-test simulation step',
        icon: PlayCircle,
        action: () => setSpeed(5),
      },
      {
        id: 'sim-reset',
        category: 'SIMULATION',
        title: 'Reset Simulation to T=0',
        description: 'Clear time elapsed and restore initial conditions',
        shortcut: 'R',
        icon: RotateCcw,
        action: () => resetSimulation(),
      },
      {
        id: 'sim-demo',
        category: 'SIMULATION',
        title: demoRunning ? 'Stop Interactive Demo Walkthrough' : 'Run 16-Step Interactive Demo Walkthrough',
        description: 'Automated sequence showing fault injection, invariant detection, and recovery',
        icon: Compass,
        action: () => (demoRunning ? stopDemo() : startDemo()),
      },

      // Diagnostics & Faults
      {
        id: 'fault-recover',
        category: 'DIAGNOSTICS',
        title: 'Recover All Faults & Reset Envelopes',
        description: 'Restore nominal operating baseline across all sensor channels',
        shortcut: 'Esc',
        icon: RotateCcw,
        action: () => recoverAllFaults(),
      },
      {
        id: 'fault-gnss',
        category: 'DIAGNOSTICS',
        title: 'Inject Fault: GNSS Constellation Loss',
        description: 'Simulate satellite loss of lock (0 SVs, HDOP invalid)',
        icon: AlertTriangle,
        action: () => {
          injectFault('GNSS_LOSS');
          setActivePage('sensors');
        },
      },
      {
        id: 'fault-imu',
        category: 'DIAGNOSTICS',
        title: 'Inject Fault: IMU Static Bias (+0.55G)',
        description: 'Force proof-mass offset outside ±0.15G nominal boundary',
        icon: AlertTriangle,
        action: () => {
          injectFault('IMU_BIAS');
          setActivePage('sensors');
        },
      },
      {
        id: 'fault-freeze',
        category: 'DIAGNOSTICS',
        title: 'Inject Fault: Barometer FIFO Freeze (Stale Data)',
        description: 'Freeze transducer readings past timeout threshold (>1.8s)',
        icon: AlertTriangle,
        action: () => {
          injectFault('STALE_DATA', 'PRESSURE');
          setActivePage('sensors');
        },
      },
      {
        id: 'fault-power',
        category: 'DIAGNOSTICS',
        title: 'Inject Fault: Power Bus Sag (19.4V)',
        description: 'Drop 24V supply to undervoltage alarm trigger',
        icon: AlertTriangle,
        action: () => {
          injectFault('POWER_DEGRADATION');
          setActivePage('sensors');
        },
      },

      // Actions & Exports
      {
        id: 'act-run-all-tests',
        category: 'ACTIONS',
        title: 'Run All 7 Automated Verification Tests',
        description: 'Execute full DO-178C test matrix and log cryptographic hashes',
        icon: CheckSquare,
        action: () => {
          setActivePage('validation');
          runAllValidationTests();
        },
      },
      {
        id: 'act-export-session',
        category: 'ACTIONS',
        title: 'Export Full Test Session Report (JSON)',
        description: 'Download complete state estimation, sensor data, and OBDS results',
        icon: Download,
        action: () => exportSessionData(),
      },
      {
        id: 'act-export-logs',
        category: 'ACTIONS',
        title: 'Export System Audit Logs (CSV)',
        description: 'Download comma-separated audit event timeline',
        icon: Download,
        action: () => exportLogsData(),
      },

      // Operator Controls & Weapon Interlocks
      {
        id: 'op-master-arm',
        category: 'ACTIONS',
        title: smartFuze.armState === 'SAFE' ? 'Operator: ARM Weapon & Fuze' : 'Operator: DISARM Weapon (Safe)',
        description: 'Toggle dual-redundant Electronic Safe and Arming Device (ESAD)',
        icon: Zap,
        action: () => setMasterArm(smartFuze.armState === 'SAFE'),
      },
      {
        id: 'op-eccm-toggle',
        category: 'ACTIONS',
        title: annunciator.eccmActive ? 'Operator: Disengage CRPA Anti-Jam' : 'Operator: Engage CRPA Anti-Jam Beamforming',
        description: '4-element adaptive spatial nulling against high-power GPS jamming',
        icon: Radio,
        action: () => toggleEccmAntiJam(),
      },
      {
        id: 'op-master-bit',
        category: 'ACTIONS',
        title: 'Operator: Run 50ms Master Built-In-Test (BIT)',
        description: 'Comprehensive diagnostic sweep across all 7 avionics subsystem invariants',
        icon: CheckSquare,
        action: () => executeBuiltInTest(),
      },
      {
        id: 'op-emergency-fts',
        category: 'ACTIONS',
        title: 'Operator: Trigger Emergency Flight Termination (FTS Abort)',
        description: 'Cut motor thrust, deploy recovery drogue, and flag emergency safety telemetry',
        icon: AlertTriangle,
        action: () => executeEmergencyFts(),
      },
      {
        id: 'op-guidance-apn',
        category: 'ACTIONS',
        title: 'Operator: Set Guidance Mode to Augmented PN',
        description: 'Proportional navigation with aerodynamic gravity compensation',
        icon: Compass,
        action: () => setGuidanceMode('AUGMENTED_PN'),
      },
      {
        id: 'op-guidance-ballistic',
        category: 'ACTIONS',
        title: 'Operator: Set Guidance Mode to Ballistic Fallback',
        description: 'Inertially trimmed flight corridor without seeker dependency',
        icon: Compass,
        action: () => setGuidanceMode('BALLISTIC_FALLBACK'),
      },
      {
        id: 'op-phase-terminal',
        category: 'ACTIONS',
        title: 'Operator: Scrub Flight Phase to Terminal Divert (T+55s)',
        description: 'Synchronize all modules into high-G canard divert and seeker homing regime',
        icon: Flame,
        action: () => setFlightPhase('PHASE_TERMINAL'),
      },
      {
        id: 'op-phase-airburst',
        category: 'ACTIONS',
        title: 'Operator: Scrub Flight Phase to FMCW Airburst (T+72s)',
        description: 'Synchronize 77 GHz radar height-of-burst trigger standoff',
        icon: Target,
        action: () => setFlightPhase('PHASE_FUZE'),
      },
      {
        id: 'op-audio-toggle',
        category: 'ACTIONS',
        title: annunciator.audioEnabled ? 'Operator: Mute Acoustic Sound FX' : 'Operator: Enable Acoustic Sound FX',
        description: 'Tactile clicks, radar pings, and MIL-STD master warning sirens',
        icon: annunciator.audioEnabled ? Radio : Radio,
        action: () => toggleAudioAnnunciator(),
      },
      {
        id: 'op-ack-warning',
        category: 'ACTIONS',
        title: 'Operator: Acknowledge Master Warning / Caution',
        description: 'Silence annunciator siren and acknowledge telemetry alerts',
        icon: CheckSquare,
        action: () => acknowledgeMasterWarning(),
      },
    ];
  }, [
    setActivePage,
    isRunning,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    setSpeed,
    injectFault,
    recoverAllFaults,
    startDemo,
    stopDemo,
    demoRunning,
    runAllValidationTests,
    exportSessionData,
    exportLogsData,
    onSelectSensor,
  ]);

  // Filtered commands
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const lower = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(lower) ||
        c.description.toLowerCase().includes(lower) ||
        c.category.toLowerCase().includes(lower)
    );
  }, [commands, query]);

  // Keep selected index in bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation inside modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          soundFX.click();
          filteredCommands[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4 bg-black/75 backdrop-blur-md">
      <div
        className="w-full max-w-2xl bg-[#0b0f19] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08] bg-[#0e1424]">
          <Search size={18} className="text-cyan-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, page, sensor, or action..."
            className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none font-sans"
            autoFocus
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <X size={15} />
            </button>
          ) : (
            <kbd className="hidden sm:inline text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              ESC
            </kbd>
          )}
        </div>

        {/* Command List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-white/[0.03]">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No matching commands or actions found. Try typing &ldquo;sensors&rdquo;, &ldquo;fault&rdquo;, or &ldquo;run&rdquo;.
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;

              return (
                <button
                  key={cmd.id}
                  onClick={() => {
                    soundFX.click();
                    cmd.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 transition-colors ${
                    isSelected
                      ? 'bg-cyan-500/15 text-white'
                      : 'text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-cyan-500/25 text-cyan-300'
                          : 'bg-slate-800/80 text-slate-400'
                      }`}
                    >
                      <Icon size={16} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold truncate text-white">
                          {cmd.title}
                        </span>
                        <span className="text-[10px] font-mono uppercase text-slate-400 hidden sm:inline">
                          · {cmd.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {cmd.description}
                      </p>
                    </div>
                  </div>

                  {cmd.shortcut && (
                    <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2 bg-[#080c14] border-t border-white/[0.06] text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono text-[10px] bg-slate-800 px-1 py-0.5 rounded border border-slate-700">↑↓</kbd> Navigate
            </span>
            <span>
              <kbd className="font-mono text-[10px] bg-slate-800 px-1 py-0.5 rounded border border-slate-700">↵</kbd> Select
            </span>
            <span>
              <kbd className="font-mono text-[10px] bg-slate-800 px-1 py-0.5 rounded border border-slate-700">ESC</kbd> Close
            </span>
          </div>
          <span className="text-cyan-400 font-mono text-[10px]">
            {filteredCommands.length} commands
          </span>
        </div>
      </div>
    </div>
  );
};
