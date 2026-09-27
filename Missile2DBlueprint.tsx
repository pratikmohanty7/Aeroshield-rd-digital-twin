import React, { useState } from 'react';
import {
  AvionicsChip,
  BlueprintViewMode,
  AvionicsBusInfo,
  MissileWorkflowPhase,
} from '../../types/missileArchitecture';
import { MISSILE_CHIPS, AVIONICS_BUSES } from '../../data/missileChipsData';
import {
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { soundFX } from '../../utils/audioFeedback';

interface Missile2DBlueprintProps {
  selectedChip: AvionicsChip | null;
  onSelectChip: (chip: AvionicsChip) => void;
  viewMode: BlueprintViewMode;
  activeChipIds?: string[];
  activePhaseStep?: number;
  selectedBus?: AvionicsBusInfo | null;
  onSelectBus?: (bus: AvionicsBusInfo | null) => void;
  currentPhase?: MissileWorkflowPhase;
  onSelectPhase?: (phase: MissileWorkflowPhase) => void;
}

export const Missile2DBlueprint: React.FC<Missile2DBlueprintProps> = ({
  selectedChip,
  onSelectChip,
  viewMode,
  activeChipIds = [],
  selectedBus = null,
  onSelectBus,
  currentPhase,
}) => {
  const [hoveredChipId, setHoveredChipId] = useState<string | null>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [zoomPreset, setZoomPreset] = useState<'FULL' | 'NOSE' | 'WARHEAD' | 'PROPULSION'>('FULL');
  const [customZoom, setCustomZoom] = useState<number>(1.0);

  const isChipActive = (id: string) => activeChipIds.includes(id);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundFX.enabled = next;
    if (next) soundFX.click();
  };

  // ViewBox mapping for smooth, crisp zooming
  const getCutawayViewBox = () => {
    switch (zoomPreset) {
      case 'NOSE':
        return '20 20 340 230';
      case 'WARHEAD':
        return '240 20 320 230';
      case 'PROPULSION':
        return '520 20 440 230';
      case 'FULL':
      default:
        if (customZoom === 1.0) return '0 0 1000 270';
        const width = 1000 / customZoom;
        const height = 270 / customZoom;
        const x = (1000 - width) / 2;
        const y = (270 - height) / 2;
        return `${x} ${y} ${width} ${height}`;
    }
  };

  const activeDisplayChip = MISSILE_CHIPS.find((c) => c.id === hoveredChipId) || selectedChip;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/[0.08] bg-[#090c15] shadow-2xl transition-all">
      {/* Precision CAD Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3 bg-[#0d121f]/90 border-b border-white/[0.06] text-xs gap-3">
        {/* Title & Active Spec */}
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="font-semibold text-slate-100 uppercase tracking-wider">
              {viewMode === 'cutaway' && '155mm ERGM Longitudinal Section CAD'}
              {viewMode === 'schematic' && 'Avionics Interconnect Architecture'}
              {viewMode === 'trajectory' && 'Ballistic Flight Profile & Aerodynamics'}
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400 hidden sm:inline text-[11px]">
              REV 5.2 · NATO STANAG 4425
            </span>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          {/* Audio Feedback */}
          <button
            onClick={handleToggleSound}
            className={`p-1.5 rounded-lg border transition-all ${
              soundEnabled
                ? 'bg-blue-950/50 text-blue-400 border-blue-800/60'
                : 'bg-slate-900/60 text-slate-500 border-white/[0.06] hover:text-slate-300'
            }`}
            title={soundEnabled ? 'Acoustic Feedback Active' : 'Muted'}
          >
            {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </button>

          {/* Section Zoom Controls */}
          {viewMode === 'cutaway' && (
            <div className="flex items-center bg-[#070a12] rounded-lg p-0.5 border border-white/[0.06] text-[11px] font-mono">
              <button
                onClick={() => {
                  soundFX.click();
                  setZoomPreset('FULL');
                  setCustomZoom(1.0);
                }}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  zoomPreset === 'FULL' && customZoom === 1.0
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                1:1 Full
              </button>
              <button
                onClick={() => {
                  soundFX.click();
                  setZoomPreset('NOSE');
                }}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  zoomPreset === 'NOSE'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Nose
              </button>
              <button
                onClick={() => {
                  soundFX.click();
                  setZoomPreset('WARHEAD');
                }}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  zoomPreset === 'WARHEAD'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Warhead
              </button>
              <button
                onClick={() => {
                  soundFX.click();
                  setZoomPreset('PROPULSION');
                }}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  zoomPreset === 'PROPULSION'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Motor
              </button>
            </div>
          )}

          {/* Zoom Buttons */}
          {viewMode === 'cutaway' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  soundFX.click();
                  setZoomPreset('FULL');
                  setCustomZoom((z) => Math.min(2.2, +(z + 0.25).toFixed(2)));
                }}
                className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/[0.06] transition-colors"
                title="Zoom In"
              >
                <ZoomIn size={13} />
              </button>
              <button
                onClick={() => {
                  soundFX.click();
                  setZoomPreset('FULL');
                  setCustomZoom((z) => Math.max(1.0, +(z - 0.25).toFixed(2)));
                }}
                className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/[0.06] transition-colors"
                title="Zoom Out"
              >
                <ZoomOut size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Real-Time Telemetry HUD Strip (Zero geometry clutter) */}
      <div className="px-5 py-2.5 bg-[#060810] border-b border-white/[0.05] flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-3 overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-900/60 font-semibold tracking-wider">
            INSPECTOR
          </span>

          {activeDisplayChip ? (
            <div className="flex items-center gap-2 text-slate-300 text-xs">
              <span className="font-bold text-white tracking-wide">{activeDisplayChip.refDes}</span>
              <span className="text-slate-600">·</span>
              <span className="font-medium text-blue-400">{activeDisplayChip.shortName}</span>
              <span className="text-slate-500 hidden sm:inline">({activeDisplayChip.section})</span>
              <span className="text-slate-600 hidden md:inline">·</span>
              <span className="text-slate-400 hidden md:inline text-[11px] truncate max-w-xs">
                {activeDisplayChip.role}
              </span>
              <span className="text-emerald-400 text-[10px] font-semibold hidden lg:inline">
                {activeDisplayChip.shockRating.split(' ')[0]}
              </span>
            </div>
          ) : hoveredZone ? (
            <span className="text-slate-300 text-xs font-medium">{hoveredZone}</span>
          ) : (
            <span className="text-slate-500 text-xs">
              Click or hover components to inspect physical placement, pinout, and shock ratings.
            </span>
          )}
        </div>

        <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-3">
          <span>{currentPhase ? `Phase: ${currentPhase.title}` : 'Ready'}</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto p-4 sm:p-6 flex justify-center items-center bg-[#05070d] select-none">
        {/* ============================================================ */}
        {/* VIEW MODE 1: LONGITUDINAL 2D CUTAWAY (1000 x 270) */}
        {/* ============================================================ */}
        {viewMode === 'cutaway' && (
          <svg
            viewBox={getCutawayViewBox()}
            className="w-full max-w-5xl h-auto drop-shadow-2xl transition-all duration-300 ease-out"
            style={{ minWidth: '760px' }}
          >
            <defs>
              {/* Subtle Grid Pattern */}
              <pattern id="cadGrid" width="25" height="25" patternUnits="userSpaceOnUse">
                <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#121827" strokeWidth="0.5" />
              </pattern>

              {/* PBXN-9 High Explosive Pattern */}
              <pattern id="pbxnHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="10" stroke="#f43f5e" strokeWidth="1.2" strokeOpacity="0.35" />
              </pattern>

              {/* Solid Propellant Grain Pattern */}
              <pattern id="srmHatch" width="12" height="12" patternTransform="rotate(-45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="12" stroke="#f59e0b" strokeWidth="1.2" strokeOpacity="0.3" />
              </pattern>

              {/* Titanium Bulkhead Pattern */}
              <pattern id="tiHatch" width="8" height="8" patternTransform="rotate(30 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="8" stroke="#94a3b8" strokeWidth="0.8" strokeOpacity="0.25" />
              </pattern>

              {/* Component Glow Filter */}
              <filter id="glowSubtle" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Canvas Base Grid */}
            <rect x="0" y="0" width="1000" height="270" fill="#05070d" />
            <rect x="0" y="0" width="1000" height="270" fill="url(#cadGrid)" />

            {/* Projectile Flight Centerline */}
            <line
              x1="20"
              y1="135"
              x2="980"
              y2="135"
              stroke="#38bdf8"
              strokeWidth="0.8"
              strokeDasharray="14,4,2,4"
              opacity="0.3"
            />

            {/* Zone Indicator Header (Cleanly floating at the top, clear of all fins) */}
            <g fill="#475569" fontSize="8" fontFamily="monospace" fontWeight="600" letterSpacing="0.8">
              <rect x="30" y="6" width="930" height="16" fill="#090e1a" rx="4" stroke="#1e273a" strokeWidth="0.8" />
              <text x="80" y="17" textAnchor="middle">SEEKER &amp; OPTICS</text>
              <line x1="130" y1="6" x2="130" y2="22" stroke="#1e273a" />
              <text x="195" y="17" textAnchor="middle">GNC BAY &amp; CANARDS</text>
              <line x1="260" y1="6" x2="260" y2="22" stroke="#1e273a" />
              <text x="340" y="17" textAnchor="middle">PBXN-9 WARHEAD</text>
              <line x1="420" y1="6" x2="420" y2="22" stroke="#1e273a" />
              <text x="480" y="17" textAnchor="middle">ESAD &amp; POWER</text>
              <line x1="540" y1="6" x2="540" y2="22" stroke="#1e273a" />
              <text x="680" y="17" textAnchor="middle">SOLID ROCKET MOTOR</text>
              <line x1="820" y1="6" x2="820" y2="22" stroke="#1e273a" />
              <text x="895" y="17" textAnchor="middle">TAIL FINS &amp; NOZZLE</text>
            </g>

            {/* Vertical Boundary Guidelines */}
            <g stroke="#334155" strokeWidth="0.6" strokeDasharray="3,3" opacity="0.3">
              <line x1="130" y1="22" x2="130" y2="245" />
              <line x1="260" y1="22" x2="260" y2="245" />
              <line x1="420" y1="22" x2="420" y2="245" />
              <line x1="540" y1="22" x2="540" y2="245" />
              <line x1="820" y1="22" x2="820" y2="245" />
            </g>

            {/* ============================================================ */}
            {/* AERODYNAMIC CONTROL SURFACES & FINS */}
            {/* ============================================================ */}
            {/* Forward Canards (Steering) */}
            <polygon
              points="180,60 210,26 226,28 216,60"
              fill="#0f172a"
              stroke="#60a5fa"
              strokeWidth="1.2"
              className="transition-colors hover:fill-blue-900/60 cursor-pointer"
              onMouseEnter={() => setHoveredZone('Forward Titanium Canard Actuator Fin')}
              onMouseLeave={() => setHoveredZone(null)}
            />
            <polygon
              points="180,210 210,244 226,242 216,210"
              fill="#0f172a"
              stroke="#60a5fa"
              strokeWidth="1.2"
              className="transition-colors hover:fill-blue-900/60 cursor-pointer"
              onMouseEnter={() => setHoveredZone('Forward Titanium Canard Actuator Fin')}
              onMouseLeave={() => setHoveredZone(null)}
            />

            {/* Aft Folding Wrap-Around Stabilizing Fins */}
            <polygon
              points="875,60 925,24 955,27 930,60"
              fill="#0f172a"
              stroke="#60a5fa"
              strokeWidth="1.2"
              className="transition-colors hover:fill-blue-900/60 cursor-pointer"
              onMouseEnter={() => setHoveredZone('Aft Folding Stabilizing Fin')}
              onMouseLeave={() => setHoveredZone(null)}
            />
            <polygon
              points="875,210 925,246 955,243 930,210"
              fill="#0f172a"
              stroke="#60a5fa"
              strokeWidth="1.2"
              className="transition-colors hover:fill-blue-900/60 cursor-pointer"
              onMouseEnter={() => setHoveredZone('Aft Folding Stabilizing Fin')}
              onMouseLeave={() => setHoveredZone(null)}
            />

            {/* Supersonic Convergent-Divergent Bell Nozzle */}
            <polygon
              points="865,80 918,91 960,74 960,196 918,179 865,190"
              fill="#090d16"
              stroke="#475569"
              strokeWidth="1.4"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredZone('Carbon-Phenolic Supersonic Expansion Nozzle')}
              onMouseLeave={() => setHoveredZone(null)}
            />
            <ellipse cx="960" cy="135" rx="5.5" ry="61" fill="#03050a" stroke="#38bdf8" strokeWidth="0.9" />

            {/* Main Projectile Hull Silhouette */}
            <path
              d="M 30,135 C 50,100 80,70 120,60 L 865,60 L 865,210 L 120,210 C 80,200 50,170 30,135 Z"
              fill="#0a0f1d"
              stroke="#2563eb"
              strokeWidth="1.6"
            />

            {/* Sapphire Optical Seeker Dome (Nose) */}
            <path
              d="M 30,135 C 35,120 45,105 55,95 L 55,175 C 45,165 35,150 30,135 Z"
              fill="#0284c7"
              fillOpacity="0.35"
              stroke="#38bdf8"
              strokeWidth="1.3"
              className="cursor-pointer hover:fill-opacity-50 transition-all"
              onMouseEnter={() => setHoveredZone('Zone 1: Sapphire Conformal Optical Seeker Dome')}
              onMouseLeave={() => setHoveredZone(null)}
            />

            {/* ============================================================ */}
            {/* INTERNAL SUB-ASSEMBLIES & COMPARTMENTS */}
            {/* ============================================================ */}
            {/* Zone 2: GNC Avionics Bay */}
            <rect
              x="135"
              y="68"
              width="120"
              height="134"
              fill="#071220"
              stroke="#1e3a8a"
              strokeWidth="0.8"
              rx="2"
              className="cursor-pointer hover:stroke-blue-400 transition-colors"
              onMouseEnter={() => setHoveredZone('Zone 2: GNC Avionics & 4-Axis Actuator Bay')}
              onMouseLeave={() => setHoveredZone(null)}
            />
            {/* Internal PCB Rails */}
            <line x1="140" y1="80" x2="250" y2="80" stroke="#047857" strokeWidth="2" strokeOpacity="0.6" />
            <line x1="140" y1="135" x2="250" y2="135" stroke="#047857" strokeWidth="2" strokeOpacity="0.6" />
            <line x1="140" y1="190" x2="250" y2="190" stroke="#047857" strokeWidth="2" strokeOpacity="0.6" />

            {/* Zone 3: PBXN-9 Warhead */}
            <rect
              x="265"
              y="68"
              width="150"
              height="134"
              fill="url(#pbxnHatch)"
              stroke="#be123c"
              strokeWidth="1"
              rx="2"
              className="cursor-pointer hover:stroke-rose-400 transition-colors"
              onMouseEnter={() => setHoveredZone('Zone 3: Insensitive PBXN-9 High Explosive Warhead')}
              onMouseLeave={() => setHoveredZone(null)}
            />
            {/* Tungsten Fragmentation Sleeve */}
            <rect x="268" y="70" width="144" height="9" fill="#881337" fillOpacity="0.7" rx="1" />
            <rect x="268" y="191" width="144" height="9" fill="#881337" fillOpacity="0.7" rx="1" />

            {/* Zone 4: ESAD & Thermal Battery Bay */}
            <rect
              x="425"
              y="68"
              width="110"
              height="134"
              fill="#0d1424"
              stroke="#4338ca"
              strokeWidth="0.8"
              rx="2"
              className="cursor-pointer hover:stroke-indigo-400 transition-colors"
              onMouseEnter={() => setHoveredZone('Zone 4: Electronic Safe & Arm Device (ESAD) + 28V Thermal Battery')}
              onMouseLeave={() => setHoveredZone(null)}
            />
            {/* 28V Thermal Molten-Salt Battery Core */}
            <rect
              x="480"
              y="130"
              width="48"
              height="66"
              fill="#1e1b4b"
              stroke="#a855f7"
              strokeWidth="1"
              rx="2"
              className="cursor-pointer hover:fill-purple-900/50 transition-colors"
              onMouseEnter={() => setHoveredZone('28V Molten-Salt LiFeS2 Thermal Battery (150ms Pyrotechnic Activation)')}
              onMouseLeave={() => setHoveredZone(null)}
            />

            {/* Zone 5: Solid Rocket Motor (SRM) */}
            <rect
              x="545"
              y="68"
              width="270"
              height="134"
              fill="url(#srmHatch)"
              stroke="#b45309"
              strokeWidth="1"
              rx="2"
              className="cursor-pointer hover:stroke-amber-400 transition-colors"
              onMouseEnter={() => setHoveredZone('Zone 5: HTPB/APCP Solid Rocket Propellant Grain')}
              onMouseLeave={() => setHoveredZone(null)}
            />
            {/* Star Grain Core Cavity */}
            <polygon
              points="547,130 575,124 795,124 811,130 811,140 795,146 575,146 547,140"
              fill="#030712"
              stroke="#d97706"
              strokeWidth="0.8"
            />

            {/* Zone 6: Aft Actuation & Bulkhead */}
            <rect
              x="820"
              y="68"
              width="45"
              height="134"
              fill="url(#tiHatch)"
              stroke="#64748b"
              strokeWidth="0.8"
              rx="1"
              className="cursor-pointer hover:stroke-slate-300 transition-colors"
              onMouseEnter={() => setHoveredZone('Zone 6: Titanium Aft Bulkhead & Slip-Ring Obturator Seal')}
              onMouseLeave={() => setHoveredZone(null)}
            />

            {/* ============================================================ */}
            {/* 10 AVIONICS IC PACKAGES (CLEAN REFDES ONLY, ZERO OVERLAP) */}
            {/* ============================================================ */}
            {MISSILE_CHIPS.map((chip) => {
              const isSelected = selectedChip?.id === chip.id;
              const isHovered = hoveredChipId === chip.id;
              const active = isChipActive(chip.id);
              const { x, y, width, height } = chip.cutawayCoords;

              return (
                <g
                  key={chip.id}
                  onClick={() => {
                    soundFX.chipSelect();
                    onSelectChip(chip);
                  }}
                  onMouseEnter={() => setHoveredChipId(chip.id)}
                  onMouseLeave={() => setHoveredChipId(null)}
                  className="cursor-pointer transition-all duration-150"
                  filter={isSelected || isHovered || active ? 'url(#glowSubtle)' : undefined}
                >
                  {/* Active / Selection Halo */}
                  {(isSelected || isHovered || active) && (
                    <rect
                      x={x - 2.5}
                      y={y - 2.5}
                      width={width + 5}
                      height={height + 5}
                      fill={chip.color}
                      fillOpacity={isSelected ? 0.3 : 0.15}
                      stroke={chip.color}
                      strokeWidth={isSelected ? 1.6 : 0.9}
                      strokeDasharray={active ? '2,2' : undefined}
                      rx="3"
                    />
                  )}

                  {/* Ceramic Package Body */}
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill="#050a14"
                    stroke={isSelected ? '#ffffff' : chip.color}
                    strokeWidth={isSelected ? 1.6 : 1.1}
                    rx="2"
                  />

                  {/* Gold Bond Pads */}
                  <line x1={x + 3} y1={y} x2={x + width - 3} y2={y} stroke="#eab308" strokeWidth="0.6" strokeDasharray="2,2" />
                  <line x1={x + 3} y1={y + height} x2={x + width - 3} y2={y + height} stroke="#eab308" strokeWidth="0.6" strokeDasharray="2,2" />

                  {/* Status Indicator LED */}
                  <circle
                    cx={x + width - 4.5}
                    cy={y + 4.5}
                    r="2"
                    fill={active ? '#10b981' : isSelected ? '#38bdf8' : chip.color}
                    className={active ? 'animate-ping' : ''}
                  />

                  {/* RefDes (U101..U110) - Clear, centered, no overlap */}
                  <text
                    x={x + width / 2}
                    y={y + height / 2 + 1}
                    fill="#ffffff"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {chip.refDes}
                  </text>
                </g>
              );
            })}

            {/* Baseline Engineering Dimension Lead */}
            <g stroke="#475569" strokeWidth="0.7" opacity="0.6">
              <line x1="30" y1="258" x2="960" y2="258" />
              <line x1="30" y1="253" x2="30" y2="263" />
              <line x1="960" y1="253" x2="960" y2="263" />
              <text
                x="495"
                y="262"
                fill="#94a3b8"
                fontSize="8"
                fontFamily="monospace"
                textAnchor="middle"
                fontWeight="600"
                letterSpacing="0.6"
              >
                OVERALL LENGTH: 980 mm · DIAMETER: 155 mm NATO · TOTAL ALL-UP MASS: 47.5 kg
              </text>
            </g>
          </svg>
        )}

        {/* ============================================================ */}
        {/* VIEW MODE 2: AVIONICS INTERCONNECT SCHEMATIC (1000 x 380) */}
        {/* ============================================================ */}
        {viewMode === 'schematic' && (
          <svg
            viewBox="0 0 1000 380"
            className="w-full max-w-5xl h-auto drop-shadow-2xl"
            style={{ minWidth: '760px' }}
          >
            {/* Background Grid */}
            <rect x="0" y="0" width="1000" height="380" fill="#05070d" />
            <rect x="0" y="0" width="1000" height="380" fill="url(#cadGrid)" />

            {/* Subsystem Columns */}
            <g fill="#475569" fontSize="8" fontFamily="monospace" fontWeight="600" letterSpacing="0.8">
              <text x="65" y="24">1. SENSORS &amp; TELEMETRY</text>
              <text x="265" y="24">2. FLIGHT COMPUTER &amp; IMU</text>
              <text x="485" y="24">3. NAVIGATION &amp; ACTUATION</text>
              <text x="695" y="24">4. ORDNANCE &amp; POWER CORE</text>
            </g>

            {/* Interconnect Bus Highway Traces */}
            <g fill="none">
              {/* SPI High Speed Sensor Bus */}
              <g
                onClick={() => {
                  soundFX.click();
                  onSelectBus?.(AVIONICS_BUSES[0]);
                }}
                className="cursor-pointer"
              >
                <path d="M 200,165 L 260,110" stroke="#38bdf8" strokeWidth={selectedBus?.id === 'bus-spi' ? 3 : 1.6} />
                <path d="M 430,110 L 480,110" stroke="#38bdf8" strokeWidth={selectedBus?.id === 'bus-spi' ? 3 : 1.6} />
                <path d="M 345,155 L 345,215" stroke="#38bdf8" strokeWidth={selectedBus?.id === 'bus-spi' ? 3 : 1.6} strokeDasharray="4,2" />
                <path d="M 430,110 L 455,110 L 455,330 L 480,330" stroke="#38bdf8" strokeWidth={selectedBus?.id === 'bus-spi' ? 3 : 1.6} />
              </g>

              {/* CAN-FD Actuation Highway */}
              <g
                onClick={() => {
                  soundFX.click();
                  onSelectBus?.(AVIONICS_BUSES[1]);
                }}
                className="cursor-pointer"
              >
                <path d="M 430,125 L 480,225" stroke="#f59e0b" strokeWidth={selectedBus?.id === 'bus-canfd' ? 3 : 1.8} />
                <path d="M 640,225 L 665,225 L 665,330 L 690,330" stroke="#f59e0b" strokeWidth={selectedBus?.id === 'bus-canfd' ? 3 : 1.5} strokeDasharray="3,3" />
              </g>

              {/* SpaceWire Telemetry Link */}
              <g
                onClick={() => {
                  soundFX.click();
                  onSelectBus?.(AVIONICS_BUSES[2]);
                }}
                className="cursor-pointer"
              >
                <path d="M 260,125 L 200,295" stroke="#a855f7" strokeWidth={selectedBus?.id === 'bus-spacewire' ? 3 : 1.6} strokeDasharray="4,2" />
              </g>

              {/* MIL-STD-1316 Arming Loop */}
              <g
                onClick={() => {
                  soundFX.click();
                  onSelectBus?.(AVIONICS_BUSES[3]);
                }}
                className="cursor-pointer"
              >
                <path d="M 690,110 L 665,110 L 665,240 L 690,240" stroke="#e11d48" strokeWidth={selectedBus?.id === 'bus-esad' ? 3 : 1.8} />
                <path d="M 770,165 L 770,295" stroke="#e11d48" strokeWidth={selectedBus?.id === 'bus-esad' ? 3 : 1.8} strokeDasharray="3,2" />
              </g>

              {/* DC Power Distribution Bus */}
              <g
                onClick={() => {
                  soundFX.click();
                  onSelectBus?.(AVIONICS_BUSES[4]);
                }}
                className="cursor-pointer"
              >
                <path d="M 690,240 L 455,240 L 455,125 L 430,125" stroke="#10b981" strokeWidth={selectedBus?.id === 'bus-power' ? 2.5 : 1.2} strokeOpacity="0.75" />
              </g>
            </g>

            {/* 10 Schematic Chip Cards */}
            {MISSILE_CHIPS.map((chip) => {
              const isSelected = selectedChip?.id === chip.id;
              const isHovered = hoveredChipId === chip.id;
              const active = isChipActive(chip.id);
              const { x, y, width, height } = chip.schematicCoords;

              return (
                <g
                  key={chip.id}
                  onClick={() => {
                    soundFX.chipSelect();
                    onSelectChip(chip);
                  }}
                  onMouseEnter={() => setHoveredChipId(chip.id)}
                  onMouseLeave={() => setHoveredChipId(null)}
                  className="cursor-pointer transition-all duration-150"
                  filter={isSelected || isHovered || active ? 'url(#glowSubtle)' : undefined}
                >
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill="#080e1a"
                    stroke={isSelected ? '#ffffff' : chip.color}
                    strokeWidth={isSelected ? 1.6 : 1}
                    rx="3"
                  />

                  {/* Header Bar */}
                  <rect x={x} y={y} width={width} height="18" fill={chip.color} fillOpacity="0.15" rx="2" />
                  <text x={x + 8} y={y + 13} fill="#ffffff" fontSize="9" fontFamily="monospace" fontWeight="bold">
                    {chip.refDes} · {chip.packageType.split(' ')[0]}
                  </text>
                  <circle
                    cx={x + width - 9}
                    cy={y + 9}
                    r="2.5"
                    fill={active ? '#10b981' : chip.color}
                    className={active ? 'animate-pulse' : ''}
                  />

                  {/* Chip Name */}
                  <text x={x + 8} y={y + 34} fill={chip.color} fontSize="9" fontFamily="sans-serif" fontWeight="bold">
                    {chip.shortName}
                  </text>

                  {/* Specs */}
                  <text x={x + 8} y={y + 48} fill="#94a3b8" fontSize="7" fontFamily="monospace">
                    {chip.clockFreq} · {chip.operatingVoltage}
                  </text>
                  <text x={x + 8} y={y + 61} fill="#cbd5e1" fontSize="7" fontFamily="monospace" fontWeight="600">
                    {chip.interfaces[0]?.split(' ')[0]}
                  </text>

                  {/* Active Badge */}
                  {active && (
                    <rect
                      x={x + width - 46}
                      y={y + height - 15}
                      width="40"
                      height="11"
                      fill="#064e3b"
                      stroke="#10b981"
                      strokeWidth="0.8"
                      rx="2"
                    />
                  )}
                  {active && (
                    <text
                      x={x + width - 26}
                      y={y + height - 7}
                      fill="#34d399"
                      fontSize="6"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      ENGAGED
                    </text>
                  )}
                </g>
              );
            })}

            {/* Bus Protocol Legend */}
            <g fontSize="8" fontFamily="monospace" fontWeight="600">
              <rect x="25" y="348" width="950" height="24" fill="#090e1a" stroke="#1e273a" rx="4" />

              <g onClick={() => onSelectBus?.(AVIONICS_BUSES[0])} className="cursor-pointer">
                <circle cx="45" cy="360" r="3.5" fill="#38bdf8" />
                <text x="55" y="363" fill={selectedBus?.id === 'bus-spi' ? '#ffffff' : '#38bdf8'}>
                  SPI BUS (50 MHz)
                </text>
              </g>

              <g onClick={() => onSelectBus?.(AVIONICS_BUSES[1])} className="cursor-pointer">
                <circle cx="230" cy="360" r="3.5" fill="#f59e0b" />
                <text x="240" y="363" fill={selectedBus?.id === 'bus-canfd' ? '#ffffff' : '#f59e0b'}>
                  CAN-FD (5 Mbps)
                </text>
              </g>

              <g onClick={() => onSelectBus?.(AVIONICS_BUSES[2])} className="cursor-pointer">
                <circle cx="420" cy="360" r="3.5" fill="#a855f7" />
                <text x="430" y="363" fill={selectedBus?.id === 'bus-spacewire' ? '#ffffff' : '#a855f7'}>
                  SPACEWIRE (100 Mbps)
                </text>
              </g>

              <g onClick={() => onSelectBus?.(AVIONICS_BUSES[3])} className="cursor-pointer">
                <circle cx="630" cy="360" r="3.5" fill="#e11d48" />
                <text x="640" y="363" fill={selectedBus?.id === 'bus-esad' ? '#ffffff' : '#e11d48'}>
                  MIL-STD-1316 FIRE
                </text>
              </g>

              <g onClick={() => onSelectBus?.(AVIONICS_BUSES[4])} className="cursor-pointer">
                <circle cx="830" cy="360" r="3.5" fill="#10b981" />
                <text x="840" y="363" fill={selectedBus?.id === 'bus-power' ? '#ffffff' : '#10b981'}>
                  28V DC POWER
                </text>
              </g>
            </g>
          </svg>
        )}
      </div>
    </div>
  );
};
