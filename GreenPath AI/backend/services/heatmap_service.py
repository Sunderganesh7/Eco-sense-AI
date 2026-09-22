"""
GreenPath AI — Heatmap Service
Upgraded from tree_heatmap.py with Gaussian smoothing and viridis palette.
"""

import os
import cv2
import numpy as np
import logging
from typing import List, Tuple

logger = logging.getLogger(__name__)


def create_tree_heatmap(
    image_path: str,
    boxes: List[Tuple[int, int, int, int]],
    output_dir: str,
) -> str:
    """
    Generate a Gaussian-smoothed tree density heatmap overlaid on the image.

    Args:
        image_path: Path to the source image.
        boxes: List of (x1, y1, x2, y2) bounding boxes.
        output_dir: Directory to save the heatmap PNG.

    Returns:
        Path to the saved heatmap PNG.
    """
    os.makedirs(output_dir, exist_ok=True)
    image = cv2.imread(image_path)

    if image is None:
        logger.error(f"Cannot read image for heatmap: {image_path}")
        return ""

    h, w = image.shape[:2]

    # ── Build density matrix ──────────────────────────────────────────────
    density = np.zeros((h, w), dtype=np.float32)

    for (x1, y1, x2, y2) in boxes:
        cx = int((x1 + x2) / 2)
        cy = int((y1 + y2) / 2)
        # Draw a filled circle at each tree centroid
        cv2.circle(density, (cx, cy), radius=30, color=1.0, thickness=-1)

    # ── Gaussian blur for smooth heatmap ─────────────────────────────────
    blur_size = max(31, int(min(h, w) * 0.08))
    if blur_size % 2 == 0:
        blur_size += 1
    density = cv2.GaussianBlur(density, (blur_size, blur_size), 0)

    # ── Normalise to [0, 255] ─────────────────────────────────────────────
    if density.max() > 0:
        density = (density / density.max() * 255).astype(np.uint8)
    else:
        density = density.astype(np.uint8)

    # ── Apply MAGMA colormap (dark-to-bright) ─────────────────────────────
    heatmap_colored = cv2.applyColorMap(density, cv2.COLORMAP_INFERNO)

    # ── Blend with original image ─────────────────────────────────────────
    blended = cv2.addWeighted(image, 0.5, heatmap_colored, 0.5, 0)

    # ── Draw tree centroids as white dots ─────────────────────────────────
    for (x1, y1, x2, y2) in boxes:
        cx = int((x1 + x2) / 2)
        cy = int((y1 + y2) / 2)
        cv2.circle(blended, (cx, cy), 4, (255, 255, 255), -1)

    # ── Legend ────────────────────────────────────────────────────────────
    _draw_density_legend(blended)

    out_path = os.path.join(output_dir, "tree_heatmap.png")
    cv2.imwrite(out_path, blended)

    logger.info(f"🔥 Heatmap saved: {out_path}")
    return out_path


def _draw_density_legend(img: np.ndarray):
    """Overlay a colour scale legend on the heatmap."""
    h, w = img.shape[:2]
    bar_h = 15
    bar_w = min(180, w - 20)
    bar_x, bar_y = 10, h - bar_h - 25

    for i in range(bar_w):
        val = int(i / bar_w * 255)
        color_img = np.zeros((1, 1, 3), dtype=np.uint8)
        color_img[0, 0] = [val, val, val]
        colored = cv2.applyColorMap(color_img, cv2.COLORMAP_INFERNO)
        img[bar_y:bar_y + bar_h, bar_x + i] = colored[0, 0]

    cv2.putText(img, "Low", (bar_x, bar_y + bar_h + 12),
                cv2.FONT_HERSHEY_SIMPLEX, 0.35, (220, 220, 220), 1)
    cv2.putText(img, "High Density", (bar_x + bar_w - 70, bar_y + bar_h + 12),
                cv2.FONT_HERSHEY_SIMPLEX, 0.35, (220, 220, 220), 1)
