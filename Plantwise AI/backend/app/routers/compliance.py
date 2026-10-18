import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models.compliance import ComplianceCheck
from app.schemas.compliance import LocationInput, ComplianceCheckResponse
from app.engine.compliance_engine import evaluate_legal_compliance
from app.engine.suitability_engine import calculate_plantation_suitability
from app.engine.species_engine import recommend_species
from app.engine.gis_engine import generate_suitability_zones_geojson
from app.engine.district_resolver import resolve_district_from_coords, get_district_metadata
from app.data.seed_data import SAMPLE_SCHEMES
from app.utils.pdf_generator import generate_compliance_report_pdf

router = APIRouter(prefix="/compliance", tags=["Compliance Engine"])

@router.post("/check", response_model=ComplianceCheckResponse)
def perform_compliance_check(req: LocationInput, db: Session = Depends(get_db)):
    check_ref = f"GP-CHK-{uuid.uuid4().hex[:8].upper()}"

    # 0. Point-in-Polygon District Resolution
    resolved_district = resolve_district_from_coords(req.latitude, req.longitude) or req.district
    
    # Check if point falls outside Maharashtra boundary
    if not resolved_district:
        return ComplianceCheckResponse(
            check_ref=check_ref,
            timestamp=datetime.utcnow(),
            location_name=req.name or f"Point ({req.latitude:.4f}, {req.longitude:.4f})",
            latitude=req.latitude,
            longitude=req.longitude,
            district=None,
            division=None,
            is_inside_maharashtra=False,
            granularity_label="Outside supported region",
            outside_region_warning="The selected coordinate falls outside the 36 districts of Maharashtra state boundary.",
            land_type=req.land_type,
            land_type_display="Outside Maharashtra Region",
            governing_law="N/A (Outside Maharashtra Jurisdiction)",
            primary_authority="Competent Authority of Respective State",
            secondary_authorities=[],
            compliance_score=0,
            verdict="Outside Supported Region",
            verdict_badge="rose",
            verdict_summary="This coordinate is located outside Maharashtra. GreenPermit AI currently evaluates legal compliance for all 36 districts across Maharashtra.",
            noc_required_display="Not Applicable",
            factors=[],
            checklist=[],
            procedure_steps=[],
            recommended_species_top5=[],
            matched_schemes_top3=[],
            prohibited_species=[],
            statutory_conditions=["Location outside Maharashtra state jurisdiction."],
            disclaimer="GreenPermit AI evaluates statutory clearance and species fit specifically under Maharashtra regulations."
        )

    dist_meta = get_district_metadata(resolved_district)
    division_name = dist_meta.get("division") if dist_meta else None
    
    # Determine appropriate regional tag for species recommendation
    if resolved_district in ['Mumbai City', 'Mumbai Suburban', 'Thane', 'Palghar', 'Raigad', 'Ratnagiri', 'Sindhudurg']:
        species_region = "Konkan / Western Ghats"
    elif resolved_district in ['Nagpur', 'Wardha', 'Chandrapur', 'Gadchiroli', 'Gondia', 'Bhandara', 'Amravati', 'Akola', 'Washim', 'Buldhana', 'Yavatmal']:
        species_region = "Vidarbha / Eastern Maharashtra"
    elif resolved_district in ['Chhatrapati Sambhajinagar', 'Jalna', 'Beed', 'Latur', 'Dharashiv', 'Nanded', 'Parbhani', 'Hingoli']:
        species_region = "Marathwada / Central Deccan"
    else:
        species_region = "Deccan Plateau"

    granularity_label = f"based on {resolved_district} regional data"

    # 1. Evaluate Legal Rules & Document Checklist
    legal_res = evaluate_legal_compliance(
        land_type=req.land_type,
        target_trees=req.target_trees or 50,
        ownership_type=req.ownership_type or "Private",
        crz_status=req.crz_status or "Non-CRZ",
        road_distance_m=req.road_distance_m or 10.0
    )

    # 2. Calculate 0-100 Suitability Score with 8 Factor Breakdown
    suit_res = calculate_plantation_suitability(
        land_type=req.land_type,
        ownership_type=req.ownership_type or "Private",
        crz_status=req.crz_status or "Non-CRZ",
        existing_canopy_pct=req.existing_canopy_pct or (dist_meta.get("existing_canopy_pct") if dist_meta else 15.0),
        road_distance_m=req.road_distance_m or 10.0,
        water_source=req.water_source or (dist_meta.get("nearest_water_source") if dist_meta else "Municipal Supply"),
        soil_type=req.soil_type or (dist_meta.get("soil_type") if dist_meta else "Clay Loam"),
        target_trees=req.target_trees or 50
    )

    # 3. Recommend Top 5 Native Species
    species_rec = recommend_species(
        region=species_region,
        soil_type=req.soil_type,
        water_availability="Moderate",
        plantation_purpose=req.plantation_purpose or "Urban Greening",
        land_type=req.land_type,
        limit=5
    )

    # 4. Match Government Schemes
    matched_schemes = []
    for sc in SAMPLE_SCHEMES:
        p_tags = [p.lower() for p in sc.get("purpose_tags", [])]
        req_purp = (req.plantation_purpose or "Urban Greening").lower()
        if any(p in req_purp or req_purp in p for p in p_tags):
            matched_schemes.append(sc)
    if not matched_schemes:
        matched_schemes = SAMPLE_SCHEMES[:3]
    else:
        matched_schemes = matched_schemes[:3]

    response_data = ComplianceCheckResponse(
        check_ref=check_ref,
        timestamp=datetime.utcnow(),
        location_name=req.name or f"{resolved_district} Site",
        latitude=req.latitude,
        longitude=req.longitude,
        district=resolved_district,
        division=division_name,
        is_inside_maharashtra=True,
        granularity_label=granularity_label,
        outside_region_warning=None,
        
        land_type=req.land_type,
        land_type_display=legal_res["land_type_display"],
        governing_law=legal_res["governing_law"],
        primary_authority=legal_res["primary_authority"],
        secondary_authorities=legal_res["secondary_authorities"],
        
        compliance_score=suit_res["compliance_score"],
        verdict=suit_res["verdict"],
        verdict_badge=suit_res["verdict_badge"],
        verdict_summary=suit_res["verdict_summary"],
        noc_required_display=legal_res["noc_required"],
        
        factors=suit_res["factors"],
        checklist=legal_res["checklist"],
        procedure_steps=legal_res["procedure_steps"],
        recommended_species_top5=species_rec,
        matched_schemes_top3=matched_schemes,
        prohibited_species=legal_res["prohibited_species"],
        statutory_conditions=legal_res["statutory_conditions"],
        disclaimer=f"Preliminary compliance assessment {granularity_label}. Final authorization subject to Tree Authority inspection."
    )

    # Save to audit log
    audit_entry = ComplianceCheck(
        check_ref=check_ref,
        created_at=datetime.utcnow(),
        location_name=req.name or "Site Coordinate",
        latitude=req.latitude,
        longitude=req.longitude,
        land_type=req.land_type,
        soil_type=req.soil_type,
        target_trees=req.target_trees or 50,
        plantation_purpose=req.plantation_purpose or "Urban Greening",
        ownership_type=req.ownership_type or "Private",
        compliance_score=suit_res["compliance_score"],
        verdict=suit_res["verdict"],
        verdict_badge=suit_res["verdict_badge"],
        primary_authority=legal_res["primary_authority"],
        governing_law=legal_res["governing_law"],
        noc_required=legal_res["noc_required"],
        factor_breakdown=[f.model_dump() for f in suit_res["factors"]],
        document_checklist=[c.model_dump() for c in legal_res["checklist"]],
        recommended_species=species_rec,
        matched_schemes=matched_schemes,
        procedure_steps=[p.model_dump() for p in legal_res["procedure_steps"]]
    )
    db.add(audit_entry)
    db.commit()

    return response_data

@router.get("/zones-geojson")
def get_zones_geojson(lat: float, lng: float, land_type: str = "municipal_public"):
    return generate_suitability_zones_geojson(lat, lng, land_type)

@router.post("/export-pdf")
def export_compliance_pdf(payload: Dict[str, Any]):
    pdf_buffer = generate_compliance_report_pdf(payload)
    return Response(
        content=pdf_buffer.read(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=GreenPermit-Compliance-{payload.get('check_ref', 'Report')}.pdf"
        }
    )

@router.get("/history")
def get_recent_checks(db: Session = Depends(get_db), limit: int = 10):
    checks = db.query(ComplianceCheck).order_by(ComplianceCheck.created_at.desc()).limit(limit).all()
    return checks
