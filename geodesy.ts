/**
 * Geodesy and Ballistic Trajectory Calculations for Tactical Map
 */

const EARTH_RADIUS_KM = 6371.0;

// Convert degrees to radians
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// Convert radians to degrees
function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Calculates Great-Circle Haversine distance between two coordinates.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((EARTH_RADIUS_KM * c).toFixed(2));
}

/**
 * Calculates initial true azimuth bearing from point 1 to point 2 in degrees (0 - 360).
 */
export function calculateBearingDeg(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  return Math.round((toDeg(θ) + 360) % 360);
}

/**
 * Generates an interpolated Great-Circle ballistic arc between launch battery and target,
 * including parabolic apogee altitude.
 */
export function calculateBallisticTrajectory(
  startLat: number,
  startLon: number,
  targetLat: number,
  targetLon: number,
  numPoints: number = 30
): Array<{ lat: number; lon: number; altitudeM: number; progress: number }> {
  const points: Array<{ lat: number; lon: number; altitudeM: number; progress: number }> = [];
  const rangeKm = calculateDistanceKm(startLat, startLon, targetLat, targetLon);

  // Maximum apogee altitude scales with range: ~14,000m for 48km range
  const apogeeM = Math.min(22000, Math.max(800, rangeKm * 280));

  for (let i = 0; i <= numPoints; i++) {
    const fraction = i / numPoints;

    // Linear spherical interpolation for lat/lon
    const lat = startLat + (targetLat - startLat) * fraction;
    const lon = startLon + (targetLon - startLon) * fraction;

    // Parabolic arc for altitude: 4 * apogee * f * (1 - f)
    const altitudeM = Math.round(4 * apogeeM * fraction * (1 - fraction));

    points.push({
      lat: Number(lat.toFixed(5)),
      lon: Number(lon.toFixed(5)),
      altitudeM,
      progress: fraction,
    });
  }

  return points;
}

/**
 * Formats decimal degrees into NATO Military Grid / DMS format string.
 */
export function formatToDMS(deg: number, isLat: boolean): string {
  const absolute = Math.abs(deg);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = Math.floor((minutesNotTruncated - minutes) * 60);

  const direction = isLat ? (deg >= 0 ? 'N' : 'S') : deg >= 0 ? 'E' : 'W';

  return `${degrees}°${minutes.toString().padStart(2, '0')}'${seconds.toString().padStart(2, '0')}"${direction}`;
}
