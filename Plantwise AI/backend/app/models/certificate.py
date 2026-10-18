from sqlalchemy import Column, Integer, String, Float, Text, JSON, DateTime
from datetime import datetime
from app.database import Base

class Certificate(Base):
    __tablename__ = "plantation_certificates"

    id = Column(Integer, primary_key=True, index=True)
    certificate_id = Column(String(50), unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    project_name = Column(String(180), nullable=False)
    planter_name = Column(String(150), nullable=False)
    planter_role = Column(String(80), default="Citizen / Green Volunteer")
    organization = Column(String(150), default="Independent Citizen Initiative")
    
    location_name = Column(String(180), nullable=False)
    district = Column(String(100), default="Maharashtra")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    land_type = Column(String(100), default="Municipal Public Ground")
    
    trees_count = Column(Integer, default=50)
    species_planted = Column(JSON, default=list)
    
    authority_reference = Column(String(200), default="Tree Authority Ref: MC/TREE/2026/P-882")
    compliance_score = Column(Integer, default=88)
    verification_hash = Column(String(100), unique=True, index=True)
    qr_data = Column(Text, default="")
    status = Column(String(30), default="Verified & Active")
