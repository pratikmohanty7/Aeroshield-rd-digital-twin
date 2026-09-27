/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FlightPhaseId =
  | 'PHASE_GUN_LAUNCH'
  | 'PHASE_DESPIN'
  | 'PHASE_MIDCOURSE'
  | 'PHASE_TERMINAL'
  | 'PHASE_FUZE';

export type GuidanceLawMode =
  | 'AUGMENTED_PN'       // Proportional Navigation with gravity & drag bias compensation
  | 'PURE_PURSUIT'       // Velocity vector points directly at target
  | 'BALLISTIC_FALLBACK' // Pure aerodynamic trim without active seeker updates
  | 'MANUAL_TRIM'        // Direct manual operator canard control
  | 'FTS_TERMINATION';   // Flight Termination System (Emergency Abort)

export type SeekerTrackStatus =
  | 'OFFLINE'
  | 'SEARCHING'
  | 'ACQUIRING'
  | 'LOCKED'
  | 'TERMINAL_HOMING';

export type FuzeArmMode =
  | 'SAFE'
  | 'ARMED'
  | 'PROXIMITY_ACTIVE'
  | 'BURST_TRIGGERED';

export type FuzeBurstPreset = 'AIRBURST_3M' | 'AIRBURST_5M' | 'AIRBURST_7M' | 'POINT_DETONATING' | 'BUNKER_DELAY';

export interface CanardDeflections {
  fin1: number; // Top Right (deg)
  fin2: number; // Bottom Right (deg)
  fin3: number; // Bottom Left (deg)
  fin4: number; // Top Left (deg)
  pitch: number; // Equivalent pitch trim (deg)
  yaw: number;   // Equivalent yaw trim (deg)
  roll: number;  // Equivalent roll trim (deg)
}

export interface FlightDynamicsTelemetry {
  phaseId: FlightPhaseId;
  phaseName: string;
  phaseCode: string;
  phaseDuration: string;
  phaseSummary: string;
  mach: number;
  altitudeM: number;
  velocityMps: number;
  dynamicPressureKpa: number;
  gLoad: number;
  spinRateHz: number;
  downrangeKm: number;
  timeToGoSec: number;
  impactCepM: number;
  airDensityKgM3: number;
  angleOfAttackDeg: number;
  sideslipAngleDeg: number;
  canards: CanardDeflections;
  canardMode: 'AUTO' | 'MANUAL';
  guidanceMode: GuidanceLawMode;
  seekerStatus: SeekerTrackStatus;
  seekerLosRateDps: number;
  motorThrottlePercent: number;
  thermalSkinTempC: number;
}

export interface TacticalTargetState {
  targetId: string;
  targetName: string;
  targetLat: number;
  targetLon: number;
  targetAltM: number;
  batteryLat: number;
  batteryLon: number;
  batteryName: string;
  currentMissileLat: number;
  currentMissileLon: number;
  distanceKm: number;
  bearingDeg: number;
  headingDeg: number;
  elevationAngleDeg: number;
  apogeeM: number;
  totalFlightTimeSec: number;
}

export interface SmartFuzeState {
  armState: FuzeArmMode;
  preset: FuzeBurstPreset;
  hobM: number;
  standoffRangeM: number;
  closureVelocityMps: number;
  rfSignalDb: number;
  dopplerShiftKhz: number;
  safetyInterlockLocked: boolean;
  detonated: boolean;
}

export interface OperatorProfile {
  callsign: string;
  role: string;
  clearanceLevel: string;
  stationId: string;
}

export interface MasterAnnunciatorState {
  masterWarning: boolean;
  masterCaution: boolean;
  guidanceArmed: boolean;
  eccmActive: boolean;
  ftsArmed: boolean;
  audioEnabled: boolean;
  acknowledged: boolean;
}
