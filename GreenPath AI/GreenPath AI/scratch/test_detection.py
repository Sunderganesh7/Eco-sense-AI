import os
import sys

# Ensure backend modules can be imported
sys.path.append(os.path.abspath("."))

from backend.services.detection_service import detect_trees
import logging

logging.basicConfig(level=logging.INFO)

test_images = [
    "uploads/images.jpg",
    "uploads/test_test_large_1786783178_3a4ff9.jpg",
    "uploads/ov_large_1787410237_d26349.jpg"
]

for img_path in test_images:
    if os.path.exists(img_path):
        print(f"\nTesting: {img_path}")
        try:
            result = detect_trees(img_path, "outputs")
            print(f"Tree count: {result['tree_count']}")
            print(f"Health summary: {result['health_summary']}")
        except Exception as e:
            print(f"Failed: {e}")
    else:
        print(f"File not found: {img_path}")
