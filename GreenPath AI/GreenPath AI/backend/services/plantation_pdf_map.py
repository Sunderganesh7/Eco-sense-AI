import cv2
import numpy as np
import os
import uuid

def _generate_plantation_map(image_path: str, output_dir: str, plantation_data: dict) -> str:
    """Generates a professional visualization of plantation zones for the PDF."""
    if not image_path or not os.path.exists(image_path) or not plantation_data:
        return ""
        
    img = cv2.imread(image_path)
    if img is None:
        return ""
        
    h, w = img.shape[:2]
    
    # Create an overlay layer for translucent zones
    overlay = img.copy()
    
    # 1. Draw Priority Zones
    zones = plantation_data.get("zones", [])
    for zone in zones:
        zone_id = zone.get("id") # "P-01" to "P-09"
        if not zone_id.startswith("P-"):
            continue
            
        try:
            idx = int(zone_id.split("-")[1]) - 1
            col = idx % 3
            row = idx // 3
        except:
            continue
            
        x0 = int(col * (w / 3))
        y0 = int(row * (h / 3))
        x1 = int(x0 + (w / 3))
        y1 = int(y0 + (h / 3))
        
        priority = zone.get("priority", "LOW")
        if priority == "HIGH":
            # Red overlay
            cv2.rectangle(overlay, (x0, y0), (x1, y1), (0, 0, 255), -1)
        elif priority == "MEDIUM":
            # Yellow overlay
            cv2.rectangle(overlay, (x0, y0), (x1, y1), (0, 255, 255), -1)
            
    # Blend overlay with original image (25% opacity)
    alpha = 0.25
    img = cv2.addWeighted(overlay, alpha, img, 1 - alpha, 0)
    
    # 2. Draw Existing Trees (GREEN)
    existing_points = plantation_data.get("existing_points", [])
    for pt in existing_points:
        px = int((pt.get("x", 0) / 100.0) * w)
        py = int((pt.get("y", 0) / 100.0) * h)
        # Green circle with white outline
        cv2.circle(img, (px, py), 7, (255, 255, 255), -1, cv2.LINE_AA) # White outline
        cv2.circle(img, (px, py), 5, (0, 200, 0), -1, cv2.LINE_AA)   # Green fill
        
    # 3. Draw Recommended Planting Points (Numbered)
    planting_points = plantation_data.get("planting_points", [])
    for i, pt in enumerate(planting_points):
        px = int((pt.get("x", 0) / 100.0) * w)
        py = int((pt.get("y", 0) / 100.0) * h)
        priority = pt.get("priority", "HIGH")
        
        # Determine colors (BGR)
        if priority == "HIGH":
            color = (50, 50, 255) # Red/Pink
        else:
            color = (0, 215, 255) # Yellow/Gold
            
        # Draw circular marker
        cv2.circle(img, (px, py), 12, (255, 255, 255), -1, cv2.LINE_AA) # White outline
        cv2.circle(img, (px, py), 10, color, -1, cv2.LINE_AA)
        
        # Add number
        num_str = str(i + 1)
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.5
        thickness = 2
        (text_w, text_h), _ = cv2.getTextSize(num_str, font, font_scale, thickness)
        text_x = px - (text_w // 2)
        text_y = py + (text_h // 2)
        
        cv2.putText(img, num_str, (text_x, text_y), font, font_scale, (255, 255, 255), thickness, cv2.LINE_AA)

    # Save to outputs
    os.makedirs(output_dir, exist_ok=True)
    out_filename = f"plantation_map_{uuid.uuid4().hex[:8]}.png"
    out_filepath = os.path.join(output_dir, out_filename)
    cv2.imwrite(out_filepath, img)
    return out_filepath
