import asyncio
from fastapi.testclient import TestClient
from app.main import app

def test_chat_pipeline():
    client = TestClient(app)
    
    # 1. Fetch existing profile 1
    resp_get = client.get("/api/v1/profiles/1")
    print("GET Profile 1 status:", resp_get.status_code)
    profile_data = resp_get.json()
    
    # 2. Update with the test observation values:
    # SOC = 0.45%, Rainfall = 550 mm, Species Richness = 15
    profile_data["soil"] = profile_data.get("soil") or {}
    profile_data["soil"]["organic_carbon"] = 0.45
    profile_data["soil"]["soil_ph"] = 6.8
    profile_data["soil"]["moisture"] = 18.0
    
    profile_data["climate"] = profile_data.get("climate") or {}
    profile_data["climate"]["rainfall"] = 550.0
    profile_data["climate"]["temperature"] = 24.0
    
    profile_data["biodiversity"] = profile_data.get("biodiversity") or {}
    profile_data["biodiversity"]["species_richness"] = 15
    
    profile_data["land"] = profile_data.get("land") or {}
    profile_data["land"]["land_use"] = "agriculture"
    profile_data["land"]["crop"] = "wheat"
    
    resp_put = client.put("/api/v1/profiles/1", json=profile_data)
    print("PUT Profile 1 status:", resp_put.status_code)
    
    # 3. Call Chat API
    chat_payload = {
        "message": "What is driving biodiversity pressure?",
        "profile_id": "1"
    }
    print("Sending chat message...")
    resp_chat = client.post("/api/v1/chat/", json=chat_payload)
    print("Chat API status:", resp_chat.status_code)
    if resp_chat.status_code != 200:
        print("Error details:", resp_chat.text)
    else:
        chat_data = resp_chat.json()
        print("Chat response_type:", chat_data.get("response_type"))
        print("Assessment summary:", chat_data.get("assessment", {}).get("summary")[:120], "...")
        print("Drivers:", len(chat_data.get("drivers", [])))
        print("Recommendations:", len(chat_data.get("recommendations", [])))
        print("Reasoning trace steps:", len(chat_data.get("reasoning_trace", [])))
        print("Claims count:", len(chat_data.get("claims", [])))
        print("Variables used:", chat_data.get("variables_used", []))

if __name__ == "__main__":
    test_chat_pipeline()
