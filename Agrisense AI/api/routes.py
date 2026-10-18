"""
API Routes — All endpoints for Smart Crop Advisory.
"""

from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form, Request
from pydantic import BaseModel, Field
from typing import Optional, List
import time
import random
import json
import os

from ml_service import (
    recommend_crop, predict_yield, predict_price,
    get_crop_list, get_yield_metadata, get_price_metadata,
    get_state_list, get_soil_types, get_state_crops, get_dataset_version,
    get_yield_districts
)
from scoring_engine import apply_scoring
from disease_service import detect_disease, get_supported_disease_crops
from auth_service import register_user, login_user, get_current_user, google_login
from profile_service import get_profile, save_profile, delete_profile
from fields_service import (
    get_fields, get_field, create_field, update_field, delete_field
)
from history_service import (
    save_recommendation, get_recommendation_history, delete_recommendation,
    save_disease_scan, get_disease_history, delete_disease_scan
)
from planner_service import (
    get_plans, get_plans_grouped, create_plan, update_plan,
    delete_plan, delete_plans_for_plot
)
from location_service import get_location_from_ip
from weather_service import get_current_weather, get_forecast, check_severe_weather
from email_service import send_weather_alert, check_and_send_alerts_for_all_users
from pest_service import get_pest_alerts, get_pest_for_crop, get_season_info, get_available_states as get_pest_states
from fertilizer_service import recommend_fertilizer, get_organic_remedies, get_fertilizer_metadata
from market_service import get_market_metadata, get_historical_prices, get_commodities_for_location

router = APIRouter(prefix="/api")

# ── Load state crop recommendations from JSON ────────────
STATE_RECS_PATH = os.path.join(os.path.dirname(__file__), "..", "datasets", "state_crop_recommendations.json")
_state_recs = {}
try:
    if os.path.exists(STATE_RECS_PATH):
        with open(STATE_RECS_PATH, "r", encoding="utf-8") as f:
            _state_recs = json.load(f)
        print(f"  [OK] State recommendations loaded ({len(_state_recs)} states)")
except Exception as e:
    print(f"  [WARN] Failed to load state recommendations: {e}")


# ── Pydantic Models ───────────────────────────────────────

class CropRecommendRequest(BaseModel):
    nitrogen: float = Field(..., ge=0, le=500, description="Nitrogen (N) in kg/ha")
    phosphorus: float = Field(..., ge=0, le=500, description="Phosphorus (P) in kg/ha")
    potassium: float = Field(..., ge=0, le=500, description="Potassium (K) in kg/ha")
    temperature: float = Field(..., ge=-10, le=60, description="Temperature in °C")
    humidity: float = Field(..., ge=0, le=100, description="Humidity in %")
    ph: float = Field(..., ge=0, le=14, description="Soil pH")
    rainfall: float = Field(..., ge=0, le=5000, description="Rainfall in mm")
    season: str = Field(default="kharif", description="Season: kharif, rabi, or zaid")
    previous_crop: Optional[str] = Field(default=None, description="Previous crop name")
    state: Optional[str] = Field(default=None, description="State name for location-aware recommendation")
    soil_type: Optional[str] = Field(default=None, description="Soil type (e.g., Alluvial soil, Red soil)")


class YieldPredictionRequest(BaseModel):
    state: str = Field(..., description="State name")
    district: Optional[str] = Field(default="", description="District name")
    crop: str = Field(..., description="Crop name")
    season: str = Field(default="Kharif", description="Season")
    area_ha: Optional[float] = Field(default=None, description="Area in hectares")
    area: Optional[float] = Field(default=None, description="Area in hectares")
    year: int = Field(default=2026, description="Year")


class PricePredictionRequest(BaseModel):
    state: str = Field(..., description="State name")
    district: Optional[str] = Field(default="", description="District name")
    market: Optional[str] = Field(default="", description="Market/Mandi name")
    commodity: Optional[str] = Field(default=None, description="Commodity/Crop name")
    crop: Optional[str] = Field(default=None, description="Crop name alias")
    variety: str = Field(default="Other", description="Variety")
    grade: str = Field(default="FAQ", description="Grade")
    min_price: Optional[float] = Field(default=None, gt=0, description="Minimum price Rs./Quintal")
    max_price: Optional[float] = Field(default=None, gt=0, description="Maximum price Rs./Quintal")
    month: int = Field(default=4, ge=1, le=12, description="Month (1-12)")
    year: int = Field(default=2026, description="Year")


class AuthRegisterRequest(BaseModel):
    phone: Optional[str] = Field(default=None, description="Phone number")
    email: Optional[str] = Field(default=None, description="Email address")
    password: str = Field(..., min_length=4, description="Password")
    name: str = Field(default="", description="Full name")
    full_name: Optional[str] = Field(default=None, description="Full name")
    state: Optional[str] = Field(default=None, description="State")
    district: Optional[str] = Field(default=None, description="District")


class AuthLoginRequest(BaseModel):
    phone: Optional[str] = Field(default=None, description="Phone number")
    email: Optional[str] = Field(default=None, description="Email address")
    password: str = Field(..., description="Password")


class GoogleLoginRequest(BaseModel):
    access_token: str = Field(..., description="Supabase access token from Google OAuth")


class ProfileRequest(BaseModel):
    name: str = ""
    full_name: Optional[str] = None
    district: str = ""
    state: str = ""
    language: str = "en"
    preferred_language: Optional[str] = None
    phone: Optional[str] = None
    role: str = "farmer"
    farm_size: Optional[float] = None
    crops_grown: list = []
    notifications: dict = {}
    email: str = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class FertilizerRequest(BaseModel):
    temperature: float = Field(default=25, description="Temperature in C")
    moisture: float = Field(default=50, description="Moisture %")
    rainfall: float = Field(default=100, description="Rainfall mm")
    ph: float = Field(default=6.5, description="Soil pH")
    nitrogen: float = Field(default=50, description="Nitrogen")
    phosphorous: float = Field(default=50, description="Phosphorous")
    potassium: float = Field(default=50, description="Potassium")
    carbon: float = Field(default=1.0, description="Carbon")
    soil: str = Field(default="Loamy", description="Soil type")
    crop: str = Field(default="Rice", description="Crop")


class OrganicRequest(BaseModel):
    nitrogen: float = Field(default=50, description="Nitrogen")
    phosphorous: float = Field(default=50, description="Phosphorous")
    potassium: float = Field(default=50, description="Potassium")


class CommunityMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="Message text")


class FieldRequest(BaseModel):
    label: str = "Unnamed Field"
    name: Optional[str] = None
    area_ha: float = 1.0
    area_acres: Optional[float] = None
    irrigation: str = "rainfed"
    irrigation_type: Optional[str] = None
    soil_n: float = 0
    nitrogen: Optional[float] = None
    soil_p: float = 0
    phosphorus: Optional[float] = None
    soil_k: float = 0
    potassium: Optional[float] = None
    soil_ph: float = 7.0
    ph: Optional[float] = None
    soil_type: str = ""
    previous_crop: str = ""
    current_crop: str = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: str = "active"

    def to_service_dict(self) -> dict:
        d = self.model_dump()
        if self.name and (not d.get("label") or d.get("label") == "Unnamed Field"):
            d["label"] = self.name
        if self.area_acres is not None:
            d["area_ha"] = round(self.area_acres * 0.404686, 2)
        if self.nitrogen is not None:
            d["soil_n"] = self.nitrogen
        if self.phosphorus is not None:
            d["soil_p"] = self.phosphorus
        if self.potassium is not None:
            d["soil_k"] = self.potassium
        if self.ph is not None:
            d["soil_ph"] = self.ph
        if self.irrigation_type is not None:
            d["irrigation"] = self.irrigation_type
        return d


class CropPlanRequest(BaseModel):
    field_id: Optional[int] = None
    plot_label: str = "Unnamed Plot"
    year: int = 2026
    crop: str = ""
    season: str = ""
    start_month: int = 1
    end_month: int = 3


def _extract_user(request: Request) -> dict:
    """Extract user from JWT token in Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated. Please login.")
    token = auth_header[7:]
    try:
        return get_current_user(token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


def _try_extract_user(request: Request) -> dict | None:
    """Try to extract user from JWT token. Returns None if not authenticated (non-blocking)."""
    try:
        return _extract_user(request)
    except HTTPException:
        return None


# ── Auth ──────────────────────────────────────────────────

@router.post("/auth/register")
async def api_register(req: AuthRegisterRequest):
    try:
        phone = req.phone or ""
        email = req.email or ""
        name = req.name or req.full_name or ""
        result = register_user(phone=phone, password=req.password, name=name, email=email)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/auth/login")
async def api_login(req: AuthLoginRequest):
    try:
        ident = req.phone or req.email or ""
        result = login_user(ident, req.password)
        return result
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/auth/verify")
async def api_verify(request: Request, token: Optional[str] = Query(default=None)):
    """Verify JWT token and return decoded user data."""
    try:
        tok = token
        if not tok:
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                tok = auth_header[7:]
        if not tok:
            raise ValueError("Token is required")
        user = get_current_user(tok)
        return {"valid": True, "user": user}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/auth/google")
async def api_google_login(req: GoogleLoginRequest):
    """Authenticate via Google OAuth using a Supabase access token."""
    try:
        result = google_login(req.access_token)
        return result
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Internal Server Error: {str(e)}")


# ── Profile ───────────────────────────────────────────────

@router.get("/profile")
@router.get("/profile/me")
async def api_get_profile(request: Request):
    user = _extract_user(request)
    profile = get_profile(user["user_id"])
    if profile:
        if "phone" not in profile or not profile["phone"]:
            profile["phone"] = user.get("phone", "")
        return {"profile": profile}
    return {"profile": {"name": user.get("name", ""), "phone": user.get("phone", "")}}


@router.put("/profile")
@router.put("/profile/me")
async def api_save_profile(req: ProfileRequest, request: Request):
    user = _extract_user(request)
    try:
        saved = save_profile(user["user_id"], req.model_dump())
        return {"profile": saved, "message": "Profile saved successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/profile")
@router.delete("/profile/me")
async def api_delete_profile(request: Request):
    user = _extract_user(request)
    delete_profile(user["user_id"])
    return {"message": "Profile and account deleted"}


# ── Fields ────────────────────────────────────────────────

@router.get("/fields")
async def api_get_fields(request: Request):
    """Get all fields/plots for the authenticated user."""
    user = _extract_user(request)
    fields = get_fields(user["user_id"])
    return {"fields": fields, "total": len(fields)}


@router.get("/fields/{field_id}")
async def api_get_field(field_id: int, request: Request):
    """Get a single field by ID."""
    user = _extract_user(request)
    field = get_field(user["user_id"], field_id)
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    return {"field": field}


@router.post("/fields")
async def api_create_field(req: FieldRequest, request: Request):
    """Create a new field/plot."""
    user = _extract_user(request)
    try:
        field = create_field(user["user_id"], req.to_service_dict())
        return {"field": field, "message": "Field created successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/fields/{field_id}")
async def api_update_field(field_id: int, req: FieldRequest, request: Request):
    """Update an existing field."""
    user = _extract_user(request)
    updated = update_field(user["user_id"], field_id, req.to_service_dict())
    if not updated:
        raise HTTPException(status_code=404, detail="Field not found")
    return {"field": updated, "message": "Field updated successfully"}


@router.delete("/fields/{field_id}")
async def api_delete_field(field_id: int, request: Request):
    """Delete a field."""
    user = _extract_user(request)
    deleted = delete_field(user["user_id"], field_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Field not found")
    return {"message": "Field deleted successfully"}


# ── Recommendation History ────────────────────────────────

@router.get("/recommendations/history")
async def api_get_recommendation_history(
    request: Request,
    limit: int = Query(default=20, ge=1, le=100, description="Number of records"),
):
    """Get the user's crop recommendation history."""
    user = _extract_user(request)
    history = get_recommendation_history(user["user_id"], limit)
    return {"history": history, "total": len(history)}


@router.delete("/recommendations/history/{record_id}")
async def api_delete_recommendation(record_id: int, request: Request):
    """Delete a recommendation history entry."""
    user = _extract_user(request)
    delete_recommendation(user["user_id"], record_id)
    return {"message": "Recommendation deleted"}


# ── Disease Scan History ──────────────────────────────────

@router.get("/disease/history")
async def api_get_disease_history(
    request: Request,
    limit: int = Query(default=20, ge=1, le=100, description="Number of records"),
):
    """Get the user's disease scan history."""
    user = _extract_user(request)
    history = get_disease_history(user["user_id"], limit)
    return {"history": history, "total": len(history)}


@router.delete("/disease/history/{scan_id}")
async def api_delete_disease_scan(scan_id: int, request: Request):
    """Delete a disease scan history entry."""
    user = _extract_user(request)
    delete_disease_scan(user["user_id"], scan_id)
    return {"message": "Scan deleted"}


# ── Crop Plans (Rotation Planner) ─────────────────────────

@router.get("/plans")
async def api_get_plans(
    request: Request,
    year: Optional[int] = Query(default=None, description="Filter by year"),
    grouped: bool = Query(default=True, description="Group plans by plot"),
):
    """Get all crop plans for the user."""
    user = _extract_user(request)
    if grouped:
        plans = get_plans_grouped(user["user_id"], year)
    else:
        plans = get_plans(user["user_id"], year)
    return {"plans": plans, "total": len(plans)}


@router.post("/plans")
async def api_create_plan(req: CropPlanRequest, request: Request):
    """Create a new crop plan entry."""
    user = _extract_user(request)
    try:
        plan = create_plan(user["user_id"], req.model_dump())
        return {"plan": plan, "message": "Plan entry created"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/plans/{plan_id}")
async def api_update_plan(plan_id: int, req: CropPlanRequest, request: Request):
    """Update an existing crop plan entry."""
    user = _extract_user(request)
    updated = update_plan(user["user_id"], plan_id, req.model_dump())
    if not updated:
        raise HTTPException(status_code=404, detail="Plan entry not found")
    return {"plan": updated, "message": "Plan updated"}


@router.delete("/plans/{plan_id}")
async def api_delete_plan(plan_id: int, request: Request):
    """Delete a crop plan entry."""
    user = _extract_user(request)
    delete_plan(user["user_id"], plan_id)
    return {"message": "Plan entry deleted"}


# ── Health ────────────────────────────────────────────────

@router.get("/health")
async def health_check():
    from database import check_connection as check_mysql
    db_ok = check_mysql()
    crops = get_crop_list()
    return {
        "status": "healthy" if db_ok else "degraded",
        "version": "3.0.0",
        "database": "mysql",
        "database_connected": db_ok,
        "dataset_version": get_dataset_version(),
        "supported_crops_count": len(crops),
        "services": {
            "ml_models": "loaded",
            "disease_detection": "loaded",
            "weather": "open-meteo",
            "geolocation": "ip-api",
            "email_alerts": "brevo",
            "pest_alerts": "loaded",
            "fertilizer": "loaded",
            "market_data": "agmarknet",
            "database": "mysql",
            "api": "running",
        }
    }



# ── Crop Recommendation ──────────────────────────────────

@router.post("/recommend/crop")
async def get_crop_recommendation(req: CropRecommendRequest, request: Request):
    start = time.time()
    try:
        # Get base ML predictions — get more candidates for scoring to filter
        base_results = recommend_crop(
            nitrogen=req.nitrogen,
            phosphorus=req.phosphorus,
            potassium=req.potassium,
            temperature=req.temperature,
            humidity=req.humidity,
            ph=req.ph,
            rainfall=req.rainfall,
            top_k=15,
            state=req.state,
            soil_type=req.soil_type,
        )

        # Get state-specific crop list for boosting
        state_crops_list = get_state_crops(req.state) if req.state else []

        # Apply scoring engine (constraints + bonuses + state boost)
        scored = apply_scoring(
            base_results=base_results,
            previous_crop=req.previous_crop,
            season=req.season,
            ph=req.ph,
            temperature=req.temperature,
            nitrogen=req.nitrogen,
            phosphorus=req.phosphorus,
            potassium=req.potassium,
            state=req.state,
            state_crops=state_crops_list,
        )

        for item in scored:
            item["confidence"] = item.get("confidence_pct", round(item.get("final_score", 0.8) * 100, 1))
            item["suitability_score"] = item.get("final_score", 0.8)
            item["agronomic_explanation"] = item.get("reason", "")
            item["season"] = req.season

        inference_ms = int((time.time() - start) * 1000)

        model_ver = f"rf-v2-state-aware" if get_dataset_version() == "v2_state_aware" else "rf-v1-legacy"

        response_data = {
            "recommendations": scored[:3],
            "model_version": model_ver,
            "dataset_version": get_dataset_version(),
            "inference_ms": inference_ms,
            "input_summary": {
                "soil": {"N": req.nitrogen, "P": req.phosphorus, "K": req.potassium, "pH": req.ph},
                "weather": {"temperature": req.temperature, "humidity": req.humidity, "rainfall": req.rainfall},
                "season": req.season,
                "previous_crop": req.previous_crop,
                "state": req.state,
                "soil_type": req.soil_type,
            },
        }

        # Save to history if user is authenticated (non-blocking — don't fail if not logged in)
        user = _try_extract_user(request)
        if user:
            try:
                save_recommendation(
                    user_id=user["user_id"],
                    input_data=response_data["input_summary"],
                    recommendations=scored[:3],
                    model_version=model_ver,
                    inference_ms=inference_ms,
                )
            except Exception:
                pass  # Don't fail the recommendation if saving history fails

        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── States & Location-Based Recommendations ──────────────

@router.get("/states")
async def list_states():
    """Return list of supported states."""
    model_states = get_state_list()
    all_state_names = sorted(set(model_states + list(_state_recs.keys())))
    return {
        "states": all_state_names,
        "model_states": model_states,
        "total": len(all_state_names),
    }


@router.get("/crops/by-state/{state}")
async def get_crops_by_state(state: str):
    """Return recommended crops for a state (before soil details are entered)."""
    # Get from dataset-trained model
    dataset_crops = get_state_crops(state)

    # Get from curated recommendations
    curated = _state_recs.get(state, {})
    curated_crops = curated.get("top_crops", [])

    # Merge: curated first, then dataset crops
    all_crops = []
    seen = set()
    for crop_info in curated_crops:
        if isinstance(crop_info, dict):
            all_crops.append(crop_info)
            seen.add(crop_info.get("name", "").lower())
        elif isinstance(crop_info, str):
            all_crops.append({"name": crop_info, "season": "Various"})
            seen.add(crop_info.lower())

    for crop_name in dataset_crops[:15]:
        if crop_name.lower() not in seen:
            all_crops.append({"name": crop_name, "season": "Various", "source": "dataset"})
            seen.add(crop_name.lower())

    return {
        "state": state,
        "crops": all_crops[:20],
        "soil_types": curated.get("soil_types", get_soil_types()),
        "climate": curated.get("climate", ""),
        "major_seasons": curated.get("major_seasons", ["Kharif", "Rabi", "Zaid"]),
    }


@router.get("/soil-types")
async def list_soil_types():
    """Return list of supported soil types."""
    return {"soil_types": get_soil_types()}


# ── Disease Detection ────────────────────────────────────

@router.get("/disease/crops")
async def disease_crops():
    """Return list of crops supported for disease detection."""
    crops_list = get_supported_disease_crops()
    return {
        "crops": crops_list,
        "supported_crops": crops_list,
    }


@router.post("/disease/detect")
async def disease_detect(
    request: Request,
    crop: Optional[str] = Form(default=None, description="Crop key: potato, corn, rice, sugarcane"),
    crop_type: Optional[str] = Form(default=None, description="Crop key alias"),
    image: Optional[UploadFile] = File(default=None, description="Leaf image file"),
    file: Optional[UploadFile] = File(default=None, description="Leaf image file alias"),
):
    """Detect disease from a leaf image."""
    try:
        target_crop = crop or crop_type
        if not target_crop:
            raise HTTPException(status_code=400, detail="Crop type is required (potato, corn, rice, sugarcane, other)")
        target_crop = target_crop.strip().lower()

        target_file = image or file
        if not target_file:
            raise HTTPException(status_code=400, detail="Image file is required")

        image_bytes = await target_file.read()
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty image file")

        # Limit file size (10MB)
        if len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image file too large (max 10MB)")

        result = detect_disease(crop=target_crop, image_bytes=image_bytes)

        if not result.get("success", False):
            raise HTTPException(status_code=400, detail=result.get("error", "Unknown error"))

        # Save to history if user is authenticated (non-blocking)
        user = _try_extract_user(request)
        if user:
            try:
                save_disease_scan(
                    user_id=user["user_id"],
                    crop=result.get("crop", target_crop),
                    disease=result.get("disease", "Unknown"),
                    confidence=result.get("confidence", 0),
                    is_healthy=result.get("is_healthy", False),
                    treatment=result.get("treatment", {}),
                    all_predictions=result.get("all_predictions", []),
                )
            except Exception:
                pass  # Don't fail the detection if saving history fails

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Yield Prediction ─────────────────────────────────────

@router.get("/yield/districts")
async def get_yield_districts_endpoint(
    state: str = Query(default="", description="State name"),
):
    """Return districts available in the yield dataset for a given state."""
    districts = get_yield_districts(state)
    return {"state": state, "districts": districts, "total": len(districts)}


@router.post("/predict/yield")
async def get_yield_prediction(req: YieldPredictionRequest):
    try:
        effective_area = req.area_ha or req.area or 1.0
        effective_district = req.district or "All"
        result = predict_yield(
            state=req.state,
            district=effective_district,
            crop=req.crop,
            season=req.season,
            area_ha=effective_area,
            year=req.year,
        )
        result["predicted_yield_per_hectare"] = result.get("predicted_yield_tonnes_per_ha", 0)
        result["total_estimated_production"] = result.get("predicted_total_tonnes", 0)
        result["unit"] = "Tonnes/Ha"
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Price Prediction ──────────────────────────────────────

@router.post("/predict/price")
async def get_price_prediction(req: PricePredictionRequest):
    try:
        commodity = req.commodity or req.crop or "Wheat"
        min_p = req.min_price or 2100.0
        max_p = req.max_price or 2400.0
        result = predict_price(
            state=req.state,
            district=req.district or "All",
            market=req.market or "All",
            commodity=commodity,
            variety=req.variety,
            grade=req.grade,
            min_price=min_p,
            max_price=max_p,
            month=req.month,
            year=req.year,
        )
        result["unit"] = "Rs/Quintal"
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Crops List ────────────────────────────────────────────

@router.get("/crops")
async def list_crops():
    crop_list = get_crop_list()
    return {
        "total_crops": len(crop_list),
        "recommendation_crops": crop_list,
        "yield_metadata": get_yield_metadata(),
        "price_metadata": get_price_metadata(),
        "dataset_version": get_dataset_version(),
    }


# ── Location Detection (ip-api / ipstack) ────────────────
@router.get("/location/detect")
async def detect_location(request: Request, ip: Optional[str] = Query(default=None)):
    """Detect user's location from IP address using free ip-api with ipstack fallback."""
    client_ip = ip
    if not client_ip:
        forwarded = request.headers.get("X-Forwarded-For", "")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()
            if ":" in client_ip and "." in client_ip:
                client_ip = client_ip.split(":")[0]
        else:
            client_ip = request.client.host if request.client else ""

    location = get_location_from_ip(client_ip)
    location["detected_ip"] = client_ip or "auto"
    return location


# ── Weather (Open-Meteo / OpenWeatherMap — Real Live Data) ──
@router.get("/weather/current")
async def get_current_weather_endpoint(
    lat: Optional[float] = Query(default=None),
    lon: Optional[float] = Query(default=None),
    latitude: Optional[float] = Query(default=None),
    longitude: Optional[float] = Query(default=None),
):
    """Return real current weather from Open-Meteo (or OpenWeatherMap)."""
    from weather_service import get_full_weather
    target_lat = lat if lat is not None else latitude
    target_lon = lon if lon is not None else longitude
    if target_lat is None or target_lon is None:
        raise HTTPException(status_code=400, detail="Latitude and longitude are required.")
    try:
        current, forecast, alerts, source = get_full_weather(target_lat, target_lon)
        current["source"] = source
        return current
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Weather data currently unavailable: {str(e)}")


@router.get("/weather/forecast")
async def get_forecast_weather_endpoint(
    lat: Optional[float] = Query(default=None),
    lon: Optional[float] = Query(default=None),
    latitude: Optional[float] = Query(default=None),
    longitude: Optional[float] = Query(default=None),
):
    """Return real 7-day weather forecast from Open-Meteo."""
    from weather_service import get_full_weather
    target_lat = lat if lat is not None else latitude
    target_lon = lon if lon is not None else longitude
    if target_lat is None or target_lon is None:
        raise HTTPException(status_code=400, detail="Latitude and longitude are required.")
    try:
        current, forecast, alerts, source = get_full_weather(target_lat, target_lon)
        return {"forecast": forecast, "source": source}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Weather forecast currently unavailable: {str(e)}")


@router.get("/weather/{lat}/{lon}")
async def get_weather_forecast_endpoint(lat: float, lon: float):
    """Return real live weather data from Open-Meteo (or OpenWeatherMap). Never uses fake data."""
    from weather_service import get_full_weather
    try:
        current, forecast, alerts, source = get_full_weather(lat, lon)
        return {
            "latitude": lat,
            "longitude": lon,
            "current": current,
            "forecast": forecast,
            "alerts": alerts,
            "source": source,
        }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Real-time weather data currently unavailable: {str(e)}. Fasal.AI does not return fabricated weather."
        )



@router.get("/weather/alerts/{lat}/{lon}")
async def get_weather_alerts(lat: float, lon: float, days: int = Query(default=2, ge=1, le=5)):
    """Check for severe weather alerts."""
    alerts = check_severe_weather(lat, lon, days_ahead=days)
    return {"alerts": alerts, "total": len(alerts)}


@router.post("/alerts/check-weather")
async def trigger_weather_alert_check(request: Request):
    """Manually trigger weather alert check for all users."""
    count = check_and_send_alerts_for_all_users()
    return {"message": f"Weather alert check complete. {count} alert emails sent.", "alerts_sent": count}


@router.get("/alerts/my-alerts")
async def get_my_alerts(request: Request, limit: int = Query(default=10, ge=1, le=50)):
    """Get the current user's recent weather alerts from MySQL."""
    user = _extract_user(request)
    from database import get_db_context
    from models import WeatherAlert
    with get_db_context() as db:
        alerts = (
            db.query(WeatherAlert)
            .filter(WeatherAlert.user_id == user["user_id"])
            .order_by(WeatherAlert.sent_at.desc())
            .limit(limit)
            .all()
        )
        data = [a.to_dict() for a in alerts]
        return {"alerts": data, "total": len(data)}



# ── Market Prices (Real Data — Agmarknet) ────────────────

@router.get("/market/prices")
@router.get("/market/mandi")
async def get_market_prices(
    commodity: str = Query(default="Wheat", description="Commodity name"),
    state: str = Query(default="", description="State name"),
    district: str = Query(default="", description="District name"),
    market: str = Query(default="", description="Market/Mandi name"),
    days: int = Query(default=90, ge=1, le=365, description="Number of days"),
):
    """Return real market price history from agmarknet dataset."""
    result = get_historical_prices(
        commodity=commodity, state=state, district=district,
        market=market, days=days,
    )

    # Format for frontend compatibility
    prices_formatted = []
    for p in result.get("prices", []):
        prices_formatted.append({
            "date": p.get("date", ""),
            "mandi": market or f"{district} Mandi" if district else "All Markets",
            "price_per_quintal": p.get("modal_price", 0),
            "min_price": p.get("min_price", 0),
            "max_price": p.get("max_price", 0),
        })

    summary = result.get("summary", {})
    return {
        "crop": commodity,
        "commodity": commodity,
        "state": state,
        "district": district,
        "market": market,
        "prices": prices_formatted,
        "records": prices_formatted,
        "trend": summary.get("trend", "stable"),
        "latest_price": summary.get("latest_price", 0),
        "average_price": summary.get("average_price", 0),
        "data_points": summary.get("data_points", 0),
        "source": result.get("source", "agmarknet"),
    }


@router.get("/market/metadata")
async def get_market_metadata_endpoint():
    """Return available states, districts, markets, and commodities for dropdown filters."""
    metadata = get_market_metadata()
    return metadata


@router.get("/market/commodities")
async def get_market_commodities(
    state: str = Query(default="", description="State name"),
    district: str = Query(default="", description="District name"),
):
    """Return available commodities for a state/district."""
    commodities = get_commodities_for_location(state, district)
    return {"commodities": commodities, "total": len(commodities)}


# ── Pest Alerts ──────────────────────────────────────────

@router.get("/pests/alerts")
async def get_pest_alerts_endpoint(
    state: str = Query(default="", description="State name"),
    season: str = Query(default="", description="Season: kharif, rabi, zaid"),
):
    """Get pest alerts for a state and season."""
    if not state:
        return {"error": "State is required", "crops": []}
    result = get_pest_alerts(state, season or None)
    return result


@router.get("/pests/crop/{crop_key}")
async def get_pest_for_crop_endpoint(crop_key: str):
    """Get pest profile for a specific crop."""
    result = get_pest_for_crop(crop_key)
    return result


@router.get("/pests/season")
async def get_season_info_endpoint():
    """Get current agricultural season info."""
    return get_season_info()


@router.get("/pests/states")
async def get_pest_states_endpoint():
    """Get available states in the pest knowledge base."""
    states = get_pest_states()
    return {"states": states, "total": len(states)}


# ── Fertilizer Recommendation ────────────────────────────

@router.post("/fertilizer/recommend")
async def fertilizer_recommend_endpoint(req: FertilizerRequest):
    """Get ML-based fertilizer recommendation."""
    result = recommend_fertilizer(
        temperature=req.temperature, moisture=req.moisture,
        rainfall=req.rainfall, ph=req.ph,
        nitrogen=req.nitrogen, phosphorous=req.phosphorous,
        potassium=req.potassium, carbon=req.carbon,
        soil=req.soil, crop=req.crop,
    )
    if "recommendations" in result and result["recommendations"]:
        result["recommended_fertilizer"] = result["recommendations"][0]["fertilizer"]
    else:
        result["recommended_fertilizer"] = "Balanced NPK Fertilizer"

    # Include organic remedies
    organic = get_organic_remedies(
        nitrogen=req.nitrogen, phosphorous=req.phosphorous, potassium=req.potassium
    )
    result["organic_remedies"] = organic.get("remedies", [])
    return result


@router.post("/fertilizer/organic")
async def organic_remedies_endpoint(req: OrganicRequest):
    """Get organic fertilizer recommendations for low NPK values."""
    result = get_organic_remedies(
        nitrogen=req.nitrogen,
        phosphorous=req.phosphorous,
        potassium=req.potassium,
    )
    return result


@router.get("/fertilizer/metadata")
async def fertilizer_metadata_endpoint():
    """Get fertilizer model metadata (available types, soils, crops)."""
    return get_fertilizer_metadata()


# ── Crop Rotation Planner ────────────────────────────────

class PlanGenerateRequest(BaseModel):
    current_crop: str = Field(..., description="Current crop")
    soil_type: str = Field(default="Alluvial soil", description="Soil type")
    season: str = Field(default="kharif", description="Current season: kharif, rabi, zaid")
    state: Optional[str] = Field(default=None, description="State name")
    year: int = Field(default=2026, description="Year")


class PlanSaveRequest(BaseModel):
    field_name: Optional[str] = Field(default="Main Plot", description="Field name")
    plot_label: Optional[str] = Field(default="Main Plot", description="Plot label")
    current_crop: Optional[str] = Field(default="", description="Current crop")
    soil_type: Optional[str] = Field(default="", description="Soil type")
    plan_data: Optional[list] = Field(default=[], description="Plan entries")
    year: int = Field(default=2026, description="Year")
    season: Optional[str] = Field(default="", description="Season")
    crop: Optional[str] = Field(default="", description="Crop")
    start_month: int = Field(default=1, description="Start month")
    end_month: int = Field(default=3, description="End month")
    field_id: Optional[int] = Field(default=None, description="Field ID")


@router.post("/planner/generate")
async def generate_crop_plan_endpoint(req: PlanGenerateRequest):
    """Generate season-aware crop rotation recommendations from documented agronomic rules."""
    seasons = ["rabi", "zaid", "kharif", "rabi"]
    season_info_map = {
        "rabi": {"label": "Rabi (Nov-Mar)", "start": 11, "end": 3},
        "kharif": {"label": "Kharif (Jun-Oct)", "start": 6, "end": 10},
        "zaid": {"label": "Zaid (Mar-Jun)", "start": 3, "end": 6},
    }
    rotation_plan = []
    last_crop = req.current_crop.lower()
    year = req.year

    cereal_crops = ["rice", "wheat", "maize", "barley", "bajra", "jowar"]
    legume_crops = ["chickpea", "lentil", "moong(green gram)", "urad", "gram", "peas", "soyabean"]

    for i, s in enumerate(seasons):
        if last_crop in cereal_crops:
            chosen = "Chickpea" if s == "rabi" else ("Moong(Green Gram)" if s == "zaid" else "Soyabean")
            reason = "Legume after cereal naturally restores soil nitrogen and breaks pest cycles"
        elif last_crop in legume_crops:
            chosen = "Wheat" if s == "rabi" else ("Cucumber" if s == "zaid" else "Rice")
            reason = "Cereal capitalizes on fixed nitrogen reserves left by prior legume"
        else:
            chosen = "Mustard" if s == "rabi" else ("Watermelon" if s == "zaid" else "Maize")
            reason = "Deep-rooting rotation improves soil aeration and prevents soil fatigue"

        s_info = season_info_map[s]
        rotation_plan.append({
            "season": s,
            "season_label": s_info["label"],
            "crop": chosen,
            "recommended_crop": chosen,
            "reason": reason,
            "agronomic_rationale": reason,
            "start_month": s_info["start"],
            "end_month": s_info["end"],
            "year": year if s != "rabi" or i != 0 else year - 1,
        })
        last_crop = chosen.lower()

    return {
        "current_crop": req.current_crop,
        "soil_type": req.soil_type,
        "state": req.state,
        "rotation_plan": rotation_plan,
        "total_seasons": len(rotation_plan),
    }


@router.get("/planner/plans")
@router.get("/planner/my-plans")
async def get_crop_plans_endpoint(request: Request, year: Optional[int] = Query(default=None)):
    """Get all saved crop rotation plans for the authenticated user from MySQL."""
    user = _extract_user(request)
    plans = get_plans_grouped(user["user_id"], year)
    flat_plans = get_plans(user["user_id"], year)
    return {"plans": plans if plans else flat_plans, "grouped": plans, "total": len(flat_plans)}


@router.post("/planner/plans")
@router.post("/planner/save")
async def save_crop_plan_endpoint(req: PlanSaveRequest, request: Request):
    """Save a crop rotation plan to MySQL."""
    user = _extract_user(request)
    plot_label = req.plot_label or req.field_name or "Main Plot"

    # If plan_data array is provided, save multiple entries
    if req.plan_data:
        saved_entries = []
        for item in req.plan_data:
            entry = create_plan(user["user_id"], {
                "field_id": req.field_id,
                "plot_label": plot_label,
                "year": item.get("year", req.year),
                "crop": item.get("recommended_crop", item.get("crop", "")),
                "season": item.get("season", ""),
                "start_month": item.get("start_month", 1),
                "end_month": item.get("end_month", 3),
            })
            saved_entries.append(entry)
        return {"saved": saved_entries, "message": f"Saved {len(saved_entries)} plan entries to MySQL"}
    else:
        entry = create_plan(user["user_id"], {
            "field_id": req.field_id,
            "plot_label": plot_label,
            "year": req.year,
            "crop": req.crop,
            "season": req.season,
            "start_month": req.start_month,
            "end_month": req.end_month,
        })
        return {"plan": entry, "message": "Crop plan saved successfully"}


@router.delete("/planner/plans/{plan_id}")
async def delete_crop_plan_endpoint(plan_id: int, request: Request):
    """Delete a saved crop rotation plan entry."""
    user = _extract_user(request)
    deleted = delete_plan(user["user_id"], plan_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Crop plan not found")
    return {"message": "Crop plan deleted successfully"}


# ── Community Chat ───────────────────────────────────────

@router.get("/community/messages")
async def get_community_messages(
    limit: int = Query(default=50, ge=1, le=200),
    before: Optional[int] = Query(default=None, description="Get messages before this ID"),
):
    """Get community chat messages from MySQL (paginated)."""
    from database import get_db_context
    from models import CommunityMessage
    with get_db_context() as db:
        query = db.query(CommunityMessage)
        if before:
            query = query.filter(CommunityMessage.id < before)
        messages = query.order_by(CommunityMessage.created_at.desc()).limit(limit).all()
        data = list(reversed([m.to_dict() for m in messages]))
        return {"messages": data, "total": len(data)}


@router.post("/community/messages")
async def send_community_message(req: CommunityMessageRequest, request: Request):
    """Send a message to the community chat and save in MySQL."""
    user = _extract_user(request)
    from database import get_db_context
    from models import CommunityMessage
    with get_db_context() as db:
        new_msg = CommunityMessage(
            user_id=user["user_id"],
            user_name=user.get("name") or "Anonymous",
            message=req.message.strip(),
            message_type="text",
        )
        db.add(new_msg)
        db.flush()
        return {"message": new_msg.to_dict(), "success": True}


@router.get("/community/online")
async def get_online_count():
    """Get approximate online user count based on recent activity."""
    import datetime
    from database import get_db_context
    from models import CommunityMessage
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(minutes=5)
    with get_db_context() as db:
        recent = db.query(CommunityMessage.user_id).filter(CommunityMessage.created_at >= cutoff).all()
        unique_users = set(r[0] for r in recent)
        return {"online_count": max(1, len(unique_users)), "active_in_last_5min": len(unique_users)}


# ── Feedback ─────────────────────────────────────────────

class FeedbackRequest(BaseModel):
    area: str = "general"
    message: str = ""
    comment: Optional[str] = None
    rating: Optional[int] = None


@router.post("/feedback")
async def submit_feedback(req: FeedbackRequest, request: Request):
    """Submit user feedback to MySQL."""
    user = _extract_user(request)
    msg = req.message.strip() or (req.comment or "").strip()
    if not msg:
        raise HTTPException(status_code=400, detail="Feedback message cannot be empty")
    area = req.area.strip() or "general"

    from database import get_db_context
    from models import Feedback
    with get_db_context() as db:
        new_fb = Feedback(
            user_id=user["user_id"],
            user_name=user.get("name") or "Anonymous",
            area=req.area.strip(),
            message=req.message.strip(),
        )
        db.add(new_fb)
        db.flush()
        return {"feedback": new_fb.to_dict(), "success": True}


@router.get("/feedback")
async def get_feedback_history(
    request: Request,
    limit: int = Query(default=10, ge=1, le=50),
):
    """Get the current user's feedback history from MySQL."""
    user = _extract_user(request)
    from database import get_db_context
    from models import Feedback
    with get_db_context() as db:
        fbs = (
            db.query(Feedback)
            .filter(Feedback.user_id == user["user_id"])
            .order_by(Feedback.created_at.desc())
            .limit(limit)
            .all()
        )
        data = [f.to_dict() for f in fbs]
        return {"feedback": data, "total": len(data)}



# ── Speech-to-Text (Azure) ──────────────────────────────

@router.post("/speech-to-text")
async def speech_to_text_endpoint(
    audio: UploadFile = File(...),
    language: str = Form(default="en-IN"),
):
    """
    Convert speech audio to text using Azure Cognitive Services.
    Accepts audio file (WAV/WebM/OGG) and optional language code.
    """
    from speech_service import transcribe_audio

    result = await transcribe_audio(audio, language)

    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("error", "Speech recognition failed"))

    return result


# ── Azure AI Translation Proxy ──────────────────────────

class TranslateRequest(BaseModel):
    texts: List[str]
    target_language: str
    source_language: str = "en"

@router.post("/translate")
async def translate_endpoint(req: TranslateRequest):
    """
    Secure proxy for translating dynamic blocks using Azure Cognitive Services.
    """
    from translator_service import translate_texts
    try:
        translated = translate_texts(req.texts, req.target_language, req.source_language)
        return {"translations": translated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
