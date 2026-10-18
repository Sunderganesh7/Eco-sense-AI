from typing import Dict, Any, List
from app.schemas.compliance import FactorScore

def calculate_plantation_suitability(
    land_type: str,
    ownership_type: str = "Private",
    crz_status: str = "Non-CRZ",
    existing_canopy_pct: float = 15.0,
    road_distance_m: float = 10.0,
    water_source: str = "Municipal Supply",
    soil_type: str = "Clay Loam",
    target_trees: int = 50
) -> Dict[str, Any]:
    factors: List[FactorScore] = []
    
    # 1. Land Ownership Clarity (15 pts)
    if "Private" in ownership_type or land_type in ["private_residential", "private_commercial", "campus_institutional"]:
        f1_score = 15
        f1_status = "optimal"
        f1_exp = "Direct lawful land ownership or verified institutional possession with zero disputed tenure."
    elif "Agricultural" in land_type or land_type == "agricultural":
        f1_score = 14
        f1_status = "optimal"
        f1_exp = "Clear revenue title (7/12 extract) with direct farmer beneficiary rights."
    elif land_type in ["municipal_public", "industrial_greenbelt"]:
        f1_score = 12
        f1_status = "moderate"
        f1_exp = "Public municipal or industrial allotment requiring formal department permission."
    elif "roadside" in land_type:
        f1_score = 10
        f1_status = "moderate"
        f1_exp = "Highway right-of-way under state/central transport agency jurisdiction."
    else:  # forest or railway
        f1_score = 6
        f1_status = "strict"
        f1_exp = "Strict statutory agency jurisdiction requiring specialized inter-departmental clearances."
        
    factors.append(FactorScore(
        factor_id="f_ownership",
        factor_name="Land Ownership & Title Clarity",
        weight=15,
        score_awarded=f1_score,
        status=f1_status,
        explanation=f1_exp
    ))

    # 2. Forest Restriction Status (15 pts)
    if land_type == "forest_reserved":
        f2_score = 4
        f2_status = "critical"
        f2_exp = "Forest Conservation Act 1980 / 2023 restrictions apply. Direct citizen planting prohibited without JFM/DFO."
    elif land_type == "protected_area_esz":
        f2_score = 6
        f2_status = "strict"
        f2_exp = "Eco-Sensitive Zone buffer requiring Wildlife Warden concurrence and strictly endemic species."
    else:
        f2_score = 15
        f2_status = "optimal"
        f2_exp = "Non-forest revenue/urban land with standard tree preservation framework."
        
    factors.append(FactorScore(
        factor_id="f_forest",
        factor_name="Forest & Eco-Sensitive Zone Restrictions",
        weight=15,
        score_awarded=f2_score,
        status=f2_status,
        explanation=f2_exp
    ))

    # 3. CRZ & Buffer Zone Compliance (15 pts)
    if crz_status == "CRZ-I" or land_type == "coastal_crz":
        f3_score = 7
        f3_status = "strict"
        f3_exp = "Ecologically sensitive coastal/mangrove buffer requiring MCZMA statutory nod."
    elif crz_status in ["CRZ-II", "CRZ-III"]:
        f3_score = 11
        f3_status = "moderate"
        f3_exp = "Developed/rural coastal zone where salt-tolerant native trees are conditionally allowed."
    else:
        f3_score = 15
        f3_status = "optimal"
        f3_exp = "Located outside coastal regulation zones with zero maritime buffer restrictions."

    factors.append(FactorScore(
        factor_id="f_crz",
        factor_name="Coastal Regulation (CRZ) & Buffer Zones",
        weight=15,
        score_awarded=f3_score,
        status=f3_status,
        explanation=f3_exp
    ))

    # 4. Existing Canopy & Space Availability (10 pts)
    if existing_canopy_pct < 20.0:
        f4_score = 10
        f4_status = "optimal"
        f4_exp = f"Low existing canopy ({existing_canopy_pct}%); high open spatial headroom for new saplings."
    elif existing_canopy_pct < 45.0:
        f4_score = 8
        f4_status = "optimal"
        f4_exp = f"Moderate existing canopy ({existing_canopy_pct}%); good space for enrichment and understory planting."
    else:
        f4_score = 4
        f4_status = "moderate"
        f4_exp = f"Dense existing canopy ({existing_canopy_pct}%); sunlight competition may limit broad crown development."

    factors.append(FactorScore(
        factor_id="f_canopy",
        factor_name="Canopy Headroom & Planting Capacity",
        weight=10,
        score_awarded=f4_score,
        status=f4_status,
        explanation=f4_exp
    ))

    # 5. Road & Infrastructure Setback (10 pts)
    if road_distance_m >= 5.0 or land_type in ["private_residential", "campus_institutional", "agricultural"]:
        f5_score = 10
        f5_status = "optimal"
        f5_exp = f"Sufficient safety clearance ({road_distance_m}m) from traffic carriageways and underground utilities."
    elif road_distance_m >= 2.5:
        f5_score = 7
        f5_status = "moderate"
        f5_exp = f"Moderate setback ({road_distance_m}m); requires deep taproot species to prevent root-pavement heave."
    else:
        f5_score = 3
        f5_status = "strict"
        f5_exp = f"Narrow margin ({road_distance_m}m); risk of sightline obstruction or traffic hazard."

    factors.append(FactorScore(
        factor_id="f_setback",
        factor_name="Road & Infrastructure Setback Clearance",
        weight=10,
        score_awarded=f5_score,
        status=f5_status,
        explanation=f5_exp
    ))

    # 6. Water Availability & Irrigation Access (10 pts)
    if any(k in water_source.lower() for k in ["recycled", "stp", "canal", "drip", "river", "borewell"]):
        f6_score = 10
        f6_status = "optimal"
        f6_exp = f"Reliable water supply available via {water_source} ensuring > 85% sapling survival."
    elif "municipal" in water_source.lower():
        f6_score = 8
        f6_status = "optimal"
        f6_exp = "Municipal supply access available for scheduled watering cycles."
    else:
        f6_score = 4
        f6_status = "moderate"
        f6_exp = "Water source is rain-dependent or seasonal; requires drought-hardy xerophytic species."

    factors.append(FactorScore(
        factor_id="f_water",
        factor_name="Water Availability & Irrigation Feasibility",
        weight=10,
        score_awarded=f6_score,
        status=f6_status,
        explanation=f6_exp
    ))

    # 7. Native Species & Soil Compatibility (15 pts)
    if soil_type in ["Clay Loam", "Black Cotton Soil", "Alluvial", "Laterite", "Sandy Loam"]:
        f7_score = 15
        f7_status = "optimal"
        f7_exp = f"Soil type ({soil_type}) is highly fertile and compatible with top-tier indigenous Maharashtra species."
    elif soil_type == "Saline Clay":
        f7_score = 12
        f7_status = "moderate"
        f7_exp = "Saline soil requiring halophytic species like Avicennia, Thespesia, or Karanj."
    else:
        f7_score = 9
        f7_status = "moderate"
        f7_exp = "Rocky or degraded soil; pit enrichment with vermicompost & mycorrhizae strongly advised."

    factors.append(FactorScore(
        factor_id="f_soil",
        factor_name="Native Species & Soil Edaphic Match",
        weight=15,
        score_awarded=f7_score,
        status=f7_status,
        explanation=f7_exp
    ))

    # 8. Legal / Regulatory Process Complexity (10 pts)
    if land_type in ["private_residential", "campus_institutional", "agricultural"]:
        f8_score = 10
        f8_status = "optimal"
        f8_exp = "Zero or minimal regulatory friction; straightforward self-declaration or routine intimation."
    elif land_type in ["private_commercial", "municipal_public", "industrial_greenbelt"]:
        f8_score = 8
        f8_status = "moderate"
        f8_exp = "Standard single-window approval process through Municipal Tree Authority / MIDC."
    elif "roadside" in land_type or land_type == "waterbody_vicinity":
        f8_score = 6
        f8_status = "moderate"
        f8_exp = "Departmental NOC required from Highway / Irrigation executive engineers."
    else:  # forest, railway, crz-I
        f8_score = 2
        f8_status = "strict"
        f8_exp = "Multi-tier statutory approvals required under Central/State conservation acts."

    factors.append(FactorScore(
        factor_id="f_regulatory",
        factor_name="Regulatory Approval Streamlining",
        weight=10,
        score_awarded=f8_score,
        status=f8_status,
        explanation=f8_exp
    ))

    # Calculate Total Score
    total_score = sum(f.score_awarded for f in factors)
    total_score = max(0, min(100, total_score))

    # Determine Verdict
    if total_score >= 75:
        verdict = "Highly Suitable"
        verdict_badge = "green"
        verdict_summary = "Site demonstrates exceptional legal, spatial, and ecological compatibility for immediate tree plantation."
    elif total_score >= 45:
        verdict = "Conditionally Suitable"
        verdict_badge = "amber"
        verdict_summary = "Plantation is permissible subject to statutory department NOCs, specific setback guidelines, and native species adherence."
    else:
        verdict = "High Regulatory Barrier / Restricted"
        verdict_badge = "red"
        verdict_summary = "Significant statutory conservation or safety restrictions apply. Citizen plantation requires formal government co-execution."

    return {
        "compliance_score": total_score,
        "verdict": verdict,
        "verdict_badge": verdict_badge,
        "verdict_summary": verdict_summary,
        "factors": factors
    }
