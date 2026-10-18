from sqlalchemy import Column, Integer, String, Float, Text, JSON, DateTime
from datetime import datetime
from app.database import Base

class MonitoringPlot(Base):
    __tablename__ = "monitoring_plots"

    id = Column(Integer, primary_key=True, index=True)
    plot_code = Column(String(50), unique=True, index=True)
    project_name = Column(String(150), nullable=False)
    location_name = Column(String(150), nullable=False)
    district = Column(String(80), default="Pune")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    area_hectares = Column(Float, default=2.5)
    planting_date = Column(String(50), default="July 2024")
    total_saplings_planted = Column(Integer, default=1500)
    current_surviving_trees = Column(Integer, default=1380)
    survival_rate_pct = Column(Float, default=92.0)
    
    baseline_ndvi = Column(Float, default=0.24)
    current_ndvi = Column(Float, default=0.68)
    ndvi_growth_pct = Column(Float, default=183.3)
    estimated_carbon_offset_tons = Column(Float, default=34.5)
    
    species_distribution = Column(JSON, default=list)
    timeline_records = Column(JSON, default=list)
    before_image_url = Column(String(250), default="")
    after_image_url = Column(String(250), default="")
    last_drone_survey = Column(String(50), default="August 2026")
