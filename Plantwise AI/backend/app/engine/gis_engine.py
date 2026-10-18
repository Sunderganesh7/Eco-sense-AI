import math
from typing import Dict, Any, List

def generate_suitability_zones_geojson(lat: float, lng: float, land_type: str) -> Dict[str, Any]:
    """
    Generates synthetic GIS GeoJSON features around given lat/lng representing
    High Suitability, Medium Transition, and Avoid/Restricted safety zones.
    """
    # Base offset in degrees (~100m to 500m)
    d_lat = 0.003
    d_lng = 0.003

    # High Suitability Polygon (Direct open parcel)
    high_poly = [
        [lng - d_lng * 0.7, lat - d_lat * 0.7],
        [lng + d_lng * 0.7, lat - d_lat * 0.7],
        [lng + d_lng * 0.7, lat + d_lat * 0.7],
        [lng - d_lng * 0.7, lat + d_lat * 0.7],
        [lng - d_lng * 0.7, lat - d_lat * 0.7]
    ]

    # Medium Buffer Polygon (Setback boundary)
    med_poly = [
        [lng - d_lng * 1.4, lat - d_lat * 1.4],
        [lng + d_lng * 1.4, lat - d_lat * 1.4],
        [lng + d_lng * 1.4, lat + d_lat * 1.4],
        [lng - d_lng * 1.4, lat + d_lat * 1.4],
        [lng - d_lng * 1.4, lat - d_lat * 1.4]
    ]

    # Avoid / Strict Utility or Watercourse Line / Polygon
    avoid_poly = [
        [lng + d_lng * 0.8, lat - d_lat * 1.6],
        [lng + d_lng * 1.8, lat - d_lat * 1.6],
        [lng + d_lng * 1.8, lat - d_lat * 0.6],
        [lng + d_lng * 0.8, lat - d_lat * 0.6],
        [lng + d_lng * 0.8, lat - d_lat * 1.6]
    ]

    features = [
        {
            "type": "Feature",
            "properties": {
                "zone": "high",
                "name": "High Suitability Zone (Optimal Planting)",
                "color": "#10b981",
                "fillColor": "#10b981",
                "fillOpacity": 0.25,
                "description": "Clear spatial headroom, optimal soil profile, zero underground conduit conflicts."
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [high_poly]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "zone": "medium",
                "name": "Medium Suitability Zone (Setback & Understory)",
                "color": "#f59e0b",
                "fillColor": "#f59e0b",
                "fillOpacity": 0.15,
                "description": "Peripheral buffer requiring 2.5m minimum roadway/utility setback and medium-canopy species."
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [med_poly]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "zone": "avoid",
                "name": "Restricted / Avoid Zone (Safety & Utility Corridor)",
                "color": "#ef4444",
                "fillColor": "#ef4444",
                "fillOpacity": 0.35,
                "description": "Within high-tension power line clearance, drainage right-of-way, or active vehicular sight triangle."
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [avoid_poly]
            }
        }
    ]

    return {
        "type": "FeatureCollection",
        "features": features
    }

def calculate_ndvi_simulation(
    target_trees: int = 50,
    area_sqm: float = 2000.0,
    months_elapsed: int = 24
) -> Dict[str, Any]:
    """
    Simulates NDVI raster difference and carbon sequestration trajectory.
    """
    baseline_ndvi = 0.22
    growth_factor = 1.0 - math.exp(-0.06 * months_elapsed)
    max_ndvi_gain = 0.48 * min(1.0, (target_trees * 25.0) / max(500.0, area_sqm))
    
    current_ndvi = round(baseline_ndvi + (max_ndvi_gain * growth_factor), 2)
    ndvi_diff = round(current_ndvi - baseline_ndvi, 2)
    green_cover_change_pct = round((ndvi_diff / baseline_ndvi) * 100, 1)
    
    # 25 kg CO2 per tree per year average
    annual_co2_kg = target_trees * 25.0
    accumulated_carbon_tons = round((annual_co2_kg * (months_elapsed / 12.0)) / 1000.0, 2)
    oxygen_production_kg_day = round(target_trees * 0.28, 1)

    return {
        "baseline_ndvi": baseline_ndvi,
        "current_ndvi": current_ndvi,
        "ndvi_diff": ndvi_diff,
        "green_cover_change_pct": green_cover_change_pct,
        "accumulated_carbon_tons": accumulated_carbon_tons,
        "oxygen_production_kg_day": oxygen_production_kg_day,
        "months_simulated": months_elapsed
    }
