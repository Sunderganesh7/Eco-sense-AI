import sys
import json
import traceback
from fastapi.testclient import TestClient

# Add backend to path so imports work
sys.path.insert(0, "./backend")

try:
    from app.main import app
    
    client = TestClient(app)
    
    payload = {
      "message": "What about biodiversity?",
      "profile_id": "1",
      "conversation_id": "test1"
    }
    
    print("Sending POST /api/v1/chat/...")
    response = client.post("/api/v1/chat/", json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
except Exception as e:
    print("Exception occurred:")
    traceback.print_exc()
