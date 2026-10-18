"""
Comprehensive End-to-End Test Suite for Fasal.AI Smart Crop Advisory System
=============================================================================
Tests:
- FastAPI Application Lifespan & Startup
- MySQL Database Connectivity, Session Handling, and Schema Integrity
- User Registration, Password Hashing (bcrypt), JWT Token Generation & Verification
- Protected Endpoint Authentication & Authorization
- Profile CRUD Persistence
- Farmer Plots / Fields CRUD Persistence
- Verified 149 Crop Recommendation with Soil, Climate, State & Season inputs
- Crop Yield Prediction (Tonnes/Ha)
- Agmarknet Real Market Data & Price Prediction
- TFLite Disease Detection (Native Inference on Potato, Corn, Rice, Sugarcane)
- Fertilizer Recommendation (Chemical & Organic Remedies)
- Season-Aware Crop Rotation Planner & Plan Storage
- Real Open-Meteo Weather Integration
- Community Chat & User Feedback Persistence
"""

import os
import sys
import io
import time
import uuid
import pytest
from PIL import Image
from fastapi.testclient import TestClient

# Ensure api directory is in python path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API_DIR = os.path.join(ROOT_DIR, "api")
if API_DIR not in sys.path:
    sys.path.insert(0, API_DIR)

from main import app
from database import check_connection, get_db_session
from models import User, Profile, Field, RecommendationHistory, DiseaseScan, CropPlan


@pytest.fixture(scope="session")
def client():
    """Session-scoped TestClient that triggers FastAPI lifespan (loading models and DB)."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="session")
def test_user_credentials():
    """Generates unique test user credentials for isolation."""
    unique_suffix = uuid.uuid4().hex[:8]
    unique_phone = f"+919{int(unique_suffix, 16) % 1000000000:09d}"
    return {
        "email": f"farmer_{unique_suffix}@fasalai.test",
        "password": "StrongPassword123!",
        "full_name": f"Test Farmer {unique_suffix}",
        "phone": unique_phone,
        "state": "Uttar Pradesh",
        "district": "Lucknow",
    }


# ── 1. System Health & Database Connectivity ────────────────────────────

def test_health_check_endpoint(client):
    """Verify health endpoint reports healthy MySQL status, models loaded, and 149 crops."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "mysql"
    assert data["database_connected"] is True
    assert data["supported_crops_count"] == 149
    assert data["services"]["ml_models"] == "loaded"
    assert data["services"]["disease_detection"] == "loaded"
    assert data["services"]["weather"] == "open-meteo"


def test_mysql_direct_connection():
    """Directly verify MySQL connection and session execution."""
    from sqlalchemy import text
    assert check_connection() is True
    with get_db_session() as session:
        result = session.execute(text("SELECT 1 AS alive")).fetchone()
        assert result[0] == 1


# ── 2. Verified Crop Metadata ───────────────────────────────────────────

def test_crops_metadata_endpoint(client):
    """Verify supported crops list returns exactly 149 genuine crops and valid metadata."""
    response = client.get("/api/crops")
    assert response.status_code == 200
    data = response.json()
    assert data["total_crops"] == 149
    assert len(data["recommendation_crops"]) == 149
    assert "rice" in [c.lower() for c in data["recommendation_crops"]]
    assert "wheat" in [c.lower() for c in data["recommendation_crops"]]
    assert "maize" in [c.lower() for c in data["recommendation_crops"]]
    assert data["dataset_version"] == "v2_state_aware"


# ── 3. Authentication & Authorization ───────────────────────────────────

def test_user_registration_and_login(client, test_user_credentials):
    """Test user registration, secure password hashing, and JWT login."""
    # Register
    reg_resp = client.post(
        "/api/auth/register",
        json={
            "email": test_user_credentials["email"],
            "password": test_user_credentials["password"],
            "full_name": test_user_credentials["full_name"],
            "phone": test_user_credentials["phone"],
            "state": test_user_credentials["state"],
            "district": test_user_credentials["district"],
        },
    )
    assert reg_resp.status_code == 200
    reg_data = reg_resp.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == test_user_credentials["email"]

    # Duplicate registration should return 400
    dup_resp = client.post(
        "/api/auth/register",
        json={
            "email": test_user_credentials["email"],
            "password": test_user_credentials["password"],
        },
    )
    assert dup_resp.status_code == 400

    # Login with valid credentials
    login_resp = client.post(
        "/api/auth/login",
        json={
            "email": test_user_credentials["email"],
            "password": test_user_credentials["password"],
        },
    )
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    token = login_data["access_token"]
    assert token is not None

    # Login with invalid password
    bad_login = client.post(
        "/api/auth/login",
        json={
            "email": test_user_credentials["email"],
            "password": "WrongPassword999!",
        },
    )
    assert bad_login.status_code == 401

    # Verify token
    verify_resp = client.post(f"/api/auth/verify?token={token}")
    assert verify_resp.status_code == 200
    assert verify_resp.json()["valid"] is True


def test_protected_routes_require_auth(client):
    """Ensure unauthorized requests to protected endpoints return 401."""
    resp = client.get("/api/profile/me")
    assert resp.status_code == 401

    resp_fields = client.get("/api/fields")
    assert resp_fields.status_code == 401


# ── 4. Profile Management (MySQL Persistence) ───────────────────────────

def test_user_profile_crud(client, test_user_credentials):
    """Test getting and updating user profile with MySQL persistence."""
    # Login to obtain JWT
    login_resp = client.post(
        "/api/auth/login",
        json={
            "email": test_user_credentials["email"],
            "password": test_user_credentials["password"],
        },
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get profile
    get_resp = client.get("/api/profile/me", headers=headers)
    assert get_resp.status_code == 200
    prof = get_resp.json()["profile"]
    assert prof["email"] == test_user_credentials["email"]

    # Update profile
    updated_phone = f"+919{int(uuid.uuid4().hex[:8], 16) % 1000000000:09d}"
    updated_district = "Varanasi"
    put_resp = client.put(
        "/api/profile/me",
        headers=headers,
        json={
            "full_name": "Farmer Ganesh Kumar",
            "phone": updated_phone,
            "district": updated_district,
            "preferred_language": "hi",
        },
    )
    assert put_resp.status_code == 200

    # Verify persistence
    get_again = client.get("/api/profile/me", headers=headers)
    assert get_again.status_code == 200
    updated_data = get_again.json()["profile"]
    assert updated_data["phone"] == updated_phone
    assert updated_data["district"] == updated_district
    assert updated_data["preferred_language"] == "hi"


# ── 5. User Fields / Plots (MySQL Persistence) ──────────────────────────

def test_user_fields_crud(client, test_user_credentials):
    """Test creating, listing, and deleting farmer fields in MySQL."""
    login_resp = client.post(
        "/api/auth/login",
        json={
            "email": test_user_credentials["email"],
            "password": test_user_credentials["password"],
        },
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create field
    create_resp = client.post(
        "/api/fields",
        headers=headers,
        json={
            "name": "North Meadow Plot",
            "area_acres": 3.5,
            "soil_type": "Alluvial soil",
            "current_crop": "Wheat",
            "nitrogen": 85.0,
            "phosphorus": 45.0,
            "potassium": 40.0,
            "ph": 6.8,
            "irrigation_type": "Tube well",
        },
    )
    assert create_resp.status_code == 200
    created_field = create_resp.json()["field"]
    field_id = created_field["id"]
    assert created_field["name"] == "North Meadow Plot"

    # List fields
    list_resp = client.get("/api/fields", headers=headers)
    assert list_resp.status_code == 200
    fields = list_resp.json()["fields"]
    assert any(f["id"] == field_id for f in fields)

    # Delete field
    del_resp = client.delete(f"/api/fields/{field_id}", headers=headers)
    assert del_resp.status_code == 200

    # Verify deletion
    list_after = client.get("/api/fields", headers=headers)
    assert not any(f["id"] == field_id for f in list_after.json()["fields"])


# ── 6. Crop Recommendation Engine ───────────────────────────────────────

def test_crop_recommendation_standard_input(client):
    """Test crop recommendation returns ranked crops with genuine confidence & suitability."""
    payload = {
        "nitrogen": 90,
        "phosphorus": 42,
        "potassium": 43,
        "temperature": 22.5,
        "humidity": 65.0,
        "ph": 6.8,
        "rainfall": 120.0,
        "season": "kharif",
        "state": "Uttar Pradesh",
        "soil_type": "Alluvial soil",
        "top_n": 5,
    }
    resp = client.post("/api/recommend/crop", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "recommendations" in data
    recs = data["recommendations"]
    assert len(recs) > 0

    # Check top recommendation attributes
    top = recs[0]
    assert "crop" in top
    assert "confidence" in top
    assert "suitability_score" in top
    assert "agronomic_explanation" in top
    assert "season" in top
    assert top["confidence"] > 0

    # Ensure every recommended crop belongs to genuine crop vocabulary
    crops_resp = client.get("/api/crops")
    vocab = [c.lower() for c in crops_resp.json()["recommendation_crops"]]
    for r in recs:
        assert r["crop"].lower() in vocab


def test_crop_recommendation_edge_cases(client):
    """Test recommendation with boundary soil parameters."""
    boundary_payload = {
        "nitrogen": 140,
        "phosphorus": 80,
        "potassium": 100,
        "temperature": 35.0,
        "humidity": 40.0,
        "ph": 8.5,  # Alkaline soil
        "rainfall": 30.0,
        "season": "zaid",
        "state": "Rajasthan",
        "soil_type": "Desert soil",
    }
    resp = client.post("/api/recommend/crop", json=boundary_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["recommendations"]) > 0


# ── 7. Crop Yield Prediction ────────────────────────────────────────────

def test_crop_yield_prediction(client):
    """Test yield prediction ML model returns valid estimate in Tonnes/Ha."""
    payload = {
        "crop": "rice",
        "state": "Uttar Pradesh",
        "season": "kharif",
        "area": 2.0,
    }
    resp = client.post("/api/predict/yield", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "predicted_yield_per_hectare" in data
    assert data["predicted_yield_per_hectare"] > 0
    assert data["unit"] == "Tonnes/Ha"
    assert "total_estimated_production" in data


# ── 8. Market Price & Agmarknet Mandi Data ──────────────────────────────

def test_market_price_prediction(client):
    """Test price forecasting endpoint."""
    payload = {
        "crop": "Wheat",
        "state": "Uttar Pradesh",
        "month": 4,
        "year": 2026,
    }
    resp = client.post("/api/predict/price", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "predicted_modal_price" in data
    assert data["predicted_modal_price"] > 0
    assert data["unit"] == "Rs/Quintal"


def test_mandi_prices_lookup(client):
    """Test real Agmarknet mandi historical data retrieval."""
    resp = client.get("/api/market/mandi?commodity=Wheat&state=Uttar Pradesh")
    assert resp.status_code == 200
    data = resp.json()
    assert "records" in data
    assert "commodity" in data


# ── 9. TFLite Disease Detection ─────────────────────────────────────────

def test_disease_supported_crops(client):
    """Verify supported crops for disease detection (potato, corn, rice, sugarcane)."""
    resp = client.get("/api/disease/crops")
    assert resp.status_code == 200
    data = resp.json()
    crops = data["supported_crops"]
    crop_keys = [c["crop"] for c in crops]
    for expected in ["potato", "corn", "rice", "sugarcane"]:
        assert expected in crop_keys


def test_disease_detection_with_image(client):
    """Test TFLite disease detection with a valid synthetic leaf image."""
    # Create a 256x256 RGB test image
    img = Image.new("RGB", (256, 256), color=(34, 139, 34))  # Forest green leaf color
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    files = {"file": ("leaf.jpg", buf, "image/jpeg")}
    data = {"crop_type": "potato"}

    resp = client.post("/api/disease/detect", files=files, data=data)
    assert resp.status_code == 200
    res = resp.json()
    assert res.get("success") is True
    if not res.get("is_valid_leaf", True):
        assert "error" in res
    else:
        assert "disease" in res
        assert "confidence" in res
        assert res["confidence"] > 0
        assert "treatment" in res
        assert "prevention" in res
        assert res["crop"] == "Potato"


def test_disease_detection_unsupported_crop(client):
    """Test disease detection rejects unsupported crop gracefully."""
    img = Image.new("RGB", (100, 100), color=(50, 150, 50))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    files = {"file": ("leaf.jpg", buf, "image/jpeg")}
    data = {"crop_type": "mango"}

    resp = client.post("/api/disease/detect", files=files, data=data)
    assert resp.status_code == 400
    assert "Unsupported crop" in resp.json()["detail"]


# ── 10. Fertilizer Recommendation & Organic Guidance ───────────────────

def test_fertilizer_recommendation(client):
    """Test chemical and organic fertilizer recommendation."""
    payload = {
        "nitrogen": 40.0,
        "phosphorus": 20.0,
        "potassium": 20.0,
        "soil_type": "Clayey",
        "crop_type": "Wheat",
        "temperature": 25.0,
        "humidity": 60.0,
        "moisture": 45.0,
    }
    resp = client.post("/api/fertilizer/recommend", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "recommended_fertilizer" in data
    assert "organic_remedies" in data


# ── 11. Crop Rotation Planner ───────────────────────────────────────────

def test_crop_rotation_planner(client, test_user_credentials):
    """Test crop rotation suggestions and saving a plan."""
    payload = {
        "current_crop": "rice",
        "soil_type": "Alluvial soil",
        "season": "kharif",
        "state": "Uttar Pradesh",
    }
    resp = client.post("/api/planner/generate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "rotation_plan" in data
    assert len(data["rotation_plan"]) > 0

    # Save plan using authenticated user
    login_resp = client.post(
        "/api/auth/login",
        json={
            "email": test_user_credentials["email"],
            "password": test_user_credentials["password"],
        },
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    save_resp = client.post(
        "/api/planner/save",
        headers=headers,
        json={
            "field_name": "East Meadow",
            "current_crop": "rice",
            "soil_type": "Alluvial soil",
            "plan_data": data["rotation_plan"],
        },
    )
    assert save_resp.status_code == 200

    # Retrieve saved plans
    my_plans = client.get("/api/planner/my-plans", headers=headers)
    assert my_plans.status_code == 200
    assert len(my_plans.json()["plans"]) > 0


# ── 12. Open-Meteo Weather Integration ──────────────────────────────────

def test_open_meteo_weather_real_data(client):
    """Test live Open-Meteo weather coordinates for Delhi / Lucknow."""
    resp = client.get("/api/weather/current?lat=28.6139&lon=77.2090")
    assert resp.status_code == 200
    data = resp.json()
    assert "temperature" in data
    assert "humidity" in data
    assert "wind_speed" in data
    assert data.get("source") == "open-meteo"

    # Test 7-day forecast
    fc_resp = client.get("/api/weather/forecast?lat=28.6139&lon=77.2090")
    assert fc_resp.status_code == 200
    fc_data = fc_resp.json()
    assert "forecast" in fc_data
    assert len(fc_data["forecast"]) >= 5


# ── 13. Community Chat & Feedback (MySQL Persistence) ───────────────────

def test_community_messages_and_feedback(client, test_user_credentials):
    """Test posting and retrieving community messages and submitting feedback."""
    login_resp = client.post(
        "/api/auth/login",
        json={
            "email": test_user_credentials["email"],
            "password": test_user_credentials["password"],
        },
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Post message
    msg_resp = client.post(
        "/api/community/messages",
        headers=headers,
        json={"message": "Good harvest expected this Kharif season with Alluvial soil!"},
    )
    assert msg_resp.status_code == 200

    # Retrieve messages
    list_resp = client.get("/api/community/messages")
    assert list_resp.status_code == 200
    messages = list_resp.json()["messages"]
    assert any("Alluvial soil" in m["message"] for m in messages)

    # Submit feedback
    fb_resp = client.post(
        "/api/feedback",
        headers=headers,
        json={"rating": 5, "comment": "Excellent precision advisory tool for Indian farmers."},
    )
    assert fb_resp.status_code == 200
