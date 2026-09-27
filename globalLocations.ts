export interface GlobalLocation {
  id: string;
  name: string;
  category: 'Aerospace & Launch' | 'Global Metropolises' | 'Extreme Climates' | 'Aviation Hubs';
  country: string;
  lat: number;
  lon: number;
  zoom: number;
  elevationM: number;
  description: string;
}

export const GLOBAL_PRESETS: GlobalLocation[] = [
  // Aerospace & Launch Complexes
  {
    id: 'sriharikota',
    name: 'Sriharikota (SDSC SHAR)',
    category: 'Aerospace & Launch',
    country: 'India',
    lat: 13.725,
    lon: 80.228,
    zoom: 12,
    elevationM: 5,
    description: 'Satish Dhawan Space Centre launch complex and tracking corridor along the Bay of Bengal.',
  },
  {
    id: 'cape-canaveral',
    name: 'Cape Canaveral Space Force Station',
    category: 'Aerospace & Launch',
    country: 'United States',
    lat: 28.3922,
    lon: -80.6077,
    zoom: 12,
    elevationM: 3,
    description: 'Primary Atlantic launch range and Kennedy Space Center spaceport.',
  },
  {
    id: 'edwards-afb',
    name: 'Edwards Air Force Base (Flight Test Center)',
    category: 'Aerospace & Launch',
    country: 'United States',
    lat: 34.9054,
    lon: -117.8837,
    zoom: 12,
    elevationM: 702,
    description: 'Rogers Dry Lake aerospace flight dynamics test facility and supersonic corridor.',
  },
  {
    id: 'baikonur',
    name: 'Baikonur Cosmodrome',
    category: 'Aerospace & Launch',
    country: 'Kazakhstan',
    lat: 45.9646,
    lon: 63.3052,
    zoom: 12,
    elevationM: 100,
    description: 'Historic orbital spaceport in the arid central Asian steppe.',
  },
  {
    id: 'kourou',
    name: 'Guiana Space Centre (CSG Kourou)',
    category: 'Aerospace & Launch',
    country: 'French Guiana',
    lat: 5.239,
    lon: -52.768,
    zoom: 12,
    elevationM: 15,
    description: 'Equatorial spaceport maximizing Earth rotational velocity for geostationary orbits.',
  },
  {
    id: 'tanegashima',
    name: 'Tanegashima Space Center (JAXA)',
    category: 'Aerospace & Launch',
    country: 'Japan',
    lat: 30.375,
    lon: 130.958,
    zoom: 12,
    elevationM: 40,
    description: 'Scenic island orbital launch complex overlooking the Pacific Ocean.',
  },
  {
    id: 'woomera',
    name: 'Woomera Aerospace Proving Range',
    category: 'Aerospace & Launch',
    country: 'Australia',
    lat: -31.199,
    lon: 136.824,
    zoom: 11,
    elevationM: 165,
    description: 'Vast isolated inland desert aerospace and defense systems proving range.',
  },
  {
    id: 'bengaluru-aero',
    name: 'Bengaluru Aeronautical Research Center',
    category: 'Aerospace & Launch',
    country: 'India',
    lat: 12.955,
    lon: 77.685,
    zoom: 13,
    elevationM: 915,
    description: 'Major aviation development hub, HAL flight test airfield, and avionics laboratories.',
  },
  {
    id: 'pokhran-range',
    name: 'Pokhran Field Dynamics Range',
    category: 'Aerospace & Launch',
    country: 'India',
    lat: 27.025,
    lon: 71.75,
    zoom: 12,
    elevationM: 220,
    description: 'Arid desert proving grounds testing high convective updrafts and sensor thermal drift.',
  },

  // Extreme Environments
  {
    id: 'everest-leh',
    name: 'Leh-Ladakh High-Altitude Corridor',
    category: 'Extreme Climates',
    country: 'India',
    lat: 34.15,
    lon: 77.575,
    zoom: 12,
    elevationM: 3500,
    description: 'High-altitude Himalayan proving ground for thin-air avionics and sub-zero mechanics.',
  },
  {
    id: 'mount-everest',
    name: 'Mount Everest (Chomolungma)',
    category: 'Extreme Climates',
    country: 'Nepal / Tibet',
    lat: 27.9881,
    lon: 86.925,
    zoom: 12,
    elevationM: 8848,
    description: 'Highest peak on Earth with severe jet-stream winds and extreme low atmospheric density.',
  },
  {
    id: 'death-valley',
    name: 'Death Valley (Badwater Basin)',
    category: 'Extreme Climates',
    country: 'United States',
    lat: 36.2419,
    lon: -116.8258,
    zoom: 11,
    elevationM: -86,
    description: 'Lowest and hottest terrestrial depression in North America with severe thermal radiation.',
  },
  {
    id: 'antarctica-mcmurdo',
    name: 'McMurdo Station, Antarctica',
    category: 'Extreme Climates',
    country: 'Antarctica',
    lat: -77.846,
    lon: 166.668,
    zoom: 10,
    elevationM: 24,
    description: 'Polar research base under extreme polar vortex weather and auroral magnetic activity.',
  },
  {
    id: 'sahara-desert',
    name: 'Sahara Desert (Richat Structure / Eye of Sahara)',
    category: 'Extreme Climates',
    country: 'Mauritania',
    lat: 21.1269,
    lon: -11.4016,
    zoom: 11,
    elevationM: 400,
    description: 'Giant 40km circular geologic dome used as a landmark by astronauts and satellites.',
  },
  {
    id: 'reykjavik',
    name: 'Reykjavík Volcanic Rift Corridor',
    category: 'Extreme Climates',
    country: 'Iceland',
    lat: 64.1466,
    lon: -21.9426,
    zoom: 11,
    elevationM: 15,
    description: 'Sub-polar North Atlantic volcanic corridor with rapid maritime storm systems.',
  },

  // Global Metropolises & Aviation Hubs
  {
    id: 'tokyo',
    name: 'Tokyo Haneda International (RJTT)',
    category: 'Global Metropolises',
    country: 'Japan',
    lat: 35.5494,
    lon: 139.7798,
    zoom: 12,
    elevationM: 11,
    description: 'Major Pacific rim aviation gateway overlooking Tokyo Bay.',
  },
  {
    id: 'london-heathrow',
    name: 'London Heathrow (EGLL)',
    category: 'Global Metropolises',
    country: 'United Kingdom',
    lat: 51.47,
    lon: -0.4543,
    zoom: 12,
    elevationM: 25,
    description: 'High-density European terminal airspace with maritime temperate weather patterns.',
  },
  {
    id: 'new-york-jfk',
    name: 'New York JFK International',
    category: 'Global Metropolises',
    country: 'United States',
    lat: 40.6413,
    lon: -73.7781,
    zoom: 12,
    elevationM: 4,
    description: 'North Atlantic airspace gateway along Jamaica Bay.',
  },
  {
    id: 'dubai',
    name: 'Dubai International & Al Maktoum',
    category: 'Global Metropolises',
    country: 'United Arab Emirates',
    lat: 25.2532,
    lon: 55.3657,
    zoom: 12,
    elevationM: 19,
    description: 'Middle East crossroads corridor with high desert heat and coastal humidity inversion.',
  },
  {
    id: 'paris-cdg',
    name: 'Paris Charles de Gaulle (LFPG)',
    category: 'Global Metropolises',
    country: 'France',
    lat: 49.0097,
    lon: 2.5479,
    zoom: 12,
    elevationM: 119,
    description: 'Major continental European aviation transit hub.',
  },
  {
    id: 'delhi-igi',
    name: 'Delhi Indira Gandhi International (VIDP)',
    category: 'Global Metropolises',
    country: 'India',
    lat: 28.5562,
    lon: 77.1000,
    zoom: 12,
    elevationM: 237,
    description: 'Northern Indian airspace hub testing high seasonal fog and monsoon conditions.',
  },
  {
    id: 'singapore-changi',
    name: 'Singapore Changi (WSSS)',
    category: 'Global Metropolises',
    country: 'Singapore',
    lat: 1.3644,
    lon: 103.9915,
    zoom: 12,
    elevationM: 7,
    description: 'Equatorial maritime transit corridor with frequent tropical convective storm cells.',
  },
  {
    id: 'sydney-kingsford',
    name: 'Sydney Kingsford Smith (YSSY)',
    category: 'Global Metropolises',
    country: 'Australia',
    lat: -33.9399,
    lon: 151.1753,
    zoom: 12,
    elevationM: 6,
    description: 'Southern hemisphere coastal gateway along Botany Bay.',
  },
  {
    id: 'san-francisco',
    name: 'San Francisco Bay (KSFO)',
    category: 'Global Metropolises',
    country: 'United States',
    lat: 37.6213,
    lon: -122.379,
    zoom: 12,
    elevationM: 4,
    description: 'Pacific marine boundary layer with microclimate fog and crosswind shear.',
  },
];

/**
 * Searches presets or falls back to coordinate parsing.
 */
export function searchLocations(query: string): GlobalLocation[] {
  const q = query.trim().toLowerCase();
  if (!q) return GLOBAL_PRESETS.slice(0, 10);

  // Check if query is coordinates format "lat, lon" or "lat lon"
  const coordMatch = q.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lon = parseFloat(coordMatch[3]);
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return [
        {
          id: `custom-${lat}-${lon}`,
          name: `Coordinates (${lat.toFixed(4)}°, ${lon.toFixed(4)}°)`,
          category: 'Aviation Hubs',
          country: 'Custom Waypoint',
          lat,
          lon,
          zoom: 13,
          elevationM: 50,
          description: `Custom target coordinate: Latitude ${lat.toFixed(5)}°, Longitude ${lon.toFixed(5)}°.`,
        },
      ];
    }
  }

  return GLOBAL_PRESETS.filter(
    (loc) =>
      loc.name.toLowerCase().includes(q) ||
      loc.country.toLowerCase().includes(q) ||
      loc.category.toLowerCase().includes(q) ||
      loc.description.toLowerCase().includes(q)
  );
}

/**
 * Searches any city, island, territory, landmark, or military facility on Earth
 * using OpenStreetMap Nominatim free geocoding service.
 */
export async function searchGlobalGeocoding(query: string): Promise<GlobalLocation[]> {
  const localResults = searchLocations(query);
  const trimmed = query.trim();

  // If query is coordinates or empty, return immediately
  if (!trimmed || /^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/.test(trimmed)) {
    return localResults;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      trimmed
    )}&limit=6&addressdetails=1`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept-Language': 'en',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) return localResults;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return localResults;
    }

    interface NominatimItem {
      place_id: number;
      display_name: string;
      lat: string;
      lon: string;
      type?: string;
      address?: {
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        country?: string;
      };
    }

    const onlineResults: GlobalLocation[] = (data as NominatimItem[]).map((item) => {
      const lat = parseFloat(item.lat);
      const lon = parseFloat(item.lon);
      const addr = item.address || {};
      const cityName =
        addr.city || addr.town || addr.village || item.display_name.split(',')[0];
      const countryName = addr.country || 'Global';

      return {
        id: `geocoded-${item.place_id}`,
        name: cityName,
        category: 'Global Metropolises',
        country: countryName,
        lat,
        lon,
        zoom: 12,
        elevationM: 80,
        description: item.display_name,
      };
    });

    // Merge: Put exact local matches first, followed by online geocoding results (deduplicating by distance)
    const combined = [...localResults];
    onlineResults.forEach((online) => {
      const alreadyPresent = combined.some(
        (c) => Math.abs(c.lat - online.lat) < 0.1 && Math.abs(c.lon - online.lon) < 0.1
      );
      if (!alreadyPresent) {
        combined.push(online);
      }
    });

    return combined.slice(0, 10);
  } catch {
    return localResults;
  }
}
