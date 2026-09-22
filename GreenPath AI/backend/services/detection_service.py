"""
GreenPath AI — Tree Detection Service (YOLOv8 + Health Classification)
Upgraded version of yolo_tree_detection.py with:
  - Tree health classification (Healthy / Dry / Diseased / Dead)
  - Confidence scores per detection
  - Structured output for API responses
  - Lazy model loading for performance
"""

import os
import logging
import functools
from typing import List, Tuple, Dict

import cv2
import numpy as np

from backend.config import settings
from backend.models.detection_models import TreeDetectionResult, TreeHealthStatus

logger = logging.getLogger(__name__)


# ================================================================
# LAZY MODEL LOADER (Singleton — loads only once)
# ================================================================

@functools.lru_cache(maxsize=1)
def _load_yolo_model():
    """Load YOLO model once and cache it."""
    import torch
    # Monkeypatch torch.load to bypass weights_only default (PyTorch 2.6+) for custom YOLO models
    _orig_load = torch.load
    torch.load = lambda *args, **kwargs: _orig_load(*args, **{**kwargs, 'weights_only': False})

    from ultralytics import YOLO

    model_path = settings.YOLO_MODEL_PATH
    if not os.path.exists(model_path):
        # Fallback to base YOLOv8n if custom model missing
        fallback = "models/yolov8n.pt"
        if os.path.exists(fallback):
            model_path = fallback
            logger.warning(f"⚠ Custom model not found, using fallback: {fallback}")
        else:
            raise FileNotFoundError(
                f"YOLO model not found at '{model_path}'. "
                "Please place best.pt in backend/models/"
            )

    model = YOLO(model_path)
    logger.info(f"✅ YOLO model loaded from: {model_path}")
    return model


# ================================================================
# TREE HEALTH CLASSIFIER
# Using colour analysis on the bounding-box crop.
# Classes: healthy(green) / dry(brown-yellow) / diseased(pale) / dead(grey)
# ================================================================

def _classify_tree_health(crop: np.ndarray) -> Tuple[TreeHealthStatus, float]:
    """
    Classify tree health from a cropped bounding-box image.
    Returns (health_status, confidence_score).

    Heuristic HSV colour-based classifier:
      - Healthy  → dominant green (H:35-85)
      - Dry      → dominant yellow-brown (H:15-35)
      - Diseased → pale / desaturated green (low saturation, low-mid H)
      - Dead     → grey / very dark (low saturation, low value)
    """
    if crop is None or crop.size == 0:
        return TreeHealthStatus.HEALTHY, 0.5

    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    total_pixels = crop.shape[0] * crop.shape[1]

    # Green (healthy)
    green_mask = cv2.inRange(hsv, np.array([35, 50, 50]), np.array([85, 255, 255]))
    green_ratio = np.sum(green_mask > 0) / total_pixels

    # Yellow-brown (dry)
    dry_mask = cv2.inRange(hsv, np.array([15, 50, 50]), np.array([35, 255, 200]))
    dry_ratio = np.sum(dry_mask > 0) / total_pixels

    # Grey / dark (dead)
    gray_img = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    saturation = hsv[:, :, 1]
    low_sat_mask = saturation < 40
    dark_mask = hsv[:, :, 2] < 60
    dead_ratio = np.sum(low_sat_mask & dark_mask) / total_pixels
    diseased_ratio = np.sum(low_sat_mask & ~dark_mask) / total_pixels

    # Pick dominant class
    scores = {
        TreeHealthStatus.HEALTHY: green_ratio,
        TreeHealthStatus.DRY: dry_ratio,
        TreeHealthStatus.DEAD: dead_ratio,
        TreeHealthStatus.DISEASED: diseased_ratio,
    }
    status = max(scores, key=scores.get)
    confidence = min(scores[status] * 2.0, 1.0)  # scale to [0,1]

    # Default to healthy if nothing dominant
    if confidence < 0.1:
        status = TreeHealthStatus.HEALTHY
        confidence = 0.6

    return status, round(confidence, 3)


# ================================================================
# MAIN DETECTION FUNCTION
# ================================================================

def _decode_image_to_cv2(image_path: str) -> np.ndarray:
    """
    Safely reads any image file (JPEG, PNG, TIFF, CMYK, etc.) using Pillow,
    resolves EXIF rotation, and converts it to OpenCV BGR format.
    """
    from PIL import Image, ImageOps
    try:
        with open(image_path, 'rb') as f:
            with Image.open(f) as img:
                img.load()
                # Resolve EXIF orientation
                try:
                    img = ImageOps.exif_transpose(img)
                except Exception as exif_err:
                    logger.warning(f"EXIF transpose failed for {image_path}: {exif_err}")
                
                # Convert color mode to RGB if not already
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Convert RGB Pil Image to BGR OpenCV array
                return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
    except Exception as e:
        logger.error(f"Failed to decode image {image_path} with Pillow: {e}")
        return None


def detect_trees(
    image_path: str,
    output_dir: str,
    original_size: Tuple[int, int] = None,
) -> Dict:
    """
    Run YOLOv8 tree detection on the given image.

    Returns a dict containing:
      - tree_count (int)
      - detections (list of TreeDetectionResult)
      - boxes_unscaled (list of unscaled bounding boxes)
      - health_summary (dict)
      - output_image_path (str)
    """
    os.makedirs(output_dir, exist_ok=True)

    model = _load_yolo_model()
    image = _decode_image_to_cv2(image_path)

    if image is None:
        raise ValueError(f"Image could not be decoded: {image_path}")

    # Run YOLO inference
    results = model(image_path, conf=settings.YOLO_CONFIDENCE, verbose=False)

    detections: List[TreeDetectionResult] = []
    boxes_unscaled: List[List[int]] = []
    annotated = image.copy()

    health_color_map = {
        TreeHealthStatus.HEALTHY: (80, 200, 0),       # Vibrant Emerald BGR: (B, G, R)
        TreeHealthStatus.DRY: (0, 150, 235),          # Sunset Amber/Orange
        TreeHealthStatus.DISEASED: (50, 50, 220),     # Soft Crimson/Coral
        TreeHealthStatus.DEAD: (120, 120, 120),       # Muted Slate Grey
    }

    for r in results:
        if r.boxes is None:
            continue
        for box in r.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            conf = float(box.conf[0])

            # Crop for health classification (using unscaled coordinates on unscaled loaded image)
            crop = image[max(0, y1):y2, max(0, x1):x2]
            health, h_conf = _classify_tree_health(crop)

            boxes_unscaled.append([x1, y1, x2, y2])

            # Rescale box for detections list if original size is provided
            if original_size:
                orig_w, orig_h = original_size
                h_proc, w_proc = image.shape[:2]
                scale_x = orig_w / w_proc
                scale_y = orig_h / h_proc
                x1_scaled = int(round(x1 * scale_x))
                y1_scaled = int(round(y1 * scale_y))
                x2_scaled = int(round(x2 * scale_x))
                y2_scaled = int(round(y2 * scale_y))
                box_for_result = [x1_scaled, y1_scaled, x2_scaled, y2_scaled]
            else:
                box_for_result = [x1, y1, x2, y2]

            detections.append(
                TreeDetectionResult(
                    box=box_for_result,
                    confidence=round(conf, 3),
                    health_status=health,
                    health_confidence=h_conf,
                )
            )

            # Draw annotated bounding box (uses unscaled coords)
            color = health_color_map.get(health, (0, 255, 0))
            cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 0, 0), 4) # Outer black shadow border
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2) # Inner colored core border

            # Draw tag text with solid background and clean borders
            label = f"{health.value.upper()} {conf*100:.0f}%"
            (lw, lh), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.38, 1)
            
            # Draw label box background and thin black outline
            cv2.rectangle(annotated, (x1 - 1, y1 - lh - 8), (x1 + lw + 6, y1), (0, 0, 0), -1) # Black banner backing
            cv2.rectangle(annotated, (x1 - 1, y1 - lh - 8), (x1 + lw + 6, y1), color, 1) # Color border for banner
            
            # Put high-legibility text on the banner
            cv2.putText(
                annotated, label, (x1 + 3, y1 - 4),
                cv2.FONT_HERSHEY_SIMPLEX, 0.38, (255, 255, 255), 1, cv2.LINE_AA
            )

    # Save annotated image
    base_name = os.path.splitext(os.path.basename(image_path))[0]
    out_path = os.path.join(output_dir, f"{base_name}_yolo_tree_output.png")
    cv2.imwrite(out_path, annotated)

    # Health summary counts
    health_summary: Dict[str, int] = {s.value: 0 for s in TreeHealthStatus}
    for d in detections:
        # Note: health_status is Enum
        health_summary[d.health_status.value] += 1
    health_summary["total"] = len(detections)

    logger.info(
        f"🌳 Detection complete: {len(detections)} trees | "
        f"Health: {health_summary}"
    )

    return {
        "tree_count": len(detections),
        "detections": detections,
        "boxes_unscaled": boxes_unscaled,
        "health_summary": health_summary,
        "output_image_path": out_path,
    }


def get_detection_boxes(image_path: str, output_dir: str) -> Tuple[int, List[Tuple]]:
    """
    Lightweight wrapper returning (count, boxes_list) for
    backward-compatible use in other services.
    """
    result = detect_trees(image_path, output_dir)
    boxes = [tuple(d.box) for d in result["detections"]]
    return result["tree_count"], boxes
