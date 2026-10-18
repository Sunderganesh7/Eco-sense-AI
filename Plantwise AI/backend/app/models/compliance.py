from sqlalchemy import Column, Integer, String, Float, Text, DateTime, JSON
from datetime import datetime
from app.database import Base

class ComplianceCheck(Base):
    __tablename__ = "compliance_checks"

    id = Column(Integer, primary_key=True, index=True)
    check_ref = Column(String(50), unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    location_name = Column(String(150), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    land_type = Column(String(80), nullable=False)
    soil_type = Column(String(80), nullable=False)
    target_trees = Column(Integer, default=50)
    plantation_purpose = Column(String(100), default="Urban Greening")
    ownership_type = Column(String(80), default="Private")
    
    # Computed results
    compliance_score = Column(Integer, nullable=False)
    verdict = Column(String(100), nullable=False)
    verdict_badge = Column(String(20), default="green")  # green, amber, red
    primary_authority = Column(String(200), nullable=False)
    governing_law = Column(String(300), nullable=False)
    noc_required = Column(String(20), default="Conditional")
    
    factor_breakdown = Column(JSON, default=list)
    document_checklist = Column(JSON, default=list)
    recommended_species = Column(JSON, default=list)
    matched_schemes = Column(JSON, default=list)
    procedure_steps = Column(JSON, default=list)
