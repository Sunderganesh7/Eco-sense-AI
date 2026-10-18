from sqlalchemy import Column, Integer, String, Float, Text, JSON
from app.database import Base

class Species(Base):
    __tablename__ = "species"

    id = Column(Integer, primary_key=True, index=True)
    botanical_name = Column(String(120), unique=True, index=True, nullable=False)
    common_name = Column(String(100), nullable=False, index=True)
    local_name = Column(String(100), default="")
    family = Column(String(80), default="")
    growth_rate = Column(String(30), default="Moderate")  # Slow, Moderate, Fast
    mature_height_m = Column(Float, default=15.0)
    canopy_spread_m = Column(Float, default=10.0)
    canopy_type = Column(String(50), default="Broad Spreading")
    water_requirement = Column(String(50), default="Moderate")  # Low, Moderate, High
    soil_types = Column(JSON, default=list)  # List of suitable soils: ["Clay Loam", "Sandy Loam", "Black Cotton Soil", "Laterite", "Alluvial"]
    regions = Column(JSON, default=list)  # List of regions: ["Konkan / Coastal", "Western Ghats", "Deccan Plateau", "Vidarbha", "Marathwada", "Pan-India"]
    carbon_sequestration_kg_yr = Column(Float, default=25.0)  # kg CO2/year per mature tree
    maintenance_level = Column(String(30), default="Low")  # Minimal, Low, Moderate, High
    ecological_benefits = Column(JSON, default=list)  # List of strings
    suitable_purposes = Column(JSON, default=list)  # List of purposes: ["Avenue", "Urban Greening", "Reforestation", "Agroforestry", "Riparian", "Industrial Greenbelt", "Coastal"]
    apti_score = Column(Float, default=22.0)  # Air Pollution Tolerance Index
    image_url = Column(String(250), default="")
    description = Column(Text, default="")
