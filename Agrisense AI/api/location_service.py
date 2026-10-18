"""
Location Service — IP-based geolocation with free keyless fallback (ip-api.com)
and optional ipstack API key support.
Detects user's state, district/city, and coordinates from their IP address.
"""

import os
import requests

IPSTACK_API_KEY = os.environ.get("IPSTACK_API_KEY", "").strip()

STATE_NAME_MAP = {
    "uttar pradesh": "Uttar Pradesh",
    "madhya pradesh": "Madhya Pradesh",
    "andhra pradesh": "Andhra Pradesh",
    "arunachal pradesh": "Arunachal Pradesh",
    "himachal pradesh": "Himachal Pradesh",
    "jammu and kashmir": "Jammu and Kashmir",
    "tamil nadu": "Tamil Nadu",
    "west bengal": "West Bengal",
    "maharashtra": "Maharashtra",
    "karnataka": "Karnataka",
    "gujarat": "Gujarat",
    "rajasthan": "Rajasthan",
    "bihar": "Bihar",
    "punjab": "Punjab",
    "haryana": "Haryana",
    "jharkhand": "Jharkhand",
    "chhattisgarh": "Chhattisgarh",
    "uttarakhand": "Uttarakhand",
    "kerala": "Kerala",
    "telangana": "Telangana",
    "odisha": "Odisha",
    "assam": "Assam",
    "goa": "Goa",
    "tripura": "Tripura",
    "meghalaya": "Meghalaya",
    "manipur": "Manipur",
    "mizoram": "Mizoram",
    "nagaland": "Nagaland",
    "sikkim": "Sikkim",
    "delhi": "Delhi",
    "national capital territory of delhi": "Delhi",
    "chandigarh": "Chandigarh",
    "puducherry": "Puducherry",
    "pondicherry": "Puducherry",
}


def _normalize_state(region_name: str) -> str:
    """Normalize region/state name to standard Indian state name."""
    if not region_name:
        return ""
    lower = region_name.strip().lower()
    if lower in STATE_NAME_MAP:
        return STATE_NAME_MAP[lower]
    return region_name.strip().title()


def get_location_from_ip(ip: str = "") -> dict:
    """
    Detect user's location from IP address.
    Tries free ip-api.com first, then ipstack if configured.
    """
    clean_ip = ip.strip() if ip else ""
    # Filter out localhost and private network addresses for external API calls
    is_private = (
        not clean_ip or
        clean_ip in ("127.0.0.1", "::1", "localhost", "check") or
        clean_ip.startswith("192.168.") or
        clean_ip.startswith("10.") or
        clean_ip.startswith("172.16.")
    )

    # 1. Try free ip-api.com (works for public IPs or auto-detects client server IP)
    try:
        url = "http://ip-api.com/json/" if is_private else f"http://ip-api.com/json/{clean_ip}"
        resp = requests.get(url, timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            if data.get("status") == "success":
                state = _normalize_state(data.get("regionName", ""))
                city = data.get("city", "")
                lat = float(data.get("lat", 0.0))
                lon = float(data.get("lon", 0.0))
                country = data.get("country", "")
                return {
                    "state": state,
                    "city": city,
                    "latitude": lat,
                    "longitude": lon,
                    "country": country,
                    "source": "ip-api",
                }
    except Exception as e:
        print(f"  [WARN] ip-api request failed: {e}")

    # 2. Try ipstack if API key configured
    if IPSTACK_API_KEY:
        try:
            target_ip = "check" if is_private else clean_ip
            url = f"http://api.ipstack.com/{target_ip}"
            params = {
                "access_key": IPSTACK_API_KEY,
                "fields": "country_name,region_name,city,latitude,longitude",
            }
            resp = requests.get(url, params=params, timeout=5)
            data = resp.json()
            if not data.get("error"):
                state = _normalize_state(data.get("region_name", ""))
                return {
                    "state": state,
                    "city": data.get("city", ""),
                    "latitude": float(data.get("latitude") or 0.0),
                    "longitude": float(data.get("longitude") or 0.0),
                    "country": data.get("country_name", ""),
                    "source": "ipstack",
                }
        except Exception as e:
            print(f"  [WARN] ipstack request failed: {e}")

    # 3. Default fallback for local dev when offline
    return {
        "state": "Maharashtra",
        "city": "Thane",
        "latitude": 19.1963,
        "longitude": 72.9675,
        "country": "India",
        "source": "default_local_dev",
    }
