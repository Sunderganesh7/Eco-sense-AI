import os
import sys
import cv2

sys.path.append(os.path.abspath("."))
from backend.services.detection_service import _load_yolo_model, _decode_image_to_cv2

model = _load_yolo_model()
img_path = "uploads/test_test_large_1786783178_3a4ff9.jpg"
image, fmt = _decode_image_to_cv2(img_path)

for conf in [0.25, 0.15, 0.10]:
    for imgsz in [1536, 2560, 3072]:
        print(f"\nTrying conf={conf}, imgsz={imgsz}")
        try:
            results = model(image, conf=conf, iou=0.5, imgsz=imgsz, verbose=False)
            print(f"Detections: {len(results[0].boxes)}")
        except Exception as e:
            print(f"Failed: {e}")
