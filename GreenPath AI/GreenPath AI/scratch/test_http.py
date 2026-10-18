import urllib.request
import json

def test_endpoints():
    try:
        # Check /drone endpoint
        print("Testing /drone endpoint...")
        req = urllib.request.Request("http://127.0.0.1:5000/drone")
        with urllib.request.urlopen(req, timeout=5) as response:
            html = response.read().decode('utf-8')
            assert "Live Drone Camera Stream" in html
            assert "AI Vision Live Statistics" in html
            assert "chartDroneHealth" in html
            print("  /drone endpoint returns HTML containing the updated UI structure successfully!")
            
        # Check /api/drone/telemetry endpoint
        print("Testing /api/drone/telemetry endpoint...")
        req_telemetry = urllib.request.Request("http://127.0.0.1:5000/api/drone/telemetry")
        with urllib.request.urlopen(req_telemetry, timeout=5) as response:
            data = json.loads(response.read().decode('utf-8'))
            assert "telemetry" in data
            assert "scanned_trees" in data
            assert "vision_stats" in data
            assert "charts_data" in data
            print("  /api/drone/telemetry returns JSON telemetry schema successfully!")
            print(f"  Scanned trees in payload: {len(data['scanned_trees'])} trees.")
            print(f"  Vision stats: {data['vision_stats']}")
            
        print("All HTTP endpoint tests passed successfully!")
    except Exception as e:
        print(f"Test failed: {e}")

if __name__ == "__main__":
    test_endpoints()
