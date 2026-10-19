import sys
import os
from pathlib import Path
from datetime import datetime, timedelta
import pytest
import jwt

api_dir = Path(__file__).resolve().parent.parent / "api"
if str(api_dir) not in sys.path:
    sys.path.insert(0, str(api_dir))

from fastapi.testclient import TestClient
from main import app
from auth_service import JWT_SECRET, JWT_ALGORITHM


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_demo_login_success(client):
    """Test demo login with default credentials returns a valid JWT token and user info without database."""
    res = client.post("/api/auth/login", json={
        "email": "admin@capportal.gov.in",
        "password": "admin123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "token" in data and "access_token" in data
    assert data["user"]["email"] == "admin@capportal.gov.in"
    assert data["user"]["role"] == "demo_user"
    assert data["user"]["is_demo"] is True
    assert data["user"]["id"] == -1


def test_demo_login_invalid_password(client):
    """Test demo login with wrong password returns 401."""
    res = client.post("/api/auth/login", json={
        "email": "admin@capportal.gov.in",
        "password": "wrongpassword123"
    })
    assert res.status_code == 401


def test_demo_token_verification(client):
    """Test that the issued demo JWT token can be verified via /api/auth/verify."""
    login_res = client.post("/api/auth/login", json={
        "email": "admin@capportal.gov.in",
        "password": "admin123"
    })
    token = login_res.json()["token"]

    verify_res = client.post("/api/auth/verify", headers={"Authorization": f"Bearer {token}"})
    assert verify_res.status_code == 200
    vdata = verify_res.json()
    assert vdata["valid"] is True
    assert vdata["user"]["role"] == "demo_user"
    assert vdata["user"]["is_demo"] is True


def test_demo_profile_read(client):
    """Test protected GET /api/profile with demo token returns demo profile without database."""
    login_res = client.post("/api/auth/login", json={
        "email": "admin@capportal.gov.in",
        "password": "admin123"
    })
    token = login_res.json()["token"]

    res = client.get("/api/profile", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    prof = res.json()["profile"]
    assert prof["role"] == "demo_user"
    assert prof["is_demo"] is True
    assert "notice" in prof


def test_demo_profile_write_rejected(client):
    """Test protected PUT /api/profile in demo mode is rejected with 403."""
    login_res = client.post("/api/auth/login", json={
        "email": "admin@capportal.gov.in",
        "password": "admin123"
    })
    token = login_res.json()["token"]

    res = client.put("/api/profile", headers={"Authorization": f"Bearer {token}"}, json={"name": "Hacked Admin"})
    assert res.status_code == 403


def test_demo_fields_read(client):
    """Test protected GET /api/fields with demo token returns empty list with notice."""
    login_res = client.post("/api/auth/login", json={
        "email": "admin@capportal.gov.in",
        "password": "admin123"
    })
    token = login_res.json()["token"]

    res = client.get("/api/fields", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    fdata = res.json()
    assert fdata["fields"] == []
    assert fdata["total"] == 0
    assert "notice" in fdata


def test_demo_fields_write_rejected(client):
    """Test protected POST /api/fields in demo mode is rejected with 403."""
    login_res = client.post("/api/auth/login", json={
        "email": "admin@capportal.gov.in",
        "password": "admin123"
    })
    token = login_res.json()["token"]

    res = client.post("/api/fields", headers={"Authorization": f"Bearer {token}"}, json={"label": "New Field"})
    assert res.status_code == 403


def test_demo_history_endpoints(client):
    """Test protected history endpoints return empty lists with notice."""
    login_res = client.post("/api/auth/login", json={
        "email": "admin@capportal.gov.in",
        "password": "admin123"
    })
    token = login_res.json()["token"]

    r_res = client.get("/api/recommendations/history", headers={"Authorization": f"Bearer {token}"})
    assert r_res.status_code == 200
    assert r_res.json()["history"] == []

    d_res = client.get("/api/disease/history", headers={"Authorization": f"Bearer {token}"})
    assert d_res.status_code == 200
    assert d_res.json()["history"] == []


def test_invalid_token_rejected(client):
    """Test protected endpoints reject fake/invalid tokens."""
    res = client.get("/api/profile", headers={"Authorization": "Bearer fake-token-12345"})
    assert res.status_code == 401


def test_expired_token_rejected(client):
    """Test protected endpoints reject expired tokens."""
    expired_payload = {
        "user_id": -1,
        "phone": "+91 98765 43210",
        "name": "Sunderganesh",
        "email": "admin@capportal.gov.in",
        "role": "demo_user",
        "is_demo": True,
        "exp": datetime.utcnow() - timedelta(days=1),
        "iat": datetime.utcnow() - timedelta(days=2),
    }
    expired_token = jwt.encode(expired_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    res = client.get("/api/profile", headers={"Authorization": f"Bearer {expired_token}"})
    assert res.status_code == 401


def test_demo_ml_inference(client):
    """Test ML recommendation succeeds with demo token without attempting database writes."""
    login_res = client.post("/api/auth/login", json={
        "email": "admin@capportal.gov.in",
        "password": "admin123"
    })
    token = login_res.json()["token"]

    res = client.post("/api/recommend/crop", headers={"Authorization": f"Bearer {token}"}, json={
        "nitrogen": 90,
        "phosphorus": 42,
        "potassium": 43,
        "temperature": 20.8,
        "humidity": 82.0,
        "ph": 6.5,
        "rainfall": 202.9,
        "season": "kharif"
    })
    assert res.status_code == 200
    assert len(res.json()["recommendations"]) > 0
