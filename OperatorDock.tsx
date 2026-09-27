/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FlightPhaseId,
  GuidanceLawMode,
  FuzeBurstPreset,
} from '../../types/operatorFlight';
import { TRAJECTORY_PHASES } from '../../utils/flightDynamics';
import { soundFX } from '../../utils/audioFeedback';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Radio,
  Sliders,
  Compass,
  Crosshair,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  Terminal,
  Activity,
  AlertTriangle,
  Flame,
  Zap,
  Target,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Lock,
  Unlock,
  Radar,
  Gauge,
  Navigation,
  User,
  Clock,
} from 'lucide-react';

export const OperatorDock: React.FC = () => {
  const {
    flightTelemetry,
    tacticalTarget,
    smartFuze,
    operatorProfile,
    annunciator,
    timeSeconds,
    isRunning,
    startSimulation,
    pauseSimulation,
    setFlightPhase,
    setGuidanceMode,
    setCanardTrim,
    setCanardMode,
    setMasterArm,
    setHobPreset,
    toggleEccmAntiJam,
    toggleAudioAnnunciator,
    acknowledgeMasterWarning,
    setTacticalTarget,
    executeEmergencyFts,
    executeBuiltInTest,
    setOperatorProfile,
    auditLogs,
  } = useApp();

  const [expanded, setExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'GNC' | 'TARGET' | 'FUZE_EW' | 'OPERATOR'>('GNC');
  const [safetyFlapOpen, setSafetyFlapOpen] = useState<boolean>(false);

  // Global hotkey: Cmd+O or Ctrl+O toggles Operator Dock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setExpanded((prev) => !prev);
        soundFX.click();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Pre-configured tactical targets
  const TARGET_PRESETS = [
    {
      id: 'TGT-ALPHA-07',
      name: 'Coastal Defense Sector Alpha-07',
      lat: 13.9492,
      lon: 80.4085,
      altM: 14.5,
      rangeKm: 31.5,
      bearingDeg: 39.2,
    },
    {
      id: 'TGT-BETA-12',
      name: 'Mobile SAM TEL Radar Site Beta-12',
      lat: 13.8950,
      lon: 80.4610,
      altM: 28.0,
      rangeKm: 28.2,
      bearingDeg: 52.4,
    },
    {
      id: 'TGT-CHARLIE-03',
      name: 'Hardened Command Bunker Charlie',
      lat: 14.0150,
      lon: 80.3620,
      altM: 45.0,
      rangeKm: 34.0,
      bearingDeg: 28.1,
    },
    {
      id: 'TGT-DELTA-09',
      name: 'Fast Attack Naval Corvette Delta',
      lat: 13.7820,
      lon: 80.4480,
      altM: 0.0,
      rangeKm: 22.8,
      bearingDeg: 85.0,
    },
  ];

  const OPERATOR_ROLES = [
    { callsign: 'FLIGHT-DIR-01', role: 'Lead Flight Test Director', clearance: 'TOP-SECRET // DEFENSE R&D' },
    { callsign: 'GNC-ALPHA', role: 'Guidance & Navigation Specialist', clearance: 'RESTRICTED // AVIONICS' },
    { callsign: 'SAFETY-03', role: 'Range Safety & Interlock Officer', clearance: 'WEAPONS CLEARANCE // LEVEL-4' },
    { callsign: 'TAC-OPS-LEAD', role: 'Tactical Fire Direction Officer', clearance: 'COMMAND & CONTROL // ARTY' },
  ];

  const HOB_PRESETS: Array<{ id: FuzeBurstPreset; label: string; hobM: number; desc: string }> = [
    { id: 'AIRBURST_3M', label: 'Airburst 3.5m', hobM: 3.5, desc: 'Low burst radius' },
    { id: 'AIRBURST_5M', label: 'Airburst 5.0m', hobM: 5.0, desc: 'Standard fragmentation' },
    { id: 'AIRBURST_7M', label: 'Airburst 7.0m', hobM: 7.0, desc: 'Wide sensor denial' },
    { id: 'POINT_DETONATING', label: 'Point Impact', hobM: 0.0, desc: 'Direct impact kinetic' },
    { id: 'BUNKER_DELAY', label: 'Bunker Delay', hobM: -2.5, desc: 'Sub-surface penetration' },
  ];

  const recentOperatorLogs = auditLogs
    .filter((l) => l.eventType === 'OPERATOR_ACTION' || l.module.includes('GNC') || l.module.includes('FUZE'))
    .slice(0, 4);

  return (
    <aside
      aria-label="Operator command and telemetry console"
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#090c12]/98 backdrop-blur-md border-t border-[#1f283d] text-slate-200 select-none shadow-2xl transition-all duration-300 font-sans"
    >
      {/* ========================================================================= */}
      {/* 1. COMPACT ANNUNCIATOR & FLIGHT PHASE BAR (Always Visible)               */}
      {/* ========================================================================= */}
      <div className="h-11 px-3 sm:px-4 flex items-center justify-between gap-2 overflow-x-auto border-b border-[#182030] text-xs">
        
        {/* Left: Master Annunciator Light Tiles */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Master Warning Lamp */}
          <button
            onClick={acknowledgeMasterWarning}
            className={`px-2 py-1 rounded-xs font-mono font-bold text-[10px] tracking-wider uppercase border flex items-center gap-1 transition-all ${
              annunciator.masterWarning
                ? 'bg-rose-950 text-rose-200 border-rose-500 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                : 'bg-[#121620] text-slate-500 border-[#222b3d]'
            }`}
            title="Master Warning Annunciator (Click to ACK)"
          >
            <span className={`w-2 h-2 rounded-full ${annunciator.masterWarning ? 'bg-rose-500 animate-ping' : 'bg-slate-600'}`} />
            <span>MSTR WARN</span>
          </button>

          {/* Master Caution Lamp */}
          <button
            onClick={acknowledgeMasterWarning}
            className={`px-2 py-1 rounded-xs font-mono font-bold text-[10px] tracking-wider uppercase border flex items-center gap-1 transition-all ${
              annunciator.masterCaution
                ? 'bg-amber-950 text-amber-200 border-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                : 'bg-[#121620] text-slate-500 border-[#222b3d]'
            }`}
            title="Master Caution Annunciator (Click to ACK)"
          >
            <span className={`w-2 h-2 rounded-full ${annunciator.masterCaution ? 'bg-amber-400' : 'bg-slate-600'}`} />
            <span>CAUTION</span>
          </button>

          {/* GNC Armed */}
          <div
            className={`hidden sm:flex px-2 py-1 rounded-xs font-mono font-bold text-[10px] tracking-wider uppercase border items-center gap-1 ${
              smartFuze.armState !== 'SAFE'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/70 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                : 'bg-[#121620] text-slate-500 border-[#222b3d]'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${smartFuze.armState !== 'SAFE' ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            <span>{smartFuze.armState !== 'SAFE' ? 'ARMED' : 'SAFE'}</span>
          </div>

          {/* Seeker Status */}
          <div
            className={`hidden md:flex px-2 py-1 rounded-xs font-mono font-bold text-[10px] tracking-wider uppercase border items-center gap-1 ${
              flightTelemetry.seekerStatus === 'LOCKED' || flightTelemetry.seekerStatus === 'TERMINAL_HOMING'
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/70'
                : 'bg-[#121620] text-slate-500 border-[#222b3d]'
            }`}
          >
            <Radar size={11} className={flightTelemetry.seekerStatus === 'LOCKED' ? 'text-cyan-400 animate-spin' : ''} />
            <span>SEEKER: {flightTelemetry.seekerStatus}</span>
          </div>

          {/* ECCM Anti-Jam */}
          <div
            className={`hidden lg:flex px-2 py-1 rounded-xs font-mono font-bold text-[10px] tracking-wider uppercase border items-center gap-1 ${
              annunciator.eccmActive
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/70'
                : 'bg-[#121620] text-slate-500 border-[#222b3d]'
            }`}
          >
            <Radio size={11} />
            <span>CRPA {annunciator.eccmActive ? 'ON' : 'OFF'}</span>
          </div>
        </div>

        {/* Center: Live Synchronized Flight Phase Scrubber */}
        <div className="flex items-center gap-1 bg-[#0d111a] p-0.5 rounded-xs border border-[#1b2333]">
          {TRAJECTORY_PHASES.map((p) => {
            const isCurrent = flightTelemetry.phaseId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setFlightPhase(p.id)}
                className={`px-2 py-1 rounded-xs font-mono text-[10px] tracking-tight transition-all flex items-center gap-1 ${
                  isCurrent
                    ? 'bg-sky-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#161d2b]'
                }`}
                title={`${p.name} (${p.duration})\nClick to scrub simulation time to T+${p.startSec}s`}
              >
                <span>{p.code}</span>
                <span className="hidden xl:inline">{p.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Live Flight Metrics & Expand/Mute controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Key Live Telemetry Stream */}
          <div className="hidden sm:flex items-center gap-3 px-2.5 py-1 bg-[#0d111a] rounded-xs border border-[#1b2333] font-mono text-[11px] tabular-nums">
            <span className="text-slate-400">
              M <strong className="text-sky-300">{flightTelemetry.mach.toFixed(2)}</strong>
            </span>
            <span className="text-slate-400">
              ALT <strong className="text-emerald-300">{Math.round(flightTelemetry.altitudeM)}m</strong>
            </span>
            <span className="text-slate-400">
              G <strong className="text-amber-300">{flightTelemetry.gLoad.toFixed(1)}g</strong>
            </span>
            <span className="text-slate-400 hidden lg:inline">
              T-GO <strong className="text-rose-300">{flightTelemetry.timeToGoSec.toFixed(1)}s</strong>
            </span>
          </div>

          {/* Sound FX Toggle */}
          <button
            onClick={toggleAudioAnnunciator}
            className={`p-1.5 rounded-xs border transition-colors ${
              annunciator.audioEnabled
                ? 'bg-[#151c29] border-sky-600/50 text-sky-400 hover:text-white'
                : 'bg-[#121620] border-[#222b3d] text-slate-500 hover:text-slate-300'
            }`}
            title={annunciator.audioEnabled ? 'Tactile Sound FX Enabled (Click to Mute)' : 'Sound FX Muted'}
          >
            {annunciator.audioEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </button>

          {/* Expand / Minimize Console Drawer */}
          <button
            onClick={() => {
              setExpanded(!expanded);
              soundFX.click();
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xs bg-sky-950/70 border border-sky-600 text-sky-300 hover:bg-sky-900/80 font-mono text-xs font-semibold transition-all shadow-xs"
            title="Toggle Operator Command Deck (Shortcut: ⌘O)"
          >
            <span>OPERATOR CONSOLE</span>
            {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. EXPANDED INTERACTIVE OPERATOR COMMAND DECK                            */}
      {/* ========================================================================= */}
      {expanded && (
        <div className="p-3 sm:p-4 max-w-[1780px] mx-auto border-t border-[#1a2333] animate-in slide-in-from-bottom-2 duration-200">
          
          {/* Deck Navigation Tabs */}
          <div className="flex items-center justify-between gap-3 mb-3 border-b border-[#1b2436] pb-2">
            <div className="flex items-center gap-1">
              {[
                { id: 'GNC' as const, label: 'GNC & Fin Trim (CAS)', icon: Sliders },
                { id: 'TARGET' as const, label: 'Tactical Targeting', icon: Crosshair },
                { id: 'FUZE_EW' as const, label: 'Smart Fuze & EW (ECCM)', icon: Zap },
                { id: 'OPERATOR' as const, label: 'Operator Station & Audit', icon: Terminal },
              ].map((tab) => {
                const isSel = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      soundFX.click();
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs font-mono text-xs transition-colors ${
                      isSel
                        ? 'bg-sky-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#121722]'
                    }`}
                  >
                    <Icon size={13} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Operator Callsign & Clock Stamp */}
            <div className="hidden md:flex items-center gap-3 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1 text-sky-400">
                <User size={12} />
                <span>{operatorProfile.callsign}</span>
              </span>
              <span>·</span>
              <span className="text-slate-500">{operatorProfile.role}</span>
              <span>·</span>
              <span className="text-emerald-400 font-semibold">{operatorProfile.clearanceLevel}</span>
            </div>
          </div>

          {/* TAB 1: GNC & CANARD ACTUATION SYSTEM */}
          {activeTab === 'GNC' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Guidance Law Selector */}
              <div className="bg-[#0e121a] p-3 rounded-xs border border-[#1d2638] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-slate-300 uppercase tracking-wide">
                    Guidance Law Mode
                  </span>
                  <span className="font-mono text-[11px] text-sky-400">MIL-STD GNC-301</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5 text-xs font-mono">
                  {[
                    { mode: 'AUGMENTED_PN' as GuidanceLawMode, label: 'Augmented PN (Closed Loop)', desc: 'Proportional navigation with gravity bias' },
                    { mode: 'PURE_PURSUIT' as GuidanceLawMode, label: 'Pure Pursuit', desc: 'Direct seeker velocity vector alignment' },
                    { mode: 'BALLISTIC_FALLBACK' as GuidanceLawMode, label: 'Ballistic Fallback', desc: 'Pure inertial trim; ignores jammed seeker' },
                    { mode: 'MANUAL_TRIM' as GuidanceLawMode, label: 'Direct Manual Canard Trim', desc: 'Direct operator joypad deflection' },
                  ].map((g) => (
                    <button
                      key={g.mode}
                      onClick={() => setGuidanceMode(g.mode)}
                      className={`p-2 rounded-xs text-left border transition-all ${
                        flightTelemetry.guidanceMode === g.mode
                          ? 'bg-sky-950/70 border-sky-500 text-sky-200 font-bold'
                          : 'bg-[#121722] border-[#20293d] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-semibold">{g.label}</div>
                      <div className="text-[10px] text-slate-400">{g.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Canard Actuator (CAS) Controls */}
              <div className="bg-[#0e121a] p-3 rounded-xs border border-[#1d2638] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-slate-300 uppercase tracking-wide">
                      Canard Fin Steering
                    </span>
                    <button
                      onClick={() => setCanardMode(flightTelemetry.canardMode === 'AUTO' ? 'MANUAL' : 'AUTO')}
                      className={`px-2 py-0.5 rounded-xs font-mono text-[10px] font-bold uppercase transition-colors ${
                        flightTelemetry.canardMode === 'MANUAL'
                          ? 'bg-amber-600 text-white'
                          : 'bg-[#192233] text-sky-300 border border-[#273650]'
                      }`}
                    >
                      {flightTelemetry.canardMode}
                    </button>
                  </div>
                  {flightTelemetry.canardMode === 'MANUAL' && (
                    <button
                      onClick={() => setCanardTrim(0, 0, 0)}
                      className="text-[10px] font-mono text-slate-400 hover:text-white underline"
                    >
                      Center (0°)
                    </button>
                  )}
                </div>

                {/* Pitch Trim Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Pitch Trim (δe)</span>
                    <span className="text-sky-300 font-bold">{flightTelemetry.canards.pitch.toFixed(1)}°</span>
                  </div>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="0.5"
                    disabled={flightTelemetry.canardMode === 'AUTO'}
                    value={flightTelemetry.canards.pitch}
                    onChange={(e) =>
                      setCanardTrim(parseFloat(e.target.value), flightTelemetry.canards.yaw, flightTelemetry.canards.roll)
                    }
                    className="w-full accent-sky-500 h-1 bg-[#1a2333] rounded-xs cursor-pointer disabled:opacity-50"
                  />
                </div>

                {/* Yaw Trim Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Yaw Trim (δr)</span>
                    <span className="text-sky-300 font-bold">{flightTelemetry.canards.yaw.toFixed(1)}°</span>
                  </div>
                  <input
                    type="range"
                    min="-12"
                    max="12"
                    step="0.5"
                    disabled={flightTelemetry.canardMode === 'AUTO'}
                    value={flightTelemetry.canards.yaw}
                    onChange={(e) =>
                      setCanardTrim(flightTelemetry.canards.pitch, parseFloat(e.target.value), flightTelemetry.canards.roll)
                    }
                    className="w-full accent-sky-500 h-1 bg-[#1a2333] rounded-xs cursor-pointer disabled:opacity-50"
                  />
                </div>

                {/* Roll Rate Damper Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Roll Damping (δa)</span>
                    <span className="text-sky-300 font-bold">{flightTelemetry.canards.roll.toFixed(1)}°</span>
                  </div>
                  <input
                    type="range"
                    min="-5"
                    max="5"
                    step="0.5"
                    disabled={flightTelemetry.canardMode === 'AUTO'}
                    value={flightTelemetry.canards.roll}
                    onChange={(e) =>
                      setCanardTrim(flightTelemetry.canards.pitch, flightTelemetry.canards.yaw, parseFloat(e.target.value))
                    }
                    className="w-full accent-sky-500 h-1 bg-[#1a2333] rounded-xs cursor-pointer disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Live 4-Fin Real-time Deflection Matrix */}
              <div className="bg-[#0e121a] p-3 rounded-xs border border-[#1d2638] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-slate-300 uppercase tracking-wide">
                    Servo Deflections (δ1 - δ4)
                  </span>
                  <span className="font-mono text-[11px] text-emerald-400">SERVO BUS: OK</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 bg-[#121722] rounded-xs border border-[#20293d] flex justify-between items-center">
                    <span className="text-slate-400">FIN 1 (Top-R)</span>
                    <span className="text-sky-300 font-bold">{flightTelemetry.canards.fin1.toFixed(1)}°</span>
                  </div>
                  <div className="p-2 bg-[#121722] rounded-xs border border-[#20293d] flex justify-between items-center">
                    <span className="text-slate-400">FIN 2 (Btm-R)</span>
                    <span className="text-sky-300 font-bold">{flightTelemetry.canards.fin2.toFixed(1)}°</span>
                  </div>
                  <div className="p-2 bg-[#121722] rounded-xs border border-[#20293d] flex justify-between items-center">
                    <span className="text-slate-400">FIN 3 (Btm-L)</span>
                    <span className="text-sky-300 font-bold">{flightTelemetry.canards.fin3.toFixed(1)}°</span>
                  </div>
                  <div className="p-2 bg-[#121722] rounded-xs border border-[#20293d] flex justify-between items-center">
                    <span className="text-slate-400">FIN 4 (Top-L)</span>
                    <span className="text-sky-300 font-bold">{flightTelemetry.canards.fin4.toFixed(1)}°</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1d2638] flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>AoA (α): <strong className="text-white">{flightTelemetry.angleOfAttackDeg}°</strong></span>
                  <span>Sideslip (β): <strong className="text-white">{flightTelemetry.sideslipAngleDeg}°</strong></span>
                  <span>Est CEP: <strong className="text-emerald-400">≤ {flightTelemetry.impactCepM}m</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TACTICAL TARGETING */}
          {activeTab === 'TARGET' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Presets */}
              <div className="bg-[#0e121a] p-3 rounded-xs border border-[#1d2638] space-y-2">
                <span className="font-mono font-semibold text-xs text-slate-300 uppercase tracking-wide">
                  Designate Target Preset
                </span>
                <div className="space-y-1.5 font-mono text-xs">
                  {TARGET_PRESETS.map((t) => {
                    const isCur = tacticalTarget.targetId === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() =>
                          setTacticalTarget({
                            targetId: t.id,
                            targetName: t.name,
                            targetLat: t.lat,
                            targetLon: t.lon,
                            targetAltM: t.altM,
                          })
                        }
                        className={`w-full p-2 rounded-xs border text-left transition-all ${
                          isCur
                            ? 'bg-sky-950/70 border-sky-500 text-sky-200 font-bold'
                            : 'bg-[#121722] border-[#20293d] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex justify-between">
                          <span>{t.id}</span>
                          <span className="text-emerald-400">{t.rangeKm} km · {t.bearingDeg}°</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">{t.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Target Geospatial Coordinates */}
              <div className="bg-[#0e121a] p-3 rounded-xs border border-[#1d2638] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-slate-300 uppercase tracking-wide">
                    Designated Target State
                  </span>
                  <span className="font-mono text-[11px] text-cyan-400">SEEKER: {flightTelemetry.seekerStatus}</span>
                </div>
                <div className="space-y-1.5 font-mono text-xs text-slate-300">
                  <div className="p-2 bg-[#121722] rounded-xs border border-[#20293d] space-y-1">
                    <div className="text-slate-400 text-[10px] uppercase">Target Name &amp; ID</div>
                    <div className="font-bold text-white text-xs">{tacticalTarget.targetName}</div>
                    <div className="text-sky-400 text-[11px]">{tacticalTarget.targetId}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-[#121722] rounded-xs border border-[#20293d]">
                      <div className="text-slate-400 text-[10px]">Target Latitude</div>
                      <div className="font-bold text-white">{tacticalTarget.targetLat.toFixed(5)}° N</div>
                    </div>
                    <div className="p-2 bg-[#121722] rounded-xs border border-[#20293d]">
                      <div className="text-slate-400 text-[10px]">Target Longitude</div>
                      <div className="font-bold text-white">{tacticalTarget.targetLon.toFixed(5)}° E</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-time Trajectory Intercept Vector */}
              <div className="bg-[#0e121a] p-3 rounded-xs border border-[#1d2638] space-y-2 font-mono text-xs">
                <span className="font-mono font-semibold text-slate-300 uppercase tracking-wide">
                  Live Intercept Telemetry
                </span>
                <div className="space-y-1.5">
                  <div className="p-2 bg-[#121722] rounded-xs border border-[#20293d] flex justify-between">
                    <span className="text-slate-400">Slant Range-to-Go</span>
                    <span className="text-sky-300 font-bold">{tacticalTarget.distanceKm.toFixed(2)} km</span>
                  </div>
                  <div className="p-2 bg-[#121722] rounded-xs border border-[#20293d] flex justify-between">
                    <span className="text-slate-400">Line-of-Sight Bearing</span>
                    <span className="text-emerald-300 font-bold">{tacticalTarget.bearingDeg.toFixed(1)}°</span>
                  </div>
                  <div className="p-2 bg-[#121722] rounded-xs border border-[#20293d] flex justify-between">
                    <span className="text-slate-400">Closing Velocity (Vc)</span>
                    <span className="text-amber-300 font-bold">{Math.round(flightTelemetry.velocityMps)} m/s</span>
                  </div>
                  <div className="p-2 bg-[#121722] rounded-xs border border-[#20293d] flex justify-between">
                    <span className="text-slate-400">Time-to-Go (Tgo)</span>
                    <span className="text-rose-300 font-bold">{flightTelemetry.timeToGoSec.toFixed(1)} s</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SMART FUZE & EW */}
          {activeTab === 'FUZE_EW' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Master Arm Safety Cover */}
              <div className="bg-[#0e121a] p-3 rounded-xs border border-[#1d2638] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-slate-300 uppercase tracking-wide">
                    Master Arm Safety Interlock
                  </span>
                  <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-xs ${
                    smartFuze.armState !== 'SAFE' ? 'bg-rose-950 text-rose-300 border border-rose-500' : 'bg-[#182030] text-slate-400'
                  }`}>
                    {smartFuze.armState}
                  </span>
                </div>

                <div className="p-3 bg-[#121722] rounded-xs border border-[#20293d] text-center space-y-2">
                  <div className="text-[11px] font-mono text-slate-400">
                    Dual Mechanical &amp; Electrical Safety-and-Arming Unit (ESAD)
                  </div>
                  
                  {/* Safety Flap Guard */}
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => setSafetyFlapOpen(!safetyFlapOpen)}
                      className={`px-3 py-1 text-xs font-mono font-bold rounded-xs border transition-all ${
                        safetyFlapOpen
                          ? 'bg-amber-950/80 text-amber-200 border-amber-500'
                          : 'bg-[#1c2436] text-slate-400 border-[#2b3952]'
                      }`}
                    >
                      {safetyFlapOpen ? 'SAFETY FLAP: OPEN' : 'SAFETY FLAP: CLOSED'}
                    </button>

                    <button
                      disabled={!safetyFlapOpen}
                      onClick={() => setMasterArm(smartFuze.armState === 'SAFE')}
                      className={`px-4 py-1 text-xs font-mono font-bold rounded-xs border transition-all disabled:opacity-40 ${
                        smartFuze.armState !== 'SAFE'
                          ? 'bg-rose-600 text-white border-rose-400 hover:bg-rose-700 animate-pulse'
                          : 'bg-emerald-600 text-white border-emerald-400 hover:bg-emerald-700'
                      }`}
                    >
                      {smartFuze.armState !== 'SAFE' ? 'DISARM FUZE' : 'ARM WEAPON'}
                    </button>
                  </div>
                </div>

                {/* FMCW Standoff Meter */}
                <div className="space-y-1 font-mono text-xs">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">77 GHz FMCW Standoff</span>
                    <span className="text-cyan-300 font-bold">{Math.round(smartFuze.standoffRangeM)} m</span>
                  </div>
                  <div className="w-full bg-[#161c28] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-400 h-full transition-all"
                      style={{ width: `${Math.min(100, (smartFuze.standoffRangeM / 1000) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Height-of-Burst (HOB) Presets */}
              <div className="bg-[#0e121a] p-3 rounded-xs border border-[#1d2638] space-y-2">
                <span className="font-mono font-semibold text-xs text-slate-300 uppercase tracking-wide">
                  Height-of-Burst (HOB) Setting
                </span>
                <div className="space-y-1.5 font-mono text-xs">
                  {HOB_PRESETS.map((h) => {
                    const isSelected = smartFuze.preset === h.id;
                    return (
                      <button
                        key={h.id}
                        onClick={() => setHobPreset(h.id, h.hobM)}
                        className={`w-full p-2 rounded-xs border text-left transition-all ${
                          isSelected
                            ? 'bg-sky-950/70 border-sky-500 text-sky-200 font-bold'
                            : 'bg-[#121722] border-[#20293d] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex justify-between">
                          <span>{h.label}</span>
                          <span className="text-cyan-400 font-bold">{h.hobM} m</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{h.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Electronic Warfare (CRPA) & FTS Guard */}
              <div className="bg-[#0e121a] p-3 rounded-xs border border-[#1d2638] space-y-3 font-mono text-xs">
                <span className="font-mono font-semibold text-slate-300 uppercase tracking-wide">
                  Electronic Warfare &amp; Safety
                </span>

                {/* CRPA Anti-Jam Toggle */}
                <div className="p-2.5 bg-[#121722] rounded-xs border border-[#20293d] space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-semibold">CRPA Anti-Jamming</span>
                    <button
                      onClick={toggleEccmAntiJam}
                      className={`px-2 py-0.5 rounded-xs font-bold text-[10px] ${
                        annunciator.eccmActive
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#1e2738] text-slate-400'
                      }`}
                    >
                      {annunciator.eccmActive ? 'ENGAGED' : 'STANDBY'}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    4-element controlled radiation pattern antenna with 47 dB adaptive null depth against high-power GPS jammers.
                  </p>
                </div>

                {/* Master Built-In-Test */}
                <button
                  onClick={executeBuiltInTest}
                  className="w-full py-2 rounded-xs bg-[#151c29] border border-[#2b3850] hover:border-sky-500 text-sky-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Activity size={13} />
                  <span>RUN 50ms MASTER BIT SWEEP</span>
                </button>

                {/* Emergency Flight Termination System */}
                <button
                  onClick={executeEmergencyFts}
                  className="w-full py-2 rounded-xs bg-rose-950/80 border border-rose-600 hover:bg-rose-900 text-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <AlertTriangle size={13} />
                  <span>EMERGENCY ABORT (FTS TERMINATE)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: OPERATOR STATION & AUDIT */}
          {activeTab === 'OPERATOR' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Operator Call-sign Switcher */}
              <div className="bg-[#0e121a] p-3 rounded-xs border border-[#1d2638] space-y-2 font-mono text-xs">
                <span className="font-mono font-semibold text-slate-300 uppercase tracking-wide">
                  Switch Active Operator Station
                </span>
                <div className="space-y-1.5">
                  {OPERATOR_ROLES.map((r) => {
                    const isCur = operatorProfile.callsign === r.callsign;
                    return (
                      <button
                        key={r.callsign}
                        onClick={() =>
                          setOperatorProfile({
                            callsign: r.callsign,
                            role: r.role,
                            clearanceLevel: r.clearance,
                          })
                        }
                        className={`w-full p-2 rounded-xs border text-left transition-all ${
                          isCur
                            ? 'bg-sky-950/70 border-sky-500 text-sky-200 font-bold'
                            : 'bg-[#121722] border-[#20293d] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex justify-between">
                          <span>{r.callsign}</span>
                          <span className="text-emerald-400 text-[10px]">{r.clearance.split('//')[0]}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{r.role}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Station Security & Invariants */}
              <div className="bg-[#0e121a] p-3 rounded-xs border border-[#1d2638] space-y-2 font-mono text-xs">
                <span className="font-mono font-semibold text-slate-300 uppercase tracking-wide">
                  Avionics Station Invariants
                </span>
                <div className="space-y-1.5 text-slate-300">
                  <div className="p-2 bg-[#121722] rounded-xs border border-[#20293d] flex justify-between">
                    <span className="text-slate-400">Simulation Clock</span>
                    <span className="text-sky-300 font-bold">T+{timeSeconds.toFixed(1)}s</span>
                  </div>
                  <div className="p-2 bg-[#121722] rounded-xs border border-[#20293d] flex justify-between">
                    <span className="text-slate-400">Sampling Rate</span>
                    <span className="text-white">200 Hz Ref / 10 Hz Disp</span>
                  </div>
                  <div className="p-2 bg-[#121722] rounded-xs border border-[#20293d] flex justify-between">
                    <span className="text-slate-400">Telemetry Bus</span>
                    <span className="text-emerald-400 font-bold">MIL-STD-1553B OK</span>
                  </div>
                  <div className="p-2 bg-[#121722] rounded-xs border border-[#20293d] flex justify-between">
                    <span className="text-slate-400">Cryptographic Seal</span>
                    <span className="text-cyan-400 font-bold">AES-256-GCM VERIFIED</span>
                  </div>
                </div>
              </div>

              {/* Live Operator Audit Log */}
              <div className="bg-[#0e121a] p-3 rounded-xs border border-[#1d2638] space-y-2 font-mono text-xs">
                <span className="font-mono font-semibold text-slate-300 uppercase tracking-wide">
                  Recent Dispatched Commands
                </span>
                <div className="space-y-1">
                  {recentOperatorLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-1.5 bg-[#121722] rounded-xs border border-[#1f283d] text-[11px] leading-tight space-y-0.5"
                    >
                      <div className="flex justify-between text-slate-400 text-[10px]">
                        <span className="text-sky-400">{log.module}</span>
                        <span>{new Date(log.timestamp).toISOString().substr(14, 5)}</span>
                      </div>
                      <div className="text-slate-200 line-clamp-1">{log.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </aside>
  );
};
