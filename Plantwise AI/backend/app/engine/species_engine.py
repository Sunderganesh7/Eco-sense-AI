from typing import List, Dict, Any
from app.data.seed_data import SAMPLE_SPECIES

def recommend_species(
    region: str = "Deccan Plateau",
    soil_type: str = "Clay Loam",
    water_availability: str = "Moderate",
    plantation_purpose: str = "Urban Greening",
    land_type: str = "municipal_public",
    limit: int = 5
) -> List[Dict[str, Any]]:
    scored_species = []
    
    # Purpose to species tags mapping
    purpose_key = plantation_purpose.lower()
    
    for sp in SAMPLE_SPECIES:
        score = 0
        reasons = []

        # 1. Soil matching (Max 25 pts)
        suitable_soils = sp.get("soil_types", [])
        if soil_type in suitable_soils:
            score += 25
            reasons.append(f"Highly compatible with {soil_type}")
        elif any(s.lower() in soil_type.lower() for s in suitable_soils):
            score += 18
            reasons.append(f"Adaptable to {soil_type}")
        else:
            score += 8

        # 2. Region matching (Max 25 pts)
        suitable_regions = sp.get("regions", [])
        if "Pan-India" in suitable_regions or region in suitable_regions:
            score += 25
            reasons.append(f"Indigenous to {region}")
        elif any(r.lower() in region.lower() for r in suitable_regions):
            score += 20
            reasons.append(f"Well-adapted to regional climate of {region}")
        else:
            score += 5

        # 3. Purpose matching (Max 25 pts)
        purposes = [p.lower() for p in sp.get("suitable_purposes", [])]
        if any(p in purpose_key or purpose_key in p for p in purposes):
            score += 25
            reasons.append(f"Optimal for {plantation_purpose}")
        elif "urban greening" in purposes:
            score += 15
            reasons.append("Versatile urban green cover")
        else:
            score += 5

        # 4. Water requirement matching (Max 15 pts)
        sp_water = sp.get("water_requirement", "Moderate").lower()
        avail_water = water_availability.lower()
        if sp_water == avail_water:
            score += 15
        elif sp_water == "low":
            score += 14  # Low water is always resilient
            reasons.append("High drought hardiness")
        elif sp_water == "moderate" and avail_water in ["moderate", "high"]:
            score += 12
        else:
            score += 6

        # 5. Ecological & Carbon Bonus (Max 10 pts)
        co2_val = sp.get("carbon_sequestration_kg_yr", 20.0)
        if co2_val >= 35.0:
            score += 10
            reasons.append(f"High carbon sequestration ({co2_val} kg CO₂/yr)")
        elif co2_val >= 25.0:
            score += 7
        else:
            score += 4

        # Special Land Type Filters
        if land_type == "coastal_crz" and "Coastal" not in sp.get("suitable_purposes", []):
            score -= 30  # Penalize non-coastal species in CRZ
        elif land_type == "industrial_greenbelt" and sp.get("apti_score", 0) >= 24.0:
            score += 10
            reasons.append(f"High Air Pollution Tolerance (APTI {sp.get('apti_score')})")

        compatibility_pct = min(99, max(40, score))

        scored_species.append({
            "botanical_name": sp["botanical_name"],
            "common_name": sp["common_name"],
            "local_name": sp.get("local_name", ""),
            "family": sp.get("family", ""),
            "growth_rate": sp.get("growth_rate", "Moderate"),
            "mature_height_m": sp.get("mature_height_m", 15.0),
            "canopy_spread_m": sp.get("canopy_spread_m", 10.0),
            "canopy_type": sp.get("canopy_type", "Spreading"),
            "water_requirement": sp.get("water_requirement", "Moderate"),
            "carbon_sequestration_kg_yr": sp.get("carbon_sequestration_kg_yr", 25.0),
            "maintenance_level": sp.get("maintenance_level", "Low"),
            "ecological_benefits": sp.get("ecological_benefits", []),
            "compatibility_score": compatibility_pct,
            "suitability_reasons": reasons[:3],
            "description": sp.get("description", "")
        })

    # Sort descending by compatibility score
    scored_species.sort(key=lambda x: x["compatibility_score"], reverse=True)
    return scored_species[:limit]
