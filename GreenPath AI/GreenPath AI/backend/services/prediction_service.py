"""
GreenPath AI — Predictive Analytics Service (NEW)
Uses scikit-learn regression to predict future:
  - AQI trends (12 months)
  - Carbon absorption (12 months)
  - Urban heat reduction (12 months)

Also supports time-series comparison between two images.
"""

import os
import logging
import calendar
from datetime import datetime
from typing import Dict, Any, List, Optional

import numpy as np
import cv2

logger = logging.getLogger(__name__)


# ================================================================
# ML PREDICTION MODELS (inline — no external training data needed)
# ================================================================

def _generate_synthetic_training_data(
    tree_count: int, green_cover: float, current_aqi: int, current_temp: float
):
    """
    Generate synthetic training data around the user's current values.
    This simulates seasonal and growth-based trends.
    """
    np.random.seed(42)
    n = 120  # 10 years of monthly data

    # Simulate tree growth over time
    tree_growth = np.linspace(tree_count * 0.7, tree_count * 1.3, n)
    green_growth = np.linspace(green_cover * 0.7, green_cover * 1.2, n)
    green_growth = np.clip(green_growth, 0, 100)

    # Seasonal pattern
    months = np.arange(n)
    seasonal = np.sin(2 * np.pi * months / 12) * 5

    # AQI inversely related to green cover
    aqi_series = (current_aqi - (green_growth - green_cover) * 0.8 + seasonal + 
                  np.random.normal(0, 3, n))
    aqi_series = np.clip(aqi_series, 0, 500)

    # Carbon: proportional to tree count
    carbon_series = tree_growth * 22 + np.random.normal(0, 50, n)
    carbon_series = np.clip(carbon_series, 0, None)

    # Heat: base_temp minus green cover + seasonal
    heat_series = (current_temp - (green_growth * 0.03) - (tree_growth * 0.02) + 
                   seasonal * 0.5 + np.random.normal(0, 0.5, n))

    X = np.column_stack([tree_growth, green_growth, months])
    return X, aqi_series, carbon_series, heat_series


def generate_predictions(
    tree_count: int,
    green_cover: float,
    aqi_score: int,
    current_temp: float = 35.0,
    months_ahead: int = 12,
) -> Dict[str, Any]:
    """
    Predict future environmental metrics using sklearn Linear Regression.

    Returns:
      - months (list of month labels)
      - predicted_aqi (list of floats)
      - predicted_carbon_kg (list of floats)
      - predicted_temp (list of floats)
      - model_metrics (R² scores)
      - insights (list of human-readable strings)
    """
    try:
        from sklearn.linear_model import LinearRegression, Ridge
        from sklearn.preprocessing import PolynomialFeatures
        from sklearn.pipeline import make_pipeline
        from sklearn.metrics import r2_score
    except ImportError:
        logger.error("scikit-learn not installed")
        return _prediction_fallback(tree_count, green_cover, aqi_score, months_ahead)

    # ── Generate training data ────────────────────────────────────────────
    X, y_aqi, y_carbon, y_heat = _generate_synthetic_training_data(
        tree_count, green_cover, aqi_score, current_temp
    )

    # ── Train polynomial regression models ────────────────────────────────
    degree = 2
    aqi_model = make_pipeline(PolynomialFeatures(degree), Ridge(alpha=1.0))
    carbon_model = make_pipeline(PolynomialFeatures(degree), Ridge(alpha=1.0))
    heat_model = make_pipeline(PolynomialFeatures(degree), Ridge(alpha=1.0))

    aqi_model.fit(X, y_aqi)
    carbon_model.fit(X, y_carbon)
    heat_model.fit(X, y_heat)

    # ── Predict next N months ────────────────────────────────────────────
    current_month = datetime.utcnow().month
    future_months = [(current_month + i - 1) % 12 + 1 for i in range(1, months_ahead + 1)]

    # Simulate gradual improvement / trend
    future_tree = np.linspace(tree_count, tree_count * 1.05, months_ahead)
    future_green = np.linspace(green_cover, min(green_cover * 1.03, 100), months_ahead)
    future_X = np.column_stack([future_tree, future_green, future_months])

    pred_aqi = aqi_model.predict(future_X).clip(0, 500).round(1).tolist()
    pred_carbon = carbon_model.predict(future_X).clip(0).round(1).tolist()
    pred_temp = heat_model.predict(future_X).round(2).tolist()

    # ── R² scores on training data ────────────────────────────────────────
    aqi_r2 = round(r2_score(y_aqi, aqi_model.predict(X)), 3)
    carbon_r2 = round(r2_score(y_carbon, carbon_model.predict(X)), 3)

    # ── Month labels ──────────────────────────────────────────────────────
    month_labels = [calendar.month_abbr[m] for m in future_months]

    # ── Insights ──────────────────────────────────────────────────────────
    insights = _generate_insights(
        tree_count, green_cover, aqi_score,
        pred_aqi, pred_carbon, pred_temp
    )

    return {
        "months": month_labels,
        "predicted_aqi": pred_aqi,
        "predicted_carbon_kg": pred_carbon,
        "predicted_temp": pred_temp,
        "model_metrics": {
            "aqi_r2": aqi_r2,
            "carbon_r2": carbon_r2,
        },
        "insights": insights,
        "current": {
            "aqi": aqi_score,
            "carbon_kg": round(tree_count * 22, 1),
            "temp": round(current_temp - (tree_count * 0.02) - (green_cover * 0.03), 2),
        },
    }


def _generate_insights(
    tree_count, green_cover, current_aqi,
    pred_aqi, pred_carbon, pred_temp
) -> List[str]:
    insights = []
    avg_future_aqi = np.mean(pred_aqi)
    if avg_future_aqi < current_aqi:
        insights.append(
            f"✅ AQI is projected to improve by {current_aqi - avg_future_aqi:.1f} points "
            "over the next 12 months based on current green cover trends."
        )
    else:
        insights.append(
            "⚠️ AQI may worsen slightly. Recommend increasing tree plantation by at least 20%."
        )

    if tree_count < 10:
        insights.append(
            "🌱 Critical: Very low tree count detected. Urban heat island risk is HIGH. "
            "Prioritise plantation in low-density zones."
        )
    elif tree_count < 30:
        insights.append(
            "🌿 Moderate tree density. Increasing by 15–20 trees could reduce local temperature by ~0.5°C."
        )
    else:
        insights.append(
            f"🌳 Good tree cover. Maintaining {tree_count} trees will absorb ~{tree_count*22} kg CO₂/year."
        )

    if green_cover < 20:
        insights.append(
            "🔴 Green cover below 20%. Urban heat and air quality risks are significantly elevated."
        )
    elif green_cover > 50:
        insights.append(
            "🟢 Excellent green cover. This area is resilient against urban heat island effects."
        )

    return insights


def compare_images_timeseries(
    image_path_old: str,
    image_path_new: str,
    output_dir: str,
) -> Dict[str, Any]:
    """
    Compare two satellite images to detect:
      - Green cover change
      - Deforestation / expansion
      - Urban growth
    Returns diff image + metrics.
    """
    from backend.services.green_cover_service import green_cover_estimation

    os.makedirs(output_dir, exist_ok=True)

    old_result = green_cover_estimation(image_path_old, output_dir)
    new_result = green_cover_estimation(image_path_new, output_dir)

    green_change = round(new_result["green_percent"] - old_result["green_percent"], 2)
    pct_change = round(
        green_change / (old_result["green_percent"] + 1e-5) * 100, 2
    )

    # ── Visual diff image ──────────────────────────────────────────────────
    img_old = cv2.imread(image_path_old)
    img_new = cv2.imread(image_path_new)

    diff_img = None
    diff_path = None

    if img_old is not None and img_new is not None:
        h = min(img_old.shape[0], img_new.shape[0])
        w = min(img_old.shape[1], img_new.shape[1])
        img_old_r = cv2.resize(img_old, (w, h))
        img_new_r = cv2.resize(img_new, (w, h))

        diff = cv2.absdiff(img_old_r, img_new_r)
        diff_gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
        _, diff_thresh = cv2.threshold(diff_gray, 30, 255, cv2.THRESH_BINARY)

        # Colour-code: red = loss, green = gain
        diff_colored = cv2.cvtColor(diff_thresh, cv2.COLOR_GRAY2BGR)
        diff_colored[diff_thresh > 0] = (0, 0, 200) if green_change < 0 else (0, 200, 0)

        side_by_side = np.hstack([img_old_r, img_new_r, diff_colored])
        cv2.putText(side_by_side, "Before", (10, 25),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        cv2.putText(side_by_side, "After", (w + 10, 25),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        cv2.putText(side_by_side, "Change", (2 * w + 10, 25),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

        diff_path = os.path.join(output_dir, "timeseries_diff.png")
        cv2.imwrite(diff_path, side_by_side)

    trend = "Deforestation" if green_change < -2 else \
            "Urban Expansion" if green_change < 0 else \
            "Reforestation" if green_change > 2 else "Stable"

    return {
        "old_green_percent": old_result["green_percent"],
        "new_green_percent": new_result["green_percent"],
        "green_change": green_change,
        "percent_change": pct_change,
        "trend": trend,
        "diff_image_path": diff_path,
        "summary": (
            f"Green cover {'increased' if green_change >= 0 else 'decreased'} "
            f"by {abs(green_change):.2f}% ({abs(pct_change):.1f}%). "
            f"Trend: {trend}."
        ),
    }


def _prediction_fallback(tree_count, green_cover, aqi_score, months_ahead) -> Dict:
    """Simple linear extrapolation when sklearn is unavailable."""
    import calendar
    from datetime import datetime
    current_month = datetime.utcnow().month
    months = [(current_month + i - 1) % 12 + 1 for i in range(1, months_ahead + 1)]
    return {
        "months": [calendar.month_abbr[m] for m in months],
        "predicted_aqi": [max(0, aqi_score - i * 0.5) for i in range(months_ahead)],
        "predicted_carbon_kg": [tree_count * 22 * (1 + i * 0.01) for i in range(months_ahead)],
        "predicted_temp": [35.0 - i * 0.05 for i in range(months_ahead)],
        "model_metrics": {"aqi_r2": 0.0, "carbon_r2": 0.0},
        "insights": ["Install scikit-learn for full predictive analytics."],
        "current": {"aqi": aqi_score, "carbon_kg": tree_count * 22, "temp": 35.0},
    }
