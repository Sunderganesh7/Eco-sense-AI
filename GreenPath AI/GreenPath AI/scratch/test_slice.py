import os
import sys
import cv2

sys.path.append(os.path.abspath("."))
from backend.services.detection_service import _load_yolo_model, _decode_image_to_cv2

model = _load_yolo_model()
img_path = "uploads/test_test_large_1786783178_3a4ff9.jpg"
image, fmt = _decode_image_to_cv2(img_path)

h, w = image.shape[:2]
patches = [
    (0, 0, w//2 + 100, h//2 + 100), 
    (w//2 - 100, 0, w, h//2 + 100), 
    (0, h//2 - 100, w//2 + 100, h), 
    (w//2 - 100, h//2 - 100, w, h)
]

fallback_boxes = []
for (x1_p, y1_p, x2_p, y2_p) in patches:
    patch = image[y1_p:y2_p, x1_p:x2_p]
    p_res = model(patch, conf=0.25, iou=0.5, imgsz=((max(patch.shape[:2]) + 31)//32)*32, verbose=False)
    if p_res[0].boxes is not None:
        for box in p_res[0].boxes:
            bx1, by1, bx2, by2 = map(int, box.xyxy[0])
            conf = float(box.conf[0])
            fallback_boxes.append([bx1 + x1_p, by1 + y1_p, bx2 + x1_p, by2 + y1_p, conf])

bboxes = []
scores = []
for b in fallback_boxes:
    bboxes.append([int(b[0]), int(b[1]), int(b[2]-b[0]), int(b[3]-b[1])])
    scores.append(b[4])

if len(bboxes) > 0:
    indices = cv2.dnn.NMSBoxes(bboxes, scores, 0.25, 0.5)
    print(f"Slice detections: {len(indices)}")
else:
    print("Slice detections: 0")

