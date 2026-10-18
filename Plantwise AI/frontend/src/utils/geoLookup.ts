import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point as turfPoint } from '@turf/helpers';
import { MAHARASHTRA_DISTRICTS, MaharashtraDistrict } from '../data/maharashtraDistricts';

export interface GeoJSONGeometry {
  type: string;
  coordinates: any;
}

export interface GeoJSONFeature {
  type: 'Feature';
  properties: Record<string, any>;
  geometry: GeoJSONGeometry;
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export interface DistrictLookupResult {
  district: string | null;
  division: string | null;
  isInsideMaharashtra: boolean;
  districtData: MaharashtraDistrict | null;
  granularityLabel: string;
  feature?: GeoJSONFeature;
}

// In-memory GeoJSON cache
let cachedGeoJSON: GeoJSONFeatureCollection | null = null;
let loadPromise: Promise<GeoJSONFeatureCollection> | null = null;

/**
 * Standard Ray-casting point-in-polygon algorithm as a fast in-memory fallback
 */
function rayCastPointInPolygon(lon: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  const n = ring.length;
  if (n < 3) return false;
  let p1x = ring[0][0];
  let p1y = ring[0][1];
  for (let i = 0; i <= n; i++) {
    const p2 = ring[i % n];
    const p2x = p2[0];
    const p2y = p2[1];
    if (lat > Math.min(p1y, p2y)) {
      if (lat <= Math.max(p1y, p2y)) {
        if (lon <= Math.max(p1x, p2x)) {
          let xinters = lon;
          if (p1y !== p2y) {
            xinters = ((lat - p1y) * (p2x - p1x)) / (p2y - p1y) + p1x;
          }
          if (p1x === p2x || lon <= xinters) {
            inside = !inside;
          }
        }
      }
    }
    p1x = p2x;
    p1y = p2y;
  }
  return inside;
}

/**
 * Loads /data/maharashtra_districts.geojson once into memory at startup
 */
export async function loadMaharashtraDistrictsGeoJSON(): Promise<GeoJSONFeatureCollection> {
  if (cachedGeoJSON) {
    return cachedGeoJSON;
  }
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    try {
      const res = await fetch('/data/maharashtra_districts.geojson');
      if (!res.ok) {
        throw new Error(`Failed to load geojson: ${res.statusText}`);
      }
      const data = (await res.json()) as GeoJSONFeatureCollection;
      cachedGeoJSON = data;
      return data;
    } catch (err) {
      console.error('Error loading /data/maharashtra_districts.geojson:', err);
      // Fallback empty collection
      const empty: GeoJSONFeatureCollection = {
        type: 'FeatureCollection',
        features: []
      };
      cachedGeoJSON = empty;
      return empty;
    }
  })();

  return loadPromise;
}

/**
 * Synchronous in-memory point-in-polygon lookup
 */
export function lookupDistrictSync(
  lat: number,
  lng: number,
  geoJSONCollection?: GeoJSONFeatureCollection | null
): DistrictLookupResult {
  const geojson = geoJSONCollection || cachedGeoJSON;

  if (!geojson || !geojson.features || geojson.features.length === 0) {
    // If geojson not loaded yet, find nearest district centroid
    return {
      district: null,
      division: null,
      isInsideMaharashtra: false,
      districtData: null,
      granularityLabel: 'Loading regional boundary data...'
    };
  }

  const pt = turfPoint([lng, lat]);

  for (const feature of geojson.features) {
    let isInside = false;

    try {
      // Use Turf.js booleanPointInPolygon
      isInside = booleanPointInPolygon(pt, feature as any);
    } catch {
      // Fallback to ray-casting if turf encounters unexpected multi-ring
      const geom = feature.geometry;
      if (geom.type === 'Polygon') {
        isInside = rayCastPointInPolygon(lng, lat, geom.coordinates[0]);
      } else if (geom.type === 'MultiPolygon') {
        for (const poly of geom.coordinates) {
          if (rayCastPointInPolygon(lng, lat, poly[0])) {
            isInside = true;
            break;
          }
        }
      }
    }

    if (isInside) {
      const rawName = (feature.properties?.district ||
        feature.properties?.district_name ||
        feature.properties?.NAME_2 ||
        '') as string;

      // Find matching district metadata from the 36 districts dataset
      const matchedData =
        MAHARASHTRA_DISTRICTS.find(
          d => d.district.toLowerCase() === rawName.toLowerCase()
        ) || null;

      const districtName = matchedData ? matchedData.district : rawName;
      const divisionName = matchedData ? matchedData.division : null;

      return {
        district: districtName,
        division: divisionName,
        isInsideMaharashtra: true,
        districtData: matchedData,
        granularityLabel: `based on ${districtName} regional data`,
        feature
      };
    }
  }

  // Pin falls outside every polygon in the boundary file
  return {
    district: null,
    division: null,
    isInsideMaharashtra: false,
    districtData: null,
    granularityLabel: 'Outside supported region'
  };
}

/**
 * Async lookup helper that ensures GeoJSON is loaded before resolving
 */
export async function lookupDistrictByCoordinates(lat: number, lng: number): Promise<DistrictLookupResult> {
  const geojson = await loadMaharashtraDistrictsGeoJSON();
  return lookupDistrictSync(lat, lng, geojson);
}
