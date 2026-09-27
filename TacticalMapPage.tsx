import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { TacticalMap } from '../components/map/TacticalMap';
import {
  BaseMapStyle,
  Waypoint,
  RadarColorScheme,
  TacticalMissionMode,
  MeasurementToolState,
  ArtilleryMissionState,
} from '../types/geoMap';
import {
  GLOBAL_PRESETS,
  GlobalLocation,
  searchLocations,
  searchGlobalGeocoding,
} from '../data/globalLocations';
import {
  calculateVehicleGeoState,
  calculateWeatherAtPosition,
} from '../utils/geoSimulation';
import {
  calculateGlobalSatellites,
  GlobalSatellite,
} from '../services/satelliteService';
import {
  fetchLiveWeather,
  fetchRainViewerMetadata,
  LiveWeatherReport,
  RainViewerMetadata,
} from '../services/weatherService';
import {
  calculateDistanceKm,
  calculateBearingDeg,
  formatToDMS,
} from '../utils/geodesy';
import { soundFX } from '../utils/audioFeedback';
import { TacticalWeatherStation } from '../components/weather/TacticalWeatherStation';
import {
  Satellite,
  CloudRain,
  Thermometer,
  Wind,
  Navigation,
  Crosshair,
  Search,
  Globe,
  Play,
  Pause,
  ChevronRight,
  MapPin,
  LocateFixed,
  Ruler,
  Target,
  CircleDot,
  Radio,
  BarChart3,
  Gauge,
  Compass,
  Layers,
  Sun,
  Sparkles,
} from 'lucide-react';

export const TacticalMapPage: React.FC = () => {
  const {
    timeSeconds,
    healthBreakdown,
    activeFaults,
    tacticalTarget,
    setTacticalTarget,
    flightTelemetry,
    setFlightPhase,
    annunciator,
  } = useApp();

  // Location / Navigation state
  const [currentBaseLocation, setCurrentBaseLocation] = useState<GlobalLocation>(
    GLOBAL_PRESETS[0] // Sriharikota default
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<GlobalLocation[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const [isSearchingOnline, setIsSearchingOnline] = useState<boolean>(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const [flyToTarget, setFlyToTarget] = useState<{
    lat: number;
    lon: number;
    zoom: number;
  } | null>(null);

  // Inspected map coordinate (when user clicks anywhere on Earth)
  const [inspectedLocation, setInspectedLocation] = useState<{
    lat: number;
    lon: number;
    weatherReport: LiveWeatherReport | null;
    isLoadingWeather: boolean;
  } | null>(null);

  // Vehicle position override (when user relocates aircraft)
  const [vehicleOffset, setVehicleOffset] = useState<{
    lat: number;
    lon: number;
  }>({
    lat: GLOBAL_PRESETS[0].lat,
    lon: GLOBAL_PRESETS[0].lon,
  });

  // Tactical Flight Mission Mode
  const [missionMode, setMissionMode] = useState<TacticalMissionMode>('artillery_fire_mission');

  // Artillery Mission State (Synchronized with AppContext Tactical Target)
  const [artilleryMission, setArtilleryMission] = useState<ArtilleryMissionState>({
    batteryLat: tacticalTarget.batteryLat,
    batteryLon: tacticalTarget.batteryLon,
    targetLat: tacticalTarget.targetLat,
    targetLon: tacticalTarget.targetLon,
    targetName: tacticalTarget.targetName,
    rangeKm: 31.5,
    bearingDeg: Math.round(tacticalTarget.bearingDeg),
    apogeeM: 8820,
    tofSeconds: 74,
    impactCepM: flightTelemetry.impactCepM,
    active: true,
  });

  // Keep artilleryMission synced when tacticalTarget changes in AppContext
  useEffect(() => {
    setArtilleryMission((prev) => ({
      ...prev,
      batteryLat: tacticalTarget.batteryLat,
      batteryLon: tacticalTarget.batteryLon,
      targetLat: tacticalTarget.targetLat,
      targetLon: tacticalTarget.targetLon,
      targetName: tacticalTarget.targetName,
      bearingDeg: Math.round(tacticalTarget.bearingDeg),
      impactCepM: flightTelemetry.impactCepM,
    }));
  }, [tacticalTarget.targetId, tacticalTarget.targetLat, tacticalTarget.targetLon, tacticalTarget.targetName, tacticalTarget.bearingDeg, flightTelemetry.impactCepM]);

  // Base map & layer toggles
  const [baseMapStyle, setBaseMapStyle] = useState<BaseMapStyle>('satellite');
  const [showTemperatureOverlay, setShowTemperatureOverlay] = useState<boolean>(true);
  const [showWeatherRadar, setShowWeatherRadar] = useState<boolean>(true);
  const [showWindVectors, setShowWindVectors] = useState<boolean>(true);
  const [showSatelliteFootprints, setShowSatelliteFootprints] = useState<boolean>(true);
  const [showFlightTrail, setShowFlightTrail] = useState<boolean>(true);
  const [showWaypoints, setShowWaypoints] = useState<boolean>(true);
  const [showRangeRings, setShowRangeRings] = useState<boolean>(true);
  const [autoCenterVehicle, setAutoCenterVehicle] = useState<boolean>(false);

  // Measurement Tool State (Ruler)
  const [measurementState, setMeasurementState] = useState<MeasurementToolState>({
    active: false,
    pointA: null,
    pointB: null,
    distanceKm: 0,
    distanceNm: 0,
    bearingDeg: 0,
  });

  // RainViewer Radar Live Metadata & Playback
  const [radarMetadata, setRadarMetadata] = useState<RainViewerMetadata | null>(null);
  const [radarFrameIndex, setRadarFrameIndex] = useState<number>(0);
  const [isRadarPlaying, setIsRadarPlaying] = useState<boolean>(true);
  const [radarOpacity, setRadarOpacity] = useState<number>(0.75);
  const [radarColorScheme, setRadarColorScheme] = useState<RadarColorScheme>(4); // 4 = TITAN Doppler

  // Live weather report for vehicle position
  const [vehicleLiveWeather, setVehicleLiveWeather] = useState<LiveWeatherReport | null>(null);

  // Tactical Section View Mode: Map, Dedicated Weather Center, or Dual View
  const [activeViewTab, setActiveViewTab] = useState<'map' | 'weather' | 'split'>('map');

  // Weather station location target for detailed inspection
  const [weatherStationFocus, setWeatherStationFocus] = useState<{
    lat: number;
    lon: number;
    name: string;
  }>({
    lat: GLOBAL_PRESETS[0].lat,
    lon: GLOBAL_PRESETS[0].lon,
    name: GLOBAL_PRESETS[0].name,
  });

  // Search input handler with OSM Nominatim Geocoding
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      setIsSearchingOnline(false);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      return;
    }

    const local = searchLocations(text);
    setSearchResults(local);
    setShowSearchDropdown(true);

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setIsSearchingOnline(true);

    searchDebounceRef.current = setTimeout(async () => {
      const globalResults = await searchGlobalGeocoding(text);
      setSearchResults(globalResults);
      setIsSearchingOnline(false);
    }, 450);
  };

  // Jump to location
  const handleSelectLocation = (loc: GlobalLocation) => {
    soundFX.click();
    setCurrentBaseLocation(loc);
    setVehicleOffset({ lat: loc.lat, lon: loc.lon });
    setFlyToTarget({ lat: loc.lat, lon: loc.lon, zoom: loc.zoom });
    setWeatherStationFocus({ lat: loc.lat, lon: loc.lon, name: loc.name });
    setSearchQuery(loc.name);
    setShowSearchDropdown(false);
  };

  // HTML5 Device GPS Geolocation
  const handleLocateUserDevice = () => {
    if (!navigator.geolocation) return;
    soundFX.click();
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLoc: GlobalLocation = {
          id: 'user-device-loc',
          name: 'My GPS Location',
          category: 'Aviation Hubs',
          country: 'Local Coordinate',
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          zoom: 13,
          elevationM: 25,
          description: `Device fix: ${pos.coords.latitude.toFixed(5)}°, ${pos.coords.longitude.toFixed(5)}°.`,
        };
        handleSelectLocation(userLoc);
      },
      (err) => {
        console.warn('Geolocation error:', err);
      },
      { timeout: 8000 }
    );
  };

  // Relocate aircraft to clicked or selected location
  const handleRelocateAircraft = (target: { lat: number; lon: number }) => {
    soundFX.phaseStep();
    setVehicleOffset(target);
    setFlyToTarget({ lat: target.lat, lon: target.lon, zoom: 12 });
  };

  // Designate clicked coordinate as Artillery Target
  const handleSetArtilleryTarget = (targetCoords: { lat: number; lon: number }, name?: string) => {
    soundFX.chipSelect();
    const range = calculateDistanceKm(vehicleOffset.lat, vehicleOffset.lon, targetCoords.lat, targetCoords.lon);
    const bearing = calculateBearingDeg(vehicleOffset.lat, vehicleOffset.lon, targetCoords.lat, targetCoords.lon);
    const apogeeM = Math.min(22000, Math.max(800, range * 280));
    const tof = Math.round(range * 2.15);

    setArtilleryMission({
      batteryLat: vehicleOffset.lat,
      batteryLon: vehicleOffset.lon,
      targetLat: targetCoords.lat,
      targetLon: targetCoords.lon,
      targetName: name || `Target (${targetCoords.lat.toFixed(3)}°, ${targetCoords.lon.toFixed(3)}°)`,
      rangeKm: range,
      bearingDeg: bearing,
      apogeeM,
      tofSeconds: tof,
      impactCepM: 0.8,
      active: true,
    });
    setMissionMode('artillery_fire_mission');
  };

  // Fetch RainViewer metadata once on mount
  useEffect(() => {
    fetchRainViewerMetadata().then((data) => {
      if (data && data.radar && data.radar.past && data.radar.past.length > 0) {
        setRadarMetadata(data);
        setRadarFrameIndex(data.radar.past.length - 1);
      }
    });
  }, []);

  // Radar playback ticker
  useEffect(() => {
    if (!isRadarPlaying || !radarMetadata || !radarMetadata.radar.past.length) return;
    const interval = setInterval(() => {
      setRadarFrameIndex((prev) => (prev + 1) % radarMetadata.radar.past.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [isRadarPlaying, radarMetadata]);

  // Compute live vehicle state relative to current center & mission mode
  const activeFaultTypes = activeFaults.filter((f) => f.active).map((f) => f.type);

  const vehicleState = useMemo(() => {
    if (missionMode === 'artillery_fire_mission' && artilleryMission.active) {
      const tof = Math.max(10, artilleryMission.tofSeconds);
      const progress = (timeSeconds % tof) / tof;

      const lat =
        artilleryMission.batteryLat +
        (artilleryMission.targetLat - artilleryMission.batteryLat) * progress;
      const lon =
        artilleryMission.batteryLon +
        (artilleryMission.targetLon - artilleryMission.batteryLon) * progress;

      const altitudeM =
        currentBaseLocation.elevationM +
        Math.round(4 * artilleryMission.apogeeM * progress * (1 - progress));

      const speedKnots = Math.round(
        (artilleryMission.rangeKm / (tof / 3600)) * 0.539957
      );

      return {
        lat: Number(lat.toFixed(5)),
        lon: Number(lon.toFixed(5)),
        altitudeM,
        headingDeg: artilleryMission.bearingDeg,
        speedKnots,
        climbRateMps: Number(((0.5 - progress) * 120).toFixed(1)),
        trajectoryPoint: {
          lat: Number(lat.toFixed(5)),
          lon: Number(lon.toFixed(5)),
          altitudeM,
          timestamp: timeSeconds,
          health: healthBreakdown.systemHealthIndex,
          speedKnots,
          headingDeg: artilleryMission.bearingDeg,
        },
      };
    }

    const radiusDeg = 0.035;
    const periodS = 90;
    const angle = (timeSeconds * (2 * Math.PI)) / periodS;

    const lat = vehicleOffset.lat + Math.cos(angle) * radiusDeg;
    const lon = vehicleOffset.lon + Math.sin(angle) * radiusDeg;
    const altitudeM = currentBaseLocation.elevationM + 450 + Math.sin(timeSeconds * 0.2) * 80;

    let headingDeg = ((-angle * 180) / Math.PI + 90 + 360) % 360;
    const speedKnots = 125 + Math.sin(timeSeconds * 0.1) * 15;

    return {
      lat: Number(lat.toFixed(5)),
      lon: Number(lon.toFixed(5)),
      altitudeM: Math.round(altitudeM),
      headingDeg: Math.round(headingDeg),
      speedKnots: Math.round(speedKnots),
      climbRateMps: Number((Math.cos(timeSeconds * 0.2) * 2.5).toFixed(1)),
      trajectoryPoint: {
        lat: Number(lat.toFixed(5)),
        lon: Number(lon.toFixed(5)),
        altitudeM: Math.round(altitudeM),
        timestamp: timeSeconds,
        health: healthBreakdown.systemHealthIndex,
        speedKnots: Math.round(speedKnots),
        headingDeg: Math.round(headingDeg),
      },
    };
  }, [
    missionMode,
    artilleryMission,
    vehicleOffset,
    timeSeconds,
    currentBaseLocation.elevationM,
    healthBreakdown.systemHealthIndex,
  ]);

  // Compute live weather simulation
  const weather = useMemo(() => {
    return calculateWeatherAtPosition(
      {
        id: currentBaseLocation.id,
        name: currentBaseLocation.name,
        region: currentBaseLocation.country,
        center: [currentBaseLocation.lat, currentBaseLocation.lon],
        zoom: currentBaseLocation.zoom,
        elevationBaseM: currentBaseLocation.elevationM,
        description: currentBaseLocation.description,
        climateType: currentBaseLocation.category,
        baseTempC: 28.0,
        basePressureHpa: 1013.2,
        baseWindKnots: 12.0,
        baseWindDeg: 220,
      },
      vehicleState.altitudeM,
      timeSeconds,
      activeFaultTypes
    );
  }, [currentBaseLocation, vehicleState.altitudeM, timeSeconds, activeFaultTypes]);

  // Fetch real-world live weather for vehicle location periodically
  useEffect(() => {
    let isCancelled = false;
    fetchLiveWeather(
      vehicleState.lat,
      vehicleState.lon,
      vehicleState.altitudeM,
      timeSeconds
    ).then((report) => {
      if (!isCancelled) {
        setVehicleLiveWeather(report);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [Math.floor(timeSeconds / 30), currentBaseLocation.id]);

  // Handle map click to inspect anywhere on Earth
  const handleMapClickCoords = (coords: { lat: number; lon: number }) => {
    soundFX.click();
    setInspectedLocation({
      lat: coords.lat,
      lon: coords.lon,
      weatherReport: null,
      isLoadingWeather: true,
    });

    fetchLiveWeather(coords.lat, coords.lon, 100, timeSeconds).then((report) => {
      setInspectedLocation({
        lat: coords.lat,
        lon: coords.lon,
        weatherReport: report,
        isLoadingWeather: false,
      });
    });
  };

  // Compute global satellites
  const globalSatellites = useMemo(() => {
    return calculateGlobalSatellites(timeSeconds, vehicleState.lat, vehicleState.lon);
  }, [timeSeconds, vehicleState.lat, vehicleState.lon]);

  // Dynamic waypoints around current vehicle area
  const activeWaypoints = useMemo<Waypoint[]>(() => {
    return [
      {
        id: 'WP-BASE',
        name: `${currentBaseLocation.name.split(' ')[0]} Launch Datum`,
        lat: vehicleOffset.lat,
        lon: vehicleOffset.lon,
        altitudeM: currentBaseLocation.elevationM + 10,
        type: 'TAKEOFF',
        description: 'Simulated projectile launch position / reference datum.',
      },
      {
        id: 'WP-GS',
        name: 'Telemetry Uplink Station',
        lat: vehicleOffset.lat - 0.04,
        lon: vehicleOffset.lon - 0.04,
        altitudeM: currentBaseLocation.elevationM + 25,
        type: 'GROUND_STATION',
        description: '868 MHz FSK tracking antenna link.',
      },
      {
        id: 'WP-APEX',
        name: 'Simulated Trajectory Apogee',
        lat: vehicleOffset.lat + 0.05,
        lon: vehicleOffset.lon + 0.04,
        altitudeM: currentBaseLocation.elevationM + 600,
        type: 'CHECKPOINT',
        description: 'Mid-course ballistic apex waypoint.',
      },
      {
        id: 'WP-GRID',
        name: 'Designated Test Range Datum',
        lat: vehicleOffset.lat + 0.06,
        lon: vehicleOffset.lon - 0.05,
        altitudeM: currentBaseLocation.elevationM + 900,
        type: 'TARGET_RANGE',
        description: 'Simulated terminal impact / test range area.',
      },
    ];
  }, [currentBaseLocation, vehicleOffset]);

  // Generate historical trajectory trail
  const trajectory = useMemo(() => {
    const points = [];
    const trailLength = 25;
    for (let i = trailLength; i >= 0; i--) {
      const historicalTime = Math.max(0, timeSeconds - i * 1.5);
      const radiusDeg = 0.035;
      const periodS = 90;
      const angle = (historicalTime * (2 * Math.PI)) / periodS;

      const lat = vehicleOffset.lat + Math.cos(angle) * radiusDeg;
      const lon = vehicleOffset.lon + Math.sin(angle) * radiusDeg;
      const altitudeM = currentBaseLocation.elevationM + 450 + Math.sin(historicalTime * 0.2) * 80;

      points.push({
        lat: Number(lat.toFixed(5)),
        lon: Number(lon.toFixed(5)),
        altitudeM: Math.round(altitudeM),
        timestamp: historicalTime,
        health: healthBreakdown.systemHealthIndex,
        speedKnots: 125,
        headingDeg: Math.round(((-angle * 180) / Math.PI + 90 + 360) % 360),
      });
    }
    return points;
  }, [vehicleOffset, timeSeconds, currentBaseLocation.elevationM, healthBreakdown.systemHealthIndex]);

  const currentRadarFrame =
    radarMetadata && radarMetadata.radar.past[radarFrameIndex]
      ? radarMetadata.radar.past[radarFrameIndex]
      : null;

  return (
    <div className="space-y-4 font-sans max-w-[1600px] mx-auto">
      {/* Top Persistent Disclaimer Banner */}
      <div className="bg-[#0d1322] border border-cyan-500/30 rounded-sm p-3 px-4 flex items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-2.5">
          <Globe size={15} className="text-cyan-400 shrink-0" />
          <span>
            <strong className="text-white">GEOSPATIAL SIMULATION:</strong> Purely synthetic visualization module mapping simulated vehicle kinematics and test range datums. No operational fire control, target acquisition, or live weapon commands are implemented.
          </span>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-sm bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold shrink-0">
          SYNTHETIC DATA
        </span>
      </div>

      {/* Top Header & Mission Teleport / Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400 mb-1 font-semibold uppercase tracking-widest">
            <Globe size={12} />
            <span>07 · GEOSPATIAL SIMULATION · DIGITAL-TWIN MAP</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <span>Geospatial Simulation &amp; Trajectory Map</span>
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Track Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap font-mono">
            <span>Range Sector: {currentBaseLocation.name} ({currentBaseLocation.country})</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-300 tabular-nums">{vehicleState.lat.toFixed(4)}°N, {vehicleState.lon.toFixed(4)}°E</span>
            <span className="text-slate-600">·</span>
            <span className="text-cyan-400">Altitude: {vehicleState.altitudeM} m</span>
            <span className="text-slate-600">·</span>
            <span className="text-emerald-400">Integrity: {healthBreakdown.systemHealthIndex}%</span>
          </p>
        </div>

        {/* View Mode Switcher, Global Search & Teleport Bar */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto flex-wrap font-mono text-xs">
          {/* Tactical Section View Switcher */}
          <div className="flex items-center bg-[#080d1a] border border-white/[0.08] rounded-sm p-0.5">
            <button
              onClick={() => {
                soundFX.click();
                setActiveViewTab('map');
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-medium transition-all ${
                activeViewTab === 'map'
                  ? 'bg-cyan-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe size={13} />
              <span>Tactical Map</span>
            </button>

            <button
              onClick={() => {
                soundFX.click();
                setActiveViewTab('weather');
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-medium transition-all ${
                activeViewTab === 'weather'
                  ? 'bg-cyan-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CloudRain size={13} />
              <span>Weather Center</span>
            </button>

            <button
              onClick={() => {
                soundFX.click();
                setActiveViewTab('split');
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-medium transition-all ${
                activeViewTab === 'split'
                  ? 'bg-cyan-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers size={13} />
              <span>Dual View</span>
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <div className="flex items-center gap-2 bg-[#080d1a] border border-white/[0.08] rounded-sm px-3 py-1.5 focus-within:border-cyan-500/80 transition-all">
              <Search size={14} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search coordinates, theater, or city..."
                className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden font-sans"
              />
              {isSearchingOnline && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shrink-0" title="Querying global database"></span>
              )}
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchDropdown(false);
                  }}
                  className="text-slate-500 hover:text-slate-300 text-xs font-mono"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Autocomplete Dropdown with Live Geocoded Places */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#080d1a] border border-white/[0.12] rounded-sm shadow-2xl z-50 max-h-72 overflow-y-auto divide-y divide-white/[0.04]">
                {searchResults.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => handleSelectLocation(loc)}
                    className="w-full text-left px-3.5 py-2 hover:bg-cyan-600/15 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                        {loc.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {loc.country} · {loc.lat.toFixed(3)}°, {loc.lon.toFixed(3)}°
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-500 group-hover:text-cyan-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Device GPS Location Button */}
          <button
            onClick={handleLocateUserDevice}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#080d1a] hover:bg-white/[0.05] border border-white/[0.08] text-cyan-300 hover:text-white text-xs font-mono shrink-0 transition-colors"
            title="Locate device GPS position"
          >
            <LocateFixed size={13} />
            <span className="hidden sm:inline">My GPS</span>
          </button>
        </div>
      </div>

      {/* TACTICAL MAP INTERFACE (Active in 'map' or 'split' view) */}
      {(activeViewTab === 'map' || activeViewTab === 'split') && (
        <>
          {/* Unified Defense Command Deck & Sensor Matrix Bar */}
          <div className="bg-[#0d1322] border border-white/[0.08] rounded-sm p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Left: Mission Mode Selector & Status */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider">Mission:</span>
              <div className="flex items-center bg-[#080d1a] rounded-sm p-0.5 border border-white/[0.06]">
                <button
                  onClick={() => {
                    soundFX.click();
                    setMissionMode('recon_orbit');
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium transition-all ${
                    missionMode === 'recon_orbit'
                      ? 'bg-cyan-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CircleDot size={13} />
                  <span>Recon Orbit</span>
                </button>

                <button
                  onClick={() => {
                    soundFX.click();
                    setMissionMode('artillery_fire_mission');
                    setArtilleryMission((prev) => ({ ...prev, active: true }));
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium transition-all ${
                    missionMode === 'artillery_fire_mission'
                      ? 'bg-rose-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Target size={13} />
                  <span>Artillery Strike</span>
                </button>
              </div>

              {/* Active Artillery Strike Status Info */}
              {missionMode === 'artillery_fire_mission' && (
                <div className="flex items-center gap-2 text-xs bg-rose-950/40 border border-rose-800/80 rounded-sm px-2.5 py-1 text-rose-300 font-mono">
                  <span className="font-semibold font-sans">{artilleryMission.targetName}</span>
                  <span className="text-slate-500">·</span>
                  <span className="tabular-nums">Range: {artilleryMission.rangeKm} km</span>
                  <span className="text-slate-500">·</span>
                  <span className="tabular-nums">TOF: {artilleryMission.tofSeconds} s</span>
                </div>
              )}
            </div>

            {/* Center: Basemap Style Selector */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-bold tracking-wider">Basemap:</span>
              <div className="flex items-center bg-[#080d1a] rounded-sm p-0.5 border border-white/[0.06]">
                <button
                  onClick={() => {
                    soundFX.click();
                    setBaseMapStyle('satellite');
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium transition-colors ${
                    baseMapStyle === 'satellite'
                      ? 'bg-cyan-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Google Hybrid Satellite"
                >
                  <Satellite size={12} />
                  <span>Hybrid Sat</span>
                </button>
                <button
                  onClick={() => {
                    soundFX.click();
                    setBaseMapStyle('satellite_esri');
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-medium transition-colors ${
                    baseMapStyle === 'satellite_esri'
                      ? 'bg-cyan-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Esri HD World Imagery"
                >
                  <span>Esri HD</span>
                </button>
                <button
                  onClick={() => {
                    soundFX.click();
                    setBaseMapStyle('dark');
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-medium transition-colors ${
                    baseMapStyle === 'dark'
                      ? 'bg-cyan-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Tactical Dark Matter"
                >
                  <span>Dark Matter</span>
                </button>
                <button
                  onClick={() => {
                    soundFX.click();
                    setBaseMapStyle('topo');
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-medium transition-colors ${
                    baseMapStyle === 'topo'
                      ? 'bg-cyan-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="OpenTopoMap Elevation"
                >
                  <span>Topo</span>
                </button>
                <button
                  onClick={() => {
                    soundFX.click();
                    setBaseMapStyle('night_lights');
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-medium transition-colors ${
                    baseMapStyle === 'night_lights'
                      ? 'bg-cyan-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="NASA Earth at Night / City Lights"
                >
                  <span>Night Lights</span>
                </button>
              </div>
            </div>

            {/* Right: Tactical Sensor & Overlays Deck */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => {
                  soundFX.click();
                  setShowWeatherRadar(!showWeatherRadar);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium border transition-colors ${
                  showWeatherRadar
                    ? 'bg-emerald-950/80 border-emerald-600/70 text-emerald-300 font-semibold'
                    : 'bg-[#080d1a] border-white/[0.06] text-slate-400 hover:text-slate-200'
                }`}
                title="RainViewer Doppler Weather Radar"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${showWeatherRadar ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                <CloudRain size={12} />
                <span>Radar</span>
              </button>

              <button
                onClick={() => {
                  soundFX.click();
                  setShowRangeRings(!showRangeRings);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium border transition-colors ${
                  showRangeRings
                    ? 'bg-rose-950/80 border-rose-600/70 text-rose-300 font-semibold'
                    : 'bg-[#080d1a] border-white/[0.06] text-slate-400 hover:text-slate-200'
                }`}
                title="15km, 40km, 70km Artillery Strike Rings"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${showRangeRings ? 'bg-rose-400' : 'bg-slate-600'}`}></span>
                <Target size={12} />
                <span>Range Rings</span>
              </button>

              <button
                onClick={() => {
                  soundFX.click();
                  setShowTemperatureOverlay(!showTemperatureOverlay);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium border transition-colors ${
                  showTemperatureOverlay
                    ? 'bg-amber-950/80 border-amber-600/70 text-amber-300 font-semibold'
                    : 'bg-[#080d1a] border-white/[0.06] text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${showTemperatureOverlay ? 'bg-amber-400' : 'bg-slate-600'}`}></span>
                <Thermometer size={12} />
                <span>Thermal</span>
              </button>

              <button
                onClick={() => {
                  soundFX.click();
                  setShowWindVectors(!showWindVectors);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium border transition-colors ${
                  showWindVectors
                    ? 'bg-sky-950/80 border-sky-600/70 text-sky-300 font-semibold'
                    : 'bg-[#080d1a] border-white/[0.06] text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${showWindVectors ? 'bg-sky-400' : 'bg-slate-600'}`}></span>
                <Wind size={12} />
                <span>Wind</span>
              </button>

              <button
                onClick={() => {
                  soundFX.click();
                  setShowSatelliteFootprints(!showSatelliteFootprints);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium border transition-colors ${
                  showSatelliteFootprints
                    ? 'bg-purple-950/80 border-purple-600/70 text-purple-300 font-semibold'
                    : 'bg-[#080d1a] border-white/[0.06] text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${showSatelliteFootprints ? 'bg-purple-400' : 'bg-slate-600'}`}></span>
                <Satellite size={12} />
                <span>Satellites</span>
              </button>

              <button
                onClick={() => {
                  soundFX.click();
                  setShowFlightTrail(!showFlightTrail);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium border transition-colors ${
                  showFlightTrail
                    ? 'bg-cyan-950/80 border-cyan-600/70 text-cyan-300 font-semibold'
                    : 'bg-[#080d1a] border-white/[0.06] text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${showFlightTrail ? 'bg-cyan-400' : 'bg-slate-600'}`}></span>
                <Navigation size={12} />
                <span>Trajectory</span>
              </button>

              {/* Geodesic Distance Tool */}
              <button
                onClick={() => {
                  soundFX.click();
                  setMeasurementState((prev) => ({
                    ...prev,
                    active: !prev.active,
                    pointA: null,
                    pointB: null,
                  }));
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium border transition-colors ${
                  measurementState.active
                    ? 'bg-amber-600 text-white border-amber-500 font-semibold'
                    : 'bg-[#080d1a] border-white/[0.06] text-slate-400 hover:text-slate-200'
                }`}
                title="Measure great-circle distance & true bearing"
              >
                <Ruler size={12} />
                <span>Ruler</span>
              </button>

              {/* Auto-Center Tracking Lock */}
              <button
                onClick={() => {
                  soundFX.click();
                  setAutoCenterVehicle(!autoCenterVehicle);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-medium border transition-colors ${
                  autoCenterVehicle
                    ? 'bg-cyan-600 border-cyan-500 text-white font-semibold'
                    : 'bg-[#080d1a] border-white/[0.06] text-slate-400 hover:text-slate-200'
                }`}
                title="Locks map view to follow the vehicle in real-time"
              >
                <Crosshair size={12} />
                <span>{autoCenterVehicle ? 'Tracking' : 'Free Pan'}</span>
              </button>
            </div>
          </div>

      {/* Main Map Canvas */}
      <TacticalMap
        vehicleState={vehicleState}
        weather={weather}
        liveWeatherReport={vehicleLiveWeather}
        satellites={globalSatellites}
        trajectory={trajectory}
        waypoints={activeWaypoints}
        baseMapStyle={baseMapStyle}
        radarPath={currentRadarFrame?.path || null}
        radarTimestamp={currentRadarFrame?.time || null}
        radarOpacity={radarOpacity}
        radarColorScheme={radarColorScheme}
        showTemperatureOverlay={showTemperatureOverlay}
        showWeatherRadar={showWeatherRadar}
        showWindVectors={showWindVectors}
        showSatelliteFootprints={showSatelliteFootprints}
        showFlightTrail={showFlightTrail}
        showWaypoints={showWaypoints}
        showRangeRings={showRangeRings}
        autoCenterVehicle={autoCenterVehicle}
        onMapClickCoords={handleMapClickCoords}
        onRelocateVehicle={handleRelocateAircraft}
        onSetArtilleryTarget={handleSetArtilleryTarget}
        flyToTarget={flyToTarget}
        measurementState={measurementState}
        onUpdateMeasurement={setMeasurementState}
        artilleryMission={artilleryMission}
      />

      {/* Weather Radar Player Controls */}
      {showWeatherRadar && (
        <div className="bg-[#0b0f19] border border-emerald-900/60 rounded-xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-2 text-emerald-400 font-semibold">
              <CloudRain size={16} />
              <span>Doppler Radar Sweep:</span>
            </span>
            <span className="text-slate-300 font-mono tabular-nums">
              {currentRadarFrame
                ? new Date(currentRadarFrame.time * 1000).toLocaleTimeString()
                : 'Worldwide Precipitation Scan'}
            </span>

            {/* Color Scheme Picker */}
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Scale:</span>
              <select
                value={radarColorScheme}
                onChange={(e) => {
                  soundFX.click();
                  setRadarColorScheme(parseInt(e.target.value) as RadarColorScheme);
                }}
                className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-emerald-300 font-sans focus:outline-hidden"
              >
                <option value={4}>TITAN (Doppler)</option>
                <option value={7}>NEXRAD Level 3</option>
                <option value={3}>Universal Blue</option>
                <option value={1}>Black &amp; White</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                soundFX.click();
                if (radarMetadata && radarMetadata.radar.past.length) {
                  setRadarFrameIndex(
                    (prev) => (prev - 1 + radarMetadata.radar.past.length) % radarMetadata.radar.past.length
                  );
                }
              }}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 transition-colors"
              title="Previous Frame"
            >
              ◀
            </button>

            <button
              onClick={() => {
                soundFX.click();
                setIsRadarPlaying(!isRadarPlaying);
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-semibold transition-colors shadow-xs"
            >
              {isRadarPlaying ? <Pause size={12} /> : <Play size={12} />}
              <span>{isRadarPlaying ? 'Pause' : 'Loop Sweep'}</span>
            </button>

            <button
              onClick={() => {
                soundFX.click();
                if (radarMetadata && radarMetadata.radar.past.length) {
                  setRadarFrameIndex((prev) => (prev + 1) % radarMetadata.radar.past.length);
                }
              }}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 transition-colors"
              title="Next Frame"
            >
              ▶
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-400 ml-2 font-mono">
              <span className="font-sans">Opacity:</span>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={radarOpacity}
                onChange={(e) => setRadarOpacity(parseFloat(e.target.value))}
                className="w-18 accent-emerald-500"
              />
              <span className="tabular-nums">{Math.round(radarOpacity * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Point-and-Click Tactical Inspection HUD */}
      {inspectedLocation && (() => {
        const distKm = calculateDistanceKm(vehicleState.lat, vehicleState.lon, inspectedLocation.lat, inspectedLocation.lon);
        const distNm = (distKm * 0.539957).toFixed(1);
        const bearingDeg = calculateBearingDeg(vehicleState.lat, vehicleState.lon, inspectedLocation.lat, inspectedLocation.lon);
        const estTof = Math.round(distKm * 2.15);

        return (
          <div className="bg-[#090c15] border border-blue-500/40 rounded-xl p-4 font-sans shadow-2xl flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 backdrop-blur-md">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-xs">
                  <MapPin size={15} />
                  <span>INSPECTED COORDINATE:</span>
                </div>
                <span className="font-mono font-bold text-white text-xs tabular-nums">
                  {inspectedLocation.lat.toFixed(4)}°N, {inspectedLocation.lon.toFixed(4)}°E
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-950/60 text-blue-300 border border-blue-800/40 font-mono">
                  {formatToDMS(inspectedLocation.lat, true)} {formatToDMS(inspectedLocation.lon, false)}
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs font-mono text-emerald-400">
                  Range: <strong>{distKm.toFixed(1)} km</strong> ({distNm} NM)
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs font-mono text-amber-400">
                  Bearing: <strong>{bearingDeg}°</strong>
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs font-mono text-purple-300">
                  Est. TOF: <strong>{estTof} s</strong>
                </span>
              </div>

              {inspectedLocation.isLoadingWeather ? (
                <div className="text-xs text-slate-400 font-mono animate-pulse flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
                  Querying live atmospheric telemetry via Open-Meteo API...
                </div>
              ) : inspectedLocation.weatherReport ? (
                <div className="flex items-center gap-2.5 text-xs text-slate-300 flex-wrap font-mono">
                  <span className="text-amber-400">
                    🌤️ {inspectedLocation.weatherReport.temperatureC}°C (
                    {(inspectedLocation.weatherReport.temperatureC * 1.8 + 32).toFixed(1)}°F)
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-sky-400">
                    💨 {inspectedLocation.weatherReport.windSpeedKnots} kt @ {inspectedLocation.weatherReport.windDirectionDeg}°
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-emerald-400">
                    📊 {inspectedLocation.weatherReport.surfacePressureHpa} hPa
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-200 font-sans">
                    {inspectedLocation.weatherReport.weatherDescription}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2 flex-wrap self-stretch xl:self-auto">
              <button
                onClick={() => handleSetArtilleryTarget(inspectedLocation)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all shadow-md shadow-rose-950/40"
              >
                <Target size={13} />
                <span>Set as Strike Target</span>
              </button>

              <button
                onClick={() => handleRelocateAircraft(inspectedLocation)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md shadow-blue-950/40"
              >
                <Navigation size={13} />
                <span>Deploy Battery Here</span>
              </button>

              <button
                onClick={() => {
                  soundFX.click();
                  setWeatherStationFocus({
                    lat: inspectedLocation.lat,
                    lon: inspectedLocation.lon,
                    name: `Datum (${inspectedLocation.lat.toFixed(3)}°, ${inspectedLocation.lon.toFixed(3)}°)`,
                  });
                  setActiveViewTab('weather');
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0d121f] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 text-xs font-medium transition-colors"
                title="Inspect atmospheric report for this coordinate"
              >
                <CloudRain size={13} />
                <span>Weather Profile</span>
              </button>

              <button
                onClick={() => setInspectedLocation(null)}
                className="px-3 py-1.5 rounded-lg bg-[#0d121f] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-white text-xs font-mono transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        );
      })()}
        </>
      )}

      {/* DEDICATED WEATHER CENTER SECTION (Active in 'weather' or 'split' view) */}
      {(activeViewTab === 'weather' || activeViewTab === 'split') && (
        <TacticalWeatherStation
          initialLat={weatherStationFocus.lat}
          initialLon={weatherStationFocus.lon}
          initialName={weatherStationFocus.name}
          aircraftLat={vehicleState.lat}
          aircraftLon={vehicleState.lon}
          onFlyToLocation={(coords) => {
            soundFX.click();
            setFlyToTarget(coords);
            setActiveViewTab('map');
          }}
          onDeployAircraft={(coords) => {
            handleRelocateAircraft(coords);
            setActiveViewTab('map');
          }}
        />
      )}

      {/* Two Column Layout: Weather Station & Global Satellite Constellation Tracker */}
      <div className={`grid grid-cols-1 ${activeViewTab === 'weather' ? '' : 'lg:grid-cols-2'} gap-4`}>
        {/* LEFT COLUMN: Live Weather Station Telemetry (shown on Map view) */}
        {activeViewTab !== 'weather' && (
          <div className="bg-[#090c15] border border-white/[0.08] rounded-xl p-4 sm:p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <CloudRain size={16} className="text-blue-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Live Atmospheric &amp; Environmental Telemetry
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-blue-300 font-semibold font-mono">
                  {currentBaseLocation.name.split(' ')[0]}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-950/80 text-blue-300 border border-blue-800/60 font-mono font-medium">
                  {vehicleLiveWeather?.source === 'OPEN_METEO_LIVE' ? 'OPEN-METEO LIVE' : 'SYNOPTIC MODEL'}
                </span>
              </div>
            </div>

          {/* Meteorological Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-3 rounded-lg bg-[#0d121f] border border-white/[0.06]">
              <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 font-mono">
                <Thermometer size={12} className="text-amber-400" />
                Ambient Temp
              </div>
              <div className="text-xl font-bold text-amber-400 mt-1 font-mono tabular-nums">
                {vehicleLiveWeather ? vehicleLiveWeather.temperatureC : weather.ambientTemperatureC}°C
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                {(
                  (vehicleLiveWeather ? vehicleLiveWeather.temperatureC : weather.ambientTemperatureC) *
                    1.8 +
                  32
                ).toFixed(1)}
                °F · Dew: {weather.dewPointC}°C
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#0d121f] border border-white/[0.06]">
              <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 font-mono">
                <Wind size={12} className="text-sky-400" />
                Wind Velocity
              </div>
              <div className="text-xl font-bold text-white mt-1 font-mono tabular-nums">
                {vehicleLiveWeather ? vehicleLiveWeather.windSpeedKnots : weather.windSpeedKnots} kt
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                Hdg: {vehicleLiveWeather ? vehicleLiveWeather.windDirectionDeg : weather.windDirectionDeg}° · Gusts: {weather.windGustKnots} kt
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#0d121f] border border-white/[0.06]">
              <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 font-mono">
                <Gauge size={12} className="text-emerald-400" />
                Barometric Pressure
              </div>
              <div className="text-xl font-bold text-emerald-400 mt-1 font-mono tabular-nums">
                {vehicleLiveWeather ? vehicleLiveWeather.surfacePressureHpa : weather.barometricPressureHpa} hPa
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                {(
                  (vehicleLiveWeather
                    ? vehicleLiveWeather.surfacePressureHpa
                    : weather.barometricPressureHpa) * 0.02953
                ).toFixed(2)}{' '}
                inHg
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#0d121f] border border-white/[0.06]">
              <div className="text-[11px] text-slate-400 font-medium font-mono">
                Relative Humidity
              </div>
              <div className="text-lg font-bold text-slate-100 mt-1 font-mono tabular-nums">
                {vehicleLiveWeather ? vehicleLiveWeather.relativeHumidity : weather.relativeHumidity}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {weather.relativeHumidity > 60 ? 'Moist Layer' : 'Dry Mass'}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#0d121f] border border-white/[0.06]">
              <div className="text-[11px] text-slate-400 font-medium font-mono">
                Weather State
              </div>
              <div className="text-xs font-semibold text-blue-300 mt-1 truncate">
                {vehicleLiveWeather ? vehicleLiveWeather.weatherDescription : 'Atmospheric Stable'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                Precip: {vehicleLiveWeather ? vehicleLiveWeather.precipitationMm : 0} mm
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#0d121f] border border-white/[0.06]">
              <div className="text-[11px] text-slate-400 font-medium font-mono">
                Density Altitude
              </div>
              <div className="text-lg font-bold text-slate-100 mt-1 font-mono tabular-nums">
                {weather.densityAltitudeM} m
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                Freezing Lvl: {weather.freezingLevelM} m
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] text-slate-400 font-mono">
              Synoptic observations, 24-hr flight timeline &amp; 7-day forecast.
            </span>
            <button
              onClick={() => {
                soundFX.click();
                setWeatherStationFocus({
                  lat: currentBaseLocation.lat,
                  lon: currentBaseLocation.lon,
                  name: currentBaseLocation.name,
                });
                setActiveViewTab('weather');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-semibold transition-all shadow-xs"
            >
              <CloudRain size={12} />
              <span>Open Weather Center →</span>
            </button>
          </div>
        </div>
      )}

        {/* RIGHT COLUMN: Global Spacecraft & Satellite Constellation */}
        <div className="bg-[#090c15] border border-white/[0.08] rounded-xl p-4 sm:p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <Satellite size={16} className="text-blue-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Global Satellite &amp; Orbital Constellations
              </h2>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 font-semibold">
              {globalSatellites.length} ORBITAL OBJECTS
            </span>
          </div>

          {/* Satellite Constellation List */}
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
            {globalSatellites.map((sat) => (
              <div
                key={sat.id}
                onClick={() => {
                  soundFX.click();
                  setFlyToTarget({ lat: sat.lat, lon: sat.lon, zoom: 6 });
                }}
                className="p-2.5 rounded-lg bg-[#0d121f] hover:bg-white/[0.06] border border-white/[0.06] hover:border-blue-500/50 flex items-center justify-between text-xs cursor-pointer transition-all shadow-xs group"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: sat.color }}
                  ></span>
                  <div>
                    <div className="font-semibold text-slate-200 group-hover:text-blue-300 flex items-center gap-1.5">
                      <span>{sat.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-slate-400 border border-white/[0.06] font-mono">
                        {sat.constellation}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Alt: {sat.altitudeKm.toLocaleString()} km · Vel: {(sat.speedKmh / 3600).toFixed(1)} km/s
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs font-mono">
                  <div
                    className={
                      sat.isLineOfSight
                        ? 'text-emerald-400 font-semibold'
                        : 'text-slate-500'
                    }
                  >
                    El: {sat.elevationFromUserDeg}°
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 tabular-nums">
                    {sat.lat.toFixed(1)}°, {sat.lon.toFixed(1)}°
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Tap any satellite to center map directly on its subsatellite orbit.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
