"""
GreenPath AI — Green Cover Estimation Service
Upgraded from green_cover.py with structured return and multi-mask analysis.
"""

import os
import cv2
import numpy as np
import logging
from typing import Dict, Any, Tuple

logger = logging.getLogger(__name__)


def green_cover_estimation(image_path: str, output_dir: str) -> Dict[str, Any]:
    """
    Estimate the percentage of green cover in the image.

    Returns dict with:
      - green_percent (float 0-100)
      - non_green_percent (float 0-100)
      - green_image_path (str)
      - non_green_image_path (str)
      - pixel_counts (dict)
    """
    os.makedirs(output_dir, exist_ok=True)
    image = cv2.imread(image_path)

    if image is None:
        logger.error(f"Cannot read image: {image_path}")
        return {
            "green_percent": 0.0,
            "non_green_percent": 100.0,
            "green_image_path": None,
            "non_green_image_path": None,
            "pixel_counts": {},
        }

    # ── HSV-based vegetation mask ──────────────────────────────────────────
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    # Broad green range (covers dark green to bright yellow-green)
    mask_green = cv2.inRange(hsv, np.array([25, 30, 30]), np.array([95, 255, 255]))

    # Morphological clean-up to remove noise
    kernel = np.ones((5, 5), np.uint8)
    mask_green = cv2.morphologyEx(mask_green, cv2.MORPH_CLOSE, kernel)
    mask_green = cv2.morphologyEx(mask_green, cv2.MORPH_OPEN, kernel)

    total_pixels = image.shape[0] * image.shape[1]
    green_pixels = int(np.sum(mask_green > 0))
    non_green_pixels = total_pixels - green_pixels

    green_pct = round(green_pixels / total_pixels * 100, 2)
    non_green_pct = round(100.0 - green_pct, 2)

    # ── Generate green overlay image ──────────────────────────────────────
    green_img = image.copy()
    green_img[mask_green == 0] = [30, 30, 30]   # darken non-green

    # ── Generate non-green (urban/built) overlay image ────────────────────
    non_green_img = image.copy()
    non_green_img[mask_green > 0] = [30, 30, 30]  # darken green areas

    green_out = os.path.join(output_dir, "green_cover_mask.png")
    non_green_out = os.path.join(output_dir, "non_green_mask.png")
    cv2.imwrite(green_out, green_img)
    cv2.imwrite(non_green_out, non_green_img)

    logger.info(f"🌿 Green cover: {green_pct}% | Non-green: {non_green_pct}%")

    return {
        "green_percent": green_pct,
        "non_green_percent": non_green_pct,
        "green_image_path": green_out,
        "non_green_image_path": non_green_out,
        "pixel_counts": {
            "total": total_pixels,
            "green": green_pixels,
            "non_green": non_green_pixels,
        },
    }
