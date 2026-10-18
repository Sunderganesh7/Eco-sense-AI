from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.species import Species
from app.engine.species_engine import recommend_species

router = APIRouter(prefix="/species", tags=["Native Species"])

@router.get("")
def list_species(
    region: Optional[str] = None,
    soil_type: Optional[str] = None,
    water_req: Optional[str] = None,
    purpose: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Species)
    if search:
        s_term = f"%{search}%"
        query = query.filter(
            (Species.common_name.ilike(s_term)) |
            (Species.botanical_name.ilike(s_term)) |
            (Species.local_name.ilike(s_term))
        )
    if water_req and water_req != "All":
        query = query.filter(Species.water_requirement.ilike(f"%{water_req}%"))

    species_list = query.all()
    results = []
    for sp in species_list:
        # In-memory filter for JSON fields if needed
        if region and region != "All" and region not in (sp.regions or []):
            continue
        if soil_type and soil_type != "All" and soil_type not in (sp.soil_types or []):
            continue
        if purpose and purpose != "All" and purpose not in (sp.suitable_purposes or []):
            continue
        results.append(sp)

    return results

@router.get("/{species_id}")
def get_species_detail(species_id: int, db: Session = Depends(get_db)):
    sp = db.query(Species).filter(Species.id == species_id).first()
    return sp

@router.post("/recommend")
def get_species_recommendations(
    region: str = "Deccan Plateau",
    soil_type: str = "Clay Loam",
    water_availability: str = "Moderate",
    plantation_purpose: str = "Urban Greening",
    land_type: str = "municipal_public",
    limit: int = 6
):
    return recommend_species(
        region=region,
        soil_type=soil_type,
        water_availability=water_availability,
        plantation_purpose=plantation_purpose,
        land_type=land_type,
        limit=limit
    )
