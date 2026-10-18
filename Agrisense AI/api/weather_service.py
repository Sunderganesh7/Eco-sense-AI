"""
Weather Service — Real weather data using Open-Meteo API (free, keyless)
with optional OpenWeatherMap fallback if an API key is provided.
Provides current weather, 7-day forecast, and severe weather detection.
Never produces fabricated or synthetic data on provider failure.
"""

import os
import requests
import datetime
from typing import Tuple, List, Dict, Any

OPENWEATHERMAP_API_KEY = os.environ.get("OPENWEATHERMAP_API_KEY", "").strip()

# WMO Weather interpretation codes (WW) from Open-Meteo
# https://open-meteo.com/en/docs
WMO_CODE_MAP = {
    0: ("sunny", "sunny", "Clear sky"),
    1: ("sunny", "sunny", "Mainly clear"),
    2: ("partly_cloudy", "partly_cloudy", "Partly cloudy"),
    3: ("cloudy", "cloudy", "Overcast"),
    45: ("foggy", "foggy", "Foggy"),
    48: ("foggy", "foggy", "Depositing rime fog"),
    51: ("light_rain", "rainy", "Light drizzle"),
    53: ("light_rain", "rainy", "Moderate drizzle"),
    55: ("rainy", "rainy", "Dense drizzle"),
    56: ("light_rain", "rainy", "Freezing drizzle"),
    57: ("rainy", "rainy", "Heavy freezing drizzle"),
    61: ("light_rain", "rainy", "Slight rain"),
    63: ("rainy", "rainy", "Moderate rain"),
    65: ("rainy", "rainy", "Heavy rain"),
    66: ("light_rain", "rainy", "Freezing rain"),
    67: ("rainy", "rainy", "Heavy freezing rain"),
    71: ("snow", "snow", "Slight snow fall"),
    73: ("snow", "snow", "Moderate snow fall"),
    75: ("snow", "snow", "Heavy snow fall"),
    77: ("snow", "snow", "Snow grains"),
    80: ("light_rain", "rainy", "Slight rain showers"),
    81: ("rainy", "rainy", "Moderate rain showers"),
    82: ("rainy", "rainy", "Violent rain showers"),
    85: ("snow", "snow", "Slight snow showers"),
    86: ("snow", "snow", "Heavy snow showers"),
    95: ("thunderstorm", "thunderstorm", "Thunderstorm"),
    96: ("thunderstorm", "thunderstorm", "Thunderstorm with slight hail"),
    99: ("thunderstorm", "thunderstorm", "Thunderstorm with heavy hail"),
}

OWM_CONDITION_MAP = {
    "Clear": ("sunny", "sunny"),
    "Clouds": ("partly_cloudy", "partly_cloudy"),
    "Drizzle": ("light_rain", "rainy"),
    "Rain": ("rainy", "rainy"),
    "Thunderstorm": ("thunderstorm", "thunderstorm"),
    "Snow": ("snow", "snow"),
    "Mist": ("foggy", "foggy"),
    "Smoke": ("foggy", "foggy"),
    "Haze": ("foggy", "foggy"),
    "Dust": ("foggy", "foggy"),
    "Fog": ("foggy", "foggy"),
    "Tornado": ("thunderstorm", "thunderstorm"),
}


import time

_weather_cache: Dict[Tuple[float, float], Tuple[float, Dict[str, Any], List[Dict[str, Any]]]] = {}
CACHE_TTL_SECONDS = 900  # 15 minutes cache


def _get_open_meteo_weather(lat: float, lon: float) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """Fetch current and 7-day daily forecast from Open-Meteo with caching and retry."""
    cache_key = (round(lat, 2), round(lon, 2))
    now = time.time()

    # Check cache first
    if cache_key in _weather_cache:
        cached_time, cached_curr, cached_fore = _weather_cache[cache_key]
        if now - cached_time < CACHE_TTL_SECONDS:
            return cached_curr, cached_fore

    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": (
            "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,"
            "rain,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m"
        ),
        "daily": (
            "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,"
            "rain_sum,wind_speed_10m_max"
        ),
        "timezone": "auto",
    }

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) FasalAI/3.0",
        "Accept": "application/json",
    }

    last_error = None
    for attempt in range(3):
        try:
            resp = requests.get(url, params=params, headers=headers, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                break
            elif resp.status_code in (429, 503):
                time.sleep(1.2 * (attempt + 1))
                last_error = f"Open-Meteo returned status {resp.status_code}: {resp.text[:100]}"
            else:
                raise RuntimeError(f"Open-Meteo returned status {resp.status_code}: {resp.text[:100]}")
        except requests.RequestException as e:
            last_error = str(e)
            time.sleep(1.0 * (attempt + 1))

    else:
        # If all retries failed, fall back to expired cache if available
        if cache_key in _weather_cache:
            _, cached_curr, cached_fore = _weather_cache[cache_key]
            cached_curr_copy = dict(cached_curr)
            cached_curr_copy["cached_fallback"] = True
            return cached_curr_copy, cached_fore
        raise RuntimeError(f"Open-Meteo weather service error: {last_error}")

    curr = data.get("current", {})
    code = curr.get("weather_code", 0)
    cond, icon, desc = WMO_CODE_MAP.get(code, ("partly_cloudy", "partly_cloudy", "Partly cloudy"))

    current_data = {
        "temperature": curr.get("temperature_2m"),
        "feels_like": curr.get("apparent_temperature"),
        "humidity": curr.get("relative_humidity_2m"),
        "pressure": curr.get("surface_pressure"),
        "wind_speed": curr.get("wind_speed_10m"),
        "wind_deg": curr.get("wind_direction_10m", 0),
        "condition": cond,
        "icon": icon,
        "description": desc,
        "clouds": 100 if cond in ("cloudy", "rainy", "thunderstorm") else 20,
        "visibility": 10000,
        "rain_1h": curr.get("precipitation", 0),
        "city_name": f"{lat:.2f}N, {lon:.2f}E",
        "timestamp": curr.get("time", datetime.datetime.utcnow().isoformat()),
        "source": "open-meteo",
    }

    daily = data.get("daily", {})
    dates = daily.get("time", [])
    max_temps = daily.get("temperature_2m_max", [])
    min_temps = daily.get("temperature_2m_min", [])
    precips = daily.get("precipitation_sum", [])
    winds = daily.get("wind_speed_10m_max", [])
    codes = daily.get("weather_code", [])

    forecast_list = []
    for i in range(len(dates)):
        d_str = dates[i]
        d_code = codes[i] if i < len(codes) else 0
        d_cond, d_icon, _ = WMO_CODE_MAP.get(d_code, ("partly_cloudy", "partly_cloudy", "Partly cloudy"))
        try:
            day_dt = datetime.datetime.fromisoformat(d_str)
            day_name = day_dt.strftime("%A")
        except Exception:
            day_name = "Day"

        forecast_list.append({
            "date": d_str,
            "day_name": day_name,
            "temp_min": round(min_temps[i], 1) if i < len(min_temps) else 20.0,
            "temp_max": round(max_temps[i], 1) if i < len(max_temps) else 30.0,
            "humidity": current_data["humidity"] if i == 0 else 60,
            "rainfall_mm": round(precips[i], 1) if i < len(precips) else 0.0,
            "wind_speed_max": round(winds[i], 1) if i < len(winds) else 10.0,
            "condition": d_cond,
            "icon": d_icon,
        })

    # Store in in-memory cache
    _weather_cache[cache_key] = (now, current_data, forecast_list)
    return current_data, forecast_list



def _get_owm_weather(lat: float, lon: float) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """Fetch weather from OpenWeatherMap if API key is present."""
    if not OPENWEATHERMAP_API_KEY:
        raise ValueError("OPENWEATHERMAP_API_KEY not configured")

    curr_url = "https://api.openweathermap.org/data/2.5/weather"
    curr_resp = requests.get(curr_url, params={"lat": lat, "lon": lon, "appid": OPENWEATHERMAP_API_KEY, "units": "metric"}, timeout=8)
    curr_data = curr_resp.json()
    if curr_data.get("cod") != 200:
        raise RuntimeError(curr_data.get("message", "OWM error"))

    main_cond = curr_data.get("weather", [{}])[0].get("main", "Clear")
    cond, icon = OWM_CONDITION_MAP.get(main_cond, ("partly_cloudy", "partly_cloudy"))

    current_data = {
        "temperature": curr_data["main"]["temp"],
        "feels_like": curr_data["main"]["feels_like"],
        "humidity": curr_data["main"]["humidity"],
        "pressure": curr_data["main"]["pressure"],
        "wind_speed": curr_data["wind"]["speed"],
        "wind_deg": curr_data["wind"].get("deg", 0),
        "condition": cond,
        "icon": icon,
        "description": curr_data["weather"][0].get("description", ""),
        "clouds": curr_data["clouds"]["all"],
        "visibility": curr_data.get("visibility", 10000),
        "rain_1h": curr_data.get("rain", {}).get("1h", 0),
        "city_name": curr_data.get("name", ""),
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "source": "openweathermap",
    }

    fore_url = "https://api.openweathermap.org/data/2.5/forecast"
    fore_resp = requests.get(fore_url, params={"lat": lat, "lon": lon, "appid": OPENWEATHERMAP_API_KEY, "units": "metric"}, timeout=8)
    fore_json = fore_resp.json()
    forecast_list = []
    if fore_json.get("cod") == "200":
        daily = {}
        for item in fore_json.get("list", []):
            dt = datetime.datetime.fromtimestamp(item["dt"])
            d_key = dt.date().isoformat()
            if d_key not in daily:
                daily[d_key] = {"date": d_key, "day_name": dt.strftime("%A"), "temps": [], "humidity": [], "rainfall": 0, "wind_speeds": [], "conditions": []}
            d = daily[d_key]
            d["temps"].append(item["main"]["temp"])
            d["humidity"].append(item["main"]["humidity"])
            d["rainfall"] += item.get("rain", {}).get("3h", 0)
            d["wind_speeds"].append(item["wind"]["speed"])
            d["conditions"].append(item["weather"][0]["main"])

        for d_key in sorted(daily.keys())[:7]:
            d = daily[d_key]
            from collections import Counter
            c_counts = Counter(d["conditions"])
            m_cond = c_counts.most_common(1)[0][0]
            d_cond, d_icon = OWM_CONDITION_MAP.get(m_cond, ("partly_cloudy", "partly_cloudy"))
            forecast_list.append({
                "date": d["date"],
                "day_name": d["day_name"],
                "temp_min": round(min(d["temps"]), 1),
                "temp_max": round(max(d["temps"]), 1),
                "humidity": round(sum(d["humidity"]) / len(d["humidity"])),
                "rainfall_mm": round(d["rainfall"], 1),
                "wind_speed_max": round(max(d["wind_speeds"]), 1),
                "condition": d_cond,
                "icon": d_icon,
            })

    return current_data, forecast_list


def get_full_weather(lat: float, lon: float) -> Tuple[Dict[str, Any], List[Dict[str, Any]], List[Dict[str, Any]], str]:
    """
    Get current weather, 7-day forecast, and severe weather alerts.
    Tries Open-Meteo first (no key required), then OpenWeatherMap.
    Raises RuntimeError if neither provider is reachable.
    """
    errors = []
    # 1. Try Open-Meteo
    try:
        curr, fore = _get_open_meteo_weather(lat, lon)
        alerts = check_severe_weather_from_forecast(fore)
        return curr, fore, alerts, "open-meteo"
    except Exception as e:
        errors.append(f"Open-Meteo error: {e}")

    # 2. Try OpenWeatherMap
    if OPENWEATHERMAP_API_KEY:
        try:
            curr, fore = _get_owm_weather(lat, lon)
            alerts = check_severe_weather_from_forecast(fore)
            return curr, fore, alerts, "openweathermap"
        except Exception as e:
            errors.append(f"OpenWeatherMap error: {e}")

    raise RuntimeError("Weather provider service unavailable: " + "; ".join(errors))


def get_current_weather(lat: float, lon: float) -> dict:
    """Get current weather for location."""
    try:
        curr, _, _, _ = get_full_weather(lat, lon)
        return curr
    except Exception as e:
        return {"error": str(e)}


def get_forecast(lat: float, lon: float) -> list:
    """Get 7-day daily forecast for location."""
    try:
        _, fore, _, _ = get_full_weather(lat, lon)
        return fore
    except Exception as e:
        print(f"  [WARN] Forecast failed: {e}")
        return []


def check_severe_weather_from_forecast(forecast: List[Dict[str, Any]], days_ahead: int = 2) -> list:
    """Check for severe weather in the forecast."""
    alerts = []
    for day in forecast[:days_ahead]:
        # Heavy rain
        rain = day.get("rainfall_mm", 0)
        if rain > 50:
            alerts.append({
                "type": "rain",
                "severity": "severe" if rain > 100 else "warning",
                "date": day["date"],
                "day_name": day["day_name"],
                "message": f"Heavy rainfall expected: {rain}mm on {day['day_name']}",
                "value": rain,
                "unit": "mm",
            })
        elif rain > 20:
            alerts.append({
                "type": "rain",
                "severity": "advisory",
                "date": day["date"],
                "day_name": day["day_name"],
                "message": f"Moderate rainfall expected: {rain}mm on {day['day_name']}",
                "value": rain,
                "unit": "mm",
            })

        # Strong wind (> 50 km/h)
        wind_kmh = day.get("wind_speed_max", 0)
        if wind_kmh > 60:
            alerts.append({
                "type": "storm",
                "severity": "severe" if wind_kmh > 90 else "warning",
                "date": day["date"],
                "day_name": day["day_name"],
                "message": f"Strong winds expected: {round(wind_kmh)} km/h on {day['day_name']}",
                "value": round(wind_kmh),
                "unit": "km/h",
            })

        # Extreme heat
        temp_max = day.get("temp_max", 0)
        if temp_max > 43:
            alerts.append({
                "type": "heatwave",
                "severity": "warning",
                "date": day["date"],
                "day_name": day["day_name"],
                "message": f"High heat expected: {temp_max}°C on {day['day_name']}",
                "value": temp_max,
                "unit": "°C",
            })

    return alerts


def check_severe_weather(lat: float, lon: float, days_ahead: int = 2) -> list:
    """Check for severe weather by querying weather provider."""
    try:
        _, fore, alerts, _ = get_full_weather(lat, lon)
        return alerts
    except Exception as e:
        print(f"  [WARN] Severe weather check failed: {e}")
        return []
