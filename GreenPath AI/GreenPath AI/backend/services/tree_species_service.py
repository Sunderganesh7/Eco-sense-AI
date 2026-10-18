"""
GreenPath AI — Tree Species Detection Service (YOLOv8)
Loads models/tree_species.pt once at Flask startup and provides inference
with species name, confidence score, bounding boxes, and detection time.
"""

import os
import time
import logging
import functools
from typing import Dict, List, Any

import cv2
import numpy as np
from backend.services.botanical_service import get_botanical_info, get_tree_care_recommendation

logger = logging.getLogger("greenpath.tree_species")


@functools.lru_cache(maxsize=1)
def _load_tree_species_model():
    """
    Singleton loader for Tree Species YOLO model (models/tree_species.pt).
    Loads ONLY models/tree_species.pt (no fallback to other models).
    """
    import torch
    _orig_load = torch.load
    torch.load = lambda *args, **kwargs: _orig_load(*args, **{**kwargs, 'weights_only': False})

    from ultralytics import YOLO

    model_path = "models/tree_species.pt"
    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Trained model file '{model_path}' not found. "
            "Please verify that models/tree_species.pt exists and is not renamed."
        )

    model = YOLO(model_path)
    logger.info(f"✅ Tree Species YOLO model successfully loaded from: {model_path} with {len(model.names)} classes.")
    return model


def init_tree_species_model():
    """
    Called once during Flask application startup to preload the model into memory
    and print model.names to verify all 131 classes are loaded.
    """
    try:
        model = _load_tree_species_model()
        print("=" * 70)
        print("🌲 [STARTUP CHECK] Tree Species YOLO Model Verification")
        print(f"🌲 Loaded Model Path : models/tree_species.pt")
        print(f"🌲 Total Class Count : {len(model.names)} classes")
        print(f"🌲 Sample Class Names: {list(model.names.items())[:10]}")
        print("=" * 70)
        logger.info(f"Verified Tree Species model startup loading: {len(model.names)} classes loaded.")
    except Exception as e:
        logger.error(f"Failed to initialize Tree Species YOLO model at startup: {e}")


def detect_tree_species(image_path: str, output_dir: str = "outputs") -> Dict[str, Any]:
    """
    Run YOLO inference using official Ultralytics API on models/tree_species.pt
    with conf=0.10 for testing and full raw prediction logging.
    
    Returns:
        Dict containing species_name, confidence_score, detection_time,
        uploaded_image_url, detected_image_url, and raw_predictions array.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image file not found: {image_path}")

    os.makedirs(output_dir, exist_ok=True)

    # 1. Get cached YOLO model
    model = _load_tree_species_model()

    # 2. Measure inference time and call official Ultralytics API directly on image_path
    # Using lower confidence threshold 0.10 for testing as requested
    start_time = time.perf_counter()
    results = model.predict(
        source=image_path,
        conf=0.10,
        verbose=True,
        save=False
    )
    elapsed_time = time.perf_counter() - start_time

    r = results[0]
    names_map = getattr(r, "names", {})

    detections: List[Dict[str, Any]] = []
    raw_predictions: List[Dict[str, Any]] = []

    logger.debug(f"🌲 [DEBUG INFERENCE] Raw YOLO Predictions for: {image_path}")
    logger.debug(f"   Total bounding boxes detected (conf >= 0.10): {len(r.boxes) if r.boxes else 0}")

    if r.boxes and len(r.boxes) > 0:
        for idx, box in enumerate(r.boxes):
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            conf = float(box.conf[0])
            cls_idx = int(box.cls[0])
            species_name = names_map.get(cls_idx, f"Class {cls_idx}")

            logger.debug(f"   -> Box #{idx+1}: Class ID = {cls_idx} ('{species_name}') | Confidence = {conf:.4f} ({conf*100:.2f}%) | BBox = [{x1}, {y1}, {x2}, {y2}]")

            item_data = {
                "box": [x1, y1, x2, y2],
                "confidence": conf,
                "confidence_percent": f"{conf * 100:.2f}%",
                "class_index": cls_idx,
                "class_id": cls_idx,
                "species": species_name,
                "class_name": species_name
            }
            detections.append(item_data)
            raw_predictions.append(item_data)
    else:
        logger.debug("   -> No detections found at conf >= 0.10 threshold.")

    # 3. Determine primary detected species (highest confidence detection)
    if detections:
        best_detection = max(detections, key=lambda d: d["confidence"])
        primary_species = best_detection["species"]
        primary_conf = best_detection["confidence"]
        confidence_str = f"{primary_conf * 100:.2f}%"
        status_str = "Species Classified"
        botanical_meta = get_botanical_info(primary_species)
        care_advisory = get_tree_care_recommendation(primary_species, "healthy")
    else:
        primary_species = "No tree species detected. Please upload a clearer image containing a visible tree."
        confidence_str = "0.00%"
        primary_conf = 0.0
        status_str = "No Tree Detected"
        botanical_meta = None
        care_advisory = None

    # 4. Use official Ultralytics r.plot() to generate annotated image (without confidence labels)
    annotated = r.plot(conf=False)
    base_name = os.path.splitext(os.path.basename(image_path))[0]
    out_filename = f"{base_name}_species_detected.png"
    out_path = os.path.join(output_dir, out_filename)
    cv2.imwrite(out_path, annotated)

    # Format detection time
    ms = int(round(elapsed_time * 1000))
    time_str = f"{elapsed_time:.2f}s ({ms} ms)"

    return {
        "success": True,
        "species_name": primary_species,
        "detection_status": status_str,
        "botanical_info": botanical_meta,
        "care_recommendation": care_advisory,
        "confidence_score": confidence_str,
        "confidence_raw": round(primary_conf, 4),
        "detection_time": time_str,
        "detection_time_seconds": round(elapsed_time, 3),
        "tree_count": len(detections),
        "detections": detections,
        "raw_predictions": raw_predictions,
        "uploaded_image_url": f"/uploads/{os.path.basename(image_path)}",
        "detected_image_url": f"/outputs/{out_filename}",
        "output_filename": out_filename
    }
