export interface LiveWeatherReport {
  latitude: number;
  longitude: number;
  elevationM: number;
  temperatureC: number;
  relativeHumidity: number;
  surfacePressureHpa: number;
  windSpeedKnots: number;
  windDirectionDeg: number;
  precipitationMm: number;
  weatherCode: number;
  weatherDescription: string;
  source: 'OPEN_METEO_LIVE' | 'THERMODYNAMIC_MODEL';
  fetchedAt: number;
}

export interface HourlyForecastItem {
  time: string;
  timestamp: number;
  temperatureC: number;
  weatherCode: number;
  weatherDescription: string;
  icon: string;
  precipitationProb: number;
  windSpeedKnots: number;
}

export interface DailyForecastItem {
  date: string;
  dayName: string;
  weatherCode: number;
  weatherDescription: string;
  icon: string;
  tempMaxC: number;
  tempMinC: number;
  precipitationProbMax: number;
  uvIndexMax: number;
  sunrise: string;
  sunset: string;
}

export interface ComprehensiveWeatherReport {
  latitude: number;
  longitude: number;
  elevationM: number;
  temperatureC: number;
  apparentTemperatureC: number;
  relativeHumidity: number;
  dewPointC: number;
  surfacePressureHpa: number;
  windSpeedKnots: number;
  windDirectionDeg: number;
  windGustKnots: number;
  cloudCoverPercent: number;
  precipitationMm: number;
  visibilityKm: number;
  uvIndex: number;
  weatherCode: number;
  weatherDescription: string;
  weatherIcon: string;
  flightRuleCategory: 'VFR' | 'MVFR' | 'IFR';
  densityAltitudeM: number;
  freezingLevelM: number;
  airDensityKgM3: number;
  source: 'OPEN_METEO_LIVE' | 'THERMODYNAMIC_MODEL';
  fetchedAt: number;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
}

export interface RainViewerMetadata {
  version: string;
  generated: number;
  host: string;
  radar: {
    past: Array<{ time: number; path: string }>;
    nowcast: Array<{ time: number; path: string }>;
  };
  satellite: {
    infrared: Array<{ time: number; path: string }>;
  };
}

// Weather interpretation from WMO code
export function decodeWmoWeatherCode(code: number): { description: string; icon: string } {
  if (code === 0) return { description: 'Clear Sky / Sunny', icon: '☀️' };
  if (code === 1) return { description: 'Mainly Clear', icon: '🌤️' };
  if (code === 2) return { description: 'Partly Cloudy', icon: '⛅' };
  if (code === 3) return { description: 'Overcast Skies', icon: '☁️' };
  if (code === 45 || code === 48) return { description: 'Dense Fog / Low Visibility', icon: '🌫️' };
  if (code >= 51 && code <= 55) return { description: 'Light Drizzle', icon: '🌦️' };
  if (code >= 61 && code <= 65) return { description: 'Moderate Rain Shower', icon: '🌧️' };
  if (code >= 71 && code <= 77) return { description: 'Snowfall / Ice Crystals', icon: '🌨️' };
  if (code >= 80 && code <= 82) return { description: 'Heavy Rain Showers', icon: '🌧️' };
  if (code >= 95 && code <= 99) return { description: 'Severe Thunderstorm / Squall', icon: '⛈️' };
  return { description: 'Atmospheric Turbulence', icon: '🌤️' };
}

/**
 * Calculates a thermodynamic model of ambient temperature and pressure anywhere on Earth.
 */
export function calculateThermodynamicModel(
  lat: number,
  lon: number,
  elevationM: number = 0,
  timeSeconds: number = 0
): LiveWeatherReport {
  const absLat = Math.abs(lat);
  const latitudeFactor = Math.cos((absLat * Math.PI) / 180);
  const baseSeaLevelTemp = -20 + latitudeFactor * 52;
  const tempAtElevation = baseSeaLevelTemp - (elevationM / 1000) * 6.5;
  const diurnal = Math.sin(timeSeconds * 0.05 + lon * 0.05) * 3.5;
  const tempC = Number((tempAtElevation + diurnal).toFixed(1));

  const pRatio = Math.max(0.1, 1 - 2.25577e-5 * elevationM);
  const pressureHpa = Number((1013.25 * Math.pow(pRatio, 5.25588)).toFixed(1));

  const isWesterlies = absLat >= 35 && absLat <= 60;
  const baseWind = isWesterlies ? 18.5 : 10.2;
  const windKnots = Number((baseWind + Math.sin(timeSeconds * 0.1) * 4.2).toFixed(1));
  const windDir = Math.round((220 + Math.sin(timeSeconds * 0.04) * 30 + 360) % 360);

  const isCold = tempC < 0;
  const humidity = isCold ? 48 : Math.round(55 + Math.sin(lat * 0.2) * 25);
  const weatherCode = isCold ? 71 : humidity > 75 ? 61 : absLat < 20 ? 1 : 2;

  const { description } = decodeWmoWeatherCode(weatherCode);

  return {
    latitude: Number(lat.toFixed(4)),
    longitude: Number(lon.toFixed(4)),
    elevationM: Math.round(elevationM),
    temperatureC: tempC,
    relativeHumidity: humidity,
    surfacePressureHpa: pressureHpa,
    windSpeedKnots: windKnots,
    windDirectionDeg: windDir,
    precipitationMm: weatherCode >= 60 ? 2.4 : 0.0,
    weatherCode,
    weatherDescription: description,
    source: 'THERMODYNAMIC_MODEL',
    fetchedAt: Date.now(),
  };
}

/**
 * Attempts to fetch live real-world weather from Open-Meteo for any coordinate.
 */
export async function fetchLiveWeather(
  lat: number,
  lon: number,
  elevationM: number = 0,
  timeSeconds: number = 0
): Promise<LiveWeatherReport> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,precipitation,weather_code&wind_speed_unit=kn`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Open-Meteo HTTP ${res.status}`);
    }

    const data = await res.json();
    const current = data.current;

    const weatherCode = current.weather_code ?? 0;
    const { description } = decodeWmoWeatherCode(weatherCode);

    return {
      latitude: Number(lat.toFixed(4)),
      longitude: Number(lon.toFixed(4)),
      elevationM: Math.round(data.elevation || elevationM),
      temperatureC: Number(current.temperature_2m.toFixed(1)),
      relativeHumidity: Math.round(current.relative_humidity_2m || 50),
      surfacePressureHpa: Number((current.surface_pressure || 1013.2).toFixed(1)),
      windSpeedKnots: Number((current.wind_speed_10m || 10).toFixed(1)),
      windDirectionDeg: Math.round(current.wind_direction_10m || 0),
      precipitationMm: Number((current.precipitation || 0).toFixed(1)),
      weatherCode,
      weatherDescription: description,
      source: 'OPEN_METEO_LIVE',
      fetchedAt: Date.now(),
    };
  } catch {
    return calculateThermodynamicModel(lat, lon, elevationM, timeSeconds);
  }
}

/**
 * Fallback comprehensive weather model with realistic 24-hr hourly and 7-day daily forecasts.
 */
export function generateSyntheticComprehensiveWeather(
  lat: number,
  lon: number,
  elevationM: number = 0,
  timeSeconds: number = 0
): ComprehensiveWeatherReport {
  const base = calculateThermodynamicModel(lat, lon, elevationM, timeSeconds);
  const { icon } = decodeWmoWeatherCode(base.weatherCode);

  const apparentTemp = Number((base.temperatureC + (base.relativeHumidity > 70 ? 2.5 : -1.2)).toFixed(1));
  const dewPoint = Number((base.temperatureC - ((100 - base.relativeHumidity) / 5)).toFixed(1));
  const cloudCover = base.weatherCode === 0 ? 5 : base.weatherCode === 1 ? 25 : base.weatherCode === 2 ? 50 : 85;
  const visibilityKm = base.weatherCode >= 60 ? 8.5 : base.weatherCode >= 45 ? 2.0 : 16.0;
  const uvIndex = Math.max(1, Math.min(11, Math.round(Math.cos((lat * Math.PI) / 180) * 9)));

  // Aviation flight rule category
  const flightRuleCategory: 'VFR' | 'MVFR' | 'IFR' =
    visibilityKm < 5 || cloudCover > 85 ? 'IFR' : visibilityKm < 8 || cloudCover > 60 ? 'MVFR' : 'VFR';

  // Density altitude (m) = Pressure Altitude + (120 * (OAT - ISA_temp))
  const isaTemp = 15 - 0.0065 * elevationM;
  const densityAltitudeM = Math.round(elevationM + 120 * (base.temperatureC - isaTemp));
  const airDensityKgM3 = Number((1.225 * (base.surfacePressureHpa / 1013.25) * (288.15 / (base.temperatureC + 273.15))).toFixed(3));
  const freezingLevelM = Math.max(0, Math.round((base.temperatureC / 6.5) * 1000));

  // Generate 24 Hourly items
  const hourly: HourlyForecastItem[] = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const futureHour = new Date(now.getTime() + i * 3600 * 1000);
    const hourNum = futureHour.getHours();
    const diurnalCurve = Math.sin(((hourNum - 8) / 24) * 2 * Math.PI) * 4.5;
    const hourTemp = Number((base.temperatureC + diurnalCurve).toFixed(1));
    const rainProb = base.weatherCode >= 60 ? Math.min(95, 40 + i * 2) : Math.max(5, 15 - i);
    const hourCode = rainProb > 65 ? 61 : hourTemp > 28 ? 0 : 2;
    const dec = decodeWmoWeatherCode(hourCode);

    hourly.push({
      time: `${hourNum.toString().padStart(2, '0')}:00`,
      timestamp: futureHour.getTime(),
      temperatureC: hourTemp,
      weatherCode: hourCode,
      weatherDescription: dec.description,
      icon: dec.icon,
      precipitationProb: rainProb,
      windSpeedKnots: Math.round(base.windSpeedKnots + Math.sin(i * 0.5) * 3),
    });
  }

  // Generate 7 Daily items
  const daily: DailyForecastItem[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let d = 0; d < 7; d++) {
    const futureDay = new Date(now.getTime() + d * 86400 * 1000);
    const dName = d === 0 ? 'Today' : dayNames[futureDay.getDay()];
    const dDate = futureDay.toISOString().split('T')[0];
    const dayShift = Math.sin(d * 1.1) * 3;
    const maxT = Number((base.temperatureC + 4 + dayShift).toFixed(1));
    const minT = Number((base.temperatureC - 3 + dayShift).toFixed(1));
    const dCode = (d === 2 || d === 5) && base.relativeHumidity > 60 ? 61 : d % 2 === 0 ? 1 : 2;
    const dec = decodeWmoWeatherCode(dCode);

    daily.push({
      date: dDate,
      dayName: dName,
      weatherCode: dCode,
      weatherDescription: dec.description,
      icon: dec.icon,
      tempMaxC: maxT,
      tempMinC: minT,
      precipitationProbMax: dCode >= 60 ? 75 : 15,
      uvIndexMax: uvIndex,
      sunrise: '06:12 AM',
      sunset: '06:48 PM',
    });
  }

  return {
    latitude: base.latitude,
    longitude: base.longitude,
    elevationM: base.elevationM,
    temperatureC: base.temperatureC,
    apparentTemperatureC: apparentTemp,
    relativeHumidity: base.relativeHumidity,
    dewPointC: dewPoint,
    surfacePressureHpa: base.surfacePressureHpa,
    windSpeedKnots: base.windSpeedKnots,
    windDirectionDeg: base.windDirectionDeg,
    windGustKnots: Number((base.windSpeedKnots * 1.4).toFixed(1)),
    cloudCoverPercent: cloudCover,
    precipitationMm: base.precipitationMm,
    visibilityKm,
    uvIndex,
    weatherCode: base.weatherCode,
    weatherDescription: base.weatherDescription,
    weatherIcon: icon,
    flightRuleCategory,
    densityAltitudeM,
    freezingLevelM,
    airDensityKgM3,
    source: 'THERMODYNAMIC_MODEL',
    fetchedAt: Date.now(),
    hourly,
    daily,
  };
}

/**
 * Fetches comprehensive real-world weather from Open-Meteo including current, 24-hr hourly, and 7-day outlook.
 */
export async function fetchComprehensiveWeather(
  lat: number,
  lon: number,
  elevationM: number = 0,
  timeSeconds: number = 0
): Promise<ComprehensiveWeatherReport> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunrise,sunset&wind_speed_unit=kn&forecast_days=7&timezone=auto`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Open-Meteo HTTP ${res.status}`);
    }

    const data = await res.json();
    const cur = data.current || {};
    const code = cur.weather_code ?? 0;
    const { description, icon } = decodeWmoWeatherCode(code);

    const tempC = Number((cur.temperature_2m ?? 24).toFixed(1));
    const humidity = Math.round(cur.relative_humidity_2m ?? 50);
    const dewPoint = Number((tempC - ((100 - humidity) / 5)).toFixed(1));
    const visibilityKm = code >= 60 ? 8.5 : code >= 45 ? 2.0 : 16.0;
    const cloudCover = Math.round(cur.cloud_cover ?? 30);

    const flightRuleCategory: 'VFR' | 'MVFR' | 'IFR' =
      visibilityKm < 5 || cloudCover > 85 ? 'IFR' : visibilityKm < 8 || cloudCover > 60 ? 'MVFR' : 'VFR';

    const elev = Math.round(data.elevation || elevationM);
    const isaTemp = 15 - 0.0065 * elev;
    const densityAltitudeM = Math.round(elev + 120 * (tempC - isaTemp));
    const pres = Number((cur.surface_pressure || 1013.2).toFixed(1));
    const airDensityKgM3 = Number((1.225 * (pres / 1013.25) * (288.15 / (tempC + 273.15))).toFixed(3));
    const freezingLevelM = Math.max(0, Math.round((tempC / 6.5) * 1000));

    // Parse Hourly (next 24 hours)
    const hourlyRaw = data.hourly || {};
    const hourlyTimes: string[] = hourlyRaw.time || [];
    const hourlyTemps: number[] = hourlyRaw.temperature_2m || [];
    const hourlyCodes: number[] = hourlyRaw.weather_code || [];
    const hourlyProbs: number[] = hourlyRaw.precipitation_probability || [];
    const hourlyWinds: number[] = hourlyRaw.wind_speed_10m || [];

    const hourly: HourlyForecastItem[] = [];
    const limit = Math.min(24, hourlyTimes.length);
    for (let i = 0; i < limit; i++) {
      const timeStr = hourlyTimes[i];
      const hourPart = timeStr.includes('T') ? timeStr.split('T')[1].slice(0, 5) : `${i}:00`;
      const hCode = hourlyCodes[i] ?? 0;
      const dec = decodeWmoWeatherCode(hCode);

      hourly.push({
        time: hourPart,
        timestamp: new Date(timeStr).getTime() || Date.now() + i * 3600 * 1000,
        temperatureC: Number((hourlyTemps[i] ?? tempC).toFixed(1)),
        weatherCode: hCode,
        weatherDescription: dec.description,
        icon: dec.icon,
        precipitationProb: Math.round(hourlyProbs[i] ?? 0),
        windSpeedKnots: Math.round(hourlyWinds[i] ?? 10),
      });
    }

    // Parse Daily (7 days)
    const dailyRaw = data.daily || {};
    const dailyDates: string[] = dailyRaw.time || [];
    const dailyMaxs: number[] = dailyRaw.temperature_2m_max || [];
    const dailyMins: number[] = dailyRaw.temperature_2m_min || [];
    const dailyCodes: number[] = dailyRaw.weather_code || [];
    const dailyProbs: number[] = dailyRaw.precipitation_probability_max || [];
    const dailyUvs: number[] = dailyRaw.uv_index_max || [];
    const dailySunrises: string[] = dailyRaw.sunrise || [];
    const dailySunsets: string[] = dailyRaw.sunset || [];

    const daily: DailyForecastItem[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let d = 0; d < dailyDates.length; d++) {
      const dDate = dailyDates[d];
      const dateObj = new Date(dDate);
      const dName = d === 0 ? 'Today' : dayNames[dateObj.getDay()] || 'Day';
      const dCode = dailyCodes[d] ?? 0;
      const dec = decodeWmoWeatherCode(dCode);

      const sunriseStr = dailySunrises[d] ? dailySunrises[d].split('T')[1]?.slice(0, 5) : '06:00';
      const sunsetStr = dailySunsets[d] ? dailySunsets[d].split('T')[1]?.slice(0, 5) : '18:30';

      daily.push({
        date: dDate,
        dayName: dName,
        weatherCode: dCode,
        weatherDescription: dec.description,
        icon: dec.icon,
        tempMaxC: Number((dailyMaxs[d] ?? tempC + 4).toFixed(1)),
        tempMinC: Number((dailyMins[d] ?? tempC - 3).toFixed(1)),
        precipitationProbMax: Math.round(dailyProbs[d] ?? 10),
        uvIndexMax: Math.round(dailyUvs[d] ?? 5),
        sunrise: sunriseStr,
        sunset: sunsetStr,
      });
    }

    return {
      latitude: Number(lat.toFixed(4)),
      longitude: Number(lon.toFixed(4)),
      elevationM: elev,
      temperatureC: tempC,
      apparentTemperatureC: Number((cur.apparent_temperature ?? tempC).toFixed(1)),
      relativeHumidity: humidity,
      dewPointC: dewPoint,
      surfacePressureHpa: pres,
      windSpeedKnots: Number((cur.wind_speed_10m || 10).toFixed(1)),
      windDirectionDeg: Math.round(cur.wind_direction_10m || 0),
      windGustKnots: Number((cur.wind_gusts_10m || cur.wind_speed_10m * 1.3 || 14).toFixed(1)),
      cloudCoverPercent: cloudCover,
      precipitationMm: Number((cur.precipitation || 0).toFixed(1)),
      visibilityKm,
      uvIndex: daily[0]?.uvIndexMax || 5,
      weatherCode: code,
      weatherDescription: description,
      weatherIcon: icon,
      flightRuleCategory,
      densityAltitudeM,
      freezingLevelM,
      airDensityKgM3,
      source: 'OPEN_METEO_LIVE',
      fetchedAt: Date.now(),
      hourly: hourly.length > 0 ? hourly : generateSyntheticComprehensiveWeather(lat, lon, elevationM, timeSeconds).hourly,
      daily: daily.length > 0 ? daily : generateSyntheticComprehensiveWeather(lat, lon, elevationM, timeSeconds).daily,
    };
  } catch {
    return generateSyntheticComprehensiveWeather(lat, lon, elevationM, timeSeconds);
  }
}

/**
 * Fetches latest RainViewer radar frames for global weather radar overlay.
 */
export async function fetchRainViewerMetadata(): Promise<RainViewerMetadata | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://api.rainviewer.com/public/weather-maps.json', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
