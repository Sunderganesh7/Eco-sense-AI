"""
GreenPath AI — FastAPI Application Entry Point
Production-ready FastAPI application with:
  - MySQL Enterprise Database initialisation ('greenpath_ai')
  - CORS middleware
  - JWT auth (via router dependency)
  - All modular routers
  - Lifespan events (startup/shutdown)
  - OpenAPI docs at /docs
"""

import logging
import os
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from backend.config import settings
from backend.database.connection import init_database_schema, is_mysql_online
from backend.services.auth_service import bootstrap_admin

# ── Routers ───────────────────────────────────────────────────────────────────
from backend.routers.auth import router as auth_router
from backend.routers.analysis import router as analysis_router
from backend.routers.predictions import router as predictions_router
from backend.routers.reports import router as reports_router
from backend.routers.chatbot import router as chatbot_router
from backend.routers.map_routes import router as map_router
from backend.routers.training import router as training_router

# ── Logging setup ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("greenpath.main")


# ================================================================
# LIFESPAN (startup + shutdown)
# ================================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: initialize MySQL DB schema, bootstrap admin."""
    logger.info("🚀 GreenPath AI Backend starting up…")

    # Ensure required directories exist
    for folder in [
        settings.UPLOAD_FOLDER,
        settings.OUTPUT_FOLDER,
        os.path.join(settings.OUTPUT_FOLDER, "reports"),
        "datasets",
        "models",
    ]:
        os.makedirs(folder, exist_ok=True)

    # Connect & initialize MySQL Database schema (greenpath_ai)
    db_ok = init_database_schema()

    if db_ok:
        await bootstrap_admin()
        logger.info("GreenPath AI is ready! MySQL Enterprise connected.")
    else:
        logger.warning(
            "GreenPath AI started with MySQL offline or pending check. "
            "Visit /db-status for status."
        )
    yield
    logger.info("👋 GreenPath AI shut down cleanly.")


# ================================================================
# APP INSTANCE
# ================================================================
app = FastAPI(
    title="GreenPath AI API",
    description=(
        "🌿 **GreenPath AI** — Smart Environmental Monitoring & GeoAI Analytics Platform.\n\n"
        "**Features:**\n"
        "- YOLOv8 Tree Detection with Health Classification\n"
        "- NDVI & Vegetation Analysis\n"
        "- AQI & Environmental Intelligence\n"
        "- ML Predictive Analytics (AQI, Carbon, Heat)\n"
        "- AI Plantation Recommendations (Gemini)\n"
        "- Time-Series Satellite Comparison\n"
        "- PDF Environmental Report Generation\n"
        "- GeoAI Zone Mapping\n"
        "- Enterprise MySQL Auth with Admin/User Roles"
    ),
    version="2.0.0",
    contact={
        "name": "GreenPath AI Team",
        "url": "https://github.com/greenpath-ai",
    },
    license_info={"name": "MIT"},
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)


# ================================================================
# MIDDLEWARE
# ================================================================

# CORS — allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip compression for large responses
app.add_middleware(GZipMiddleware, minimum_size=1000)


# ================================================================
# GLOBAL EXCEPTION HANDLER
# ================================================================
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "Internal server error. Please try again.",
            "detail": str(exc) if settings.DEBUG else "Contact support.",
        },
    )


# ================================================================
# STATIC FILE SERVING (output images, uploads)
# ================================================================
app.mount(
    "/uploads",
    StaticFiles(directory=settings.UPLOAD_FOLDER),
    name="uploads",
)
app.mount(
    "/outputs",
    StaticFiles(directory=settings.OUTPUT_FOLDER),
    name="outputs",
)


# ================================================================
# ROUTERS
# ================================================================
API_PREFIX = "/api/v1"

app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(analysis_router, prefix=API_PREFIX)
app.include_router(predictions_router, prefix=API_PREFIX)
app.include_router(reports_router, prefix=API_PREFIX)
app.include_router(chatbot_router, prefix=API_PREFIX)
app.include_router(map_router, prefix=API_PREFIX)
app.include_router(training_router, prefix=API_PREFIX)


# ================================================================
# ROOT ENDPOINT
# ================================================================
@app.get("/", tags=["Health"])
async def root():
    db_ok = is_mysql_online()
    return {
        "app": "GreenPath AI",
        "version": "2.0.0",
        "status": "running",
        "database": "connected to MySQL (greenpath_ai)" if db_ok else "disconnected",
        "docs": "/docs",
        "environment": settings.APP_ENV,
    }


@app.get("/db-status", tags=["Health"])
async def db_status():
    """Check MySQL Enterprise connection status."""
    db_ok = is_mysql_online()
    if db_ok:
        return {
            "connected": True,
            "database": settings.MYSQL_DATABASE,
            "host": settings.MYSQL_HOST,
            "port": settings.MYSQL_PORT,
            "message": "MySQL Enterprise is connected and ready."
        }
    return {
        "connected": False,
        "database": settings.MYSQL_DATABASE,
        "message": "MySQL server is NOT reachable.",
        "note": "Verify MySQL service is running on port 3306."
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for load balancers / Docker."""
    return {
        "status": "healthy",
        "database": "connected" if is_mysql_online() else "offline",
        "version": "2.0.0",
    }


# ================================================================
# ENTRY POINT
# ================================================================
if __name__ == "__main__":
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info",
        workers=1,
    )
