import React, { useState, useEffect } from 'react';
import {
  INTERNAL_MODULE_STEPS,
  InternalModuleStep,
} from '../../data/missileInternalAssembly';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Cpu,
  Zap,
  Activity,
  Radio,
  Sliders,
  Sparkles,
  Layers,
  Shield,
  Info,
} from 'lucide-react';
import { soundFX } from '../../utils/audioFeedback';

interface MissileAssemblyWorkflowViewProps {
  onSelectModule?: (module: InternalModuleStep) => void;
}

export const MissileAssemblyWorkflowView: React.FC<MissileAssemblyWorkflowViewProps> = ({
  onSelectModule,
}) => {
  // Current active assembly step (1 to 11: 1..10 modules, 11 = Assembly Complete)
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedModule, setSelectedModule] = useState<InternalModuleStep>(
    INTERNAL_MODULE_STEPS[1] // Default to IMU
  );

  // Playback timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= 10) {
            setIsPlaying(false);
            return 10;
          }
          const next = prev + 1;
          if (next < INTERNAL_MODULE_STEPS.length) {
            setSelectedModule(INTERNAL_MODULE_STEPS[next]);
          }
          soundFX.phaseStep();
          return next;
        });
      }, 2600);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const handleStepClick = (index: number) => {
    soundFX.click();
    setCurrentStepIndex(index);
    if (index < INTERNAL_MODULE_STEPS.length) {
      setSelectedModule(INTERNAL_MODULE_STEPS[index]);
      onSelectModule?.(INTERNAL_MODULE_STEPS[index]);
    }
  };

  const isAssemblyComplete = currentStepIndex >= 10;
  // Which modules are installed up to current step
  const installedSteps = INTERNAL_MODULE_STEPS.slice(0, currentStepIndex + 1);

  return (
    <div className="space-y-6">
      {/* Top Workflow Control Bar */}
      <div className="bg-[#090c15] border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400" />
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide font-mono uppercase">
              Internal Electronics Assembly &amp; Subsystem Architecture
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Sequential bay installation workflow: Sensors → Main Processing → Power Regulation → Comms &amp; Battery.
          </p>
        </div>

        {/* Playback & Step Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              soundFX.click();
              setIsPlaying(!isPlaying);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
              isPlaying
                ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40 ring-1 ring-amber-400'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-950/40'
            }`}
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
            <span>{isPlaying ? 'PAUSE SEQUENCE' : 'AUTO-PLAY TIMELINE'}</span>
          </button>

          <button
            onClick={() => {
              soundFX.click();
              setIsPlaying(false);
              setCurrentStepIndex(0);
              setSelectedModule(INTERNAL_MODULE_STEPS[0]);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0d121f] hover:bg-white/[0.06] border border-white/[0.08] text-slate-300 text-xs font-mono transition-colors"
            title="Reset assembly sequence"
          >
            <RotateCcw size={12} />
            <span>RESET</span>
          </button>

          <div className="flex items-center bg-[#0d121f] rounded-lg border border-white/[0.08] p-0.5">
            <button
              disabled={currentStepIndex <= 0}
              onClick={() => handleStepClick(Math.max(0, currentStepIndex - 1))}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
              title="Previous Step"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-2 text-xs font-mono text-cyan-400 font-bold min-w-[70px] text-center">
              {currentStepIndex + 1} / 11
            </span>
            <button
              disabled={currentStepIndex >= 10}
              onClick={() => handleStepClick(Math.min(10, currentStepIndex + 1))}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
              title="Next Step"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 11-Step Interactive Progress Stepper Carousel */}
      <div className="bg-[#090c15] border border-white/[0.08] rounded-xl p-3 shadow-lg overflow-x-auto scrollbar-thin">
        <div className="flex items-center gap-2 min-w-max pb-1">
          {/* Steps 1 to 10 Modules */}
          {INTERNAL_MODULE_STEPS.map((mod, idx) => {
            const isCurrent = idx === currentStepIndex;
            const isCompleted = idx < currentStepIndex;

            return (
              <button
                key={mod.id}
                onClick={() => handleStepClick(idx)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all border ${
                  isCurrent
                    ? 'bg-blue-600/20 border-cyan-400 text-white font-bold ring-1 ring-cyan-400/40 shadow-sm'
                    : isCompleted
                    ? 'bg-[#0d121f] border-white/[0.06] text-slate-300 hover:border-white/[0.15]'
                    : 'bg-[#070a12] border-white/[0.04] text-slate-500 hover:text-slate-300'
                }`}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 text-white"
                  style={{
                    backgroundColor: isCurrent ? mod.color : isCompleted ? '#10b981' : '#334155',
                  }}
                >
                  {isCompleted ? '✓' : idx + 1}
                </span>
                <div className="text-left">
                  <div className="leading-tight truncate max-w-[130px]">{mod.name.split('(')[0]}</div>
                  <div className="text-[10px] opacity-60 font-sans">{mod.timeCode}</div>
                </div>
              </button>
            );
          })}

          {/* Step 11: Complete Banner */}
          <button
            onClick={() => handleStepClick(10)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono transition-all border ${
              isAssemblyComplete
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold ring-1 ring-emerald-400/50 shadow-sm'
                : 'bg-[#070a12] border-white/[0.04] text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] text-black font-bold">
              11
            </span>
            <div className="text-left">
              <div className="leading-tight">ASSEMBLY COMPLETE</div>
              <div className="text-[10px] text-emerald-400">All Modules Online</div>
            </div>
          </button>
        </div>
      </div>

      {/* Main Interactive Stage: 2D Cutaway Rocket Bay + Subsystem Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Vertical Cutaway Rocket Bay Interactive Diagram (5 cols) */}
        <div className="lg:col-span-5 bg-[#090c15] border border-white/[0.08] rounded-2xl p-4 sm:p-6 shadow-2xl relative flex flex-col items-center">
          <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-white/[0.06] text-xs font-mono">
            <span className="text-slate-400 uppercase tracking-wider font-semibold">
              Vertical Avionics Bay Stack
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-950/80 text-cyan-300 border border-blue-800/60 font-mono text-[10px]">
              {isAssemblyComplete ? 'ALL 10 MODULES ARMED' : `STAGE: STEP ${currentStepIndex + 1} OF 11`}
            </span>
          </div>

          {/* Vertical SVG Visualization */}
          <div className="relative w-full max-w-[360px] h-[620px] flex items-center justify-center select-none py-2">
            <svg
              viewBox="140 30 320 670"
              className="w-full h-full drop-shadow-2xl"
              style={{ filter: 'drop-shadow(0 0 25px rgba(6,182,212,0.12))' }}
            >
              <defs>
                {/* Circuit Grid pattern */}
                <pattern id="bayGrid" width="16" height="16" patternUnits="userSpaceOnUse">
                  <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#172033" strokeWidth="0.5" />
                </pattern>

                <linearGradient id="rocketBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="35%" stopColor="#334155" />
                  <stop offset="70%" stopColor="#475569" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>

                <linearGradient id="noseConeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="50%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>

                <linearGradient id="batteryGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#84cc16" />
                  <stop offset="100%" stopColor="#4d7c0f" />
                </linearGradient>

                <filter id="moduleGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Rocket Outer Shell Background (Transparent Cutaway Hull) */}
              {/* Aerodynamic Nose Cone Cap */}
              <polygon
                points="300,40 230,135 370,135"
                fill="url(#noseConeGrad)"
                stroke="#64748b"
                strokeWidth="2"
              />
              <line x1="230" y1="135" x2="370" y2="135" stroke="#94a3b8" strokeWidth="1.5" />

              {/* Main Cylindrical Shell */}
              <path
                d="M 230,135 L 210,320 L 210,630 L 390,630 L 390,320 L 370,135 Z"
                fill="#070a12"
                stroke="#334155"
                strokeWidth="2.5"
              />

              {/* Internal Compartment Background Grid */}
              <path
                d="M 232,137 L 213,320 L 213,628 L 387,628 L 387,320 L 368,137 Z"
                fill="url(#bayGrid)"
              />

              {/* Aerodynamic Stabilizing Tail Fins (Left & Right) */}
              {/* Left Fin */}
              <polygon
                points="210,550 150,650 185,650 210,615"
                fill="#1e293b"
                stroke="#475569"
                strokeWidth="1.8"
              />
              {/* Right Fin */}
              <polygon
                points="390,550 450,650 415,650 390,615"
                fill="#1e293b"
                stroke="#475569"
                strokeWidth="1.8"
              />

              {/* Aft Rocket Motor Mount Base */}
              <rect x="235" y="630" width="130" height="24" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
              <line x1="240" y1="642" x2="360" y2="642" stroke="#64748b" strokeWidth="1" strokeDasharray="3,3" />

              {/* Internal Bay Modular Racks & Shelf Bulkheads */}
              {/* Shelf 1 (IMU & Radar Upper Deck) */}
              <line x1="228" y1="185" x2="372" y2="185" stroke="#334155" strokeWidth="1.5" strokeDasharray="4,2" />
              {/* Shelf 2 (GNSS & Baro Mid Deck) */}
              <line x1="220" y1="250" x2="380" y2="250" stroke="#334155" strokeWidth="1.5" strokeDasharray="4,2" />
              {/* Shelf 3 (STM32 Main MCU Board Deck) */}
              <line x1="213" y1="365" x2="387" y2="365" stroke="#334155" strokeWidth="1.5" strokeDasharray="4,2" />
              {/* Shelf 4 (Magnetometer & PMU Deck) */}
              <line x1="211" y1="465" x2="389" y2="465" stroke="#334155" strokeWidth="1.5" strokeDasharray="4,2" />
              {/* Shelf 5 (Comm / Programming Port Deck) */}
              <line x1="210" y1="545" x2="390" y2="545" stroke="#334155" strokeWidth="1.5" strokeDasharray="4,2" />
              {/* Battery Retaining Bracket Floor */}
              <line x1="210" y1="620" x2="390" y2="620" stroke="#475569" strokeWidth="2" />

              {/* Wiring Harness Traces (Power & Data Backbone running down the right wall) */}
              <g stroke="#38bdf8" strokeWidth="1" opacity="0.6" fill="none">
                <path d="M 370,150 L 378,200 L 378,540 L 365,580" strokeDasharray="3,2" />
              </g>
              <g stroke="#f59e0b" strokeWidth="1" opacity="0.6" fill="none">
                <path d="M 366,150 L 374,200 L 374,540 L 360,580" strokeDasharray="3,2" />
              </g>

              {/* ======================================================== */}
              {/* DYNAMICALLY INSTALLED MODULES (Based on Workflow Step) */}
              {/* ======================================================== */}

              {/* 1. Bay Chassis Bulkhead (Base step - already visible as framework) */}

              {/* 2. IMU Installation (Top Center) */}
              {currentStepIndex >= 1 && (
                <g
                  onClick={() => {
                    soundFX.chipSelect();
                    setSelectedModule(INTERNAL_MODULE_STEPS[1]);
                  }}
                  className="cursor-pointer transition-transform hover:scale-105"
                  filter={selectedModule?.id === 'mod-imu' ? 'url(#moduleGlow)' : undefined}
                >
                  <rect
                    x="270"
                    y="142"
                    width="60"
                    height="38"
                    rx="4"
                    fill="#14532d"
                    stroke={selectedModule?.id === 'mod-imu' ? '#ffffff' : '#22c55e'}
                    strokeWidth={selectedModule?.id === 'mod-imu' ? 2 : 1.2}
                  />
                  {/* IMU Chip Surface */}
                  <rect x="282" y="148" width="36" height="26" rx="2" fill="#15803d" />
                  <text x="300" y="164" fill="#ffffff" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    IMU
                  </text>
                  <circle cx="323" cy="148" r="2.5" fill="#4ade80" className="animate-ping" />
                  {/* Step Callout Badge 1 */}
                  <circle cx="265" cy="142" r="7" fill="#22c55e" stroke="#000" strokeWidth="1" />
                  <text x="265" y="145" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">
                    1
                  </text>
                </g>
              )}

              {/* 3. GNSS / GPS Module (Mid-Left Deck) */}
              {currentStepIndex >= 2 && (
                <g
                  onClick={() => {
                    soundFX.chipSelect();
                    setSelectedModule(INTERNAL_MODULE_STEPS[2]);
                  }}
                  className="cursor-pointer transition-transform hover:scale-105"
                  filter={selectedModule?.id === 'mod-gnss' ? 'url(#moduleGlow)' : undefined}
                >
                  <rect
                    x="226"
                    y="194"
                    width="68"
                    height="50"
                    rx="4"
                    fill="#7c2d12"
                    stroke={selectedModule?.id === 'mod-gnss' ? '#ffffff' : '#f97316'}
                    strokeWidth={selectedModule?.id === 'mod-gnss' ? 2 : 1.2}
                  />
                  {/* Ceramic Patch / GNSS Shield */}
                  <rect x="238" y="202" width="44" height="34" rx="3" fill="#ea580c" />
                  <circle cx="260" cy="216" r="4" fill="#fff" opacity="0.85" />
                  <text x="260" y="230" fill="#ffffff" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    GNSS
                  </text>
                  {/* Step Callout Badge 2 */}
                  <circle cx="223" cy="194" r="7" fill="#f97316" stroke="#000" strokeWidth="1" />
                  <text x="223" y="197" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">
                    2
                  </text>
                </g>
              )}

              {/* 4. Barometric Sensor (Upper Deck Right) */}
              {currentStepIndex >= 3 && (
                <g
                  onClick={() => {
                    soundFX.chipSelect();
                    setSelectedModule(INTERNAL_MODULE_STEPS[3]);
                  }}
                  className="cursor-pointer transition-transform hover:scale-105"
                  filter={selectedModule?.id === 'mod-baro' ? 'url(#moduleGlow)' : undefined}
                >
                  <rect
                    x="308"
                    y="194"
                    width="38"
                    height="42"
                    rx="3"
                    fill="#1e3a8a"
                    stroke={selectedModule?.id === 'mod-baro' ? '#ffffff' : '#3b82f6'}
                    strokeWidth={selectedModule?.id === 'mod-baro' ? 2 : 1.2}
                  />
                  <circle cx="327" cy="212" r="8" fill="#2563eb" stroke="#60a5fa" strokeWidth="1" />
                  <circle cx="327" cy="212" r="3" fill="#93c5fd" />
                  <text x="327" y="230" fill="#93c5fd" fontSize="6.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    BARO
                  </text>
                  {/* Step Callout Badge 3 */}
                  <circle cx="305" cy="194" r="7" fill="#3b82f6" stroke="#000" strokeWidth="1" />
                  <text x="305" y="197" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">
                    3
                  </text>
                </g>
              )}

              {/* 5. Magnetometer (Middle Deck Left) */}
              {currentStepIndex >= 4 && (
                <g
                  onClick={() => {
                    soundFX.chipSelect();
                    setSelectedModule(INTERNAL_MODULE_STEPS[4]);
                  }}
                  className="cursor-pointer transition-transform hover:scale-105"
                  filter={selectedModule?.id === 'mod-mag' ? 'url(#moduleGlow)' : undefined}
                >
                  <rect
                    x="226"
                    y="380"
                    width="52"
                    height="46"
                    rx="4"
                    fill="#581c87"
                    stroke={selectedModule?.id === 'mod-mag' ? '#ffffff' : '#a855f7'}
                    strokeWidth={selectedModule?.id === 'mod-mag' ? 2 : 1.2}
                  />
                  <circle cx="252" cy="403" r="10" fill="#7e22ce" stroke="#c084fc" strokeWidth="1" strokeDasharray="2,2" />
                  <text x="252" y="406" fill="#f3e8ff" fontSize="7" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    MAG
                  </text>
                  {/* Step Callout Badge 4 */}
                  <circle cx="223" cy="380" r="7" fill="#a855f7" stroke="#000" strokeWidth="1" />
                  <text x="223" y="383" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">
                    4
                  </text>
                </g>
              )}

              {/* 6. Radar / Proximity Sensor (Upper Deck Far Right) */}
              {currentStepIndex >= 5 && (
                <g
                  onClick={() => {
                    soundFX.chipSelect();
                    setSelectedModule(INTERNAL_MODULE_STEPS[5]);
                  }}
                  className="cursor-pointer transition-transform hover:scale-105"
                  filter={selectedModule?.id === 'mod-radar' ? 'url(#moduleGlow)' : undefined}
                >
                  <rect
                    x="312"
                    y="142"
                    width="52"
                    height="44"
                    rx="4"
                    fill="#7f1d1d"
                    stroke={selectedModule?.id === 'mod-radar' ? '#ffffff' : '#ef4444'}
                    strokeWidth={selectedModule?.id === 'mod-radar' ? 2 : 1.2}
                  />
                  <rect x="320" y="148" width="36" height="28" rx="2" fill="#b91c1c" />
                  {/* Radar waves icon */}
                  <path d="M 334,166 A 6 6 0 0 1 342,166" stroke="#fecaca" strokeWidth="1" fill="none" />
                  <path d="M 330,169 A 11 11 0 0 1 346,169" stroke="#fecaca" strokeWidth="1" fill="none" />
                  <text x="338" y="160" fill="#ffffff" fontSize="6.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    RADAR
                  </text>
                  {/* Step Callout Badge 5 */}
                  <circle cx="366" cy="142" r="7" fill="#ef4444" stroke="#000" strokeWidth="1" />
                  <text x="366" y="145" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">
                    5
                  </text>
                </g>
              )}

              {/* 7. Microcontroller (STM32 Main Processor) */}
              {currentStepIndex >= 6 && (
                <g
                  onClick={() => {
                    soundFX.chipSelect();
                    setSelectedModule(INTERNAL_MODULE_STEPS[6]);
                  }}
                  className="cursor-pointer transition-transform hover:scale-105"
                  filter={selectedModule?.id === 'mod-mcu' ? 'url(#moduleGlow)' : undefined}
                >
                  <rect
                    x="226"
                    y="262"
                    width="148"
                    height="94"
                    rx="6"
                    fill="#164e63"
                    stroke={selectedModule?.id === 'mod-mcu' ? '#ffffff' : '#06b6d4'}
                    strokeWidth={selectedModule?.id === 'mod-mcu' ? 2.2 : 1.4}
                  />
                  {/* IC Package body */}
                  <rect x="250" y="274" width="100" height="70" rx="4" fill="#0e7490" stroke="#67e8f9" strokeWidth="1" />
                  {/* STM32 Logo & Name */}
                  <text x="300" y="312" fill="#ffffff" fontSize="13" fontFamily="monospace" fontWeight="bold" textAnchor="middle" letterSpacing="1">
                    STM32
                  </text>
                  <text x="300" y="328" fill="#a5f3fc" fontSize="7.5" fontFamily="monospace" textAnchor="middle">
                    CORTEX-M7 480MHz
                  </text>
                  {/* Gold IC Pins Around Perimeter */}
                  <line x1="250" y1="270" x2="350" y2="270" stroke="#facc15" strokeWidth="2" strokeDasharray="3,3" />
                  <line x1="250" y1="348" x2="350" y2="348" stroke="#facc15" strokeWidth="2" strokeDasharray="3,3" />
                  {/* Step Callout Badge 6 */}
                  <circle cx="223" cy="262" r="7" fill="#06b6d4" stroke="#000" strokeWidth="1" />
                  <text x="223" y="265" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">
                    6
                  </text>
                </g>
              )}

              {/* 8. Power Management Unit (PMU) */}
              {currentStepIndex >= 7 && (
                <g
                  onClick={() => {
                    soundFX.chipSelect();
                    setSelectedModule(INTERNAL_MODULE_STEPS[7]);
                  }}
                  className="cursor-pointer transition-transform hover:scale-105"
                  filter={selectedModule?.id === 'mod-pmu' ? 'url(#moduleGlow)' : undefined}
                >
                  <rect
                    x="292"
                    y="380"
                    width="82"
                    height="72"
                    rx="5"
                    fill="#78350f"
                    stroke={selectedModule?.id === 'mod-pmu' ? '#ffffff' : '#f59e0b'}
                    strokeWidth={selectedModule?.id === 'mod-pmu' ? 2 : 1.2}
                  />
                  {/* Inductors & Regulators on PMU board */}
                  <rect x="302" y="390" width="22" height="22" rx="2" fill="#b45309" stroke="#fde68a" strokeWidth="0.8" />
                  <rect x="330" y="390" width="22" height="22" rx="2" fill="#b45309" stroke="#fde68a" strokeWidth="0.8" />
                  <rect x="304" y="420" width="48" height="22" rx="2" fill="#92400e" />
                  <text x="328" y="434" fill="#fef3c7" fontSize="7" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    PMU 28V→3V3
                  </text>
                  {/* Step Callout Badge 7 */}
                  <circle cx="376" cy="380" r="7" fill="#f59e0b" stroke="#000" strokeWidth="1" />
                  <text x="376" y="383" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">
                    7
                  </text>
                </g>
              )}

              {/* 9. Communication / Programming Interface */}
              {currentStepIndex >= 8 && (
                <g
                  onClick={() => {
                    soundFX.chipSelect();
                    setSelectedModule(INTERNAL_MODULE_STEPS[8]);
                  }}
                  className="cursor-pointer transition-transform hover:scale-105"
                  filter={selectedModule?.id === 'mod-comm' ? 'url(#moduleGlow)' : undefined}
                >
                  <rect
                    x="226"
                    y="480"
                    width="148"
                    height="50"
                    rx="5"
                    fill="#831843"
                    stroke={selectedModule?.id === 'mod-comm' ? '#ffffff' : '#ec4899'}
                    strokeWidth={selectedModule?.id === 'mod-comm' ? 2 : 1.2}
                  />
                  {/* Circular Mil-Connector & USB-C Port */}
                  <circle cx="260" cy="505" r="14" fill="#18181b" stroke="#f472b6" strokeWidth="1.5" />
                  <circle cx="260" cy="505" r="4" fill="#ec4899" />
                  <rect x="310" y="498" width="30" height="14" rx="3" fill="#18181b" stroke="#f472b6" strokeWidth="1.2" />
                  <text x="325" y="508" fill="#fbcfe8" fontSize="6.5" fontFamily="monospace" textAnchor="middle">
                    PROG / USB
                  </text>
                  {/* Step Callout Badge 8 */}
                  <circle cx="223" cy="480" r="7" fill="#ec4899" stroke="#000" strokeWidth="1" />
                  <text x="223" y="483" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">
                    8
                  </text>
                </g>
              )}

              {/* 10. Battery Pack Installation (Aft Base Deck) */}
              {currentStepIndex >= 9 && (
                <g
                  onClick={() => {
                    soundFX.chipSelect();
                    setSelectedModule(INTERNAL_MODULE_STEPS[9]);
                  }}
                  className="cursor-pointer transition-transform hover:scale-105"
                  filter={selectedModule?.id === 'mod-battery' ? 'url(#moduleGlow)' : undefined}
                >
                  {/* Battery Enclosure */}
                  <rect
                    x="226"
                    y="555"
                    width="148"
                    height="60"
                    rx="6"
                    fill="#1e293b"
                    stroke={selectedModule?.id === 'mod-battery' ? '#ffffff' : '#84cc16'}
                    strokeWidth={selectedModule?.id === 'mod-battery' ? 2 : 1.4}
                  />
                  {/* 3 Green Cylindrical Li-Ion Cells */}
                  <rect x="240" y="562" width="32" height="46" rx="4" fill="url(#batteryGrad)" stroke="#a3e635" strokeWidth="1" />
                  <rect x="284" y="562" width="32" height="46" rx="4" fill="url(#batteryGrad)" stroke="#a3e635" strokeWidth="1" />
                  <rect x="328" y="562" width="32" height="46" rx="4" fill="url(#batteryGrad)" stroke="#a3e635" strokeWidth="1" />
                  {/* Anode Caps */}
                  <rect x="250" y="559" width="12" height="3" fill="#e2e8f0" rx="1" />
                  <rect x="294" y="559" width="12" height="3" fill="#e2e8f0" rx="1" />
                  <rect x="338" y="559" width="12" height="3" fill="#e2e8f0" rx="1" />
                  {/* Step Callout Badge 9 */}
                  <circle cx="223" cy="555" r="7" fill="#84cc16" stroke="#000" strokeWidth="1" />
                  <text x="223" y="558" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">
                    9
                  </text>
                </g>
              )}

              {/* Complete Assembly Overlay Banner when step 11 */}
              {isAssemblyComplete && (
                <g className="animate-fade-in">
                  <rect x="180" y="60" width="240" height="32" rx="6" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
                  <text x="300" y="76" fill="#6ee7b7" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    ✓ INTERNAL ELECTRONICS ASSEMBLED
                  </text>
                  <text x="300" y="88" fill="#a7f3d0" fontSize="7" fontFamily="monospace" textAnchor="middle">
                    SENSORS → PROCESSING → POWER → COMMS
                  </text>
                </g>
              )}
            </svg>
          </div>

          <div className="text-[11px] text-slate-400 font-mono text-center pt-2 border-t border-white/[0.06] w-full">
            Click any installed module in the diagram to inspect pinout &amp; operational telemetry.
          </div>
        </div>

        {/* Right Column: Active Module Dossier & Subsystem Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Selected Module Detail Header Card */}
          {selectedModule ? (
            <div className="bg-[#090c15] border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
              <div className="flex items-start justify-between pb-4 border-b border-white/[0.06] gap-3">
                <div className="flex items-start gap-3.5">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center font-mono font-bold text-white text-base shrink-0 shadow-md"
                    style={{ backgroundColor: selectedModule.color }}
                  >
                    {selectedModule.step}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider text-white border"
                        style={{
                          backgroundColor: `${selectedModule.color}33`,
                          borderColor: selectedModule.color,
                        }}
                      >
                        {selectedModule.category}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Timecode: {selectedModule.timeCode}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                      {selectedModule.name}
                    </h3>
                    <p className="text-xs text-cyan-400 font-mono mt-0.5">
                      {selectedModule.subtitle}
                    </p>
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  <span className="text-[10px] text-slate-500 font-mono block">BUS PROTOCOL</span>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {selectedModule.protocol.split(' ')[0]}
                  </span>
                </div>
              </div>

              {/* Functional Role Summary */}
              <div className="p-3.5 rounded-xl bg-[#0d121f] border border-white/[0.06] space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-mono font-semibold">
                  Subsystem Operational Mission
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {selectedModule.role}
                </p>
              </div>

              {/* High-Resolution Engineering Specifications */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[#0d121f] border border-white/[0.06]">
                  <div className="text-[10px] text-slate-400 font-mono">Operating Speed / ODR</div>
                  <div className="text-xs font-bold text-white font-mono mt-1">
                    {selectedModule.specDetails.operatingFreq}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#0d121f] border border-white/[0.06]">
                  <div className="text-[10px] text-slate-400 font-mono">Supply Voltage Rail</div>
                  <div className="text-xs font-bold text-amber-400 font-mono mt-1">
                    {selectedModule.specDetails.supplyVoltage}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#0d121f] border border-white/[0.06]">
                  <div className="text-[10px] text-slate-400 font-mono">Power Dissipation</div>
                  <div className="text-xs font-bold text-emerald-400 font-mono mt-1">
                    {selectedModule.specDetails.powerUsage}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#0d121f] border border-white/[0.06]">
                  <div className="text-[10px] text-slate-400 font-mono">Setback / Shock Rating</div>
                  <div className="text-xs font-bold text-purple-400 font-mono mt-1">
                    {selectedModule.specDetails.tolerance}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#0d121f] border border-white/[0.06]">
                  <div className="text-[10px] text-slate-400 font-mono">Digital Bus Highway</div>
                  <div className="text-xs font-bold text-sky-400 font-mono mt-1 truncate">
                    {selectedModule.specDetails.interface}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#0d121f] border border-white/[0.06]">
                  <div className="text-[10px] text-slate-400 font-mono">Package / Pinout</div>
                  <div className="text-xs font-bold text-slate-300 font-mono mt-1 truncate">
                    {selectedModule.specDetails.pinCount}
                  </div>
                </div>
              </div>

              {/* Detailed Operational Context */}
              <p className="text-xs text-slate-400 leading-relaxed">
                {selectedModule.description}
              </p>
            </div>
          ) : null}

          {/* Complete 9-Module Reference Matrix */}
          <div className="bg-[#090c15] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-cyan-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Standard Avionics Module Map (Ref: Assembly Manual)
                </h4>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {installedSteps.length} of 10 Installed
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {INTERNAL_MODULE_STEPS.slice(1).map((m, idx) => {
                const isSelected = selectedModule?.id === m.id;
                const isInstalled = currentStepIndex >= m.step - 1;

                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      soundFX.chipSelect();
                      setSelectedModule(m);
                    }}
                    className={`p-2.5 rounded-lg flex items-center justify-between text-left transition-all border ${
                      isSelected
                        ? 'bg-blue-600/20 border-cyan-400 text-white font-medium shadow-xs'
                        : isInstalled
                        ? 'bg-[#0d121f] border-white/[0.06] text-slate-300 hover:border-white/[0.15]'
                        : 'bg-[#070a12] border-white/[0.03] text-slate-500 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ backgroundColor: m.color }}
                      >
                        {m.step - 1}
                      </span>
                      <div className="truncate">
                        <div className="font-semibold text-slate-200 truncate text-xs">{m.name.split('(')[0]}</div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">{m.keySpecs.split('·')[0]}</div>
                      </div>
                    </div>
                    {isInstalled ? (
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0 ml-1" />
                    ) : (
                      <span className="text-[9px] font-mono text-slate-600 shrink-0 ml-1">PENDING</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
