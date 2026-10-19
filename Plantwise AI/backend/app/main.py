import os
import uuid
import hashlib
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models.location import Location
from app.models.species import Species
from app.models.scheme import Scheme
from app.models.monitoring import MonitoringPlot
from app.models.certificate import Certificate
from app.data.seed_data import SAMPLE_LOCATIONS, SAMPLE_SPECIES, SAMPLE_SCHEMES, SAMPLE_MONITORING_PLOTS

from app.routers import locations, compliance, species, schemes, monitoring, certificates, assistant

# Ensure tables are created immediately
Base.metadata.create_all(bind=engine)

def seed_database():
    db = SessionLocal()
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)

        # 1. Seed / Upsert Locations (Ensure all 36 Maharashtra districts are populated)
        existing_names = {l.name for l in db.query(Location.name).all()}
        for loc_data in SAMPLE_LOCATIONS:
            if loc_data["name"] not in existing_names:
                loc = Location(**loc_data)
                db.add(loc)
        db.commit()

        # 2. Seed / Upsert Species
        existing_species = {s.botanical_name for s in db.query(Species.botanical_name).all()}
        for sp_data in SAMPLE_SPECIES:
            if sp_data["botanical_name"] not in existing_species:
                sp = Species(**sp_data)
                db.add(sp)
        db.commit()

        # 3. Seed / Upsert Schemes
        existing_schemes = {s.name for s in db.query(Scheme.name).all()}
        for sc_data in SAMPLE_SCHEMES:
            if sc_data["name"] not in existing_schemes:
                sc = Scheme(**sc_data)
                db.add(sc)
        db.commit()

        # 4. Seed / Upsert Monitoring Plots
        existing_plots = {p.plot_code for p in db.query(MonitoringPlot.plot_code).all()}
        for plt_data in SAMPLE_MONITORING_PLOTS:
            if plt_data["plot_code"] not in existing_plots:
                plt = MonitoringPlot(**plt_data)
                db.add(plt)
        db.commit()

        # 5. Seed Initial Certificate if none exists
        if db.query(Certificate).count() == 0:
            cert_id = "GP-CERT-INIT-001"
            v_hash = hashlib.sha256(b"GP-CERT-INIT-001:Hinjawadi").hexdigest()[:24].upper()
            init_cert = Certificate(
                certificate_id=cert_id,
                created_at=datetime.utcnow(),
                project_name="Pune Tech Corridor Biodiversity Plantation",
                planter_name="Aarav Deshmukh",
                planter_role="NGO Lead",
                organization="Pune Green Foundation",
                location_name="Hinjawadi IT Park Phase 3, Pune",
                district="Pune",
                latitude=18.5912,
                longitude=73.7029,
                land_type="Private Commercial / IT Park",
                trees_count=250,
                species_planted=["Neem (Azadirachta indica)", "Karanj (Pongamia pinnata)", "Jamun (Syzygium cumini)", "Bakul (Mimusops elengi)"],
                authority_reference="PMC/TREE/2026/P-441",
                compliance_score=94,
                verification_hash=v_hash,
                qr_data=f"https://greenpermit.ai/verify/{v_hash}?cert_id={cert_id}",
                status="Verified & Active"
            )
            db.add(init_cert)
            db.commit()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Seed database
    seed_database()
    yield
    # Shutdown logic if any

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="GIS-Based Smart Tree Plantation Planning & Legal Compliance System API",
    lifespan=lifespan
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(locations.router, prefix="/api")
app.include_router(compliance.router, prefix="/api")
app.include_router(species.router, prefix="/api")
app.include_router(schemes.router, prefix="/api")
app.include_router(monitoring.router, prefix="/api")
app.include_router(certificates.router, prefix="/api")
app.include_router(assistant.router, prefix="/api")

@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Serve frontend static files conditionally if directory exists (e.g. standalone backend deployment)
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist"))
if os.path.isdir(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
else:
    @app.get("/", tags=["Root"])
    def root():
        return {
            "status": "online",
            "service": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "message": "PlantWise AI Backend API is active. Frontend is hosted separately."
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
