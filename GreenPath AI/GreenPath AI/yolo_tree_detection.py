import torch
# Monkeypatch torch.load to bypass weights_only default (PyTorch 2.6+) for custom YOLO models
_orig_load = torch.load
torch.load = lambda *args, **kwargs: _orig_load(*args, **{**kwargs, 'weights_only': False})

from ultralytics import YOLO
import cv2
import os

# Load trained model
model_path = "best.pt" if os.path.exists("best.pt") else "models/best.pt"
model = YOLO(model_path)

def detect_trees_yolo(image_path, output_dir="outputs"):
    os.makedirs(output_dir, exist_ok=True)

    results = model(image_path, conf=0.25)
    image = cv2.imread(image_path)

    tree_count = 0
    boxes_list = []   # store boxes for heatmap

    for r in results:
        if r.boxes is not None:
            for box in r.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                boxes_list.append((x1, y1, x2, y2))

                # High-contrast double border drawing (black outer, green inner)
                cv2.rectangle(image, (x1, y1), (x2, y2), (0, 0, 0), 4)
                cv2.rectangle(image, (x1, y1), (x2, y2), (80, 200, 0), 2)

    tree_count = len(boxes_list)

    cv2.imwrite(
        os.path.join(output_dir, "yolo_tree_output.png"),
        image
    )

    # ✅ RETURN BOTH COUNT AND BOXES
    return tree_count, boxes_list
