"""
GreenPath AI — AQI & Environment Analysis Service
Enhanced version of aqi_model.py with:
  - Structured dict return (not just a string)
  - Numeric AQI value mapping
  - Additional environmental metrics
"""

import cv2
import numpy as np
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)


# AQI breakpoints mapped to environment score ranges
_AQI_MAP = [
    (80, "Good",                         "0–50",   "#00e400", 25),
    (65, "Moderate",                     "51–100", "#ffff00", 75),
    (45, "Unhealthy for Sensitive Groups","101–150","#ff7e00", 125),
    (30, "Unhealthy",                    "151–200","#ff0000", 175),
    (0,  "Very Unhealthy",               "201–300","#8f3f97", 250),
]


def analyze_environment(image_path: str) -> Dict[str, Any]:
    """
    Analyse an image and estimate environmental / AQI quality.

    Returns a structured dict:
      - environment_score (0-100)
      - aqi_value (estimated numeric AQI)
      - aqi_category (Good / Moderate / Unhealthy etc.)
      - aqi_range (string like "0-50")
      - aqi_color (hex)
      - vegetation_score (0-100)
      - clarity_score (0-100)
      - brightness_score (0-100)
      - contrast_score (0-100)
      - summary (human-readable string)
    """
    image = cv2.imread(image_path)
    if image is None:
        logger.error(f"Cannot read image: {image_path}")
        return _error_result()

    image = cv2.resize(image, (500, 500))
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # ── 1. Vegetation (green + yellow-green) ──────────────────────────────
    veg_mask = cv2.inRange(hsv, np.array([20, 40, 40]), np.array([90, 255, 255]))
    vegetation_score = round(np.sum(veg_mask > 0) / (500 * 500) * 100, 2)

    # ── 2. Clarity / sharpness (Laplacian variance) ───────────────────────
    lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    clarity_score = round(min(lap_var / 180, 1.0) * 100, 2)

    # ── 3. Brightness ─────────────────────────────────────────────────────
    brightness = float(np.mean(gray))
    if brightness > 190:
        brightness_score = 50.0       # Over-exposed / dusty haze
    elif brightness < 60:
        brightness_score = 60.0       # Under-exposed
    else:
        brightness_score = 100.0

    # ── 4. Contrast ───────────────────────────────────────────────────────
    contrast_score = round(min(float(gray.std()) / 70, 1.0) * 100, 2)

    # ── 5. Haze detection (low-freq blue channel dominance) ───────────────
    b, g, r = cv2.split(image)
    haze_ratio = float(np.mean(b)) / (float(np.mean(r)) + 1e-5)
    haze_penalty = max(0, (haze_ratio - 1.1) * 20)   # only penalise if very blue-hazy

    # ── 6. Final weighted environment score ───────────────────────────────
    env_score = (
        0.35 * vegetation_score +
        0.28 * clarity_score +
        0.20 * contrast_score +
        0.12 * brightness_score +
        0.05 * 100                    # baseline
    ) - haze_penalty

    env_score = int(max(0, min(100, env_score)))

    # ── 7. Map to AQI category ────────────────────────────────────────────
    aqi_value = 0
    category = "Very Unhealthy"
    aqi_range = "201–300"
    aqi_color = "#8f3f97"

    for threshold, cat, rng, color, aqi_est in _AQI_MAP:
        if env_score >= threshold:
            category = cat
            aqi_range = rng
            aqi_color = color
            # interpolate AQI within the range
            aqi_value = aqi_est
            break

    # Fine-grain AQI number interpolation
    if env_score >= 80:
        aqi_value = int((100 - env_score) / 20 * 50)
    elif env_score >= 65:
        aqi_value = int(50 + (80 - env_score) / 15 * 50)
    elif env_score >= 45:
        aqi_value = int(100 + (65 - env_score) / 20 * 50)
    elif env_score >= 30:
        aqi_value = int(150 + (45 - env_score) / 15 * 50)
    else:
        aqi_value = int(200 + (30 - env_score) / 30 * 100)

    aqi_value = max(0, min(500, aqi_value))

    return {
        "environment_score": env_score,
        "aqi_value": aqi_value,
        "aqi_category": category,
        "aqi_range": aqi_range,
        "aqi_color": aqi_color,
        "vegetation_score": vegetation_score,
        "clarity_score": clarity_score,
        "brightness_score": brightness_score,
        "contrast_score": contrast_score,
        "summary": (
            f"Environmental Score: {env_score}/100 | "
            f"Estimated AQI: {aqi_value} ({category})"
        ),
    }


def _error_result() -> Dict[str, Any]:
    return {
        "environment_score": 0,
        "aqi_value": 0,
        "aqi_category": "Unknown",
        "aqi_range": "N/A",
        "aqi_color": "#cccccc",
        "vegetation_score": 0,
        "clarity_score": 0,
        "brightness_score": 0,
        "contrast_score": 0,
        "summary": "Error: Could not analyse image.",
    }
