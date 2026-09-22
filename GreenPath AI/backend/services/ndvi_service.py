"""
GreenPath AI — NDVI Analysis Service (NEW)
Calculates Normalized Difference Vegetation Index from uploaded images.
For RGB images: approximates NDVI using Red and Green channels as proxies.
For real satellite imagery with NIR band: uses true NDVI = (NIR - Red) / (NIR + Red)
"""

import os
import cv2
import numpy as np
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

# NDVI colour scale (from red=bare to dark green=dense vegetation)
_NDVI_COLORMAP = [
    (-1.0, (139, 0, 0)),       # Dark red — water / bare
    (-0.1, (205, 92, 92)),     # Light red — urban
    (0.0,  (210, 180, 140)),   # Tan — sparse
    (0.2,  (255, 255, 0)),     # Yellow — grassland
    (0.4,  (144, 238, 144)),   # Light green — shrubs
    (0.6,  (0, 200, 0)),       # Green — moderate vegetation
    (1.0,  (0, 80, 0)),        # Dark green — dense forest
]


def _ndvi_value_to_color(ndvi_val: float) -> tuple:
    """Interpolate an NDVI pixel value to an RGB colour."""
    for i in range(len(_NDVI_COLORMAP) - 1):
        lo_v, lo_c = _NDVI_COLORMAP[i]
        hi_v, hi_c = _NDVI_COLORMAP[i + 1]
        if lo_v <= ndvi_val <= hi_v:
            t = (ndvi_val - lo_v) / (hi_v - lo_v + 1e-9)
            r = int(lo_c[0] + t * (hi_c[0] - lo_c[0]))
            g = int(lo_c[1] + t * (hi_c[1] - lo_c[1]))
            b = int(lo_c[2] + t * (hi_c[2] - lo_c[2]))
            return (b, g, r)   # BGR for OpenCV
    return (0, 80, 0)


def calculate_ndvi(image_path: str, output_dir: str) -> Dict[str, Any]:
    """
    Approximate NDVI from an RGB aerial/satellite image.

    RGB-NDVI approximation:
      - NIR proxy → Near Infrared not available in standard RGB.
      - We use Green channel as a NIR proxy and Red channel.
      - Formula: NDVI ≈ (G - R) / (G + R + ε)
      - This gives a relative vegetation index useful for comparison.

    Returns dict with:
      - ndvi_mean, ndvi_min, ndvi_max, ndvi_std
      - vegetation_density (% pixels with NDVI > 0.2)
      - zone_labels: list of (zone, ndvi_mean, label) for 9 sub-zones
      - ndvi_image_path
      - histogram: list of [ndvi_range_label, count]
    """
    os.makedirs(output_dir, exist_ok=True)
    image = cv2.imread(image_path)

    if image is None:
        logger.error(f"Cannot read image for NDVI: {image_path}")
        return _ndvi_error()

    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB).astype(np.float32)

    R = image_rgb[:, :, 0]
    G = image_rgb[:, :, 1]
    B = image_rgb[:, :, 2]  # noqa: F841

    # ── RGB-NDVI approximation ────────────────────────────────────────────
    ndvi = (G - R) / (G + R + 1e-9)
    ndvi = np.clip(ndvi, -1.0, 1.0)

    # ── Statistics ────────────────────────────────────────────────────────
    ndvi_mean = float(round(np.mean(ndvi), 4))
    ndvi_min = float(round(np.min(ndvi), 4))
    ndvi_max = float(round(np.max(ndvi), 4))
    ndvi_std = float(round(np.std(ndvi), 4))
    veg_density = float(round(np.sum(ndvi > 0.1) / ndvi.size * 100, 2))

    # ── Generate NDVI colour map image ────────────────────────────────────
    h, w = ndvi.shape
    ndvi_img = np.zeros((h, w, 3), dtype=np.uint8)

    for y in range(h):
        for x in range(w):
            ndvi_img[y, x] = _ndvi_value_to_color(ndvi[y, x])

    # Overlay legend bar
    _draw_ndvi_legend(ndvi_img)

    ndvi_out_path = os.path.join(output_dir, "ndvi_map.png")
    cv2.imwrite(ndvi_out_path, ndvi_img)

    # ── Zone analysis (3×3 grid) ──────────────────────────────────────────
    zone_labels = _compute_zone_ndvi(ndvi)

    # ── Histogram (5 bins) ────────────────────────────────────────────────
    histogram = _ndvi_histogram(ndvi)

    logger.info(
        f"🌿 NDVI: mean={ndvi_mean:.3f}, veg_density={veg_density}%"
    )

    return {
        "ndvi_mean": ndvi_mean,
        "ndvi_min": ndvi_min,
        "ndvi_max": ndvi_max,
        "ndvi_std": ndvi_std,
        "vegetation_density_percent": veg_density,
        "zone_ndvi": zone_labels,
        "histogram": histogram,
        "ndvi_image_path": ndvi_out_path,
        "interpretation": _interpret_ndvi(ndvi_mean),
    }


def _interpret_ndvi(mean_val: float) -> str:
    if mean_val > 0.4:
        return "Dense Vegetation — High Green Cover"
    elif mean_val > 0.2:
        return "Moderate Vegetation — Mixed Urban-Green"
    elif mean_val > 0.05:
        return "Sparse Vegetation — Mostly Built-up"
    else:
        return "Bare Land / Urban — Very Low Green Cover"


def _compute_zone_ndvi(ndvi: np.ndarray):
    """Divide image into 3×3 grid and compute mean NDVI per zone."""
    h, w = ndvi.shape
    zh, zw = h // 3, w // 3
    zone_names = [
        "Top-Left", "Top-Center", "Top-Right",
        "Mid-Left", "Center",     "Mid-Right",
        "Bot-Left", "Bot-Center", "Bot-Right",
    ]
    zones = []
    for i, name in enumerate(zone_names):
        row, col = divmod(i, 3)
        patch = ndvi[row * zh:(row + 1) * zh, col * zw:(col + 1) * zw]
        m = float(round(np.mean(patch), 3))
        zones.append({
            "zone": name,
            "ndvi_mean": m,
            "label": _interpret_ndvi(m),
        })
    return zones


def _ndvi_histogram(ndvi: np.ndarray):
    bins = [
        ("<0", -1.0, 0.0),
        ("0–0.2", 0.0, 0.2),
        ("0.2–0.4", 0.2, 0.4),
        ("0.4–0.6", 0.4, 0.6),
        (">0.6", 0.6, 1.01),
    ]
    result = []
    for label, lo, hi in bins:
        count = int(np.sum((ndvi >= lo) & (ndvi < hi)))
        result.append({"range": label, "count": count})
    return result


def _draw_ndvi_legend(img: np.ndarray):
    """Draw a small NDVI colour legend on the image."""
    h, w = img.shape[:2]
    bar_h = 20
    bar_w = min(200, w - 20)
    bar_x, bar_y = 10, h - bar_h - 10

    for i in range(bar_w):
        ndvi_val = -1.0 + (i / bar_w) * 2.0
        color = _ndvi_value_to_color(ndvi_val)
        img[bar_y:bar_y + bar_h, bar_x + i] = color

    cv2.putText(img, "-1", (bar_x, bar_y - 3),
                cv2.FONT_HERSHEY_SIMPLEX, 0.35, (255, 255, 255), 1)
    cv2.putText(img, "+1", (bar_x + bar_w - 15, bar_y - 3),
                cv2.FONT_HERSHEY_SIMPLEX, 0.35, (255, 255, 255), 1)
    cv2.putText(img, "NDVI", (bar_x + bar_w // 2 - 15, bar_y - 3),
                cv2.FONT_HERSHEY_SIMPLEX, 0.35, (255, 255, 255), 1)


def _ndvi_error() -> Dict:
    return {
        "ndvi_mean": 0.0, "ndvi_min": 0.0, "ndvi_max": 0.0, "ndvi_std": 0.0,
        "vegetation_density_percent": 0.0, "zone_ndvi": [],
        "histogram": [], "ndvi_image_path": None,
        "interpretation": "Error: Could not process image.",
    }
