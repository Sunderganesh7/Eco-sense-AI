import json
import os
from typing import Optional, Dict, Any, Tuple
from app.data.seed_data import SAMPLE_LOCATIONS

GEOJSON_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "maharashtra_districts.geojson")

_CACHED_GEOJSON: Optional[Dict[str, Any]] = None
_DISTRICT_METADATA_MAP: Dict[str, Dict[str, Any]] = {}

def get_maharashtra_geojson() -> Dict[str, Any]:
    global _CACHED_GEOJSON
    if _CACHED_GEOJSON is None:
        if os.path.exists(GEOJSON_PATH):
            with open(GEOJSON_PATH, "r", encoding="utf-8") as f:
                _CACHED_GEOJSON = json.load(f)
        else:
            # Fallback path if loaded from different directory
            alt_path = os.path.join(os.getcwd(), "app", "data", "maharashtra_districts.geojson")
            if os.path.exists(alt_path):
                with open(alt_path, "r", encoding="utf-8") as f:
                    _CACHED_GEOJSON = json.load(f)
            else:
                _CACHED_GEOJSON = {"type": "FeatureCollection", "features": []}
    return _CACHED_GEOJSON

def _point_in_polygon(x: float, y: float, polygon_coords: list) -> bool:
    """
    Standard ray-casting point-in-polygon algorithm.
    x: longitude, y: latitude
    polygon_coords: [[lon, lat], [lon, lat], ...]
    """
    inside = False
    n = len(polygon_coords)
    if n < 3:
        return False
    p1x, p1y = polygon_coords[0]
    for i in range(n + 1):
        p2x, p2y = polygon_coords[i % n]
        if y > min(p1y, p2y):
            if y <= max(p1y, p2y):
                if x <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or x <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside

def resolve_district_from_coords(latitude: float, longitude: float) -> Optional[str]:
    """
    Given a latitude and longitude, returns the name of the Maharashtra district
    it falls inside based on official boundaries, or None if outside Maharashtra.
    """
    geojson = get_maharashtra_geojson()
    lon = float(longitude)
    lat = float(latitude)

    for feature in geojson.get("features", []):
        geom = feature.get("geometry", {})
        gtype = geom.get("type")
        coords = geom.get("coordinates", [])
        props = feature.get("properties", {})
        dist_name = props.get("district") or props.get("district_name")

        if gtype == "Polygon":
            if coords and _point_in_polygon(lon, lat, coords[0]):
                return dist_name
        elif gtype == "MultiPolygon":
            for poly in coords:
                if poly and _point_in_polygon(lon, lat, poly[0]):
                    return dist_name
    return None

def get_district_metadata(district_name: Optional[str]) -> Optional[Dict[str, Any]]:
    """
    Returns regional soil, canopy, rainfall, and default land data for a district.
    """
    if not district_name:
        return None
    global _DISTRICT_METADATA_MAP
    if not _DISTRICT_METADATA_MAP:
        for loc in SAMPLE_LOCATIONS:
            dist = loc.get("district")
            if dist:
                _DISTRICT_METADATA_MAP[dist.lower()] = loc
    
    return _DISTRICT_METADATA_MAP.get(district_name.lower())
