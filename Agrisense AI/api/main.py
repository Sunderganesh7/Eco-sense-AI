"""
Smart Crop Advisory -- FastAPI Backend
=====================================
Loads ML models, pest/fertilizer data, market data, and serves crop advisory APIs.
Includes background scheduler for weather alerts via Brevo.
Uses Supabase (PostgreSQL) for user data persistence.
"""

import os
import asyncio
from dotenv import load_dotenv

# Load environment variables from .env file (if present)
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from ml_service import load_models
from disease_service import load_disease_models
from auth_service import init_db as init_auth_db
from pest_service import load_pest_data
from fertilizer_service import load_fertilizer_models
from market_service import load_market_data
from routes import router


# ── Background Weather Alert Scheduler ──────────────────
ALERT_CHECK_INTERVAL_HOURS = 6


async def _weather_alert_loop():
    """Background task: check weather alerts every N hours and send emails."""
    from email_service import check_and_send_alerts_for_all_users

    # Wait 60s after startup before first check
    await asyncio.sleep(60)

    while True:
        try:
            print(f"\n[SCHEDULER] Running weather alert check...")
            count = check_and_send_alerts_for_all_users()
            print(f"[SCHEDULER] Done. Alerts sent: {count}")
        except Exception as e:
            print(f"[SCHEDULER ERROR] {e}")

        # Sleep for N hours
        await asyncio.sleep(ALERT_CHECK_INTERVAL_HOURS * 3600)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML models and data before the app starts serving requests."""
    print("=" * 60)
    print("  Smart Crop Advisory -- Starting Server")
    print("=" * 60)

    # Core ML models
    load_models()
    load_disease_models()
    init_auth_db()

    # New services
    load_pest_data()
    load_fertilizer_models()
    load_market_data()

    print("=" * 60)
    print("  All systems ready!")
    print("=" * 60)

    # Start background weather alert scheduler
    alert_task = asyncio.create_task(_weather_alert_loop())

    yield

    # Cleanup
    alert_task.cancel()
    print("Shutting down...")


app = FastAPI(
    title="Smart Crop Advisory API",
    description="AI-powered crop recommendation, yield prediction, market price forecasting, disease detection, pest alerts, and fertilizer recommendations for Indian farmers.",
    version="3.0.0",
    lifespan=lifespan,
)

# CORS -- allow production origins and dev environments
ALLOWED_ORIGINS = [
    "https://eco-sense-ai-web.vercel.app",
    "https://eco-sense-ai-beta.vercel.app",
    "https://eco-sense-ai-w7d6.vercel.app",
    "https://eco-sense-ai-one.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:8000",
    "http://localhost:3000",
]

env_origins = os.getenv("ALLOWED_ORIGINS")
if env_origins:
    for o in env_origins.split(","):
        clean_o = o.strip()
        if clean_o and clean_o not in ALLOWED_ORIGINS:
            ALLOWED_ORIGINS.append(clean_o)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$|^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    origin = request.headers.get("origin")
    headers = {}
    if origin and (origin in ALLOWED_ORIGINS or ".vercel.app" in origin):
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
        headers=headers,
    )

# Register API routes
app.include_router(router)


@app.get("/")
async def root():
    return {
        "name": "Fasal.AI Smart Crop Advisory API",
        "version": "3.0.0",
        "database": "mysql",
        "docs": "/docs",
        "health": "/api/health",
        "features": [
            "Crop Recommendation (State & Soil-Aware)",
            "Yield Prediction (Tonnes/Ha)",
            "Price Prediction (Agmarknet Mandi Real Data)",
            "Disease Detection (Potato, Corn, Rice, Sugarcane TFLite)",
            "Free Keyless Geolocation (ip-api)",
            "Real Weather & 7-Day Forecast (Open-Meteo)",
            "Weather Email Alerts (Brevo)",
            "Pest Risk Alert System",
            "Fertilizer Recommendation (ML + Organic Remedies)",
            "Community Chat (MySQL)",
            "User Fields Management (MySQL)",
            "Recommendation & Scan History (MySQL)",
            "Crop Rotation Planner (MySQL)",
        ],
    }

