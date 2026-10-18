"""
GreenPath AI — GeoAI & Map Routes
Endpoints for map tile info, geo-coordinates analysis, and zone mapping.
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from backend.database.schemas import CoordinateRequest, APIResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/map", tags=["GeoAI & Maps"])


# ================================================================
# POST /map/analyze-coordinates
# ================================================================
@router.post("/analyze-coordinates")
async def analyze_coordinates(body: CoordinateRequest):
    """
    Analyze a geographic coordinate.
    Returns tile information, zone metadata, and GIS-compatible data.
    In production: connects to Sentinel Hub / Google Earth Engine.
    Currently returns enriched metadata with OSM tile URLs.
    """
    lat, lon = body.latitude, body.longitude
    zoom = body.zoom

    # ── Tile coordinate calculation (Slippy map tiles) ────────────────────
    import math
    n = 2 ** zoom
    x_tile = int((lon + 180.0) / 360.0 * n)
    y_tile = int(
        (1.0 - math.log(math.tan(math.radians(lat)) + 1.0 / math.cos(math.radians(lat))) / math.pi)
        / 2.0 * n
    )

    # OSM tile URL (free, no API key)
    osm_tile_url = f"https://tile.openstreetmap.org/{zoom}/{x_tile}/{y_tile}.png"

    # Satellite tile (using ESRI World Imagery — free)
    satellite_tile_url = (
        f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/"
        f"MapServer/tile/{zoom}/{y_tile}/{x_tile}"
    )

    # ── Zone classification based on lat/lon patterns ─────────────────────
    # Simple heuristic: will be replaced by real GIS analysis in production
    zone_type = _classify_zone_by_coordinates(lat, lon)

    # ── Bounding box for the selected area ────────────────────────────────
    radius_deg = body.radius_km / 111.0   # 1° ≈ 111 km
    bbox = {
        "north": lat + radius_deg,
        "south": lat - radius_deg,
        "east": lon + radius_deg / math.cos(math.radians(lat)),
        "west": lon - radius_deg / math.cos(math.radians(lat)),
    }

    return {
        "success": True,
        "coordinates": {"latitude": lat, "longitude": lon},
        "zoom": zoom,
        "tile": {"x": x_tile, "y": y_tile, "z": zoom},
        "osm_tile_url": osm_tile_url,
        "satellite_tile_url": satellite_tile_url,
        "bounding_box": bbox,
        "zone_type": zone_type,
        "area_km2": round(math.pi * body.radius_km ** 2, 2),
        "geojson": {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [lon, lat],
            },
            "properties": {
                "zone_type": zone_type,
                "radius_km": body.radius_km,
            },
        },
        "note": (
            "Live satellite analysis: Upload the satellite tile image to /analysis/upload "
            "for full AI processing. Real-time NDVI via Sentinel Hub requires API key."
        ),
    }


def _classify_zone_by_coordinates(lat: float, lon: float) -> str:
    """Simple heuristic zone classification. Replace with GIS lookup in production."""
    # Detect approximate climate/zone type based on latitude
    abs_lat = abs(lat)
    if abs_lat < 10:
        return "Tropical Rainforest Zone"
    elif abs_lat < 23.5:
        return "Tropical / Subtropical Zone"
    elif abs_lat < 35:
        return "Arid / Semi-Arid Zone"
    elif abs_lat < 50:
        return "Temperate Zone"
    elif abs_lat < 66.5:
        return "Boreal / Subarctic Zone"
    else:
        return "Arctic / Polar Zone"


# ================================================================
# GET /map/tile-info
# ================================================================
@router.get("/tile-info")
async def tile_info(lat: float, lon: float, zoom: int = 15):
    """Get OpenStreetMap tile coordinates for a lat/lon point."""
    import math
    n = 2 ** zoom
    x = int((lon + 180.0) / 360.0 * n)
    y = int(
        (1.0 - math.log(math.tan(math.radians(lat)) + 1.0 / math.cos(math.radians(lat))) / math.pi)
        / 2.0 * n
    )
    return {
        "lat": lat, "lon": lon, "zoom": zoom,
        "tile_x": x, "tile_y": y,
        "osm_url": f"https://tile.openstreetmap.org/{zoom}/{x}/{y}.png",
        "satellite_url": (
            f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/"
            f"MapServer/tile/{zoom}/{y}/{x}"
        ),
    }


# ================================================================
# GET /map/zones/geojson
# ================================================================
@router.get("/zones/geojson")
async def get_zones_geojson():
    """
    Return recent analysis results as GeoJSON FeatureCollection
    for rendering zone overlays on the map.
    """
    from backend.database.schemas import AnalysisDocument, AnalysisStatus

    analyses = await AnalysisDocument.find(
        AnalysisDocument.status == AnalysisStatus.COMPLETED,
        AnalysisDocument.latitude != None,   # noqa: E711
    ).limit(100).to_list()

    features = []
    for a in analyses:
        if a.latitude and a.longitude:
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [a.longitude, a.latitude],
                },
                "properties": {
                    "id": str(a.id),
                    "tree_count": a.tree_count,
                    "green_cover": a.green_cover_percent,
                    "aqi": a.aqi_score,
                    "aqi_category": a.aqi_category,
                    "eco_index": a.eco_index,
                    "location": a.location_name or "Unknown",
                    "analyzed_at": str(a.created_at),
                },
            })

    return {
        "type": "FeatureCollection",
        "features": features,
        "total": len(features),
    }
