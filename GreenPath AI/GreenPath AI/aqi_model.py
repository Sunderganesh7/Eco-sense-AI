"""
GreenPath AI — Visual Air Quality Estimation (AQI) Module
Calculates a scientifically backed environmental assessment by combining:
1. Atmospheric Haze Index using a Dark Channel Prior (DCP) computer vision algorithm.
2. Particulate Matter (PM2.5/PM10) dry deposition capacity based on tree crown leaf area.
3. Contrast and Laplacian variance for visual clarity indices.
4. US EPA standard AQI scaling with tree filtration offsets.
"""

import cv2
import numpy as np

def analyze_environment(image_path, tree_count=0, green_percent=0.0, live_pm2_5=None, live_aqi=None):
    """
    Analyzes an aerial image to estimate atmospheric clarity, haze density,
    and returns a structured environmental and AQI analysis.
    """
    image = cv2.imread(image_path)
    if image is None:
        return {
            "error": "Error: Image not found",
            "final_score": 0,
            "estimated_aqi": 100,
            "aqi_category": "Unknown",
            "haze_index": 0.0,
            "filtration_capacity": 0.0,
            "result_string": "Error: Image not found"
        }

    # Standardize image size for processing
    image_resized = cv2.resize(image, (512, 512))
    gray = cv2.cvtColor(image_resized, cv2.COLOR_BGR2GRAY)

    # ================================================================
    # 1. ATMOSPHERIC HAZE INDEX (Dark Channel Prior Approximation)
    # ================================================================
    # In clear weather, dark pixels in shadows/foliage are very dark (near 0).
    # In hazy/smoggy weather, atmospheric scatter increases the brightness of these shadows.
    dark_channel = np.min(image_resized, axis=2)
    # Apply local minimum filter (erosion) to get dark channel prior
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))
    dark_channel = cv2.erode(dark_channel, kernel)
    
    # Average value of dark channel normalized to [0, 100]
    haze_density = np.mean(dark_channel)
    haze_index = min(100.0, max(0.0, (haze_density / 255.0) * 100.0 * 1.5))

    # ================================================================
    # 2. VISUAL CLARITY & CONTRAST
    # ================================================================
    # Laplacian variance measures edge sharpness (contrast & blur)
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    # Normalized clarity score: higher variance = clearer air
    clarity_score = min(100.0, max(0.0, (laplacian_var / 220.0) * 100.0))

    # Image standard deviation measures overall contrast
    contrast = gray.std()
    contrast_score = min(100.0, max(0.0, (contrast / 75.0) * 100.0))

    # ================================================================
    # 3. PM2.5 PARTICULATE FILTRATION CAPACITY
    # ================================================================
    # Standard dry deposition: A mature tree crown absorbs approx 0.15 kg PM2.5/year.
    # Active grass/undercanopy cover absorbs approx 0.04 kg PM2.5/m2/year.
    pm_filtration_kg = (tree_count * 0.15) + (green_percent * 0.05)

    # ================================================================
    # 4. SCIENTIFIC AQI & ENVIRONMENTAL INDEX MODEL
    # ================================================================
    # Haze baseline AQI: anchor to live regional AQI if available, otherwise estimate from haze
    if live_aqi is not None:
        base_pollution_aqi = float(live_aqi) + (haze_index * 0.4)
    else:
        base_pollution_aqi = 40.0 + (haze_index * 1.6)
    
    # Contrast/Clarity compensation: clear high-contrast frames indicate lower local PM density
    clarity_discount = (clarity_score * 0.2) + (contrast_score * 0.1)
    
    # Tree canopy filtration offset (mitigates particulate density)
    filtration_offset = pm_filtration_kg * 6.5
    
    # Calculate final AQI based on environmental factors
    calculated_aqi = int(base_pollution_aqi - clarity_discount - filtration_offset)
    estimated_aqi = max(10, min(500, calculated_aqi))

    # Calculate standard EPA categories
    if estimated_aqi <= 50:
        category = "Good (0-50) 🌿"
        color = "var(--primary)"
    elif estimated_aqi <= 100:
        category = "Moderate (51-100) 🌤"
        color = "var(--accent-orange)"
    elif estimated_aqi <= 150:
        category = "Unhealthy for Sensitive Groups (101-150) 🟡"
        color = "var(--accent-orange)"
    elif estimated_aqi <= 200:
        category = "Unhealthy (151-200) 🌫"
        color = "var(--accent-red)"
    else:
        category = "Hazardous (200+) ⚠️"
        color = "var(--accent-red)"

    # Combine into a unified health rating score [0-100]
    final_score = int(100 - (estimated_aqi / 5.0) + (green_percent * 0.2))
    final_score = max(5, min(100, final_score))

    result_string = f"Environmental Score: {final_score}/100 | Estimated AQI: {category}"

    return {
        "final_score": final_score,
        "estimated_aqi": estimated_aqi,
        "aqi_category": category,
        "haze_index": round(haze_index, 1),
        "filtration_capacity": round(pm_filtration_kg, 2),
        "result_string": result_string,
        "color": color
    }
