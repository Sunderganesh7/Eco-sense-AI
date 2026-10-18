from sqlalchemy import Column, Integer, String, Text, JSON, Boolean
from app.database import Base

class Scheme(Base):
    __tablename__ = "government_schemes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(180), nullable=False, index=True)
    sponsor_level = Column(String(50), default="Central")  # Central, State (Maharashtra), Municipal
    state = Column(String(80), default="All India / Maharashtra")
    category = Column(String(80), default="Agroforestry & Reforestation")
    eligible_applicants = Column(JSON, default=list)  # ["Individual / Farmer", "NGO / Society", "School / Campus", "Gram Panchayat", "Corporate / CSR", "Municipal Body"]
    purpose_tags = Column(JSON, default=list)  # ["Agroforestry", "Urban Greening", "Reforestation", "Highway Buffer", "Memorial Plantation", "Catchment Protection"]
    
    financial_incentive = Column(String(200), default="Subsidized saplings + maintenance allowance")
    free_saplings_provided = Column(Boolean, default=True)
    eligibility_criteria = Column(Text, default="")
    required_documents = Column(JSON, default=list)
    application_authority = Column(String(150), default="Social Forestry Directorate / Forest Dept")
    application_portal_url = Column(String(250), default="")
    last_verified = Column(String(50), default="August 2026")
    summary = Column(Text, default="")
