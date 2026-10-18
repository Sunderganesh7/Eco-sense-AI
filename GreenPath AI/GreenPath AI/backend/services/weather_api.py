"""
GreenPath AI — Live Weather & AQI API Integration (Open-Meteo)
Provides high-fidelity real-time atmospheric readings without requiring API keys.
"""

import json
import urllib.request
import urllib.error
import logging

logger = logging.getLogger("greenpath.weather")

def fetch_live_weather_and_aqi(lat: float, lng: float) -> dict:
    """
    Fetches real-time weather and air quality values from Open-Meteo APIs.
    On failure: returns elegant climatological averages as fallbacks.
    """
    result = {
        "status": "online",
        "temperature": 25.0,  # Climatological default C
        "humidity": 60,       # Climatological default %
        "pm2_5": 12.0,        # Clean EPA baseline PM2.5 (ug/m3)
        "pm10": 20.0,         # Clean EPA baseline PM10 (ug/m3)
        "us_aqi": 50,         # Good AQI index
        "api_latency_ms": 120
    }
    
    import time
    start_time = time.time()
    
    # 1. Weather API Request
    weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current=temperature_2m,relative_humidity_2m"
    try:
        req = urllib.request.Request(
            weather_url, 
            headers={"User-Agent": "GreenPathAI/2.0 (Environmental Research)"}
        )
        with urllib.request.urlopen(req, timeout=3) as response:
            data = json.loads(response.read().decode())
            if "current" in data:
                result["temperature"] = float(data["current"].get("temperature_2m", result["temperature"]))
                result["humidity"] = int(data["current"].get("relative_humidity_2m", result["humidity"]))
                logger.info(f"Successfully fetched live weather for Lat: {lat}, Lng: {lng}")
    except Exception as e:
        logger.warning(f"Failed to query Open-Meteo Weather API: {e}. Using baseline fallback.")
        result["status"] = "degraded"
        
    # 2. Air Quality API Request
    aqi_url = f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lng}&current=pm2_5,pm10,us_aqi"
    try:
        req = urllib.request.Request(
            aqi_url, 
            headers={"User-Agent": "GreenPathAI/2.0 (Environmental Research)"}
        )
        with urllib.request.urlopen(req, timeout=3) as response:
            data = json.loads(response.read().decode())
            if "current" in data:
                result["pm2_5"] = float(data["current"].get("pm2_5", result["pm2_5"]))
                result["pm10"] = float(data["current"].get("pm10", result["pm10"]))
                result["us_aqi"] = int(data["current"].get("us_aqi", result["us_aqi"]))
                logger.info(f"Successfully fetched live ambient AQI data for Lat: {lat}, Lng: {lng}")
    except Exception as e:
        logger.warning(f"Failed to query Open-Meteo Air Quality API: {e}. Using baseline fallback.")
        result["status"] = "degraded"
        
    latency = int((time.time() - start_time) * 1000)
    result["api_latency_ms"] = latency
    return result
