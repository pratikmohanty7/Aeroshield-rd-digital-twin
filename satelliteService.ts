export interface GlobalSatellite {
  id: string;
  name: string;
  constellation: 'ISS' | 'NavIC' | 'GPS' | 'Galileo' | 'Sentinel' | 'Starlink' | 'Hubble';
  noradCatId: number;
  altitudeKm: number;
  speedKmh: number;
  inclinationDeg: number;
  periodMinutes: number;
  footprintRadiusKm: number;
  lat: number;
  lon: number;
  elevationFromUserDeg: number;
  azimuthFromUserDeg: number;
  slantRangeKm: number;
  isLineOfSight: boolean;
  color: string;
  orbitTrack: [number, number][];
}

const SATELLITE_CATALOG = [
  {
    id: 'ISS-25544',
    name: 'ISS (International Space Station)',
    constellation: 'ISS' as const,
    noradCatId: 25544,
    altitudeKm: 418,
    speedKmh: 27580,
    inclinationDeg: 51.64,
    periodMinutes: 92.9,
    phaseOffset: 0.15,
    color: '#38bdf8', // Sky blue
  },
  {
    id: 'NAVIC-1I',
    name: 'NavIC IRNSS-1I (ISRO)',
    constellation: 'NavIC' as const,
    noradCatId: 43286,
    altitudeKm: 35786,
    speedKmh: 11050,
    inclinationDeg: 29.3,
    periodMinutes: 1436,
    phaseOffset: 1.45,
    color: '#f97316', // Orange
  },
  {
    id: 'GPS-BIIF-12',
    name: 'GPS BIIF-12 (USA-266)',
    constellation: 'GPS' as const,
    noradCatId: 41328,
    altitudeKm: 20180,
    speedKmh: 13950,
    inclinationDeg: 55.0,
    periodMinutes: 718,
    phaseOffset: 2.8,
    color: '#22c55e', // Emerald
  },
  {
    id: 'GALILEO-224',
    name: 'Galileo GSAT0224 (ESA)',
    constellation: 'Galileo' as const,
    noradCatId: 49458,
    altitudeKm: 23222,
    speedKmh: 13320,
    inclinationDeg: 56.0,
    periodMinutes: 844,
    phaseOffset: 4.1,
    color: '#a855f7', // Purple
  },
  {
    id: 'SENTINEL-2A',
    name: 'Sentinel-2A Earth Observation (Copernicus)',
    constellation: 'Sentinel' as const,
    noradCatId: 40697,
    altitudeKm: 786,
    speedKmh: 26820,
    inclinationDeg: 98.6,
    periodMinutes: 100.6,
    phaseOffset: 0.8,
    color: '#06b6d4', // Cyan
  },
  {
    id: 'STARLINK-4819',
    name: 'Starlink LEO Relay-4819',
    constellation: 'Starlink' as const,
    noradCatId: 53120,
    altitudeKm: 550,
    speedKmh: 27350,
    inclinationDeg: 53.2,
    periodMinutes: 95.2,
    phaseOffset: 3.3,
    color: '#eab308', // Amber
  },
];

/**
 * Calculates current global satellite positions, orbits, and look angles from observer coordinates.
 */
export function calculateGlobalSatellites(
  timeSeconds: number,
  observerLat: number,
  observerLon: number
): GlobalSatellite[] {
  return SATELLITE_CATALOG.map((cat) => {
    // Angular orbital velocity in radians per second
    const omega = (2 * Math.PI) / (cat.periodMinutes * 60);
    const meanAnomaly = (timeSeconds * omega * 10 + cat.phaseOffset) % (2 * Math.PI);

    // Orbital inclination modulation
    const incRad = (cat.inclinationDeg * Math.PI) / 180;
    const lat = (Math.asin(Math.sin(incRad) * Math.sin(meanAnomaly)) * 180) / Math.PI;

    // Earth rotation (approx 360 deg in 86400s)
    const earthRotationRate = (360 / 86400) * 10;
    let lon = (((meanAnomaly * 180) / Math.PI - timeSeconds * earthRotationRate + cat.phaseOffset * 57.3) % 360);
    if (lon > 180) lon -= 360;
    if (lon < -180) lon += 360;

    // Line of sight footprint radius: R_earth * acos(R_earth / (R_earth + alt))
    const rEarth = 6371;
    const centralAngle = Math.acos(rEarth / (rEarth + cat.altitudeKm));
    const footprintRadiusKm = Math.round(rEarth * centralAngle);

    // Great circle distance to observer
    const dLat = ((lat - observerLat) * Math.PI) / 180;
    const dLon = ((lon - observerLon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((observerLat * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const angDist = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const groundDistanceKm = rEarth * angDist;

    // Elevation angle
    const slantRangeKm = Math.sqrt(
      rEarth * rEarth +
        (rEarth + cat.altitudeKm) * (rEarth + cat.altitudeKm) -
        2 * rEarth * (rEarth + cat.altitudeKm) * Math.cos(angDist)
    );
    const elevationRad =
      Math.asin(
        ((rEarth + cat.altitudeKm) * Math.sin(angDist)) / slantRangeKm
      ) - angDist;
    const elevationDeg = Math.round((elevationRad * 180) / Math.PI);

    // Azimuth angle
    const y = Math.sin(dLon) * Math.cos((lat * Math.PI) / 180);
    const x =
      Math.cos((observerLat * Math.PI) / 180) * Math.sin((lat * Math.PI) / 180) -
      Math.sin((observerLat * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.cos(dLon);
    let azimuthDeg = Math.round((Math.atan2(y, x) * 180) / Math.PI);
    if (azimuthDeg < 0) azimuthDeg += 360;

    // Calculate orbital track (past 20 points + future 20 points)
    const orbitTrack: [number, number][] = [];
    for (let step = -15; step <= 25; step += 2) {
      const t = timeSeconds + step * 60;
      const anom = (t * omega * 10 + cat.phaseOffset) % (2 * Math.PI);
      const trkLat = (Math.asin(Math.sin(incRad) * Math.sin(anom)) * 180) / Math.PI;
      let trkLon = (((anom * 180) / Math.PI - t * earthRotationRate + cat.phaseOffset * 57.3) % 360);
      if (trkLon > 180) trkLon -= 360;
      if (trkLon < -180) trkLon += 360;
      orbitTrack.push([Number(trkLat.toFixed(3)), Number(trkLon.toFixed(3))]);
    }

    return {
      id: cat.id,
      name: cat.name,
      constellation: cat.constellation,
      noradCatId: cat.noradCatId,
      altitudeKm: cat.altitudeKm,
      speedKmh: cat.speedKmh,
      inclinationDeg: cat.inclinationDeg,
      periodMinutes: cat.periodMinutes,
      footprintRadiusKm,
      lat: Number(lat.toFixed(4)),
      lon: Number(lon.toFixed(4)),
      elevationFromUserDeg: Math.max(-90, elevationDeg),
      azimuthFromUserDeg: azimuthDeg,
      slantRangeKm: Math.round(slantRangeKm),
      isLineOfSight: elevationDeg > 5,
      color: cat.color,
      orbitTrack,
    };
  });
}
