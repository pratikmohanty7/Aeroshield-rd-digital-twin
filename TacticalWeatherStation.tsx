import React, { useState, useEffect, useRef } from 'react';
import {
  ComprehensiveWeatherReport,
  fetchComprehensiveWeather,
} from '../../services/weatherService';
import { searchGlobalGeocoding, GlobalLocation } from '../../data/globalLocations';
import { soundFX } from '../../utils/audioFeedback';
import {
  CloudRain,
  Thermometer,
  Wind,
  Compass,
  Gauge,
  Eye,
  Sun,
  Sunrise,
  Sunset,
  Search,
  MapPin,
  LocateFixed,
  RefreshCw,
  Navigation,
  CheckCircle,
  Layers,
  ChevronRight,
  Plane,
  AlertTriangle,
  Zap,
} from 'lucide-react';

interface TacticalWeatherStationProps {
  initialLat: number;
  initialLon: number;
  initialName?: string;
  aircraftLat?: number;
  aircraftLon?: number;
  onFlyToLocation?: (coords: { lat: number; lon: number; zoom: number }) => void;
  onDeployAircraft?: (coords: { lat: number; lon: number }) => void;
}

const PRESET_STATIONS = [
  { name: 'Sriharikota SDSC', country: 'India', lat: 13.7199, lon: 80.2304 },
  { name: 'Cape Canaveral SFS', country: 'United States', lat: 28.3922, lon: -80.6077 },
  { name: 'Edwards AFB', country: 'United States', lat: 34.9054, lon: -117.8837 },
  { name: 'London Heathrow', country: 'United Kingdom', lat: 51.4700, lon: -0.4543 },
  { name: 'Tokyo Haneda', country: 'Japan', lat: 35.5494, lon: 139.7798 },
  { name: 'Dubai International', country: 'UAE', lat: 25.2532, lon: 55.3657 },
  { name: 'Paris Charles de Gaulle', country: 'France', lat: 49.0097, lon: 2.5479 },
  { name: 'New York JFK', country: 'United States', lat: 40.6413, lon: -73.7781 },
];

export const TacticalWeatherStation: React.FC<TacticalWeatherStationProps> = ({
  initialLat,
  initialLon,
  initialName = 'Active Tactical Datum',
  aircraftLat,
  aircraftLon,
  onFlyToLocation,
  onDeployAircraft,
}) => {
  // Current active coordinates & station metadata
  const [stationCoords, setStationCoords] = useState<{ lat: number; lon: number; name: string }>({
    lat: initialLat,
    lon: initialLon,
    name: initialName,
  });

  const [weatherData, setWeatherData] = useState<ComprehensiveWeatherReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');

  // Search input state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<GlobalLocation[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const [isSearchingOnline, setIsSearchingOnline] = useState<boolean>(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Selected hour index from the 24-hr strip for detailed inspection
  const [selectedHourIndex, setSelectedHourIndex] = useState<number>(0);

  // Fetch comprehensive weather data whenever station coordinates change
  const loadWeatherData = async (lat: number, lon: number) => {
    setIsLoading(true);
    const data = await fetchComprehensiveWeather(lat, lon, 25, 0);
    setWeatherData(data);
    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadWeatherData(stationCoords.lat, stationCoords.lon);
  }, [stationCoords.lat, stationCoords.lon]);

  // Sync if parent passes new initial coordinates
  useEffect(() => {
    setStationCoords((prev) => {
      if (Math.abs(prev.lat - initialLat) > 0.001 || Math.abs(prev.lon - initialLon) > 0.001) {
        return { lat: initialLat, lon: initialLon, name: initialName };
      }
      return prev;
    });
  }, [initialLat, initialLon, initialName]);

  // Format temperature based on user selection
  const formatTemp = (celsius: number): string => {
    if (tempUnit === 'F') {
      return `${Math.round(celsius * 1.8 + 32)}°F`;
    }
    return `${celsius.toFixed(1)}°C`;
  };

  // Convert wind degrees to cardinal direction
  const getWindCardinal = (deg: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(deg / 22.5) % 16;
    return directions[index];
  };

  // Handle Search Input
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      setIsSearchingOnline(false);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      return;
    }

    setShowSearchDropdown(true);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setIsSearchingOnline(true);

    searchDebounceRef.current = setTimeout(async () => {
      const results = await searchGlobalGeocoding(text);
      setSearchResults(results);
      setIsSearchingOnline(false);
    }, 450);
  };

  const handleSelectLocation = (loc: { lat: number; lon: number; name: string }) => {
    soundFX.click();
    setStationCoords(loc);
    setSearchQuery('');
    setShowSearchDropdown(false);
  };

  // Geolocation button
  const handleUseDeviceLocation = () => {
    if (!navigator.geolocation) return;
    soundFX.click();
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleSelectLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          name: 'My GPS Location',
        });
      },
      (err) => console.warn('GPS lookup error:', err),
      { timeout: 8000 }
    );
  };

  // Center on Aircraft
  const handleUseAircraftLocation = () => {
    if (aircraftLat === undefined || aircraftLon === undefined) return;
    soundFX.click();
    handleSelectLocation({
      lat: aircraftLat,
      lon: aircraftLon,
      name: 'Aircraft Telemetry Datum',
    });
  };

  return (
    <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 md:p-6 space-y-6 shadow-xl font-sans text-slate-200">
      {/* 1. Header Toolbar: Title, Location Search, Presets & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-400">
              <CloudRain size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Tactical Atmospheric &amp; Weather Center</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800/60 font-mono font-medium">
                  {weatherData?.source === 'OPEN_METEO_LIVE' ? 'LIVE RADAR MET' : 'THERMODYNAMIC'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-world high-resolution atmospheric telemetry, aviation crosswinds, 24-hour timeline, and 7-day synoptic outlook.
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar & Quick Location Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative w-full sm:w-80">
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/70 rounded-xl px-3 py-1.5 focus-within:border-blue-500/80 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-inner">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search city, airport, military station..."
                className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden"
              />
              {isSearchingOnline && (
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping shrink-0" />
              )}
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchDropdown(false);
                  }}
                  className="text-slate-500 hover:text-slate-300 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Geocoded Autocomplete Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0e1424] border border-slate-700/80 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-800/80">
                {searchResults.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() =>
                      handleSelectLocation({
                        lat: loc.lat,
                        lon: loc.lon,
                        name: `${loc.name} (${loc.country})`,
                      })
                    }
                    className="w-full text-left px-3.5 py-2.5 hover:bg-blue-600/15 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-blue-300">
                        {loc.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {loc.country} · {loc.lat.toFixed(3)}°, {loc.lon.toFixed(3)}°
                      </div>
                    </div>
                    <ChevronRight size={13} className="text-slate-500 group-hover:text-blue-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick GPS & Aircraft Locators */}
          <button
            onClick={handleUseDeviceLocation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-blue-300 text-xs font-medium transition-colors shadow-xs"
            title="Locate weather at your device GPS location"
          >
            <LocateFixed size={13} />
            <span className="hidden sm:inline">My GPS</span>
          </button>

          {aircraftLat !== undefined && aircraftLon !== undefined && (
            <button
              onClick={handleUseAircraftLocation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-blue-300 text-xs font-medium transition-colors shadow-xs"
              title="Locate weather at aircraft coordinate"
            >
              <Plane size={13} />
              <span className="hidden sm:inline">Aircraft</span>
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={() => {
              soundFX.click();
              setIsRefreshing(true);
              loadWeatherData(stationCoords.lat, stationCoords.lon);
            }}
            className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-colors"
            title="Refresh live weather telemetry"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          </button>

          {/* Celsius / Fahrenheit Segmented Switcher */}
          <div className="flex items-center bg-slate-900 rounded-xl p-0.5 border border-slate-800 text-xs font-medium">
            <button
              onClick={() => {
                soundFX.click();
                setTempUnit('C');
              }}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                tempUnit === 'C'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              °C
            </button>
            <button
              onClick={() => {
                soundFX.click();
                setTempUnit('F');
              }}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                tempUnit === 'F'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              °F
            </button>
          </div>
        </div>
      </div>

      {/* Preset Weather Stations Carousel */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-thin">
        <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider whitespace-nowrap pl-0.5">
          Aerospace Stations:
        </span>
        {PRESET_STATIONS.map((preset) => {
          const isSelected =
            Math.abs(preset.lat - stationCoords.lat) < 0.05 &&
            Math.abs(preset.lon - stationCoords.lon) < 0.05;

          return (
            <button
              key={preset.name}
              onClick={() => handleSelectLocation({ lat: preset.lat, lon: preset.lon, name: preset.name })}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-900/70 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              {preset.name}
            </button>
          );
        })}
      </div>

      {/* 2. Hero Weather Conditions Banner */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 text-sm animate-pulse space-y-2">
          <CloudRain size={36} className="mx-auto text-blue-400 animate-bounce" />
          <p>Acquiring live meteorological radar and synoptic data from Open-Meteo...</p>
        </div>
      ) : weatherData ? (
        <>
          <div className="bg-gradient-to-r from-[#0e1628] via-[#10192e] to-[#0e1628] border border-blue-500/25 rounded-2xl p-5 md:p-6 shadow-2xl relative overflow-hidden">
            {/* Ambient Background Accent Glow */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
              {/* Left: Station Identity, Condition, Temperature */}
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <MapPin size={18} className="text-blue-400 shrink-0" />
                  <span className="text-lg font-bold text-white tracking-tight">{stationCoords.name}</span>
                  <span className="text-xs font-mono text-slate-400 tabular-nums">
                    ({weatherData.latitude.toFixed(4)}°, {weatherData.longitude.toFixed(4)}°) · {weatherData.elevationM}m MSL
                  </span>
                </div>

                <div className="flex items-center gap-5 pt-1">
                  <span className="text-5xl md:text-6xl drop-shadow-md select-none">{weatherData.weatherIcon}</span>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl md:text-5xl font-extrabold text-white tracking-tight font-mono tabular-nums">
                        {formatTemp(weatherData.temperatureC)}
                      </span>
                      <span className="text-sm text-slate-400 font-sans">
                        Feels like {formatTemp(weatherData.apparentTemperatureC)}
                      </span>
                    </div>
                    <div className="text-base font-semibold text-blue-300 mt-1">
                      {weatherData.weatherDescription}
                    </div>
                  </div>
                </div>
              </div>

              {/* Center: Flight Rule Classification & Astro Times */}
              <div className="flex items-center gap-4 bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 text-xs">
                {/* Flight Rules Badge */}
                <div className="text-center px-3 border-r border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Flight Rules</div>
                  <div
                    className={`mt-1 font-bold text-sm px-2.5 py-0.5 rounded-full ${
                      weatherData.flightRuleCategory === 'VFR'
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                        : weatherData.flightRuleCategory === 'MVFR'
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                        : 'bg-rose-950/80 text-rose-300 border border-rose-700/60'
                    }`}
                  >
                    {weatherData.flightRuleCategory}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {weatherData.flightRuleCategory === 'VFR'
                      ? 'Visual Flight Clear'
                      : weatherData.flightRuleCategory === 'MVFR'
                      ? 'Marginal VFR'
                      : 'Instrument Required'}
                  </div>
                </div>

                {/* Sunrise / Sunset */}
                <div className="space-y-1.5 pl-1 text-[11px] font-mono">
                  <div className="flex items-center gap-2 text-amber-300">
                    <Sunrise size={14} />
                    <span>Sunrise: {weatherData.daily[0]?.sunrise || '06:15 AM'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-indigo-300">
                    <Sunset size={14} />
                    <span>Sunset: {weatherData.daily[0]?.sunset || '18:45 PM'}</span>
                  </div>
                </div>
              </div>

              {/* Right: Quick Action Buttons */}
              <div className="flex items-center gap-2.5 flex-wrap self-stretch lg:self-auto justify-end">
                {onFlyToLocation && (
                  <button
                    onClick={() => {
                      soundFX.click();
                      onFlyToLocation({
                        lat: weatherData.latitude,
                        lon: weatherData.longitude,
                        zoom: 12,
                      });
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md shadow-blue-950/40"
                  >
                    <Layers size={14} />
                    <span>View on Radar Map</span>
                  </button>
                )}

                {onDeployAircraft && (
                  <button
                    onClick={() => {
                      soundFX.phaseStep();
                      onDeployAircraft({
                        lat: weatherData.latitude,
                        lon: weatherData.longitude,
                      });
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all shadow-xs"
                  >
                    <Navigation size={13} />
                    <span>Deploy Aircraft Here</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 3. Detailed Aviation & Meteorological Transducer Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 text-xs">
            {/* Wind Vector Card */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <Wind size={13} className="text-sky-400" />
                  Wind Vector
                </span>
                <span className="font-mono text-slate-300">{weatherData.windDirectionDeg}°</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-white font-mono tabular-nums">
                  {weatherData.windSpeedKnots}
                </span>
                <span className="text-xs text-slate-400">kt</span>
                <span className="text-xs text-sky-400 font-semibold font-mono">
                  {getWindCardinal(weatherData.windDirectionDeg)}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Gusts: {weatherData.windGustKnots} kt ({(weatherData.windSpeedKnots * 1.852).toFixed(1)} km/h)
              </div>
            </div>

            {/* Barometric Pressure Card */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <Gauge size={13} className="text-emerald-400" />
                  Barometric
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">QNH</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
                  {weatherData.surfacePressureHpa}
                </span>
                <span className="text-xs text-slate-400">hPa</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {(weatherData.surfacePressureHpa * 0.02953).toFixed(2)} inHg ·{' '}
                {weatherData.surfacePressureHpa >= 1013.25 ? '+High' : '-Low'}
              </div>
            </div>

            {/* Humidity & Dew Point Card */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <Thermometer size={13} className="text-amber-400" />
                  Humidity
                </span>
                <span className="font-mono text-slate-400">RH</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-100 font-mono tabular-nums">
                  {weatherData.relativeHumidity}%
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Dew Point: {formatTemp(weatherData.dewPointC)}
              </div>
            </div>

            {/* Cloud Cover & Rain Card */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <CloudRain size={13} className="text-blue-400" />
                  Precipitation
                </span>
                <span className="font-mono text-blue-300">{weatherData.cloudCoverPercent}% Cld</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-blue-300 font-mono tabular-nums">
                  {weatherData.precipitationMm}
                </span>
                <span className="text-xs text-slate-400">mm/h</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {weatherData.precipitationMm > 0 ? 'Active Downpour' : 'No Rain Detected'}
              </div>
            </div>

            {/* Visibility & UV Card */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <Eye size={13} className="text-purple-400" />
                  Visibility
                </span>
                <span className="font-mono text-purple-300">UV {weatherData.uvIndex}</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-100 font-mono tabular-nums">
                  {weatherData.visibilityKm}
                </span>
                <span className="text-xs text-slate-400">km</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {(weatherData.visibilityKm * 0.539957).toFixed(1)} NM Range
              </div>
            </div>

            {/* Aerospace Ballistic Dynamics Card */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <Navigation size={13} className="text-indigo-400" />
                  Density Alt
                </span>
                <span className="text-[10px] text-indigo-400 font-mono">ISA+</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-indigo-300 font-mono tabular-nums">
                  {weatherData.densityAltitudeM}
                </span>
                <span className="text-xs text-slate-400">m</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Air: {weatherData.airDensityKgM3} kg/m³
              </div>
            </div>
          </div>

          {/* 4. 24-Hour Hourly Atmospheric Timeline */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Compass size={16} className="text-blue-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  24-Hour Hourly Atmospheric Timeline
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Next 24 Hours Flight Planning
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {weatherData.hourly.map((h, idx) => {
                const isSelected = selectedHourIndex === idx;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      soundFX.click();
                      setSelectedHourIndex(idx);
                    }}
                    className={`flex flex-col items-center justify-between min-w-[72px] p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-md ring-1 ring-blue-500/50'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-[11px] font-mono font-medium text-slate-400">{h.time}</span>
                    <span className="text-2xl my-1.5 select-none">{h.icon}</span>
                    <span className="text-xs font-bold font-mono text-white tabular-nums">
                      {formatTemp(h.temperatureC)}
                    </span>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-blue-400 font-mono">
                      <span>{h.precipitationProb}%</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                      {h.windSpeedKnots}kt
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. 7-Day Synoptic Weather Outlook */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Sun size={16} className="text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  7-Day Synoptic Weather Outlook
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Weekly Climatological Baseline
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {weatherData.daily.map((day, idx) => (
                <div
                  key={day.date}
                  className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-3 flex flex-col items-center justify-between text-center space-y-2 hover:border-slate-700 transition-colors"
                >
                  <div className="text-xs font-semibold text-slate-300">{day.dayName}</div>
                  <div className="text-[10px] font-mono text-slate-400">{day.date.slice(5)}</div>
                  <div className="text-3xl my-1 select-none">{day.icon}</div>
                  <div className="text-[11px] text-slate-300 font-medium leading-tight h-7 flex items-center justify-center">
                    {day.weatherDescription}
                  </div>

                  {/* Temp High / Low Bar */}
                  <div className="w-full pt-1 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs font-mono font-bold">
                      <span className="text-amber-400">{formatTemp(day.tempMaxC)}</span>
                      <span className="text-slate-400 text-[11px]">{formatTemp(day.tempMinC)}</span>
                    </div>
                    {day.precipitationProbMax > 20 && (
                      <div className="text-[10px] text-blue-400 font-mono mt-0.5">
                        🌧️ {day.precipitationProbMax}% rain
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
