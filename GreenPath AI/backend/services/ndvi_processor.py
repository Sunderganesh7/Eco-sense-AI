import cv2
import numpy as np

def process_ndvi_statistics(tiff_bytes: bytes):
    """
    Parses a float32 TIFF containing [NDVI, dataMask] and returns statistics.
    """
    np_arr = np.frombuffer(tiff_bytes, np.uint8)
    
    # IMREAD_UNCHANGED is required to load 32-bit float TIFF
    img = cv2.imdecode(np_arr, cv2.IMREAD_UNCHANGED)
    
    if img is None:
        raise ValueError("Failed to decode NDVI TIFF")
        
    # GeoGuardian evalscript returns 2 bands: Band 1 is NDVI, Band 2 is DataMask
    # OpenCV usually loads multi-channel images in BGR order if it's 3-channel, 
    # but for 2-channel it might just be the exact array shape (H, W, 2).
    if len(img.shape) != 3 or img.shape[2] != 2:
        raise ValueError(f"Expected 2-channel NDVI image, got shape {img.shape}")
        
    ndvi = img[:, :, 0]
    data_mask = img[:, :, 1]
    
    valid_mask = data_mask > 0
    valid_pixels = ndvi[valid_mask]
    
    total_pixels = ndvi.size
    num_valid = valid_pixels.size
    
    if num_valid == 0:
        return {
            "mean_ndvi": 0,
            "min_ndvi": 0,
            "max_ndvi": 0,
            "valid_pixel_percentage": 0,
            "ndvi_values": ndvi.flatten().tolist(), # Keep as list for change mapping if needed
            "validity_map": valid_mask.flatten().tolist()
        }
        
    mean_ndvi = float(np.mean(valid_pixels))
    min_ndvi = float(np.min(valid_pixels))
    max_ndvi = float(np.max(valid_pixels))
    
    valid_pct = (num_valid / total_pixels) * 100
    
    return {
        "mean_ndvi": round(mean_ndvi, 4),
        "min_ndvi": round(min_ndvi, 4),
        "max_ndvi": round(max_ndvi, 4),
        "valid_pixel_percentage": round(valid_pct, 2),
        "ndvi_values": ndvi.flatten().tolist(),
        "validity_map": valid_mask.flatten().tolist()
    }
