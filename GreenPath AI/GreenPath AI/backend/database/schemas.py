"""
GreenPath AI -- API Schemas (Pure Pydantic -- MySQL Backend)
Defines request/response models for the FastAPI routers.
MongoDB Document classes have been removed; the project uses MySQL exclusively.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from enum import Enum

from pydantic import BaseModel, EmailStr, Field

# Re-export from canonical models location for backward compatibility
from backend.models.detection_models import TreeDetectionResult, TreeHealthStatus


# ================================================================
# ENUMERATIONS
# ================================================================

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
    RESEARCHER = "researcher"


class AnalysisStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class AQICategory(str, Enum):
    GOOD = "Good"
    MODERATE = "Moderate"
    UNHEALTHY_SENSITIVE = "Unhealthy for Sensitive Groups"
    UNHEALTHY = "Unhealthy"
    VERY_UNHEALTHY = "Very Unhealthy"
    HAZARDOUS = "Hazardous"


# ================================================================
# STUB DOCUMENT CLASSES (Pure Pydantic -- no MongoDB connection)
# ================================================================

class UserDocument(BaseModel):
    """User stub -- backed by MySQL via mysql_db.py."""
    id: Optional[Any] = None
    name: str = ""
    email: str = ""
    role: UserRole = UserRole.RESEARCHER
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    total_analyses: int = 0
    total_reports: int = 0


class AnalysisDocument(BaseModel):
    """Analysis stub -- backed by MySQL via mysql_db.py."""
    id: Optional[Any] = None
    user_id: Optional[str] = None
    image_filename: str = ""
    original_filename: str = ""
    status: AnalysisStatus = AnalysisStatus.PENDING
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    tree_count: int = 0
    green_cover_percent: float = 0.0
    non_green_percent: float = 0.0
    co2_absorption_kg: float = 0.0
    eco_index: float = 0.0
    aqi_score: int = 0
    aqi_category: str = ""
    vegetation_score: float = 0.0
    clarity_score: float = 0.0
    heat_reduction_celsius: float = 0.0
    estimated_temp_celsius: float = 0.0
    cooling_level: str = ""
    ndvi_mean: float = 0.0
    ndvi_min: float = 0.0
    ndvi_max: float = 0.0
    ndvi_image_path: Optional[str] = None
    detections: List[TreeDetectionResult] = []
    tree_health_summary: Dict[str, int] = {}
    zone_distribution: Dict[str, int] = {}
    zone_classifications: Dict[str, str] = {}
    yolo_output_path: Optional[str] = None
    heatmap_path: Optional[str] = None
    green_cover_path: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_name: Optional[str] = None
    error_message: Optional[str] = None


class ReportDocument(BaseModel):
    """Report stub -- backed by MySQL via mysql_db.py."""
    id: Optional[Any] = None
    user_id: str = ""
    analysis_id: str = ""
    title: str = ""
    report_filename: str = ""
    file_size_bytes: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    download_count: int = 0
    metadata: Dict[str, Any] = {}


class PredictionDocument(BaseModel):
    """Prediction stub -- backed by MySQL via mysql_db.py."""
    id: Optional[Any] = None
    user_id: Optional[str] = None
    analysis_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    current_tree_count: int = 0
    current_green_cover: float = 0.0
    current_aqi_score: int = 0
    current_temp: float = 0.0
    predicted_aqi: List[float] = []
    predicted_carbon: List[float] = []
    predicted_temp: List[float] = []
    prediction_months: List[str] = []
    aqi_r2_score: float = 0.0
    carbon_r2_score: float = 0.0


class ChatMessage(BaseModel):
    """Single chat message."""
    role: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ChatHistoryDocument(BaseModel):
    """Chat history stub."""
    id: Optional[Any] = None
    user_id: Optional[str] = None
    session_id: str = ""
    messages: List[ChatMessage] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    message_count: int = 0


# ================================================================
# API REQUEST MODELS
# ================================================================

class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[str] = None
    analysis_context: Optional[Dict[str, Any]] = None


class PredictionRequest(BaseModel):
    tree_count: int = Field(..., ge=0)
    green_cover_percent: float = Field(..., ge=0, le=100)
    aqi_score: int = Field(..., ge=0, le=500)
    current_temp: float = Field(35.0, ge=-50, le=60)
    months_ahead: int = Field(12, ge=1, le=24)


class CoordinateRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    zoom: int = Field(17, ge=10, le=20)
    radius_km: float = Field(1.0, ge=0.1, le=10)


# ================================================================
# API RESPONSE MODELS
# ================================================================

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Dict[str, Any]


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
    total_analyses: int
    total_reports: int


class AnalysisSummaryResponse(BaseModel):
    id: str
    image_filename: str
    tree_count: int
    green_cover_percent: float
    aqi_category: str
    eco_index: float
    status: str
    created_at: datetime


class FullAnalysisResponse(BaseModel):
    id: str
    status: str
    tree_count: int
    green_cover_percent: float
    non_green_percent: float
    co2_absorption_kg: float
    eco_index: float
    aqi_score: int
    aqi_category: str
    heat_reduction_celsius: float
    estimated_temp_celsius: float
    cooling_level: str
    ndvi_mean: float
    tree_health_summary: Dict[str, int]
    zone_classifications: Dict[str, str]
    yolo_output_path: Optional[str]
    heatmap_path: Optional[str]
    ndvi_image_path: Optional[str]
    created_at: datetime


class DashboardStatsResponse(BaseModel):
    total_analyses: int
    total_trees_detected: int
    avg_green_cover: float
    avg_aqi_score: float
    total_co2_absorbed_kg: float
    total_reports: int
    recent_analyses: List[AnalysisSummaryResponse]
    monthly_tree_counts: List[Dict[str, Any]]
    monthly_aqi_scores: List[Dict[str, Any]]
    zone_health_distribution: Dict[str, int]


class APIResponse(BaseModel):
    """Generic API response wrapper."""
    success: bool
    message: str
    data: Optional[Any] = None
    error: Optional[str] = None
