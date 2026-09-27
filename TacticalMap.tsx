import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import {
  BaseMapStyle,
  WeatherTelemetry,
  Waypoint,
  TrajectoryPoint,
  MeasurementToolState,
  ArtilleryMissionState,
} from '../../types/geoMap';
import { GlobalSatellite } from '../../services/satelliteService';
import { LiveWeatherReport } from '../../services/weatherService';
import {
  calculateDistanceKm,
  calculateBearingDeg,
  calculateBallisticTrajectory,
  formatToDMS,
} from '../../utils/geodesy';
import { soundFX } from '../../utils/audioFeedback';

interface TacticalMapProps {
  vehicleState: {
    lat: number;
    lon: number;
    altitudeM: number;
    headingDeg: number;
    speedKnots: number;
    climbRateMps: number;
  };
  weather: WeatherTelemetry;
  liveWeatherReport: LiveWeatherReport | null;
  satellites: GlobalSatellite[];
  trajectory: TrajectoryPoint[];
  waypoints: Waypoint[];
  baseMapStyle: BaseMapStyle;
  radarPath?: string | null;
  radarTimestamp: number | null;
  radarOpacity: number;
  radarColorScheme?: number;
  showTemperatureOverlay: boolean;
  showWeatherRadar: boolean;
  showWindVectors: boolean;
  showSatelliteFootprints: boolean;
  showFlightTrail: boolean;
  showWaypoints: boolean;
  showRangeRings?: boolean;
  autoCenterVehicle: boolean;
  onMapClickCoords: (coords: { lat: number; lon: number }) => void;
  onRelocateVehicle?: (coords: { lat: number; lon: number }) => void;
  onSetArtilleryTarget?: (coords: { lat: number; lon: number }) => void;
  flyToTarget: { lat: number; lon: number; zoom: number } | null;
  measurementState?: MeasurementToolState;
  onUpdateMeasurement?: (state: MeasurementToolState) => void;
  artilleryMission?: ArtilleryMissionState | null;
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  vehicleState,
  weather,
  liveWeatherReport,
  satellites,
  trajectory,
  waypoints,
  baseMapStyle,
  radarPath,
  radarTimestamp,
  radarOpacity,
  radarColorScheme = 4,
  showTemperatureOverlay,
  showWeatherRadar,
  showWindVectors,
  showSatelliteFootprints,
  showFlightTrail,
  showWaypoints,
  showRangeRings = true,
  autoCenterVehicle,
  onMapClickCoords,
  onRelocateVehicle,
  onSetArtilleryTarget,
  flyToTarget,
  measurementState,
  onUpdateMeasurement,
  artilleryMission,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Layer groups refs
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const radarTileLayerRef = useRef<L.TileLayer | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const trajectoryPolylineRef = useRef<L.Polyline | null>(null);
  const waypointsLayerRef = useRef<L.LayerGroup | null>(null);
  const thermalOverlayLayerRef = useRef<L.LayerGroup | null>(null);
  const windOverlayLayerRef = useRef<L.LayerGroup | null>(null);
  const satelliteFootprintsLayerRef = useRef<L.LayerGroup | null>(null);
  const inspectMarkerRef = useRef<L.Marker | null>(null);
  const rangeRingsLayerRef = useRef<L.LayerGroup | null>(null);
  const measurementLayerRef = useRef<L.LayerGroup | null>(null);
  const artilleryArcLayerRef = useRef<L.LayerGroup | null>(null);

  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [mapZoom, setMapZoom] = useState<number>(12);

  // Initialize Map Once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialCenter: [number, number] = [vehicleState.lat, vehicleState.lon];
    // Map configuration
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 12,
      minZoom: 2,
      maxZoom: 22,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: true,
    });

    // Track zoom and mouse coordinates
    map.on('zoomend', () => {
      setMapZoom(map.getZoom());
    });

    map.on('mousemove', (e) => {
      setMouseCoords({
        lat: Number(e.latlng.lat.toFixed(5)),
        lon: Number(e.latlng.lng.toFixed(5)),
      });
    });

    // Initialize layer groups
    waypointsLayerRef.current = L.layerGroup().addTo(map);
    thermalOverlayLayerRef.current = L.layerGroup().addTo(map);
    windOverlayLayerRef.current = L.layerGroup().addTo(map);
    satelliteFootprintsLayerRef.current = L.layerGroup().addTo(map);
    rangeRingsLayerRef.current = L.layerGroup().addTo(map);
    measurementLayerRef.current = L.layerGroup().addTo(map);
    artilleryArcLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle map clicks (incorporating Measurement Tool and Inspection)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const handleClick = (e: L.LeafletMouseEvent) => {
      const lat = Number(e.latlng.lat.toFixed(5));
      const lon = Number(e.latlng.lng.toFixed(5));

      // Handle Measurement Ruler Tool
      if (measurementState?.active && onUpdateMeasurement) {
        if (!measurementState.pointA) {
          onUpdateMeasurement({
            active: true,
            pointA: { lat, lon },
            pointB: null,
            distanceKm: 0,
            distanceNm: 0,
            bearingDeg: 0,
          });
        } else if (!measurementState.pointB) {
          const distKm = calculateDistanceKm(
            measurementState.pointA.lat,
            measurementState.pointA.lon,
            lat,
            lon
          );
          const bearing = calculateBearingDeg(
            measurementState.pointA.lat,
            measurementState.pointA.lon,
            lat,
            lon
          );
          onUpdateMeasurement({
            active: true,
            pointA: measurementState.pointA,
            pointB: { lat, lon },
            distanceKm: distKm,
            distanceNm: Number((distKm * 0.539957).toFixed(2)),
            bearingDeg: bearing,
          });
        } else {
          // Reset to new Point A
          onUpdateMeasurement({
            active: true,
            pointA: { lat, lon },
            pointB: null,
            distanceKm: 0,
            distanceNm: 0,
            bearingDeg: 0,
          });
        }
        return;
      }

      // Default Inspection click
      onMapClickCoords({ lat, lon });

      // Inspection Pin with Quick Action Popup
      if (inspectMarkerRef.current) {
        inspectMarkerRef.current.setLatLng([lat, lon]);
      } else {
        const pinIcon = L.divIcon({
          html: `
            <div style="
              width: 24px;
              height: 24px;
              border: 2px solid #38bdf8;
              border-radius: 50%;
              background: rgba(56, 189, 248, 0.35);
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 0 12px #38bdf8;
              animation: pulse 1.8s infinite;
            ">
              <div style="width: 7px; height: 7px; border-radius: 50%; background: #ffffff;"></div>
            </div>
          `,
          className: 'inspect-pin-icon',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        inspectMarkerRef.current = L.marker([lat, lon], { icon: pinIcon }).addTo(map);
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [measurementState, onUpdateMeasurement, onMapClickCoords]);

  // Handle external FlyTo targets (when user clicks a city, preset, or search result)
  useEffect(() => {
    if (!mapRef.current || !flyToTarget) return;
    mapRef.current.flyTo([flyToTarget.lat, flyToTarget.lon], flyToTarget.zoom, {
      duration: 1.8,
      easeLinearity: 0.25,
    });
  }, [flyToTarget]);

  // Handle Base Map Tile Style Changes
  useEffect(() => {
    if (!mapRef.current) return;

    if (baseTileLayerRef.current) {
      mapRef.current.removeLayer(baseTileLayerRef.current);
    }

    let tileUrl = '';
    let maxZoom = 22;
    let maxNativeZoom = 19;
    let subdomains: string[] | undefined = undefined;

    switch (baseMapStyle) {
      case 'satellite':
        // Google Hybrid Satellite (Photographic imagery + crisp roads and borders)
        tileUrl = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
        maxNativeZoom = 20;
        maxZoom = 22;
        break;
      case 'satellite_esri':
        // Esri High-Resolution World Imagery
        // CRITICAL FIX: Esri native tiles stop at level 17 in remote/desert test ranges.
        // Setting maxNativeZoom: 17 allows seamless CSS upscaling all the way to 22 without ANY "Zoom level not supported" tile error!
        tileUrl = 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        maxNativeZoom = 17;
        maxZoom = 22;
        break;
      case 'dark':
        // CartoDB Dark Matter for tactical night/avionics look
        tileUrl = 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
        subdomains = ['a', 'b', 'c', 'd'];
        maxNativeZoom = 19;
        maxZoom = 22;
        break;
      case 'positron':
        // CartoDB Positron for clean daytime contrast
        tileUrl = 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
        subdomains = ['a', 'b', 'c', 'd'];
        maxNativeZoom = 19;
        maxZoom = 22;
        break;
      case 'topo':
        // OpenTopoMap with contour elevation lines
        tileUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
        subdomains = ['a', 'b', 'c'];
        maxNativeZoom = 17;
        maxZoom = 22;
        break;
      case 'night_lights':
        // NASA Earth at Night / City Lights (only level 8 native)
        tileUrl = 'https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default//GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg';
        maxNativeZoom = 8;
        maxZoom = 22;
        break;
      case 'streets':
      default:
        // OpenStreetMap Standard
        tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
        maxNativeZoom = 19;
        maxZoom = 22;
        break;
    }

    const newTile = L.tileLayer(tileUrl, {
      maxZoom,
      maxNativeZoom,
      subdomains: subdomains || 'abc',
      crossOrigin: true,
      keepBuffer: 4,
      updateWhenIdle: false,
      updateWhenZooming: true,
    }).addTo(mapRef.current);

    baseTileLayerRef.current = newTile;
    newTile.bringToBack();
  }, [baseMapStyle]);

  // Handle Live RainViewer Global Weather Radar Layer
  useEffect(() => {
    if (!mapRef.current) return;

    if (radarTileLayerRef.current) {
      mapRef.current.removeLayer(radarTileLayerRef.current);
      radarTileLayerRef.current = null;
    }

    if (!showWeatherRadar || (!radarTimestamp && !radarPath)) return;

    // Build URL using path if available, or timestamp
    let radarUrl = '';
    if (radarPath) {
      radarUrl = `https://tilecache.rainviewer.com${radarPath}/256/{z}/{x}/{y}/${radarColorScheme}/1_1.png`;
    } else if (radarTimestamp) {
      radarUrl = `https://tilecache.rainviewer.com/v2/radar/${radarTimestamp}/256/{z}/{x}/{y}/${radarColorScheme}/1_1.png`;
    }

    if (!radarUrl) return;

    const radarTile = L.tileLayer(radarUrl, {
      opacity: radarOpacity,
      zIndex: 10,
      maxNativeZoom: 12,
      maxZoom: 22,
    }).addTo(mapRef.current);

    radarTileLayerRef.current = radarTile;
  }, [showWeatherRadar, radarTimestamp, radarPath, radarOpacity, radarColorScheme]);

  // Handle Vehicle Marker & Real-Time Position/Heading
  useEffect(() => {
    if (!mapRef.current) return;

    const latLng: [number, number] = [vehicleState.lat, vehicleState.lon];

    const isHealthGood = weather.ambientTemperatureC < 60;
    const pulseColor = isHealthGood ? '#3b82f6' : '#f43f5e';

    const aircraftHtml = `
      <div style="position: relative; width: 46px; height: 46px; display: flex; align-items: center; justify-content: center;">
        <!-- Pulsing radar ring -->
        <div style="
          position: absolute;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid ${pulseColor};
          background: rgba(59, 130, 246, 0.15);
          animation: ping 2.2s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <!-- Rotated aircraft glyph -->
        <div style="
          transform: rotate(${vehicleState.headingDeg}deg);
          transition: transform 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${pulseColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 6px rgba(0,0,0,0.9));">
            <path d="M12 2v20M2 12h20M12 2l-7 10h14L12 2z" fill="#2563eb" fill-opacity="0.9"/>
          </svg>
        </div>
        <!-- Tooltip Badge -->
        <div style="
          position: absolute;
          bottom: -18px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(11, 15, 25, 0.95);
          border: 1px solid rgba(59, 130, 246, 0.4);
          color: #f8fafc;
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 600;
          padding: 2px 5px;
          border-radius: 4px;
          white-space: nowrap;
          box-shadow: 0 4px 10px rgba(0,0,0,0.7);
        ">
          ${vehicleState.speedKnots}kt · ${vehicleState.altitudeM}m
        </div>
      </div>
    `;

    const customIcon = L.divIcon({
      html: aircraftHtml,
      className: 'vehicle-marker-icon',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.setLatLng(latLng);
      vehicleMarkerRef.current.setIcon(customIcon);
    } else {
      vehicleMarkerRef.current = L.marker(latLng, { icon: customIcon, zIndexOffset: 1000 }).addTo(
        mapRef.current
      );
    }

    // Auto-center camera if following mode is enabled
    if (autoCenterVehicle) {
      mapRef.current.panTo(latLng, { animate: true, duration: 0.5 });
    }
  }, [
    vehicleState.lat,
    vehicleState.lon,
    vehicleState.headingDeg,
    vehicleState.speedKnots,
    vehicleState.altitudeM,
    weather.ambientTemperatureC,
    autoCenterVehicle,
  ]);

  // Handle Flight Trail Trajectory Line
  useEffect(() => {
    if (!mapRef.current) return;

    if (trajectoryPolylineRef.current) {
      mapRef.current.removeLayer(trajectoryPolylineRef.current);
      trajectoryPolylineRef.current = null;
    }

    if (!showFlightTrail || trajectory.length === 0) return;

    const latLngs: [number, number][] = trajectory.map((p) => [p.lat, p.lon]);

    const polyline = L.polyline(latLngs, {
      color: '#06b6d4',
      weight: 3,
      opacity: 0.8,
      dashArray: '5, 8',
      lineCap: 'round',
    }).addTo(mapRef.current);

    trajectoryPolylineRef.current = polyline;
  }, [trajectory, showFlightTrail]);

  // Handle Tactical Range Rings Overlay (15km, 40km, 70km)
  useEffect(() => {
    if (!rangeRingsLayerRef.current) return;
    rangeRingsLayerRef.current.clearLayers();

    if (!showRangeRings) return;

    const center: [number, number] = [vehicleState.lat, vehicleState.lon];

    // 1. 15 km Standard Artillery Range Ring
    const circle15 = L.circle(center, {
      radius: 15000,
      color: '#10b981',
      weight: 1.5,
      dashArray: '6, 6',
      fillColor: '#10b981',
      fillOpacity: 0.03,
    });
    circle15.bindTooltip('15 km Standard Artillery Range', {
      permanent: false,
      direction: 'right',
      className: 'font-mono text-[9px] text-emerald-400 bg-slate-950',
    });
    rangeRingsLayerRef.current.addLayer(circle15);

    // 2. 40 km Extended Range Base-Bleed Ring
    const circle40 = L.circle(center, {
      radius: 40000,
      color: '#f59e0b',
      weight: 1.5,
      dashArray: '8, 8',
      fillColor: '#f59e0b',
      fillOpacity: 0.02,
    });
    circle40.bindTooltip('40 km Base-Bleed Extended Range (ERGM)', {
      permanent: false,
      direction: 'right',
      className: 'font-mono text-[9px] text-amber-400 bg-slate-950',
    });
    rangeRingsLayerRef.current.addLayer(circle40);

    // 3. 70 km Rocket-Assisted Projectile (RAP) / Guided Missile Ring
    const circle70 = L.circle(center, {
      radius: 70000,
      color: '#f43f5e',
      weight: 1.8,
      dashArray: '10, 8',
      fillColor: '#f43f5e',
      fillOpacity: 0.015,
    });
    circle70.bindTooltip('70 km Guided Rocket-Assisted Strike Perimeter', {
      permanent: false,
      direction: 'right',
      className: 'font-mono text-[9px] text-rose-400 bg-slate-950',
    });
    rangeRingsLayerRef.current.addLayer(circle70);
  }, [vehicleState.lat, vehicleState.lon, showRangeRings]);

  // Handle Measurement Ruler Tool Visualization
  useEffect(() => {
    if (!measurementLayerRef.current) return;
    measurementLayerRef.current.clearLayers();

    if (!measurementState?.active) return;

    const { pointA, pointB, distanceKm, distanceNm, bearingDeg } = measurementState;

    if (pointA) {
      const markerA = L.marker([pointA.lat, pointA.lon], {
        icon: L.divIcon({
          html: `<div style="background:#0284c7;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;border:2px solid #fff;">A</div>`,
          className: 'ruler-point-a',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }),
      });
      measurementLayerRef.current.addLayer(markerA);
    }

    if (pointA && pointB) {
      const markerB = L.marker([pointB.lat, pointB.lon], {
        icon: L.divIcon({
          html: `<div style="background:#e11d48;color:#fff;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;border:2px solid #fff;">B</div>`,
          className: 'ruler-point-b',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }),
      });
      measurementLayerRef.current.addLayer(markerB);

      // Measurement line
      const line = L.polyline(
        [
          [pointA.lat, pointA.lon],
          [pointB.lat, pointB.lon],
        ],
        {
          color: '#facc15',
          weight: 3,
          dashArray: '6, 6',
        }
      );

      // Midpoint badge
      const midLat = (pointA.lat + pointB.lat) / 2;
      const midLon = (pointA.lon + pointB.lon) / 2;
      const badgeIcon = L.divIcon({
        html: `
          <div style="background:#090d16;border:1px solid #facc15;color:#facc15;padding:3px 6px;border-radius:4px;font-family:monospace;font-size:10px;white-space:nowrap;box-shadow:0 0 10px rgba(0,0,0,0.8);font-weight:bold;">
            📏 ${distanceKm} km (${distanceNm} NM) · ${bearingDeg}°
          </div>
        `,
        className: 'ruler-badge',
        iconSize: [120, 24],
        iconAnchor: [60, 12],
      });
      const badgeMarker = L.marker([midLat, midLon], { icon: badgeIcon });

      measurementLayerRef.current.addLayer(line);
      measurementLayerRef.current.addLayer(badgeMarker);
    }
  }, [measurementState]);

  // Handle Artillery Ballistic Arc Overlay
  useEffect(() => {
    if (!artilleryArcLayerRef.current) return;
    artilleryArcLayerRef.current.clearLayers();

    if (!artilleryMission?.active) return;

    const {
      batteryLat,
      batteryLon,
      targetLat,
      targetLon,
      targetName,
      rangeKm,
      bearingDeg,
      apogeeM,
      tofSeconds,
      impactCepM,
    } = artilleryMission;

    // 1. Target Impact Crosshair Marker
    const targetIcon = L.divIcon({
      html: `
        <div style="position:relative;width:34px;height:34px;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;width:30px;height:30px;border-radius:50%;border:2px solid #ef4444;background:rgba(239,68,68,0.2);animation:ping 2s infinite;"></div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="2" x2="12" y2="22"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
          </svg>
        </div>
      `,
      className: 'target-crosshair-icon',
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    const targetMarker = L.marker([targetLat, targetLon], { icon: targetIcon });
    targetMarker.bindPopup(`
      <div style="font-family:monospace;font-size:11px;background:#090d16;color:#f8fafc;padding:6px;border-radius:4px;min-width:200px;">
        <strong style="color:#f43f5e;font-size:12px;">TARGET: ${targetName}</strong><br/>
        Range: <strong>${rangeKm} km</strong> · Azimuth: <strong>${bearingDeg}°</strong><br/>
        Apogee: <strong>${apogeeM.toLocaleString()} m</strong> · TOF: <strong>${tofSeconds} s</strong><br/>
        Target CEP: <strong>&lt; ${impactCepM} m (Laser Spot Locked)</strong>
      </div>
    `);
    artilleryArcLayerRef.current.addLayer(targetMarker);

    // 2. CEP Precision Ellipse
    const cepCircle = L.circle([targetLat, targetLon], {
      radius: Math.max(50, impactCepM * 20),
      color: '#ef4444',
      weight: 1.5,
      fillColor: '#ef4444',
      fillOpacity: 0.15,
    });
    artilleryArcLayerRef.current.addLayer(cepCircle);

    // 3. Ballistic Arc Flight Path
    const trajPoints = calculateBallisticTrajectory(batteryLat, batteryLon, targetLat, targetLon, 40);
    const arcLatLngs: [number, number][] = trajPoints.map((p) => [p.lat, p.lon]);

    const arcPolyline = L.polyline(arcLatLngs, {
      color: '#ef4444',
      weight: 3.5,
      dashArray: '8, 6',
      lineCap: 'round',
    });
    artilleryArcLayerRef.current.addLayer(arcPolyline);
  }, [artilleryMission]);

  // Handle Waypoints Layer
  useEffect(() => {
    if (!waypointsLayerRef.current) return;
    waypointsLayerRef.current.clearLayers();

    if (!showWaypoints) return;

    waypoints.forEach((wp) => {
      const getWpColor = (type: Waypoint['type']) => {
        switch (type) {
          case 'TAKEOFF':
            return '#10b981';
          case 'CHECKPOINT':
            return '#38bdf8';
          case 'GROUND_STATION':
            return '#f59e0b';
          case 'TARGET_RANGE':
            return '#f43f5e';
          case 'PERIMETER':
            return '#a855f7';
          default:
            return '#94a3b8';
        }
      };

      const wpColor = getWpColor(wp.type);

      const wpIcon = L.divIcon({
        html: `
          <div style="
            background: #090d16;
            border: 1.5px solid ${wpColor};
            color: ${wpColor};
            font-size: 10px;
            font-family: monospace;
            font-weight: bold;
            padding: 2px 5px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            gap: 4px;
            box-shadow: 0 0 6px ${wpColor}55;
            white-space: nowrap;
          ">
            <span>●</span>
            <span>${wp.name}</span>
          </div>
        `,
        className: 'custom-wp-icon',
        iconSize: [80, 22],
        iconAnchor: [40, 11],
      });

      const marker = L.marker([wp.lat, wp.lon], { icon: wpIcon });
      marker.bindPopup(`
        <div style="font-family: monospace; font-size: 11px; color: #f1f5f9; background: #090d16; padding: 6px; border-radius: 4px;">
          <strong style="color: ${wpColor}; font-size: 12px;">${wp.name}</strong><br/>
          Type: ${wp.type}<br/>
          Altitude: ${wp.altitudeM} m<br/>
          Coordinates: ${wp.lat.toFixed(4)}°, ${wp.lon.toFixed(4)}°<br/>
          ${wp.description ? `<p style="margin-top: 4px; color: #94a3b8;">${wp.description}</p>` : ''}
        </div>
      `);
      waypointsLayerRef.current?.addLayer(marker);
    });
  }, [waypoints, showWaypoints]);

  // Handle Thermal Isotherm Overlay
  useEffect(() => {
    if (!thermalOverlayLayerRef.current) return;
    thermalOverlayLayerRef.current.clearLayers();

    if (!showTemperatureOverlay || !mapRef.current) return;

    const center: [number, number] = [vehicleState.lat, vehicleState.lon];
    const temp = weather.ambientTemperatureC;

    const getTempColor = (t: number) => {
      if (t < 0) return '#3b82f6';
      if (t < 15) return '#06b6d4';
      if (t < 30) return '#10b981';
      if (t < 45) return '#f59e0b';
      return '#ef4444';
    };

    const c1 = L.circle(center, {
      radius: 8000,
      color: getTempColor(temp),
      weight: 1,
      fillColor: getTempColor(temp),
      fillOpacity: 0.12,
    });
    c1.bindTooltip(`${temp.toFixed(1)}°C (Primary Ambient)`, {
      permanent: false,
      direction: 'top',
      className: 'font-mono text-[9px]',
    });

    const c2 = L.circle(center, {
      radius: 18000,
      color: getTempColor(temp - 1.5),
      weight: 1,
      dashArray: '4, 4',
      fillColor: getTempColor(temp - 1.5),
      fillOpacity: 0.06,
    });

    thermalOverlayLayerRef.current.addLayer(c1);
    thermalOverlayLayerRef.current.addLayer(c2);
  }, [vehicleState.lat, vehicleState.lon, weather.ambientTemperatureC, showTemperatureOverlay]);

  // Handle Wind Vector Grid Overlay
  useEffect(() => {
    if (!windOverlayLayerRef.current) return;
    windOverlayLayerRef.current.clearLayers();

    if (!showWindVectors || !mapRef.current) return;

    const baseLat = vehicleState.lat;
    const baseLon = vehicleState.lon;
    const windSpeed = weather.windSpeedKnots;
    const windDeg = weather.windDirectionDeg;

    const offsets = [-0.08, -0.03, 0.03, 0.08];

    offsets.forEach((dLat) => {
      offsets.forEach((dLon) => {
        const ptLat = baseLat + dLat;
        const ptLon = baseLon + dLon;

        const arrowIcon = L.divIcon({
          html: `
            <div style="
              display: flex;
              align-items: center;
              justify-content: center;
              transform: rotate(${windDeg}deg);
              opacity: 0.85;
            ">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7"/>
              </svg>
            </div>
          `,
          className: 'wind-arrow-icon',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const marker = L.marker([ptLat, ptLon], { icon: arrowIcon });
        marker.bindTooltip(`${windSpeed} kt @ ${windDeg}°`, {
          permanent: false,
          direction: 'top',
          className: 'font-mono text-[9px]',
        });
        windOverlayLayerRef.current?.addLayer(marker);
      });
    });
  }, [vehicleState.lat, vehicleState.lon, weather.windSpeedKnots, weather.windDirectionDeg, showWindVectors]);

  // Handle Global Satellite Constellations
  useEffect(() => {
    if (!satelliteFootprintsLayerRef.current) return;
    satelliteFootprintsLayerRef.current.clearLayers();

    if (!showSatelliteFootprints) return;

    satellites.forEach((sat) => {
      const satIcon = L.divIcon({
        html: `
          <div style="
            background: #090d16;
            border: 1.5px solid ${sat.color};
            color: ${sat.color};
            font-size: 10px;
            font-family: monospace;
            font-weight: bold;
            padding: 2px 5px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            gap: 4px;
            box-shadow: 0 0 8px ${sat.color}66;
            white-space: nowrap;
          ">
            🛰️ <span>${sat.name.split(' ')[0]}</span>
          </div>
        `,
        className: 'satellite-icon',
        iconSize: [85, 24],
        iconAnchor: [42, 12],
      });

      const marker = L.marker([sat.lat, sat.lon], { icon: satIcon });
      marker.bindPopup(`
        <div style="font-family: monospace; font-size: 11px; color: #f1f5f9; background: #090d16; padding: 6px; border-radius: 4px; min-width: 220px;">
          <strong style="color: ${sat.color}; font-size: 12px;">${sat.name}</strong><br/>
          Constellation: ${sat.constellation} (NORAD #${sat.noradCatId})<br/>
          Elevation from Aircraft: ${sat.elevationFromUserDeg}° (${sat.isLineOfSight ? 'IN LINE OF SIGHT' : 'BELOW HORIZON'})<br/>
          Subsatellite Coordinates: ${sat.lat.toFixed(2)}°, ${sat.lon.toFixed(2)}°<br/>
          Altitude: ${sat.altitudeKm.toLocaleString()} km · Range: ${sat.slantRangeKm.toLocaleString()} km
        </div>
      `);
      satelliteFootprintsLayerRef.current?.addLayer(marker);
    });
  }, [satellites, showSatelliteFootprints]);

  return (
    <div className="relative w-full h-[650px] rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl bg-[#06090e] font-sans">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Tactical Coordinate & Crosshair HUD */}
      <div className="absolute top-3.5 left-3.5 z-[400] flex flex-col gap-2 pointer-events-none">
        <div className="bg-[#090c15]/95 border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-slate-200 backdrop-blur-md shadow-2xl flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            <span className="font-semibold text-white font-mono tabular-nums">
              {mouseCoords ? `${mouseCoords.lat.toFixed(4)}°, ${mouseCoords.lon.toFixed(4)}°` : `${vehicleState.lat.toFixed(4)}°, ${vehicleState.lon.toFixed(4)}°`}
            </span>
          </div>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400 font-mono text-[11px]">
            {mouseCoords ? `${formatToDMS(mouseCoords.lat, true)} ${formatToDMS(mouseCoords.lon, false)}` : 'GNSS LOCKED'}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-blue-400 font-mono text-[11px] font-semibold">
            ZOOM {mapZoom}x ({mapZoom <= 5 ? 'GLOBAL' : mapZoom <= 9 ? 'THEATER' : mapZoom <= 14 ? 'TACTICAL' : 'PINPOINT'})
          </span>
        </div>

        {/* Live Weather Status Badge for Vehicle */}
        {liveWeatherReport && (
          <div className="bg-[#090c15]/95 border border-white/[0.08] rounded-xl px-3.5 py-1.5 text-[11px] text-slate-300 backdrop-blur-md shadow-2xl flex items-center gap-2.5">
            <span className="text-amber-400">🌤️</span>
            <span className="font-bold text-white font-mono tabular-nums">{liveWeatherReport.temperatureC}°C</span>
            <span className="text-slate-600">·</span>
            <span className="font-mono">{liveWeatherReport.windSpeedKnots} kt wind</span>
            <span className="text-slate-600">·</span>
            <span className="font-mono">{liveWeatherReport.surfacePressureHpa} hPa</span>
            <span className="text-slate-600">·</span>
            <span className="text-emerald-400 font-medium">{liveWeatherReport.weatherDescription}</span>
          </div>
        )}
      </div>

      {/* Floating Tactical Zoom & Recenter Control Palette (Top Right) */}
      <div className="absolute top-3.5 right-3.5 z-[400] flex items-center gap-2">
        {/* Quick Zoom Presets */}
        <div className="bg-[#090c15]/95 border border-white/[0.08] rounded-xl p-1 text-[11px] font-mono flex items-center gap-1 shadow-2xl backdrop-blur-md">
          <button
            onClick={() => {
              soundFX.click();
              mapRef.current?.setZoom(4);
            }}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              mapZoom <= 5 ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
            title="Global Planetary Overview (4x)"
          >
            Globe
          </button>
          <button
            onClick={() => {
              soundFX.click();
              mapRef.current?.setZoom(8);
            }}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              mapZoom > 5 && mapZoom <= 10 ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
            title="Regional Operational Sector (8x)"
          >
            Sector
          </button>
          <button
            onClick={() => {
              soundFX.click();
              mapRef.current?.setZoom(13);
            }}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              mapZoom > 10 && mapZoom <= 15 ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
            title="Artillery Range & Launch Perimeter (13x)"
          >
            Range
          </button>
          <button
            onClick={() => {
              soundFX.click();
              mapRef.current?.setZoom(18);
            }}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              mapZoom > 15 ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
            title="High-Resolution Target Terminal Pinpoint (18x)"
          >
            Pinpoint
          </button>
        </div>

        {/* Zoom In & Out Step Buttons */}
        <div className="bg-[#090c15]/95 border border-white/[0.08] rounded-xl p-1 flex items-center gap-1 shadow-2xl backdrop-blur-md">
          <button
            onClick={() => {
              soundFX.click();
              mapRef.current?.zoomIn();
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.08] font-bold text-sm transition-colors"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => {
              soundFX.click();
              mapRef.current?.zoomOut();
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.08] font-bold text-sm transition-colors"
            title="Zoom Out"
          >
            −
          </button>
        </div>

        {/* Center on Vehicle / Launch Battery */}
        <button
          onClick={() => {
            soundFX.click();
            mapRef.current?.flyTo([vehicleState.lat, vehicleState.lon], Math.max(13, mapZoom), {
              duration: 1.2,
            });
          }}
          className="bg-[#090c15]/95 border border-white/[0.08] hover:border-blue-500/50 hover:bg-blue-600/10 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 shadow-2xl backdrop-blur-md transition-all"
          title="Center view on vehicle or firing battery"
        >
          <span>🎯</span>
          <span className="hidden sm:inline">Center</span>
        </button>
      </div>

      {/* Tactical Canvas Telemetry Status Badge (Bottom Right) */}
      <div className="absolute bottom-3.5 right-3.5 z-[400] flex items-center gap-2 pointer-events-none">
        <div className="bg-[#090c15]/95 border border-white/[0.08] rounded-xl px-3 py-1.5 text-[11px] font-mono text-slate-300 backdrop-blur-md shadow-2xl flex items-center gap-2.5">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-white font-semibold">ALT {vehicleState.altitudeM.toLocaleString()} m</span>
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-300">SPD {vehicleState.speedKnots} kt</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-300">HDG {vehicleState.headingDeg}°</span>
          <span className="text-slate-600">·</span>
          <span className="text-blue-400 font-semibold hidden md:inline">CLICK MAP TO DESIGNATE</span>
        </div>
      </div>

      {/* Measurement Tool Active Banner */}
      {measurementState?.active && (
        <div className="absolute bottom-3.5 left-3.5 z-[400] bg-[#090c15]/95 border border-amber-500/70 rounded-xl px-4 py-2 text-xs text-amber-200 shadow-2xl backdrop-blur-md flex items-center gap-2.5">
          <span className="font-bold uppercase tracking-wider text-[11px] font-mono">Ruler Active:</span>
          <span className="font-mono">
            {!measurementState.pointA
              ? 'Click map to place Point A'
              : !measurementState.pointB
              ? 'Click map to place Point B'
              : `${measurementState.distanceKm} km (${measurementState.distanceNm} NM) · ${measurementState.bearingDeg}° Azimuth`}
          </span>
        </div>
      )}
    </div>
  );
};
