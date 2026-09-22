"""
GreenPath AI — Tree Distribution Service
Upgraded from tree_distribution.py with 9-zone grid analysis.
"""

import logging
from typing import List, Tuple, Dict

logger = logging.getLogger(__name__)


def calculate_tree_distribution(
    image_path: str,
    boxes: List[Tuple[int, int, int, int]],
) -> Dict[str, int]:
    """
    Calculate how trees are distributed across 6 named zones:
      - Horizontal: left / center / right
      - Vertical:   top / middle / bottom
    """
    import cv2
    image = cv2.imread(image_path)
    if image is None:
        return {z: 0 for z in ["left", "center", "right", "top", "middle", "bottom"]}

    h, w = image.shape[:2]

    dist = {
        "left": 0, "center": 0, "right": 0,
        "top": 0, "middle": 0, "bottom": 0,
    }

    for (x1, y1, x2, y2) in boxes:
        cx = (x1 + x2) // 2
        cy = (y1 + y2) // 2

        # Horizontal zone
        if cx < w // 3:
            dist["left"] += 1
        elif cx < 2 * w // 3:
            dist["center"] += 1
        else:
            dist["right"] += 1

        # Vertical zone
        if cy < h // 3:
            dist["top"] += 1
        elif cy < 2 * h // 3:
            dist["middle"] += 1
        else:
            dist["bottom"] += 1

    return dist


def classify_zones(
    distribution: Dict[str, int],
    green_cover: float,
) -> Dict[str, str]:
    """
    Classify each zone by environmental health score.
    Returns dict of zone → classification label.
    """
    zones = {}
    for zone, count in distribution.items():
        score = (count * 3) + (green_cover * 0.5)
        if score > 70:
            zones[zone] = "Highly Green Zone"
        elif score > 40:
            zones[zone] = "Moderate Zone"
        elif score > 20:
            zones[zone] = "Heat Risk Zone"
        else:
            zones[zone] = "Critical Zone"
    return zones
