import React, { useState } from 'react';
import { MissileCrossSectionStation } from '../../types/missileArchitecture';
import { MISSILE_CROSS_SECTIONS } from '../../data/missileArchitectureData';
import {
  Layers,
  RotateCw,
  Compass,
  Info,
  Maximize2,
  Cpu,
  Zap,
  Shield,
  Ruler,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { soundFX } from '../../utils/audioFeedback';

interface MissileCrossSectionViewerProps {
  onSelectComponentRefDes?: (refDes: string) => void;
}

export const MissileCrossSectionViewer: React.FC<MissileCrossSectionViewerProps> = ({
  onSelectComponentRefDes,
}) => {
  const [activeStationIndex, setActiveStationIndex] = useState<number>(1); // Default to Station B-B (Avionics / Servos)
  const [rotationDeg, setRotationDeg] = useState<number>(0);
  const [hoveredComponentId, setHoveredComponentId] = useState<string | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  const activeStation = MISSILE_CROSS_SECTIONS[activeStationIndex];

  const handleNextStation = () => {
    soundFX.click();
    setActiveStationIndex((prev) => (prev + 1) % MISSILE_CROSS_SECTIONS.length);
    setSelectedComponentId(null);
  };

  const handlePrevStation = () => {
    soundFX.click();
    setActiveStationIndex((prev) => (prev - 1 + MISSILE_CROSS_SECTIONS.length) % MISSILE_CROSS_SECTIONS.length);
    setSelectedComponentId(null);
  };

  const handleSelectStation = (index: number) => {
    soundFX.click();
    setActiveStationIndex(index);
    setSelectedComponentId(null);
  };

  const handleRotate = () => {
    soundFX.click();
    setRotationDeg((deg) => (deg + 45) % 360);
  };

  const selectedOrHoveredComponent = activeStation.crossSectionComponents.find(
    (c) => c.id === (selectedComponentId || hoveredComponentId)
  );

  return (
    <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl font-sans">
      {/* Top Station Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-300 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-950/80 border border-blue-700/60 text-blue-400">
            <Layers size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white uppercase tracking-wider text-xs">
                Transverse Radial Cross-Section Analysis
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 font-mono font-semibold">
                {activeStation.stationCode}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Fuselage Station: FS-{activeStation.fuselageStationMm.toString().padStart(3, '0')} mm · Calibre: {activeStation.calibreDiameterMm} mm
            </p>
          </div>
        </div>

        {/* Station Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
          {MISSILE_CROSS_SECTIONS.map((st, idx) => (
            <button
              key={st.id}
              onClick={() => handleSelectStation(idx)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeStationIndex === idx
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{st.stationCode.split(' ')[1]}</span>
            </button>
          ))}
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRotate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
            title="Rotate Radial Plane by 45°"
          >
            <RotateCw size={13} />
            <span className="font-mono">{rotationDeg}°</span>
          </button>

          <button
            onClick={() => {
              soundFX.click();
              setShowDimensions(!showDimensions);
            }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              showDimensions
                ? 'bg-blue-950 text-blue-300 border-blue-700'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            <Ruler size={13} className="inline mr-1" />
            <span>Dims</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column CAD Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-800/80">
        {/* LEFT COLUMN: Radial 2D CAD Canvas (7 Cols) */}
        <div className="lg:col-span-7 p-6 flex flex-col items-center justify-center bg-[#070a12] relative min-h-[420px]">
          {/* Subtle Polar Coordinate Grid Background */}
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Fuselage Slice Indicator Line */}
          <div className="w-full max-w-md flex items-center justify-between text-[11px] font-mono text-slate-400 mb-3 px-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>SECTION {activeStation.stationCode}</span>
            </span>
            <span>PLANE AT Z = +{activeStation.fuselageStationMm} mm</span>
          </div>

          {/* SVG Canvas for Cross Section */}
          <div className="relative w-full max-w-[380px] aspect-square flex items-center justify-center">
            <svg
              viewBox="0 0 300 300"
              className="w-full h-full drop-shadow-2xl transition-transform duration-300"
              style={{ transform: `rotate(${rotationDeg}deg)` }}
            >
              <defs>
                {/* Metallic Shell Gradient */}
                <radialGradient id="shellGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="70%" stopColor="#1e293b" />
                  <stop offset="92%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#475569" />
                </radialGradient>

                {/* Explosive PBXN-9 Core Texture */}
                <radialGradient id="pbxnGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ea580c" />
                  <stop offset="60%" stopColor="#c2410c" />
                  <stop offset="100%" stopColor="#9a3412" />
                </radialGradient>

                {/* Star Grain Propellant Texture */}
                <radialGradient id="propellantGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="30%" stopColor="#ca8a04" />
                  <stop offset="85%" stopColor="#a16207" />
                  <stop offset="100%" stopColor="#713f12" />
                </radialGradient>

                {/* Pattern for Diamond Fragmentation Matrix */}
                <pattern id="fragGrid" width="8" height="8" patternUnits="userSpaceOnUse">
                  <path d="M 0 4 L 4 0 L 8 4 L 4 8 Z" fill="none" stroke="#e11d48" strokeWidth="0.75" opacity="0.6" />
                </pattern>
              </defs>

              {/* Polar Coordinate Crosshairs & Range Rings */}
              {showGrid && (
                <g stroke="#334155" strokeWidth="0.7" strokeDasharray="3 3" opacity="0.6">
                  <circle cx="150" cy="150" r="30" fill="none" />
                  <circle cx="150" cy="150" r="60" fill="none" />
                  <circle cx="150" cy="150" r="90" fill="none" />
                  <circle cx="150" cy="150" r="120" fill="none" />
                  <line x1="150" y1="10" x2="150" y2="290" />
                  <line x1="10" y1="150" x2="290" y2="150" />
                </g>
              )}

              {/* Projectile Outer Shell Wall (Annulus) */}
              <circle
                cx="150"
                cy="150"
                r="120"
                fill="url(#shellGrad)"
                stroke="#64748b"
                strokeWidth="2.5"
              />
              <circle
                cx="150"
                cy="150"
                r="104"
                fill="#0b1120"
                stroke="#475569"
                strokeWidth="1.5"
              />

              {/* Station Specific Render Elements */}
              {activeStation.id === 'station-aa' && (
                /* Optical Sapphire Lens & Gimbal Mount */
                <g>
                  <circle cx="150" cy="150" r="75" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1" strokeDasharray="4 2" />
                  <circle cx="150" cy="150" r="46" fill="#f43f5e" fillOpacity="0.25" stroke="#f43f5e" strokeWidth="2" />
                  {/* Quad-Photodiode Crosshair Dividers */}
                  <line x1="125" y1="150" x2="175" y2="150" stroke="#fb7185" strokeWidth="1.5" />
                  <line x1="150" y1="125" x2="150" y2="175" stroke="#fb7185" strokeWidth="1.5" />
                </g>
              )}

              {activeStation.id === 'station-bb' && (
                /* GNC Hexagonal PCB Stack & 4 Canard Servos */
                <g>
                  {/* Hexagonal Polyimide Avionics Chassis */}
                  <polygon
                    points="150,90 202,120 202,180 150,210 98,180 98,120"
                    fill="#0f172a"
                    stroke="#38bdf8"
                    strokeWidth="2"
                  />
                  {/* IMU Center Mount Ring */}
                  <circle cx="150" cy="150" r="24" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
                  {/* 4 Canard Actuator Drive Shafts extending outside */}
                  <line x1="150" y1="35" x2="150" y2="10" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
                  <line x1="265" y1="150" x2="290" y2="150" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
                  <line x1="150" y1="265" x2="150" y2="290" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
                  <line x1="35" y1="150" x2="10" y2="150" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
                </g>
              )}

              {activeStation.id === 'station-cc' && (
                /* Warhead PBXN-9 Core & Frag Sleeve */
                <g>
                  {/* Pre-Formed Frag Sleeve Ring */}
                  <circle cx="150" cy="150" r="102" fill="url(#fragGrid)" />
                  <circle cx="150" cy="150" r="85" fill="url(#pbxnGrad)" stroke="#ea580c" strokeWidth="1.5" />
                  {/* Central Booster Tube */}
                  <circle cx="150" cy="150" r="22" fill="#7f1d1d" stroke="#ef4444" strokeWidth="2" />
                </g>
              )}

              {activeStation.id === 'station-dd' && (
                /* Solid Rocket Motor Star Grain */
                <g>
                  {/* Propellant Annulus */}
                  <circle cx="150" cy="150" r="98" fill="url(#propellantGrad)" stroke="#ca8a04" strokeWidth="1.5" />
                  {/* 6-Point Star Perforation Core */}
                  <polygon
                    points="150,115 160,135 180,132 170,148 185,162 165,165 160,185 150,170 140,185 135,165 115,162 130,148 120,132 140,135"
                    fill="#020617"
                    stroke="#eab308"
                    strokeWidth="2"
                  />
                </g>
              )}

              {activeStation.id === 'station-ee' && (
                /* Aft Nozzle & 4 Wrap-around Fin Hinges */
                <g>
                  {/* Carbon-Carbon Nozzle Throat */}
                  <circle cx="150" cy="150" r="48" fill="#1e293b" stroke="#94a3b8" strokeWidth="2.5" />
                  <circle cx="150" cy="150" r="28" fill="#020617" stroke="#64748b" strokeWidth="1.5" />
                  {/* Wrap-around Fin Curved Profiles */}
                  <path d="M 225 90 A 110 110 0 0 1 255 145" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                  <path d="M 225 210 A 110 110 0 0 0 255 155" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                  <path d="M 75 210 A 110 110 0 0 1 45 155" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                  <path d="M 75 90 A 110 110 0 0 0 45 145" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                </g>
              )}

              {/* Dynamic Interactive Station Components */}
              {activeStation.crossSectionComponents.map((comp) => {
                const isHovered = hoveredComponentId === comp.id;
                const isSelected = selectedComponentId === comp.id;

                if (comp.shape === 'circle' && comp.coords.cx !== undefined && comp.coords.r !== undefined) {
                  return (
                    <circle
                      key={comp.id}
                      cx={comp.coords.cx}
                      cy={comp.coords.cy}
                      r={comp.coords.r}
                      fill={comp.color}
                      fillOpacity={isHovered || isSelected ? 0.8 : 0.35}
                      stroke={comp.color}
                      strokeWidth={isHovered || isSelected ? 2.5 : 1}
                      className="cursor-pointer transition-all duration-150"
                      onMouseEnter={() => setHoveredComponentId(comp.id)}
                      onMouseLeave={() => setHoveredComponentId(null)}
                      onClick={() => {
                        soundFX.click();
                        setSelectedComponentId(comp.id);
                        if (comp.refDes && onSelectComponentRefDes) {
                          onSelectComponentRefDes(comp.refDes);
                        }
                      }}
                    />
                  );
                }

                if (comp.shape === 'rect' && comp.coords.x !== undefined) {
                  return (
                    <rect
                      key={comp.id}
                      x={comp.coords.x}
                      y={comp.coords.y}
                      width={comp.coords.w}
                      height={comp.coords.h}
                      rx={3}
                      fill={comp.color}
                      fillOpacity={isHovered || isSelected ? 0.85 : 0.45}
                      stroke={isHovered || isSelected ? '#ffffff' : comp.color}
                      strokeWidth={isHovered || isSelected ? 2 : 1}
                      className="cursor-pointer transition-all duration-150"
                      onMouseEnter={() => setHoveredComponentId(comp.id)}
                      onMouseLeave={() => setHoveredComponentId(null)}
                      onClick={() => {
                        soundFX.click();
                        setSelectedComponentId(comp.id);
                        if (comp.refDes && onSelectComponentRefDes) {
                          onSelectComponentRefDes(comp.refDes);
                        }
                      }}
                    />
                  );
                }

                return null;
              })}

              {/* Dimension Lead-Lines (Engineering Dims) */}
              {showDimensions && (
                <g stroke="#38bdf8" strokeWidth="1" opacity="0.85" className="text-[9px] font-mono">
                  {/* Calibre Outer Diameter Dimension Line */}
                  <line x1="20" y1="15" x2="280" y2="15" />
                  <line x1="20" y1="10" x2="20" y2="20" />
                  <line x1="280" y1="10" x2="280" y2="20" />
                  <text x="150" y="12" fill="#38bdf8" textAnchor="middle" fontSize="9" fontWeight="bold">
                    Ø {activeStation.calibreDiameterMm} mm CALIBRE
                  </text>

                  {/* Wall Thickness Dimension Callout */}
                  <line x1="255" y1="150" x2="285" y2="120" stroke="#f59e0b" />
                  <text x="288" y="118" fill="#f59e0b" fontSize="8" fontWeight="bold">
                    t = {activeStation.wallThicknessMm} mm
                  </text>
                </g>
              )}
            </svg>
          </div>

          {/* Quick Prev / Next Station Buttons */}
          <div className="flex items-center justify-between w-full mt-4 px-2">
            <button
              onClick={handlePrevStation}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={16} />
              <span>Previous Station</span>
            </button>
            <span className="text-[11px] font-mono text-slate-500">
              Station {activeStationIndex + 1} of {MISSILE_CROSS_SECTIONS.length}
            </span>
            <button
              onClick={handleNextStation}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <span>Next Station</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Station Technical Dossier (5 Cols) */}
        <div className="lg:col-span-5 p-5 space-y-4 bg-slate-950/60 flex flex-col justify-between text-xs">
          <div className="space-y-4">
            {/* Station Title & Summary */}
            <div className="border-b border-slate-800 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest">
                  {activeStation.stationCode} · FUSELAGE DATUM
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {activeStation.massKg} kg SUB-MASS
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-white mt-1">
                {activeStation.stationName}
              </h3>
              <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                {activeStation.description}
              </p>
            </div>

            {/* Engineering Dimensions Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Shell Material</span>
                <div className="text-xs font-bold text-slate-200 mt-0.5 leading-snug">
                  {activeStation.shellMaterial.split('(')[0]}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Wall Thickness</span>
                <div className="text-xs font-bold text-amber-400 font-mono mt-0.5">
                  {activeStation.wallThicknessMm} mm ({((activeStation.wallThicknessMm / 25.4)).toFixed(3)} in)
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Outer / Inner Diameters</span>
                <div className="text-xs font-bold text-cyan-300 font-mono mt-0.5">
                  Ø {activeStation.calibreDiameterMm} / {activeStation.innerDiameterMm} mm
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Bore Volume Ratio</span>
                <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">
                  {((activeStation.innerDiameterMm / activeStation.calibreDiameterMm) * 100).toFixed(1)}% Usable Bay
                </div>
              </div>
            </div>

            {/* Selected or Hovered Component Details */}
            {selectedOrHoveredComponent ? (
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-600/50 space-y-1.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: selectedOrHoveredComponent.color }}
                    ></span>
                    <span className="font-bold text-xs text-white">
                      {selectedOrHoveredComponent.name}
                    </span>
                  </div>
                  {selectedOrHoveredComponent.refDes && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-900/80 text-blue-200 border border-blue-700 font-mono font-bold">
                      {selectedOrHoveredComponent.refDes}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {selectedOrHoveredComponent.description}
                </p>
                {selectedOrHoveredComponent.refDes && onSelectComponentRefDes && (
                  <button
                    onClick={() => onSelectComponentRefDes(selectedOrHoveredComponent.refDes!)}
                    className="text-[10px] text-blue-400 hover:text-blue-200 font-semibold underline underline-offset-2 flex items-center gap-1 mt-1"
                  >
                    <span>Inspect chip pinouts in Hardware Dossier →</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 text-slate-400 text-xs flex items-center gap-2">
                <Info size={15} className="text-blue-400 shrink-0" />
                <span>Hover or click any internal component in the CAD viewport to inspect its sub-assembly specs.</span>
              </div>
            )}

            {/* Structural Notes */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                Structural &amp; Environmental Protections:
              </span>
              <ul className="space-y-1">
                {activeStation.structuralNotes.map((note, nIdx) => (
                  <li key={nIdx} className="text-[11px] text-slate-300 flex items-start gap-1.5 leading-snug">
                    <span className="text-blue-400 font-bold">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Cable Raceway Passthrough Footer */}
          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-300">Internal Cable Raceway:</span>{' '}
            <span className="font-mono text-cyan-300">{activeStation.cableRacewayPassthrough}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
