"""
GreenPath AI — AI Plantation Recommendation Service
Enhanced version with species recommendations based on AQI, heat, and zone density.
"""

from typing import Dict, Any, List


# ── Tree species database ──────────────────────────────────────────────────────
_TREE_SPECIES = [
    {
        "name": "Neem (Azadirachta indica)",
        "aqi_benefit": "Excellent",
        "co2_absorption_kg_year": 22,
        "heat_reduction": "High",
        "water_need": "Low",
        "growth_speed": "Fast",
        "best_for": ["high_aqi", "high_heat", "dry_zone"],
        "description": (
            "Hardy, drought-resistant tree with exceptional air-purifying properties. "
            "Ideal for polluted urban zones."
        ),
    },
    {
        "name": "Peepal (Ficus religiosa)",
        "aqi_benefit": "Excellent",
        "co2_absorption_kg_year": 26,
        "heat_reduction": "High",
        "water_need": "Moderate",
        "growth_speed": "Fast",
        "best_for": ["high_aqi", "urban_core", "high_heat"],
        "description": (
            "One of the highest oxygen producers. Absorbs CO₂ even at night. "
            "Perfect for dense urban areas."
        ),
    },
    {
        "name": "Gulmohar (Delonix regia)",
        "aqi_benefit": "Good",
        "co2_absorption_kg_year": 18,
        "heat_reduction": "Moderate",
        "water_need": "Low",
        "growth_speed": "Moderate",
        "best_for": ["aesthetic", "roadside", "moderate_aqi"],
        "description": (
            "Beautiful canopy tree with vibrant flowers. "
            "Great for roadside planting and urban beautification."
        ),
    },
    {
        "name": "Bamboo (Bambusa vulgaris)",
        "aqi_benefit": "Very Good",
        "co2_absorption_kg_year": 35,
        "heat_reduction": "High",
        "water_need": "Moderate",
        "growth_speed": "Very Fast",
        "best_for": ["carbon_sequestration", "boundary", "slope"],
        "description": (
            "Fastest-growing carbon sequestration plant. "
            "Excellent for quick green cover in sparse zones."
        ),
    },
    {
        "name": "Arjuna (Terminalia arjuna)",
        "aqi_benefit": "Good",
        "co2_absorption_kg_year": 20,
        "heat_reduction": "Moderate",
        "water_need": "Moderate",
        "growth_speed": "Moderate",
        "best_for": ["riparian", "moderate_heat", "medicinal"],
        "description": (
            "Medicinal tree with good shade cover. "
            "Suitable for riverbanks and moderate-heat urban zones."
        ),
    },
    {
        "name": "Banyan (Ficus benghalensis)",
        "aqi_benefit": "Excellent",
        "co2_absorption_kg_year": 30,
        "heat_reduction": "Very High",
        "water_need": "Moderate",
        "growth_speed": "Slow",
        "best_for": ["urban_core", "park", "high_heat", "landmark"],
        "description": (
            "Iconic large canopy tree offering massive shade. "
            "Best for parks, open plazas, and heritage urban zones."
        ),
    },
]


def get_plantation_recommendation(dist: Dict[str, int]) -> Dict[str, Any]:
    """
    Generate plantation recommendations based on zone distribution.
    Backward-compatible with the original Flask version.
    """
    left = dist.get("left", 0)
    center = dist.get("center", 0)
    right = dist.get("right", 0)
    top = dist.get("top", 0)
    middle = dist.get("middle", 0)
    bottom = dist.get("bottom", 0)

    horizontal = {"left": left, "center": center, "right": right}
    vertical = {"top": top, "middle": middle, "bottom": bottom}

    min_h = min(horizontal, key=horizontal.get)
    min_v = min(vertical, key=vertical.get)

    messages = [
        f"The {min_v}–{min_h} region has the lowest tree density based on analysis.",
        f"Prioritise new plantation in the {min_v}–{min_h} region for green cover balance.",
    ]

    avg_density = sum(dist.values()) / max(len(dist), 1)
    if left < avg_density and right < avg_density:
        messages.append("Horizontal plantation advised for left–right balance.")
    if top < avg_density and bottom < avg_density:
        messages.append("Vertical plantation advised for top–bottom balance.")

    return {
        "horizontal": min_h.capitalize(),
        "vertical": min_v.capitalize(),
        "message": " ".join(messages),
    }


def get_ai_recommendations(
    tree_count: int,
    green_cover: float,
    aqi_score: int,
    current_temp: float,
    zone_distribution: Dict[str, int],
) -> Dict[str, Any]:
    """
    Full AI plantation recommendation with:
      - Priority zones to plant
      - Recommended tree species
      - Estimated impact after planting
      - Step-by-step action plan
    """
    # ── Determine priority zones ──────────────────────────────────────────
    priority_zones: List[str] = []
    for zone, count in zone_distribution.items():
        avg = sum(zone_distribution.values()) / max(len(zone_distribution), 1)
        if count < avg * 0.6:
            priority_zones.append(zone)

    if not priority_zones:
        priority_zones = list(zone_distribution.keys())[:2]

    # ── Determine recommended species based on conditions ─────────────────
    tags = []
    if aqi_score > 100:
        tags.append("high_aqi")
    if current_temp > 35:
        tags.append("high_heat")
    if green_cover < 20:
        tags.append("dry_zone")
    if tree_count < 10:
        tags.append("urban_core")

    recommended_species = [
        s for s in _TREE_SPECIES
        if any(t in s["best_for"] for t in tags)
    ]

    if not recommended_species:
        recommended_species = _TREE_SPECIES[:3]   # default top 3

    # ── Calculate recommended planting count ─────────────────────────────
    trees_needed = max(5, int((100 - green_cover) / 5))
    if aqi_score > 150:
        trees_needed = int(trees_needed * 1.5)

    # ── Estimate impact after planting ────────────────────────────────────
    new_tree_count = tree_count + trees_needed
    estimated_co2 = round(new_tree_count * 22, 1)
    estimated_green = min(100, round(green_cover + trees_needed * 0.5, 1))
    estimated_aqi = max(0, round(aqi_score - trees_needed * 1.2, 1))
    estimated_heat = round(current_temp - (trees_needed * 0.02), 2)

    # ── Action plan ───────────────────────────────────────────────────────
    action_plan = [
        f"🎯 Plant {trees_needed} new trees in priority zones: {', '.join(priority_zones)}.",
        f"🌱 Begin with fast-growing species: {recommended_species[0]['name']}.",
        "💧 Install drip irrigation for the first 6 months post-plantation.",
        "📊 Re-analyse the zone every 3 months to track green cover growth.",
        "🔄 Replace dead/diseased trees within 30 days of detection.",
    ]

    return {
        "priority_zones": priority_zones,
        "trees_needed": trees_needed,
        "recommended_species": recommended_species[:3],
        "estimated_impact": {
            "co2_absorption_kg_year": estimated_co2,
            "green_cover_percent": estimated_green,
            "aqi_improvement": round(aqi_score - estimated_aqi, 1),
            "temp_reduction_celsius": round(current_temp - estimated_heat, 2),
        },
        "action_plan": action_plan,
        "urgency": (
            "Critical" if aqi_score > 150 or green_cover < 10 else
            "High" if aqi_score > 100 or green_cover < 20 else
            "Moderate" if aqi_score > 50 else "Low"
        ),
    }
