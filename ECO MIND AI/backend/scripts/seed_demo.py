import os
import sys

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import SessionLocal
from app.models.environmental import Base, EnvironmentalObservation
from app.schemas.environmental import (
    EnvironmentalObservationCreate, 
    Soil, 
    Climate, 
    Land, 
    Biodiversity, 
    HumanImpact,
    Location
)
from app.services import profile_service

def seed():
    db = SessionLocal()
    try:
        # Create demo profile data
        profile_data = EnvironmentalObservationCreate(
            soil=Soil(ph=6.2, organic_carbon=0.3, moisture=18.0),
            climate=Climate(temperature=29.0, rainfall=500.0),
            land=Land(use="agriculture", crop="wheat", cropping_system="monoculture"),
            biodiversity=Biodiversity(species_richness=12, habitat_diversity="low"),
            human_impact=HumanImpact(pollution="moderate", deforestation="low"),
            location=Location(latitude=19.2403, longitude=73.1305, region="Maharashtra, India"),
            source_name="Task 17 Scenario",
            source_type="Synthetic Demo",
            data_quality="Demo",
            confidence=1.0
        )
        
        # Check if profile 1 exists
        existing = profile_service.get_profile(db, 1)
        if existing:
            print("Updating existing Profile 1...")
            profile_service.update_profile(db, 1, profile_data)
        else:
            print("Creating Profile 1...")
            profile_service.create_profile(db, profile_data)
            
        print("Demo data seeded successfully.")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
