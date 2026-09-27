export type BaseMapStyle =
  | 'satellite' // Google Hybrid (Satellite + Labels)
  | 'satellite_esri' // Esri High-Res World Imagery
  | 'dark' // CartoDB Dark Matter
  | 'positron' // CartoDB Clean Light
  | 'topo' // OpenTopoMap
  | 'streets' // OpenStreetMap Standard
  | 'night_lights'; // NASA Earth at Night

export type RadarColorScheme = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; // RainViewer color scales (4 = TITAN, 7 = NEXRAD, 3 = Blue, 1 = B/W)

export type TacticalMissionMode = 'recon_orbit' | 'artillery_fire_mission' | 'free_flight';

export interface MeasurementToolState {
  active: boolean;
  pointA: { lat: number; lon: number } | null;
  pointB: { lat: number; lon: number } | null;
  distanceKm: number;
  distanceNm: number;
  bearingDeg: number;
}

export interface ArtilleryMissionState {
  batteryLat: number;
  batteryLon: number;
  targetLat: number;
  targetLon: number;
  targetName: string;
  rangeKm: number;
  bearingDeg: number;
  apogeeM: number;
  tofSeconds: number;
  impactCepM: number;
  active: boolean;
}

export interface MissionRange {
  id: string;
  name: string;
  region: string;
  center: [number, number];
  zoom: number;
  elevationBaseM: number;
  description: string;
  climateType: string;
  baseTempC: number;
  basePressureHpa: number;
  baseWindKnots: number;
  baseWindDeg: number;
}

export interface WeatherTelemetry {
  ambientTemperatureC: number;
  dewPointC: number;
  relativeHumidity: number;
  barometricPressureHpa: number;
  windSpeedKnots: number;
  windDirectionDeg: number;
  windGustKnots: number;
  visibilityKm: number;
  cloudCoverPercent: number;
  cloudBaseM: number;
  precipitationReflectivityDbz: number;
  airQualityAqi: number;
  uvIndex: number;
  densityAltitudeM: number;
  freezingLevelM: number;
}

export interface SatelliteTrack {
  id: string;
  constellation: 'GPS' | 'GLONASS' | 'Galileo' | 'NavIC';
  prn: number;
  elevationDeg: number;
  azimuthDeg: number;
  snrDb: number;
  status: 'TRACKING' | 'SEARCHING' | 'UNUSABLE' | 'DEGRADED';
  subsatelliteLat: number;
  subsatelliteLon: number;
}

export interface Waypoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  altitudeM: number;
  type: 'TAKEOFF' | 'CHECKPOINT' | 'GROUND_STATION' | 'TARGET_RANGE' | 'PERIMETER';
  description?: string;
}

export interface TrajectoryPoint {
  lat: number;
  lon: number;
  altitudeM: number;
  timestamp: number;
  health: number;
  speedKnots: number;
  headingDeg: number;
}
