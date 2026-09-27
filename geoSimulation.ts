import { MissionRange, WeatherTelemetry, SatelliteTrack, TrajectoryPoint } from '../types/geoMap';
import { INITIAL_SATELLITES, RANGE_WAYPOINTS } from '../data/mockRanges';

/**
 * Calculates current vehicle geospatial position, heading, and ground speed
 * based on the selected range waypoints and simulation elapsed time.
 */
export function calculateVehicleGeoState(
  range: MissionRange,
  timeSeconds: number,
  healthIndex: number
): {
  lat: number;
  lon: number;
  altitudeM: number;
  headingDeg: number;
  speedKnots: number;
  climbRateMps: number;
  trajectoryPoint: TrajectoryPoint;
} {
  const waypoints = RANGE_WAYPOINTS[range.id] || RANGE_WAYPOINTS.sriharikota;
  if (waypoints.length === 0) {
    return {
      lat: range.center[0],
      lon: range.center[1],
      altitudeM: range.elevationBaseM + 150,
      headingDeg: 45,
      speedKnots: 110,
      climbRateMps: 0,
      trajectoryPoint: {
        lat: range.center[0],
        lon: range.center[1],
        altitudeM: range.elevationBaseM + 150,
        timestamp: timeSeconds,
        health: healthIndex,
        speedKnots: 110,
        headingDeg: 45,
      },
    };
  }

  // Smooth orbital / circuit loop around waypoints
  const loopDuration = 120; // 2 minutes full circuit
  const progress = (timeSeconds % loopDuration) / loopDuration;
  const numLegs = waypoints.length;
  const legIndex = Math.floor(progress * numLegs);
  const nextLegIndex = (legIndex + 1) % numLegs;
  const legFraction = (progress * numLegs) - legIndex;

  const wp1 = waypoints[legIndex];
  const wp2 = waypoints[nextLegIndex];

  // Interpolate lat/lon
  const lat = wp1.lat + (wp2.lat - wp1.lat) * legFraction;
  const lon = wp1.lon + (wp2.lon - wp1.lon) * legFraction;
  const altitudeM = wp1.altitudeM + (wp2.altitudeM - wp1.altitudeM) * legFraction;

  // Heading calculation
  const dLat = wp2.lat - wp1.lat;
  const dLon = wp2.lon - wp1.lon;
  let headingDeg = (Math.atan2(dLon, dLat) * 180) / Math.PI;
  if (headingDeg < 0) headingDeg += 360;

  // Ground speed varies between 85 and 140 knots
  const speedKnots = 115 + Math.sin(timeSeconds * 0.2) * 18;
  const climbRateMps = ((wp2.altitudeM - wp1.altitudeM) / (loopDuration / numLegs));

  return {
    lat: Number(lat.toFixed(5)),
    lon: Number(lon.toFixed(5)),
    altitudeM: Math.round(altitudeM),
    headingDeg: Math.round(headingDeg),
    speedKnots: Math.round(speedKnots),
    climbRateMps: Number(climbRateMps.toFixed(1)),
    trajectoryPoint: {
      lat: Number(lat.toFixed(5)),
      lon: Number(lon.toFixed(5)),
      altitudeM: Math.round(altitudeM),
      timestamp: timeSeconds,
      health: healthIndex,
      speedKnots: Math.round(speedKnots),
      headingDeg: Math.round(headingDeg),
    },
  };
}

/**
 * Calculates real-time meteorological conditions at the vehicle position.
 */
export function calculateWeatherAtPosition(
  range: MissionRange,
  altitudeM: number,
  timeSeconds: number,
  activeFaults: string[]
): WeatherTelemetry {
  const isThermalSpike = activeFaults.includes('TEMPERATURE_SPIKE');

  // Standard atmospheric lapse rate: -6.5°C per 1000m
  const lapseRatePerM = 0.0065;
  const altitudeAboveBase = Math.max(0, altitudeM - range.elevationBaseM);
  let ambientTempC = range.baseTempC - altitudeAboveBase * lapseRatePerM;

  if (isThermalSpike) {
    ambientTempC += 42.5; // Reflects thermal fault in avionics bay
  } else {
    // Natural diurnal & sinusoidal turbulence fluctuation
    ambientTempC += Math.sin(timeSeconds * 0.1) * 0.8;
  }

  // Barometric pressure using barometric formula: P = P0 * exp(-h / 8400)
  const barometricPressureHpa = range.basePressureHpa * Math.exp(-altitudeAboveBase / 8400);

  // Relative humidity & dew point
  const relativeHumidity = Math.min(
    95,
    Math.max(18, (range.climateType.includes('Maritime') ? 76 : 32) + Math.sin(timeSeconds * 0.05) * 8)
  );
  // Magnus-Tetens dew point approximation
  const dewPointC = ambientTempC - (100 - relativeHumidity) / 5;

  // Wind speed with gust factor
  const baseWind = range.baseWindKnots + (altitudeAboveBase / 500) * 2.5;
  const windGust = baseWind + 6 + Math.sin(timeSeconds * 0.3) * 5;
  const windDir = (range.baseWindDeg + Math.sin(timeSeconds * 0.08) * 15 + 360) % 360;

  // Cloud & visibility
  const cloudBaseM = range.elevationBaseM + 1200;
  const cloudCover = range.climateType.includes('Maritime') ? 45 : 15;
  const visibilityKm = range.climateType.includes('Desert') ? 8.5 : 16.0;

  // Precipitation radar dBZ (weather radar reflectivity)
  const radarPrecipitationDbz = range.climateType.includes('Maritime')
    ? Math.max(0, 18 + Math.sin(timeSeconds * 0.15) * 14)
    : 0;

  // Density altitude (standard aviation formula)
  const isaTempAtAlt = 15 - 0.0065 * altitudeM;
  const densityAltitudeM = altitudeM + 118.8 * (ambientTempC - isaTempAtAlt);

  return {
    ambientTemperatureC: Number(ambientTempC.toFixed(1)),
    dewPointC: Number(dewPointC.toFixed(1)),
    relativeHumidity: Math.round(relativeHumidity),
    barometricPressureHpa: Number(barometricPressureHpa.toFixed(1)),
    windSpeedKnots: Number(baseWind.toFixed(1)),
    windDirectionDeg: Math.round(windDir),
    windGustKnots: Number(windGust.toFixed(1)),
    visibilityKm: Number(visibilityKm.toFixed(1)),
    cloudCoverPercent: Math.round(cloudCover),
    cloudBaseM: Math.round(cloudBaseM),
    precipitationReflectivityDbz: Number(radarPrecipitationDbz.toFixed(1)),
    airQualityAqi: range.climateType.includes('Desert') ? 92 : 44,
    uvIndex: range.climateType.includes('High-Altitude') ? 9.5 : 7.2,
    densityAltitudeM: Math.round(densityAltitudeM),
    freezingLevelM: Math.round(range.elevationBaseM + Math.max(0, range.baseTempC / 0.0065)),
  };
}

/**
 * Calculates dynamic satellite constellation tracks and status.
 * Interacts with GNSS lock loss fault!
 */
export function calculateSatelliteTracks(
  timeSeconds: number,
  isGnssLoss: boolean
): SatelliteTrack[] {
  return INITIAL_SATELLITES.map((sat, idx) => {
    // If GNSS lock loss fault is active, satellites lose tracking
    if (isGnssLoss) {
      return {
        ...sat,
        status: idx === 0 ? 'SEARCHING' : 'UNUSABLE',
        snrDb: 0,
        elevationDeg: Math.max(5, sat.elevationDeg - 20),
      };
    }

    // Normal tracking orbital drift
    const drift = Math.sin(timeSeconds * 0.05 + idx) * 2;
    return {
      ...sat,
      status: 'TRACKING',
      snrDb: Number((sat.snrDb + Math.sin(timeSeconds * 0.2 + idx) * 1.5).toFixed(1)),
      elevationDeg: Math.round(Math.min(88, Math.max(15, sat.elevationDeg + drift))),
      azimuthDeg: Math.round((sat.azimuthDeg + timeSeconds * 0.1 + 360) % 360),
    };
  });
}
