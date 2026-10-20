from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import setup_logging
from app.core.exceptions import setup_exception_handlers
from app.api.v1.router import api_router
from app.api.v1.health import health_check

from app.database.base import Base
from app.database.connection import engine

setup_logging()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API for the EcoMind Environmental Intelligence System"
)

from fastapi import Request
from starlette.responses import JSONResponse

@app.middleware("http")
async def security_headers_and_limits_middleware(request: Request, call_next):
    # Request size limit check (if Content-Length is provided)
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            if int(content_length) > settings.MAX_REQUEST_SIZE:
                return JSONResponse(
                    status_code=413,
                    content={"error": {"code": 413, "message": "Request entity too large"}}
                )
        except ValueError:
            pass
            
    response = await call_next(request)
    
    # Add Security Headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    return response

# CORS configuration
cors_origins = []
if isinstance(settings.BACKEND_CORS_ORIGINS, str):
    import json
    try:
        parsed = json.loads(settings.BACKEND_CORS_ORIGINS)
        if isinstance(parsed, list):
            cors_origins = [str(o).strip().rstrip("/") for o in parsed if o]
        else:
            cors_origins = [str(settings.BACKEND_CORS_ORIGINS).strip().rstrip("/")]
    except Exception:
        cors_origins = [o.strip().rstrip("/") for o in settings.BACKEND_CORS_ORIGINS.split(",") if o.strip()]
elif isinstance(settings.BACKEND_CORS_ORIGINS, list):
    cors_origins = [str(o).strip().rstrip("/") for o in settings.BACKEND_CORS_ORIGINS if o]

# Ensure required production origins are always present
required_origins = [
    "https://eco-sense-ai-frontend-5zdt.vercel.app",
    "https://eco-sense-ai-one.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:8000",
]
for req in required_origins:
    if req not in cors_origins:
        cors_origins.append(req)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
setup_exception_handlers(app)

# Include v1 API router
app.include_router(api_router, prefix=settings.API_PREFIX)

# Compatibility route that delegates to v1 health check
@app.get("/api/health", summary="Compatibility Health Check", tags=["compatibility"])
def legacy_health_check():
    return health_check()
