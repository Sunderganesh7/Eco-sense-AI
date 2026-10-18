from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.location import Location
from app.schemas.compliance import LocationOut, LocationInput

from app.engine.district_resolver import get_maharashtra_geojson

router = APIRouter(prefix="/locations", tags=["Locations"])

@router.get("/geojson")
def get_districts_geojson():
    return get_maharashtra_geojson()

@router.get("", response_model=List[LocationOut])
def get_all_locations(db: Session = Depends(get_db)):
    return db.query(Location).all()

@router.get("/{location_id}", response_model=LocationOut)
def get_location_by_id(location_id: int, db: Session = Depends(get_db)):
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    return loc

@router.post("", response_model=LocationOut)
def create_custom_location(loc_in: LocationInput, db: Session = Depends(get_db)):
    new_loc = Location(
        name=loc_in.name or "Custom Site",
        district="Custom District",
        state="Maharashtra",
        latitude=loc_in.latitude,
        longitude=loc_in.longitude,
        land_type=loc_in.land_type,
        soil_type=loc_in.soil_type,
        crz_status=loc_in.crz_status or "Non-CRZ",
        rainfall_annual_mm=1200,
        existing_canopy_pct=loc_in.existing_canopy_pct or 15.0,
        nearest_water_source=loc_in.water_source or "Municipal Supply",
        description="User dropped coordinate location",
        is_preset=False
    )
    db.add(new_loc)
    db.commit()
    db.refresh(new_loc)
    return new_loc
