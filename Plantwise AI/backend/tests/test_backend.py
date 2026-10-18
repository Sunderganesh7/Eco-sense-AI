import pytest
from fastapi.testclient import TestClient
from app.main import app, seed_database
from app.engine.compliance_engine import evaluate_legal_compliance
from app.engine.suitability_engine import calculate_plantation_suitability
from app.engine.species_engine import recommend_species
from app.engine.gis_engine import generate_suitability_zones_geojson, calculate_ndvi_simulation

@pytest.fixture(autouse=True)
def setup_db():
    seed_database()

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_legal_compliance_engine_private_land():
    res = evaluate_legal_compliance(land_type="private_residential", target_trees=50, ownership_type="Private")
    assert res["land_type"] == "private_residential"
    assert "Trees Act" in res["governing_law"] or "Tree Act" in res["governing_law"] or "Protection and Preservation" in res["governing_law"]
    assert len(res["checklist"]) > 0
    assert len(res["procedure_steps"]) == 11
    # Check that checklist has valid tags
    valid_tags = {"Required", "Conditional", "Not applicable", "Verify with authority"}
    for item in res["checklist"]:
        assert item.tag in valid_tags

def test_legal_compliance_engine_forest_land():
    res = evaluate_legal_compliance(land_type="forest_reserved", target_trees=100, ownership_type="NGO")
    assert res["land_type"] == "forest_reserved"
    assert res["noc_required"] == "Mandatory NOC"
    assert "Forest" in res["primary_authority"]
    assert len(res["statutory_conditions"]) > 0

def test_suitability_engine_scoring():
    res = calculate_plantation_suitability(
        land_type="private_residential",
        ownership_type="Private",
        crz_status="Non-CRZ",
        existing_canopy_pct=10.0,
        road_distance_m=10.0,
        water_source="Municipal Recycled Supply",
        soil_type="Clay Loam",
        target_trees=50
    )
    assert 0 <= res["compliance_score"] <= 100
    assert res["verdict"] in ["Highly Suitable", "Conditionally Suitable", "High Regulatory Barrier / Restricted"]
    assert len(res["factors"]) == 8
    # Sum of factor score_awarded should equal total score
    total_awarded = sum(f.score_awarded for f in res["factors"])
    assert res["compliance_score"] == total_awarded

def test_species_recommendation_engine():
    recs = recommend_species(
        region="Deccan Plateau",
        soil_type="Black Cotton Soil",
        water_availability="Low",
        plantation_purpose="Avenue",
        land_type="municipal_public",
        limit=5
    )
    assert len(recs) == 5
    assert recs[0]["compatibility_score"] >= recs[1]["compatibility_score"]
    assert "botanical_name" in recs[0]
    assert "carbon_sequestration_kg_yr" in recs[0]

def test_gis_zones_geojson():
    geojson = generate_suitability_zones_geojson(18.5204, 73.8567, "municipal_public")
    assert geojson["type"] == "FeatureCollection"
    assert len(geojson["features"]) == 3

def test_ndvi_simulation():
    sim = calculate_ndvi_simulation(target_trees=100, area_sqm=3000.0, months_elapsed=12)
    assert sim["current_ndvi"] > sim["baseline_ndvi"]
    assert sim["accumulated_carbon_tons"] > 0

def test_api_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_api_locations(client):
    response = client.get("/api/locations")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 10

def test_api_compliance_check(client):
    payload = {
        "name": "Bandra Seaside Test Plot",
        "latitude": 19.0544,
        "longitude": 72.8200,
        "land_type": "municipal_public",
        "soil_type": "Sandy Loam",
        "crz_status": "CRZ-II",
        "target_trees": 60,
        "plantation_purpose": "Urban Greening",
        "ownership_type": "NGO",
        "water_source": "Municipal Supply"
    }
    response = client.post("/api/compliance/check", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["compliance_score"] > 0
    assert len(data["checklist"]) > 0
    assert len(data["factors"]) == 8
    assert "disclaimer" in data

def test_api_species_list(client):
    response = client.get("/api/species")
    assert response.status_code == 200
    assert len(response.json()) >= 15

def test_api_schemes_list(client):
    response = client.get("/api/schemes")
    assert response.status_code == 200
    assert len(response.json()) >= 8

def test_api_assistant_chat(client):
    payload = {
        "message": "Do I need permission from Tree Officer to trim branches?",
        "land_type": "municipal_public",
        "location_name": "Shivaji Park",
        "trees_count": 20
    }
    response = client.post("/api/assistant/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "Section 8" in data["reply"]
    assert len(data["cited_rules"]) > 0

def test_api_assistant_draft_document(client):
    payload = {
        "document_type": "noc_request",
        "applicant_name": "Priyanshu Sharma",
        "applicant_role": "Environmental Lead",
        "organization_name": "Mumbai Green Mission",
        "site_name": "Versova Coastal Verge",
        "district": "Mumbai Suburban",
        "latitude": 19.1352,
        "longitude": 72.8143,
        "land_type": "coastal_crz",
        "target_trees": 150,
        "selected_species": ["Avicennia marina", "Thespesia populnea"],
        "water_plan": "Tidal creek brackish irrigation",
        "target_authority": "Maharashtra Coastal Zone Management Authority"
    }
    response = client.post("/api/assistant/draft-document", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "FORMAL APPLICATION" in data["title"]
    assert "Priyanshu Sharma" in data["content_markdown"]

def test_api_certificate_flow(client):
    payload = {
        "project_name": "Nagpur Green Lung Initiative",
        "planter_name": "Rohan Deshmukh",
        "planter_role": "Citizen Volunteer",
        "organization": "Nagpur Tree Warriors",
        "location_name": "Seminary Hills, Nagpur",
        "district": "Nagpur",
        "latitude": 21.1645,
        "longitude": 79.0618,
        "land_type": "Protected Forest Fringe",
        "trees_count": 100,
        "species_planted": ["Neem", "Peepal", "Mahua"]
    }
    create_res = client.post("/api/certificates", json=payload)
    assert create_res.status_code == 200
    cert = create_res.json()
    assert "certificate_id" in cert
    assert "verification_hash" in cert

    # Verify certificate
    v_hash = cert["verification_hash"]
    v_res = client.get(f"/api/certificates/verify/{v_hash}")
    assert v_res.status_code == 200
    assert v_res.json()["valid"] is True

def test_point_in_polygon_resolution(client):
    # Test random coordinate inside Pune district (18.5204, 73.8567)
    res_pune = client.post("/api/compliance/check", json={
        "name": "Random Pune Plot",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "land_type": "private_residential"
    })
    assert res_pune.status_code == 200
    data_pune = res_pune.json()
    assert data_pune["district"] == "Pune"
    assert data_pune["is_inside_maharashtra"] is True
    assert "based on Pune regional data" in data_pune["granularity_label"]

    # Test random coordinate outside Maharashtra (Delhi: 28.6139, 77.2090)
    res_out = client.post("/api/compliance/check", json={
        "name": "Delhi Test Plot",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "land_type": "private_residential"
    })
    assert res_out.status_code == 200
    data_out = res_out.json()
    assert data_out["is_inside_maharashtra"] is False
    assert data_out["verdict"] == "Outside Supported Region"
    assert data_out["compliance_score"] == 0

