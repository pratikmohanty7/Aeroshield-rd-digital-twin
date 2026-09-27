/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FlightPhaseId,
  FlightDynamicsTelemetry,
  TacticalTargetState,
  SmartFuzeState,
  CanardDeflections,
  GuidanceLawMode,
  SeekerTrackStatus,
} from '../types/operatorFlight';

export interface TrajectoryPhaseMeta {
  id: FlightPhaseId;
  name: string;
  code: string;
  duration: string;
  startSec: number;
  endSec: number;
  summary: string;
}

export const TRAJECTORY_PHASES: TrajectoryPhaseMeta[] = [
  {
    id: 'PHASE_GUN_LAUNCH',
    name: 'Launch Setback Shock',
    code: 'PH-01',
    duration: '0.00 - 0.05 s',
    startSec: 0.0,
    endSec: 0.05,
    summary: 'In-bore setback shock (28,400 g) and 280 Hz rifled barrel spin in 155mm ordnance breech.',
  },
  {
    id: 'PHASE_DESPIN',
    name: 'Muzzle Exit & Aerobrake Despin',
    code: 'PH-02',
    duration: '0.05 - 2.50 s',
    startSec: 0.05,
    endSec: 2.5,
    summary: 'Deployable counter-torque aerodynamic brake despinning forward guidance fuze from 280 Hz to < 20 Hz roll rate.',
  },
  {
    id: 'PHASE_MIDCOURSE',
    name: 'Midcourse Ballistic Glide',
    code: 'PH-03',
    duration: '2.50 - 55.00 s',
    startSec: 2.5,
    endSec: 55.0,
    summary: 'Coupled GNSS/INS Extended Kalman Filter navigation maintaining optimal aerodynamic glide corridor toward apogee (8,820m).',
  },
  {
    id: 'PHASE_TERMINAL',
    name: 'High-G Terminal Divert',
    code: 'PH-04',
    duration: '55.00 - 72.00 s',
    startSec: 55.0,
    endSec: 72.0,
    summary: 'High-rate canard servo divert actuation executing Proportional Navigation to correct wind drift to CEP < 1m.',
  },
  {
    id: 'PHASE_FUZE',
    name: 'Proximity FMCW Airburst',
    code: 'PH-05',
    duration: '72.00 - 74.00 s',
    startSec: 72.0,
    endSec: 74.0,
    summary: '77 GHz FMCW millimeter-wave radar proximity trigger evaluating Height-of-Burst (HOB: 5.0m) for optimal airburst burst.',
  },
];

/**
 * Calculates continuous ballistic & aerodynamic state for the guided projectile
 */
export function computeFlightDynamics(
  simTimeSec: number,
  canardMode: 'AUTO' | 'MANUAL',
  manualCanards: { pitch: number; yaw: number; roll: number },
  guidanceMode: GuidanceLawMode,
  eccmActive: boolean,
  crosswindKnots: number = 15
): FlightDynamicsTelemetry {
  const TOTAL_CYCLE = 74.0;
  // Loop or clamp within 0 - 74 seconds for continuous testing
  const t = Math.max(0, simTimeSec % TOTAL_CYCLE);

  // 1. Identify Phase
  let phase = TRAJECTORY_PHASES[2]; // Default midcourse
  for (const p of TRAJECTORY_PHASES) {
    if (t >= p.startSec && t <= p.endSec) {
      phase = p;
      break;
    }
  }

  // 2. Physics & Ballistics Equations
  let altitudeM = 0;
  let mach = 0.85;
  let gLoad = 1.0;
  let spinRateHz = 1.2;
  let downrangeKm = 0;
  let seekerStatus: SeekerTrackStatus = 'SEARCHING';
  let seekerLosRate = 0;
  let motorThrottle = 0;

  if (t <= 0.05) {
    // Launch Setback
    const frac = t / 0.05;
    altitudeM = 5 + frac * 115;
    mach = 0.85 + frac * 0.4;
    gLoad = 28400 * Math.sin(frac * Math.PI);
    spinRateHz = 280;
    downrangeKm = frac * 0.05;
    seekerStatus = 'OFFLINE';
  } else if (t <= 2.5) {
    // Muzzle Exit & Despin
    const frac = (t - 0.05) / (2.5 - 0.05);
    altitudeM = 120 + frac * 730;
    mach = 2.15 - frac * 0.2;
    gLoad = 1.2 + Math.sin(t * 8) * 0.4;
    spinRateHz = 280 * Math.exp(-frac * 2.8) + 1.2;
    downrangeKm = 0.05 + frac * 1.75;
    seekerStatus = 'OFFLINE';
  } else if (t <= 55.0) {
    // Midcourse Glide
    const frac = (t - 2.5) / (55.0 - 2.5);
    // Parabolic arc with apogee at ~32 seconds (8,820m)
    const normalizedArc = Math.sin(frac * Math.PI);
    altitudeM = 850 + normalizedArc * 7970;
    mach = 1.95 - frac * 0.65;
    gLoad = 1.0 + Math.sin(t * 0.4) * 0.15;
    spinRateHz = 1.2 + Math.sin(t * 0.2) * 0.1;
    downrangeKm = 1.8 + frac * 24.7;
    seekerStatus = frac > 0.75 ? 'ACQUIRING' : 'SEARCHING';
    seekerLosRate = 0.4 + Math.sin(t * 0.1) * 0.2;
  } else if (t <= 72.0) {
    // High-G Terminal Divert
    const frac = (t - 55.0) / (72.0 - 55.0);
    altitudeM = Math.max(50, 1600 * (1 - frac * 0.97));
    mach = 1.30 - frac * 0.25;
    gLoad = 3.8 + Math.sin(t * 3.5) * 1.6; // High-G divert pulses
    spinRateHz = 0.15;
    downrangeKm = 26.5 + frac * 4.9;
    seekerStatus = 'LOCKED';
    seekerLosRate = 2.8 + Math.cos(t * 2) * 1.1;
  } else {
    // Proximity FMCW Airburst
    const frac = (t - 72.0) / (74.0 - 72.0);
    altitudeM = Math.max(0, 50 * (1 - frac));
    mach = 0.98 - frac * 0.04;
    gLoad = 1.0;
    spinRateHz = 0.0;
    downrangeKm = 31.4 + frac * 0.1;
    seekerStatus = 'TERMINAL_HOMING';
    seekerLosRate = 0.05;
  }

  // Velocity (m/s) based on Mach and standard temperature
  const tempKelvin = Math.max(216.65, 288.15 - 0.0065 * altitudeM);
  const speedOfSound = Math.sqrt(1.4 * 287.05 * tempKelvin);
  const velocityMps = mach * speedOfSound;

  // Dynamic Pressure: Q = 0.5 * rho * v^2
  const airDensity = Math.max(0.1, 1.225 * Math.pow(tempKelvin / 288.15, 4.256));
  const dynamicPressureKpa = (0.5 * airDensity * Math.pow(velocityMps, 2)) / 1000;

  // Canard Fin Calculation
  let canards: CanardDeflections;
  let angleOfAttackDeg = 0;
  let sideslipAngleDeg = 0;

  if (canardMode === 'MANUAL') {
    const p = Math.max(-15, Math.min(15, manualCanards.pitch));
    const y = Math.max(-15, Math.min(15, manualCanards.yaw));
    const r = Math.max(-15, Math.min(15, manualCanards.roll));

    canards = {
      fin1: parseFloat((p + y + r).toFixed(2)),
      fin2: parseFloat((-p + y + r).toFixed(2)),
      fin3: parseFloat((-p - y + r).toFixed(2)),
      fin4: parseFloat((p - y + r).toFixed(2)),
      pitch: p,
      yaw: y,
      roll: r,
    };
    angleOfAttackDeg = parseFloat((p * 0.42).toFixed(2));
    sideslipAngleDeg = parseFloat((y * 0.42).toFixed(2));
  } else {
    // Autonomous Proportional Navigation trim
    let targetPitch = 0;
    let targetYaw = 0;

    if (phase.id === 'PHASE_MIDCOURSE') {
      targetPitch = Math.sin(t * 0.3) * 1.4;
      targetYaw = (crosswindKnots / 30) * 1.8 + Math.cos(t * 0.25) * 0.6;
    } else if (phase.id === 'PHASE_TERMINAL') {
      targetPitch = -3.2 + Math.sin(t * 2.2) * 2.5;
      targetYaw = Math.cos(t * 2.0) * 3.8;
    }

    const rollDamping = -spinRateHz * 0.8;

    canards = {
      fin1: parseFloat((targetPitch + targetYaw + rollDamping).toFixed(2)),
      fin2: parseFloat((-targetPitch + targetYaw + rollDamping).toFixed(2)),
      fin3: parseFloat((-targetPitch - targetYaw + rollDamping).toFixed(2)),
      fin4: parseFloat((targetPitch - targetYaw + rollDamping).toFixed(2)),
      pitch: parseFloat(targetPitch.toFixed(2)),
      yaw: parseFloat(targetYaw.toFixed(2)),
      roll: parseFloat(rollDamping.toFixed(2)),
    };
    angleOfAttackDeg = parseFloat((targetPitch * 0.38).toFixed(2));
    sideslipAngleDeg = parseFloat((targetYaw * 0.38).toFixed(2));
  }

  // Time-to-go and estimated CEP
  const timeToGoSec = Math.max(0, parseFloat((TOTAL_CYCLE - t).toFixed(1)));
  let impactCepM = 0.75;
  if (!eccmActive) {
    impactCepM += 0.35;
  }
  if (canardMode === 'MANUAL') {
    impactCepM += Math.abs(canards.pitch) * 0.8 + Math.abs(canards.yaw) * 0.8;
  }

  // Thermal Skin Temperature (stagnation recovery)
  const recoveryFactor = 0.88;
  const tempCelsius = tempKelvin - 273.15;
  const stagnationTempC = (tempKelvin * (1 + 0.2 * recoveryFactor * Math.pow(mach, 2))) - 273.15;
  const thermalSkinTempC = parseFloat(Math.max(tempCelsius, stagnationTempC).toFixed(1));

  return {
    phaseId: phase.id,
    phaseName: phase.name,
    phaseCode: phase.code,
    phaseDuration: phase.duration,
    phaseSummary: phase.summary,
    mach: parseFloat(mach.toFixed(2)),
    altitudeM: parseFloat(altitudeM.toFixed(1)),
    velocityMps: parseFloat(velocityMps.toFixed(1)),
    dynamicPressureKpa: parseFloat(dynamicPressureKpa.toFixed(1)),
    gLoad: parseFloat(gLoad.toFixed(2)),
    spinRateHz: parseFloat(spinRateHz.toFixed(2)),
    downrangeKm: parseFloat(downrangeKm.toFixed(2)),
    timeToGoSec,
    impactCepM: parseFloat(impactCepM.toFixed(2)),
    airDensityKgM3: parseFloat(airDensity.toFixed(3)),
    angleOfAttackDeg,
    sideslipAngleDeg,
    canards,
    canardMode,
    guidanceMode,
    seekerStatus,
    seekerLosRateDps: parseFloat(seekerLosRate.toFixed(2)),
    motorThrottlePercent: motorThrottle,
    thermalSkinTempC,
  };
}

/**
 * Calculates current projectile geo position interpolated between Battery and Target
 */
export function computeProjectileGeo(
  batteryLat: number,
  batteryLon: number,
  targetLat: number,
  targetLon: number,
  downrangeKm: number,
  totalRangeKm: number = 31.5
): { lat: number; lon: number; bearingDeg: number } {
  const frac = Math.max(0, Math.min(1.0, downrangeKm / (totalRangeKm || 31.5)));
  const lat = batteryLat + (targetLat - batteryLat) * frac;
  const lon = batteryLon + (targetLon - batteryLon) * frac;

  // Bearing from battery to target
  const dLon = (targetLon - batteryLon) * (Math.PI / 180);
  const y = Math.sin(dLon) * Math.cos(targetLat * (Math.PI / 180));
  const x =
    Math.cos(batteryLat * (Math.PI / 180)) * Math.sin(targetLat * (Math.PI / 180)) -
    Math.sin(batteryLat * (Math.PI / 180)) * Math.cos(targetLat * (Math.PI / 180)) * Math.cos(dLon);
  const bearingRad = Math.atan2(y, x);
  const bearingDeg = parseFloat((((bearingRad * 180) / Math.PI + 360) % 360).toFixed(1));

  return {
    lat: parseFloat(lat.toFixed(6)),
    lon: parseFloat(lon.toFixed(6)),
    bearingDeg,
  };
}
