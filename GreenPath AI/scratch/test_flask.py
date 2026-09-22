import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import app
import json

def test_flask_app():
    # Setup test client
    app.config['TESTING'] = True
    app.config['SECRET_KEY'] = 'test_key'
    
    with app.test_client() as client:
        # Inject mock session for user
        with client.session_transaction() as sess:
            sess['user'] = {
                'id': 1,
                'name': 'Ganesh',
                'email': 'ganesh@university.edu'
            }
            
        print("Testing /drone endpoint via test client...")
        res = client.get('/drone')
        assert res.status_code == 200
        html = res.data.decode('utf-8')
        assert "Live Drone Camera Stream" in html
        assert "AI Vision Live Statistics" in html
        assert "chartDroneHealth" in html
        print("  /drone template rendered correctly!")
        
        print("Testing /api/drone/telemetry endpoint via test client...")
        res_telemetry = client.get('/api/drone/telemetry')
        assert res_telemetry.status_code == 200
        data = json.loads(res_telemetry.data.decode('utf-8'))
        assert "telemetry" in data
        assert "scanned_trees" in data
        assert "vision_stats" in data
        assert "charts_data" in data
        print("  /api/drone/telemetry response is structurally correct!")
        print(f"  Accuracy: {data['vision_stats']['accuracy']}%")
        print(f"  FPS: {data['vision_stats']['fps']}")
        
        print("All Flask test client verification tests passed!")

if __name__ == "__main__":
    test_flask_app()
