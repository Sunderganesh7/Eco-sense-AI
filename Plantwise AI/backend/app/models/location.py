from sqlalchemy import Column, Integer, String, Float, Text, Boolean
from app.database import Base

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    district = Column(String(100), nullable=False)
    state = Column(String(100), default="Maharashtra")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    land_type = Column(String(80), nullable=False)
    soil_type = Column(String(80), default="Clay Loam")
    crz_status = Column(String(50), default="Non-CRZ")
    rainfall_annual_mm = Column(Integer, default=1200)
    existing_canopy_pct = Column(Float, default=15.0)
    nearest_water_source = Column(String(100), default="Borewell / Municipal Supply")
    description = Column(Text, default="")
    is_preset = Column(Boolean, default=True)
