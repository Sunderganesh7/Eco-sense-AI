import cv2
import numpy as np

def calculate_pixel_differences(before_pixels, after_pixels):
    """
    Calculates pixel differences between two RGB images.
    Returns changed pixels, change percentage, severity, and change type.
    """
    total_pixels = before_pixels.shape[0] * before_pixels.shape[1]
    
    # Calculate Euclidean distance between RGB pixels
    # Need to cast to int32 to avoid overflow during squaring
    before_32 = before_pixels.astype(np.int32)
    after_32 = after_pixels.astype(np.int32)
    
    diff_squared = np.sum((after_32 - before_32) ** 2, axis=2)
    color_diff = np.sqrt(diff_squared)
    
    # Threshold for significant change
    changed_mask = color_diff > 50
    changed_pixels = np.count_nonzero(changed_mask)
    
    change_percentage = (changed_pixels / total_pixels) * 100
    
    severity = "low"
    if change_percentage > 20:
        severity = "high"
    elif change_percentage > 10:
        severity = "medium"
        
    change_type = "minor_change"
    if change_percentage > 15:
        change_type = "significant_change"
    elif change_percentage > 8:
        change_type = "moderate_change"
        
    return {
        "changePercentage": float(round(change_percentage, 2)),
        "changedPixels": int(changed_pixels),
        "totalPixels": int(total_pixels),
        "severity": severity,
        "changeType": change_type,
        "mask": changed_mask # Return mask for diff image generation
    }

def detect_changes(before_bytes: bytes, after_bytes: bytes, width: int = 512, height: int = 512):
    """
    Compares two satellite images and detects changes.
    Returns analysis results and a diff image byte array.
    """
    before_np = np.frombuffer(before_bytes, np.uint8)
    before_img = cv2.imdecode(before_np, cv2.IMREAD_COLOR)
    
    after_np = np.frombuffer(after_bytes, np.uint8)
    after_img = cv2.imdecode(after_np, cv2.IMREAD_COLOR)
    
    if before_img is None or after_img is None:
        raise ValueError("Failed to decode one or both images")
        
    # Resize to common dimensions
    before_resized = cv2.resize(before_img, (width, height), interpolation=cv2.INTER_AREA)
    after_resized = cv2.resize(after_img, (width, height), interpolation=cv2.INTER_AREA)
    
    # Calculate differences
    diff_results = calculate_pixel_differences(before_resized, after_resized)
    changed_mask = diff_results.pop("mask")
    
    # Create diff image
    diff_img = after_resized.copy()
    
    # Highlight changes (in OpenCV, channels are BGR)
    # GeoGuardian logic: diffPixels[i] = Math.min(255, afterR + 100); diffPixels[i+1] = Math.max(0, afterG - 50); diffPixels[i+2] = Math.max(0, afterB - 50);
    # In BGR:
    # B: max(0, B - 50)
    # G: max(0, G - 50)
    # R: min(255, R + 100)
    
    changed_bgr = diff_img[changed_mask].astype(np.int32)
    
    if len(changed_bgr) > 0:
        changed_bgr[:, 0] = np.maximum(0, changed_bgr[:, 0] - 50) # B
        changed_bgr[:, 1] = np.maximum(0, changed_bgr[:, 1] - 50) # G
        changed_bgr[:, 2] = np.minimum(255, changed_bgr[:, 2] + 100) # R
        
        diff_img[changed_mask] = changed_bgr.astype(np.uint8)
        
    _, buffer = cv2.imencode(".png", diff_img)
    diff_bytes = buffer.tobytes()
    
    return diff_results, diff_bytes
