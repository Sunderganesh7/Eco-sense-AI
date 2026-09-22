import os
import time
import httpx
from datetime import datetime, timedelta
import cv2
import numpy as np

SENTINEL_TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
SENTINEL_PROCESS_URL = "https://sh.dataspace.copernicus.eu/api/v1/process"

_access_token = None
_token_expiry = 0

def get_credentials():
    client_id = os.environ.get("SENTINEL_CLIENT_ID")
    client_secret = os.environ.get("SENTINEL_CLIENT_SECRET")
    
    if client_id:
        client_id = client_id.strip()
    if client_secret:
        client_secret = client_secret.strip()
        
    if not client_id or not client_secret:
        raise Exception("Sentinel Hub authentication is not configured. Add SENTINEL_CLIENT_ID and SENTINEL_CLIENT_SECRET to backend/.env")
    return client_id, client_secret

async def get_access_token():
    global _access_token, _token_expiry
    
    if _access_token and time.time() < _token_expiry:
        return _access_token
        
    client_id, client_secret = get_credentials()
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                SENTINEL_TOKEN_URL,
                data={
                    "grant_type": "client_credentials",
                    "client_id": client_id,
                    "client_secret": client_secret
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=15.0
            )
            response.raise_for_status()
            data = response.json()
            token = data.get("access_token")
            if not token:
                raise Exception("OAuth response did not include an access token")
                
            expires_in = int(data.get("expires_in", 300))
            _access_token = token
            _token_expiry = time.time() + max(30, expires_in - 60)
            return _access_token
        except Exception as e:
            _access_token = None
            _token_expiry = 0
            raise Exception(f"Sentinel Hub authentication failed: {str(e)}")

async def fetch_satellite_image(date_str: str, bbox: list, width: int = 400, height: int = 400):
    """
    Fetches a Sentinel-2 L2A image (RGB bands) for a given date and bbox.
    bbox format: [minLon, minLat, maxLon, maxLat]
    """
    if len(bbox) != 4:
        raise ValueError("BBox must be a list of 4 numbers: [minLon, minLat, maxLon, maxLat]")
        
    min_lon, min_lat, max_lon, max_lat = map(float, bbox)
    
    if min_lon >= max_lon or min_lat >= max_lat or min_lon < -180 or max_lon > 180 or min_lat < -90 or max_lat > 90:
        raise ValueError("BBox coordinates are invalid")
        
    date_obj = datetime.strptime(date_str, "%Y-%m-%d")
    
    def build_request_body(days: int, max_cloud_coverage: int):
        from_date = (date_obj - timedelta(days=days)).strftime("%Y-%m-%d")
        to_date = (date_obj + timedelta(days=days)).strftime("%Y-%m-%d")
        
        return {
            "input": {
                "bounds": {
                    "bbox": [min_lon, min_lat, max_lon, max_lat],
                    "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"}
                },
                "data": [{
                    "type": "sentinel-2-l2a",
                    "dataFilter": {
                        "timeRange": {
                            "from": f"{from_date}T00:00:00Z",
                            "to": f"{to_date}T23:59:59Z"
                        },
                        "maxCloudCoverage": max_cloud_coverage,
                        "mosaickingOrder": "leastCC"
                    }
                }]
            },
            "output": {
                "width": width,
                "height": height,
                "responses": [{"identifier": "default", "format": {"type": "image/jpeg"}}]
            },
            "evalscript": "//VERSION=3\nfunction setup() { return { input: [\"B04\", \"B03\", \"B02\", \"dataMask\"], output: { bands: 3 } }; }\nfunction evaluatePixel(sample) { return [2.5 * sample.B04, 2.5 * sample.B03, 2.5 * sample.B02]; }"
        }

    def is_visible_image(image_bytes: bytes) -> bool:
        # Check if the image isn't purely blank/black.
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            return False
        # If max pixel value across all channels is <= 5, it's effectively blank/black
        return bool(np.max(img) > 5)

    async def request_image(token: str, request_body: dict):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                SENTINEL_PROCESS_URL,
                json=request_body,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                    "Accept": "image/jpeg"
                },
                timeout=60.0
            )
            if response.status_code != 200:
                raise Exception(f"Sentinel Hub returned non-200 status: {response.status_code}. Response: {response.text}")
                
            img_bytes = response.content
            if len(img_bytes) < 1000:
                return None
            return img_bytes

    try:
        token = await get_access_token()
        
        # Try a tight time window with low cloud coverage
        image_bytes = await request_image(token, build_request_body(3, 30))
        
        if not image_bytes or not is_visible_image(image_bytes):
            # Fallback: wider time window, allow more clouds
            image_bytes = await request_image(token, build_request_body(30, 100))
            
        if not image_bytes or not is_visible_image(image_bytes):
            raise Exception("No usable Sentinel-2 pixels were found for this date and area. Choose another date or location.")
            
        return image_bytes
        
    except Exception as e:
        raise Exception(f"Failed to fetch satellite image: {str(e)}")

async def fetch_ndvi_data(date_str: str, bbox: list, width: int = 400, height: int = 400):
    """
    Fetches NDVI raw data (Float32 TIFF) for change detection.
    """
    min_lon, min_lat, max_lon, max_lat = map(float, bbox)
    date_obj = datetime.strptime(date_str, "%Y-%m-%d")
    
    # We use a wider window and leastCC to ensure we get data
    from_date = (date_obj - timedelta(days=30)).strftime("%Y-%m-%d")
    to_date = (date_obj + timedelta(days=30)).strftime("%Y-%m-%d")
    
    request_body = {
        "input": {
            "bounds": {
                "bbox": [min_lon, min_lat, max_lon, max_lat],
                "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"}
            },
            "data": [{
                "type": "sentinel-2-l2a",
                "dataFilter": {
                    "timeRange": {
                        "from": f"{from_date}T00:00:00Z",
                        "to": f"{to_date}T23:59:59Z"
                    },
                    "maxCloudCoverage": 100,
                    "mosaickingOrder": "leastCC"
                }
            }]
        },
        "output": {
            "width": width,
            "height": height,
            "responses": [{"identifier": "default", "format": {"type": "image/tiff"}}]
        },
        # Evalscript to return raw NDVI and a data mask
        "evalscript": """//VERSION=3
function setup() {
    return {
        input: ["B04", "B08", "dataMask"],
        output: { bands: 2, sampleType: "FLOAT32" }
    };
}
function evaluatePixel(sample) {
    let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04 + 0.0000001);
    return [ndvi, sample.dataMask];
}"""
    }

    try:
        token = await get_access_token()
        async with httpx.AsyncClient() as client:
            response = await client.post(
                SENTINEL_PROCESS_URL,
                json=request_body,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                    "Accept": "image/tiff"
                },
                timeout=60.0
            )
            response.raise_for_status()
            return response.content
    except Exception as e:
        raise Exception(f"Failed to fetch NDVI data: {str(e)}")
