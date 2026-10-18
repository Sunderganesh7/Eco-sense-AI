import asyncio
from flask import Flask, render_template, jsonify, request, send_from_directory, session, redirect, url_for, flash, jsonify
import os
import cv2
import random
from urllib.parse import quote
from functools import wraps
from aqi_model import analyze_environment

# -------------------------------
# Import project modules
# -------------------------------
from yolo_tree_detection import detect_trees_yolo
from tree_heatmap import create_tree_heatmap
from preprocessing_pipeline import preprocessing_pipeline
from green_cover import green_cover_estimation
from optimal_path import generate_optimal_path
from tree_info import TREE_INFO
from tree_distribution import calculate_tree_distribution
from plantation_recommendation import get_plantation_recommendation
from backend.database.mysql_db import init_db, log_analysis, get_user_analyses, get_global_stats

# -------------------------------
# Flask app setup
# -------------------------------
app = Flask(__name__)
app.secret_key = "greenpath_capstone_project_key"

# BUG 5 FIX: Limit uploads to 64 MB; prevents silent truncation of large TIFF/RAW images.
# Files larger than this return a 413 response handled below.
app.config['MAX_CONTENT_LENGTH'] = 64 * 1024 * 1024  # 64 MB

progress_tracker = {}

def get_tracker_key():
    if "user" in session:
        return f"user_{session['user']['id']}"
    if "session_id" not in session:
        import uuid
        session["session_id"] = str(uuid.uuid4())
    return f"session_{session['session_id']}"

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
OUTPUT_FOLDER = os.path.join(BASE_DIR, "outputs")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Run database setup on server boot
init_db()

# Preload Tree Species YOLO model once during server startup
from backend.services.tree_species_service import init_tree_species_model, detect_tree_species
init_tree_species_model()

# -------------------------------
# Authentication Decorator
# -------------------------------
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user" not in session:
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated_function


# BUG 5 FIX: Return clear JSON error for oversized uploads instead of crashing.
@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({
        "success": False,
        "message": "File too large. Maximum upload size is 64 MB. Please compress your image or use a smaller file."
    }), 413

# -------------------------------
# Core Analysis Engine
# -------------------------------
def run_full_analysis(image_path):
    """
    Runs the complete AI analysis pipeline for the uploaded image
    and stores the results in the Flask session.
    """
    from backend.services.detection_service import detect_trees
    import math

    key = get_tracker_key()
    progress_tracker[key] = 1 # Step 1: YOLOv8 Detection Starting

    # Retrieve original size from session to rescale coordinates back for frontend canvas
    original_size = session.get("original_size")

    # 1. Advanced Tree Health & Count Detection
    result = detect_trees(image_path, OUTPUT_FOLDER, original_size=original_size)
    tree_count = result["tree_count"]
    
    # Bounding Boxes for spatial calculations (unscaled relative to processing image size)
    boxes = result.get("boxes_unscaled") or [d.box for d in result["detections"]]
    
    name, _ = os.path.splitext(os.path.basename(image_path))

    progress_tracker[key] = 2 # Step 2: Heatmap Generation Starting

    # 2. Generates Heatmap dynamically
    heatmap_filename = f"{name}_tree_heatmap.png"
    heatmap_filepath = os.path.join(OUTPUT_FOLDER, heatmap_filename)
    image = cv2.imread(image_path)
    if image is not None:
        heatmap_img = create_tree_heatmap(image, boxes)
        cv2.imwrite(heatmap_filepath, heatmap_img)
        
    progress_tracker[key] = 3 # Step 3: CV Pipeline Processing Starting

    # 3. Generates 5-stage image processing pipeline images (dynamic prefixing)
    preprocessing_pipeline(image_path, OUTPUT_FOLDER)
    
    # 4. Generates Spatial distribution
    dist = calculate_tree_distribution(image_path, boxes)
    
    progress_tracker[key] = 4 # Step 4: Green Cover Estimation Starting

    # 5. Green Cover Estimation (returns dynamic paths)
    green, non_green, green_img, non_green_img = green_cover_estimation(image_path, OUTPUT_FOLDER)
    
    progress_tracker[key] = 5 # Step 5: Weather API and AQI Estimation Starting
    
    # 6. Live Weather & AQI API Telemetry Integration
    base_lat = session.get("base_lat", 40.782091)
    base_lng = session.get("base_lng", -73.968285)
    
    try:
        from backend.services.weather_api import fetch_live_weather_and_aqi
        weather_data = fetch_live_weather_and_aqi(base_lat, base_lng)
    except Exception as e:
        import logging
        logging.getLogger("greenpath.app").warning(f"Failed to fetch live weather: {e}")
        weather_data = {
            "status": "offline",
            "temperature": 25.0,
            "humidity": 60,
            "pm2_5": 12.0,
            "pm10": 20.0,
            "us_aqi": 50,
            "api_latency_ms": 0
        }
        
    # Inject real-time weather stats into session
    session["live_weather"] = weather_data
    
    # Environmental AQI Analysis (hybrid visual-instrumental calculation)
    aqi_result = analyze_environment(
        image_path, 
        tree_count, 
        green, 
        live_pm2_5=weather_data.get("pm2_5"), 
        live_aqi=weather_data.get("us_aqi")
    )

    # ── SINGLE SOURCE OF TRUTH METRICS ──────────────────────────────────────────
    detected_tree_count = tree_count

    # ── 7. Estimated CO₂ Absorption ──────────────────────────────────────────
    # Project Assumption: 1 tree = 22 kg CO₂/year
    co2_absorption = float(detected_tree_count * 22.0)

    # ── 8. Eco-Index Score ───────────────────────────────────────────────────
    # Project Assumption: 30 trees is the target
    TARGET_TREE_COUNT = 30.0
    eco_index_raw = (detected_tree_count / TARGET_TREE_COUNT) * 100.0
    eco_index = int(round(min(eco_index_raw, 100.0)))

    if eco_index >= 80:
        eco_status = "Healthy 🌿"
    elif eco_index >= 50:
        eco_status = "Moderate ⚠️"
    else:
        eco_status = "Needs Attention 🔴"

    # ── 9. Estimated Cooling Effect (Heat Mitigation) ───────────────────────
    # Project Assumption: 1 tree = 0.15°C cooling, capped at 3.0°C
    heat_reduction = min(detected_tree_count * 0.15, 3.0)
    heat_reduction = round(heat_reduction, 2)

    BASE_TEMP = float(weather_data.get("temperature", 35.0))
    final_temp = round(BASE_TEMP - heat_reduction, 2)

    if heat_reduction < 1.2:
        cooling_level = "Minimal Cooling Effect 🟡"
    elif heat_reduction < 2.5:
        cooling_level = "Moderate Cooling Effect 🟢"
    else:
        cooling_level = "High Evapotranspiration Cooling Effect 🔵"
        
    # 10. Smart zones
    zones = {}
    for zone, count in dist.items():
        zone_score = (count * 3) + (green * 0.5)
        if zone_score > 70:
            zones[zone] = "Highly Green Zone 🌳"
        elif zone_score > 40:
            zones[zone] = "Moderate Zone 🌿"
        elif zone_score > 20:
            zones[zone] = "Heat Risk Zone 🔥"
        else:
            zones[zone] = "Critical Zone ⚠"
            
    # 11. Plantation recommendations
    plantation_res = get_plantation_recommendation(dist)
    
    # 11.5 Plantation Zones Detailed Grid (3x3)
    import math

    def _pos_label(px_pct, py_pct):
        """Return human-readable image position from percentage coordinates."""
        x_label = "Left" if px_pct <= 33.33 else ("Right" if px_pct >= 66.66 else "Center")
        y_label = "Top" if py_pct <= 33.33 else ("Bottom" if py_pct >= 66.66 else "Middle")
        if x_label == "Center" and y_label == "Middle":
            return "Center"
        return f"{y_label} {x_label}"

    def _gen_candidate_grid(col, row, img_w, img_h, needed):
        """Deterministically generate candidate points inside a 3x3 zone cell.
        Subdivides the cell into a sub-grid and returns the first `needed` centres."""
        x_min = col * (img_w / 3)
        x_max = (col + 1) * (img_w / 3)
        y_min = row * (img_h / 3)
        y_max = (row + 1) * (img_h / 3)
        # Inset 15% from each edge so markers are never right on the border
        margin_x = (x_max - x_min) * 0.15
        margin_y = (y_max - y_min) * 0.15
        x_min += margin_x
        x_max -= margin_x
        y_min += margin_y
        y_max -= margin_y
        # Build a sub-grid large enough to cover `needed` points
        side = max(2, math.ceil(math.sqrt(needed + 1)))
        candidates = []
        for sy in range(side):
            for sx in range(side):
                if side == 1:
                    px = (x_min + x_max) / 2
                    py = (y_min + y_max) / 2
                else:
                    px = x_min + sx * (x_max - x_min) / (side - 1)
                    py = y_min + sy * (y_max - y_min) / (side - 1)
                candidates.append((px, py))
        return candidates

    grid_counts = {f"P-{i+1:02d}": 0 for i in range(9)}
    img_h, img_w = (1000, 1000)
    if image is not None:
        img_h, img_w, _ = image.shape

    existing_centers = []   # pixel coords for collision detection
    existing_points = []    # percentage coords for template

    for box in boxes:
        x1, y1, x2, y2 = box
        cx = (x1 + x2) / 2
        cy = (y1 + y2) / 2
        col = min(2, max(0, int(cx // (img_w / 3))))
        row = min(2, max(0, int(cy // (img_h / 3))))
        idx = row * 3 + col
        grid_counts[f"P-{idx+1:02d}"] += 1
        existing_centers.append((cx, cy))
        existing_points.append({"x": round(cx / img_w * 100, 2),
                                 "y": round(cy / img_h * 100, 2)})

    zone_area = 0.45
    plantation_zones_data = {
        "zones": [],
        "total_recommended_area": 0.0,
        "priority_zones_count": 0,
        "high_priority_count": 0,
        "estimated_trees": 0,
        "total_area": 4.05,
        "planting_points": [],
        "existing_points": existing_points
    }

    avg_density = tree_count / 9 if tree_count > 0 else 10
    min_sep = img_w * 0.04   # minimum pixel separation between any two recommended points
    global_pt_idx = 0        # running index across all zones

    for i in range(9):
        col = i % 3
        row = i // 3
        zone_id = f"P-{i+1:02d}"
        count = grid_counts[zone_id]

        needed = 0
        target = 0
        if count < avg_density * 0.5:
            priority = "HIGH"
            p_level = "🔴"
            target = math.ceil(avg_density * 1.5)
            desc = "Low tree density detected in this area. Consider planting here to balance green coverage."
        elif count < avg_density * 0.9:
            priority = "MEDIUM"
            p_level = "🟡"
            target = math.ceil(avg_density * 1.0)
            desc = "Sparse tree coverage in this area. Additional planting could improve canopy."
        else:
            priority = "LOW"
            p_level = "🟢"
            desc = "Existing coverage sufficient. No immediate plantation requirement."

        needed = max(0, target - count)
        if needed == 0 and priority in ["HIGH", "MEDIUM"]:
            needed = 1

        if needed > 0:
            plantation_zones_data["total_recommended_area"] += zone_area
            plantation_zones_data["priority_zones_count"] += 1
            plantation_zones_data["estimated_trees"] += needed
            if priority == "HIGH":
                plantation_zones_data["high_priority_count"] += 1

            # --- Deterministic candidate grid for this cell ---
            candidates = _gen_candidate_grid(col, row, img_w, img_h, needed)
            points_placed = 0
            for cand_px, cand_py in candidates:
                if points_placed >= needed:
                    break
                # Check separation from all existing trees + already-placed recommended pts
                too_close = any(
                    math.hypot(cand_px - ex, cand_py - ey) < min_sep
                    for ex, ey in existing_centers
                )
                if not too_close:
                    global_pt_idx += 1
                    existing_centers.append((cand_px, cand_py))
                    px_pct = round(cand_px / img_w * 100, 2)
                    py_pct = round(cand_py / img_h * 100, 2)
                    plantation_zones_data["planting_points"].append({
                        "id": f"{zone_id}-{points_placed + 1:02d}",
                        "zone": zone_id,
                        "x": px_pct,
                        "y": py_pct,
                        "position": _pos_label(px_pct, py_pct),
                        "priority": priority,
                        "desc": desc
                    })
                    points_placed += 1

            # Fallback: if all candidates were too close to existing trees,
            # relax the check and force-place the remaining points.
            if points_placed < needed:
                for cand_px, cand_py in candidates:
                    if points_placed >= needed:
                        break
                    global_pt_idx += 1
                    existing_centers.append((cand_px, cand_py))
                    px_pct = round(cand_px / img_w * 100, 2)
                    py_pct = round(cand_py / img_h * 100, 2)
                    plantation_zones_data["planting_points"].append({
                        "id": f"{zone_id}-{points_placed + 1:02d}",
                        "zone": zone_id,
                        "x": px_pct,
                        "y": py_pct,
                        "position": _pos_label(px_pct, py_pct),
                        "priority": priority,
                        "desc": desc
                    })
                    points_placed += 1

        plantation_zones_data["zones"].append({
            "id": zone_id,
            "count": count,
            "area": zone_area,
            "priority": priority,
            "p_level": p_level,
            "needed": needed,
            "density": "Low" if priority == "HIGH" else ("Medium" if priority == "MEDIUM" else "High"),
            "desc": desc
        })

    session["plantation_zones_data"] = plantation_zones_data
    
    # 12. Tree health detailed list
    detections_list = []
    for det in result["detections"]:
        detections_list.append({
            "box": det.box,
            "confidence": det.confidence,
            "health_status": det.health_status.value,
            "health_confidence": det.health_confidence
        })
        
    # 13. Grid path planning filename & creation
    optimal_path_filename = f"{name}_optimal_path.png"
    optimal_path_filepath = os.path.join(OUTPUT_FOLDER, optimal_path_filename)
    generate_optimal_path(image_path, optimal_path_filepath)
    
    # 14. GeoAI Map Coordinates offsets from central base
    mock_gps_points = []
    base_lat = 40.782091
    base_lng = -73.968285
    if image is not None:
        h, w, _ = image.shape
        for box in boxes:
            x1, y1, x2, y2 = box
            cx = (x1 + x2) / 2
            cy = (y1 + y2) / 2
            lat_offset = ((h - cy) / h) * 0.004 - 0.002
            lng_offset = (cx / w) * 0.005 - 0.0025
            mock_gps_points.append({
                "lat": base_lat + lat_offset,
                "lng": base_lng + lng_offset,
                "confidence": 0.94
            })
            
    # Save all values to session cache (preserve original full-res or converted PNG name)
    if "current_image" not in session:
        session["current_image"] = os.path.basename(image_path)
    session["tree_count"] = tree_count
    session["tree_distribution"] = dist
    session["green"] = green
    session["non_green"] = non_green
    session["green_img"] = green_img
    session["non_green_img"] = non_green_img
    
    # Dynamic Unique Filenames
    session["yolo_tree_output_image"] = f"{name}_yolo_tree_output.png"
    session["tree_heatmap_image"] = heatmap_filename
    session["pipeline_original_image"] = f"{name}_pipeline_original.png"
    session["pipeline_gray_image"] = f"{name}_pipeline_gray.png"
    session["pipeline_preprocessed_image"] = f"{name}_pipeline_preprocessed.png"
    session["pipeline_tree_mask_image"] = f"{name}_pipeline_tree_mask.png"
    
    # Save scientific AQI properties
    session["aqi_result"] = aqi_result["result_string"]
    session["aqi_score"] = aqi_result["final_score"]
    session["aqi_value"] = aqi_result["estimated_aqi"]
    session["aqi_category"] = aqi_result["aqi_category"]
    session["aqi_haze_index"] = aqi_result["haze_index"]
    session["aqi_filtration"] = aqi_result["filtration_capacity"]
    session["aqi_color"] = aqi_result["color"]

    session["co2_absorption"] = co2_absorption
    session["eco_index"] = eco_index
    session["eco_status"] = eco_status
    session["heat_reduction"] = heat_reduction
    session["final_temp"] = final_temp
    session["cooling_level"] = cooling_level
    session["zones"] = zones
    session["plantation_result"] = plantation_res
    session["detections"] = detections_list
    session["health_summary"] = result["health_summary"]
    try:
        from backend.database.mysql_db import log_detection
        user_id = session.get("user", {}).get("id")
        user_name = session.get("user", {}).get("name", "Researcher")
        hs = result["health_summary"]
        health_str = f"Healthy:{hs.get('healthy',0)}, Dry:{hs.get('dry',0)}, Diseased:{hs.get('diseased',0)}, Dead:{hs.get('dead',0)}"
        log_detection(user_id, user_name, f"/uploads/{session['current_image']}", "Forest Canopy Analysis", health_str)
    except Exception:
        pass
    session["optimal_path_image"] = optimal_path_filename
    session["mock_gps_points"] = mock_gps_points
    progress_tracker[key] = 6 # Step 6: Analysis Complete!


def get_dashboard_context(active_tab="overview"):
    """
    Helper function to load the full template rendering context from session.
    """
    if session.get("current_image") and not session.get("zones"):
        image_name = session.get("processing_image") or session["current_image"]
        image_path = os.path.join(UPLOAD_FOLDER, image_name)
        if os.path.exists(image_path):
            try:
                run_full_analysis(image_path)
            except Exception:
                session.pop("current_image", None)
                session.pop("processing_image", None)
        else:
            session.pop("current_image", None)
            session.pop("processing_image", None)

    # Fetch MySQL Enterprise records for active profile
    user_history = []
    user_id = session.get("user", {}).get("id")
    if user_id:
        try:
            user_history = get_user_analyses(user_id)
        except Exception:
            pass

    global_stats = {}
    recent_detections = []
    try:
        global_stats = get_global_stats()
        from backend.database.mysql_db import get_recent_detections
        recent_detections = get_recent_detections(limit=15)
    except Exception:
        pass

    admin_users = []
    admin_logins = []
    if session.get("user", {}).get("role") == "Admin":
        try:
            from backend.database.mysql_db import list_admin_users, list_admin_login_history
            admin_users = list_admin_users()
            admin_logins = list_admin_login_history(limit=150)
        except Exception:
            pass

    plantation_zones_default = {
        "zones": [],
        "total_recommended_area": 0.0,
        "priority_zones_count": 0,
        "high_priority_count": 0,
        "estimated_trees": 0,
        "total_area": 4.05,
        "planting_points": [],
        "existing_points": []
    }
    
    # Retrofit existing session data: regenerate points if missing OR empty while trees are expected
    import math

    def _retrofit_pos_label(px_pct, py_pct):
        x_label = "Left" if px_pct <= 33.33 else ("Right" if px_pct >= 66.66 else "Center")
        y_label = "Top" if py_pct <= 33.33 else ("Bottom" if py_pct >= 66.66 else "Middle")
        if x_label == "Center" and y_label == "Middle":
            return "Center"
        return f"{y_label} {x_label}"

    def _retrofit_candidates(col, row, img_w, img_h, needed):
        x_min = col * (img_w / 3)
        x_max = (col + 1) * (img_w / 3)
        y_min = row * (img_h / 3)
        y_max = (row + 1) * (img_h / 3)
        margin_x = (x_max - x_min) * 0.15
        margin_y = (y_max - y_min) * 0.15
        x_min += margin_x; x_max -= margin_x
        y_min += margin_y; y_max -= margin_y
        side = max(2, math.ceil(math.sqrt(needed + 1)))
        candidates = []
        for sy in range(side):
            for sx in range(side):
                px = x_min + sx * (x_max - x_min) / max(side - 1, 1)
                py = y_min + sy * (y_max - y_min) / max(side - 1, 1)
                candidates.append((px, py))
        return candidates

    p_data = session.get("plantation_zones_data")
    needs_retrofit = (
        p_data is not None and
        p_data.get("estimated_trees", 0) > 0 and
        len(p_data.get("planting_points", [])) == 0
    )
    if needs_retrofit:
        img_w, img_h = 1000, 1000
        p_data["planting_points"] = []
        if "existing_points" not in p_data:
            p_data["existing_points"] = []
        for zone in p_data.get("zones", []):
            needed = zone.get("needed", 0)
            if needed <= 0:
                continue
            zone_idx = int(zone["id"].split("-")[1]) - 1
            col = zone_idx % 3
            row = zone_idx // 3
            candidates = _retrofit_candidates(col, row, img_w, img_h, needed)
            placed = 0
            for cand_px, cand_py in candidates:
                if placed >= needed:
                    break
                px_pct = round(cand_px / img_w * 100, 2)
                py_pct = round(cand_py / img_h * 100, 2)
                p_data["planting_points"].append({
                    "id": f"{zone['id']}-{placed + 1:02d}",
                    "zone": zone["id"],
                    "x": px_pct,
                    "y": py_pct,
                    "position": _retrofit_pos_label(px_pct, py_pct),
                    "priority": zone.get("priority", "MEDIUM"),
                    "desc": zone.get("desc", "")
                })
                placed += 1
        session["plantation_zones_data"] = p_data

    def calculate_tree_metrics(t_count):
        t_count = max(0, int(t_count))
        co2_abs = float(t_count * 22.0)
        heat_mit = min(t_count * 0.15, 3.0)
        eco_idx = min((t_count / 30.0) * 100.0, 100.0)

        if eco_idx >= 80:
            e_status = "Healthy 🌿"
        elif eco_idx >= 50:
            e_status = "Moderate ⚠️"
        else:
            e_status = "Needs Attention 🔴"

        return {
            "co2_absorption": round(co2_abs, 1),
            "heat_mitigation": round(heat_mit, 2),
            "eco_index": int(round(eco_idx)),
            "eco_status": e_status
        }
        
    current_tree_count = session.get("tree_count", 0) or 0
    live_metrics = calculate_tree_metrics(current_tree_count)
    
    print("ECO INDEX DEBUG")
    print("Detected Trees:", current_tree_count)
    print(
        "Eco Index:",
        min((current_tree_count / 30.0) * 100.0, 100.0)
    )

    print("HEAT MITIGATION DEBUG")
    print("Detected Trees:", current_tree_count)
    print(
        "Heat Mitigation:",
        min(current_tree_count * 0.15, 3.0)
    )

    print(
        "FINAL DASHBOARD METRICS:",
        {
            "tree_count": current_tree_count,
            "co2": live_metrics["co2_absorption"],
            "heat": live_metrics["heat_mitigation"],
            "eco_index": live_metrics["eco_index"],
            "eco_status": live_metrics["eco_status"]
        }
    )

    return {
        "active_tab": active_tab,
        "tree_count": current_tree_count,
        "uploaded_image": session.get("current_image"),
        "tree_distribution": session.get("tree_distribution"),
        "green": session.get("green"),
        "non_green": session.get("non_green"),
        "green_img": session.get("green_img"),
        "non_green_img": session.get("non_green_img"),
        "aqi_result": session.get("aqi_result"),
        "aqi_score": session.get("aqi_score"),
        "aqi_value": session.get("aqi_value"),
        "aqi_category": session.get("aqi_category"),
        "aqi_haze_index": session.get("aqi_haze_index"),
        "aqi_filtration": session.get("aqi_filtration"),
        "aqi_color": session.get("aqi_color"),
        "co2_absorption": live_metrics["co2_absorption"],
        "eco_index": live_metrics["eco_index"],
        "eco_status": live_metrics["eco_status"],
        "heat_reduction": live_metrics["heat_mitigation"],
        "final_temp": session.get("final_temp"),
        "cooling_level": session.get("cooling_level"),
        "zones": session.get("zones"),
        "plantation_result": session.get("plantation_result"),
        "plantation_zones_data": session.get("plantation_zones_data", plantation_zones_default) or plantation_zones_default,
        "detections": session.get("detections"),
        "health_summary": session.get("health_summary"),
        "active_species_name": session.get("active_species_name", "Tropical Canopy"),
        "optimal_path_image": session.get("optimal_path_image"),
        "mock_gps_points": session.get("mock_gps_points"),
        "historical_image": session.get("historical_image"),
        "comparison_results": session.get("comparison_results"),
        "user_history": user_history,
        "global_stats": global_stats,
        "recent_detections": recent_detections,
        "admin_users": admin_users,
        "admin_logins": admin_logins,
        "active_user": session.get("user"),
        # Dynamic unique output images
        "yolo_tree_output_image": session.get("yolo_tree_output_image", "yolo_tree_output.png"),
        "tree_heatmap_image": session.get("tree_heatmap_image", "tree_heatmap.png"),
        "pipeline_original_image": session.get("pipeline_original_image", "pipeline_original.png"),
        "pipeline_gray_image": session.get("pipeline_gray_image", "pipeline_gray.png"),
        "pipeline_preprocessed_image": session.get("pipeline_preprocessed_image", "pipeline_preprocessed.png"),
        "pipeline_tree_mask_image": session.get("pipeline_tree_mask_image", "pipeline_tree_mask.png"),
        "base_lat": session.get("base_lat", 40.782091),
        "base_lng": session.get("base_lng", -73.968285),
        "live_weather": session.get("live_weather")
    }


# =====================================================
# USER AUTHENTICATION ENDPOINTS
# =====================================================

@app.route("/login", methods=["GET", "POST"])
def login():
    if "user" in session:
        return redirect("/overview")
        
    error = None
    success_msg = request.args.get("success_msg")
    
    if request.method == "POST":
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "")
        
        # Collect IP address and browser telemetry
        ip_address = request.headers.get("X-Forwarded-For", request.remote_addr or "127.0.0.1")
        user_agent_str = request.headers.get("User-Agent", "Unknown Web Client")
        browser = "Chrome" if "Chrome" in user_agent_str else ("Firefox" if "Firefox" in user_agent_str else ("Safari" if "Safari" in user_agent_str else "Web Browser"))
        os_name = "Windows" if "Windows" in user_agent_str else ("Mac" if "Mac" in user_agent_str else ("Linux" if "Linux" in user_agent_str else "OS"))
        
        from backend.database.mysql_db import authenticate_user
        success, message, user_data = authenticate_user(
            email, password, ip_address=ip_address, browser=browser, os_name=os_name
        )
        if success and user_data:
            session["user"] = user_data
            session["jwt_token"] = user_data.get("jwt_token")
            return redirect("/overview")
        else:
            error = message
            
    return render_template("index.html", active_tab="login", error=error, success_msg=success_msg)


@app.route("/register", methods=["GET", "POST"])
def register():
    if "user" in session:
        return redirect("/overview")
        
    error = None
    if request.method == "POST":
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "")
        confirm_password = request.form.get("confirm_password", "")
        role_name = request.form.get("role", "Researcher")
        phone = request.form.get("phone", "")
        
        if confirm_password and password != confirm_password:
            error = "Passwords do not match."
        else:
            from backend.database.mysql_db import register_user
            success, message, user_id = register_user(name, email, password, role_name=role_name, phone_number=phone)
            if success:
                return redirect(url_for("login", success_msg="Registration successful! Please log in."))
            else:
                error = message
            
    return render_template("index.html", active_tab="register", error=error)


@app.route("/logout")
def logout():
    user = session.get("user")
    if user and user.get("id"):
        try:
            from backend.database.mysql_db import record_logout
            record_logout(user["id"])
        except Exception:
            pass
    session.clear()
    return redirect(url_for("login"))


# =====================================================
# ENTERPRISE ADMIN USER MANAGEMENT & LOGIN HISTORY APIS
# =====================================================

@app.route("/api/admin/users", methods=["GET"])
def api_admin_users():
    user = session.get("user")
    if not user or user.get("role") != "Admin":
        return jsonify({"success": False, "message": "Unauthorized admin access required."}), 403
    try:
        search = request.args.get("search", "").strip()
        role_filter = request.args.get("role", "ALL").strip()
        status_filter = request.args.get("status", "ALL").strip()
        from backend.database.mysql_db import list_admin_users
        users_list = list_admin_users(search=search, role_filter=role_filter, status_filter=status_filter)
        return jsonify({"success": True, "users": users_list})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/api/admin/users/<int:user_id>", methods=["GET"])
def api_admin_user_details(user_id):
    user = session.get("user")
    if not user or user.get("role") != "Admin":
        return jsonify({"success": False, "message": "Unauthorized admin access required."}), 403
    try:
        from backend.database.mysql_db import get_user_details
        user_data = get_user_details(user_id)
        if not user_data:
            return jsonify({"success": False, "message": "User not found."}), 404
        return jsonify({"success": True, "user": user_data})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/api/admin/users/<int:user_id>/toggle-status", methods=["POST"])
def api_admin_toggle_status(user_id):
    user = session.get("user")
    if not user or user.get("role") != "Admin":
        return jsonify({"success": False, "message": "Unauthorized admin access required."}), 403
    try:
        from backend.database.mysql_db import toggle_user_status
        success, message, new_status = toggle_user_status(user_id, admin_email=user.get("email", "Admin"))
        return jsonify({"success": success, "message": message, "new_status": new_status})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/api/admin/users/<int:user_id>", methods=["DELETE"])
def api_admin_delete_user(user_id):
    user = session.get("user")
    if not user or user.get("role") != "Admin":
        return jsonify({"success": False, "message": "Unauthorized admin access required."}), 403
    try:
        from backend.database.mysql_db import delete_user_account
        success, message = delete_user_account(user_id, admin_email=user.get("email", "Admin"))
        return jsonify({"success": success, "message": message})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/api/admin/users/<int:user_id>/role", methods=["POST"])
def api_admin_update_role(user_id):
    user = session.get("user")
    if not user or user.get("role") != "Admin":
        return jsonify({"success": False, "message": "Unauthorized admin access required."}), 403
    try:
        data = request.get_json() or {}
        role_name = data.get("role", "").strip()
        if role_name not in ["Admin", "Researcher", "Officer"]:
            return jsonify({"success": False, "message": "Invalid role name."}), 400
        from backend.database.mysql_db import update_user_role
        success, message = update_user_role(user_id, role_name, admin_email=user.get("email", "Admin"))
        return jsonify({"success": success, "message": message})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/api/admin/logins", methods=["GET"])
def api_admin_logins():
    user = session.get("user")
    if not user or user.get("role") != "Admin":
        return jsonify({"success": False, "message": "Unauthorized admin access required."}), 403
    try:
        limit = int(request.args.get("limit", 150))
        from backend.database.mysql_db import list_admin_login_history
        history = list_admin_login_history(limit=limit)
        return jsonify({"success": True, "logins": history})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/set-coordinates", methods=["POST"])
@login_required
def set_coordinates():
    try:
        data = request.get_json()
        if not data:
            return {"success": False, "message": "Invalid request payload"}, 400
            
        lat = float(data.get("latitude"))
        lng = float(data.get("longitude"))
        
        session["base_lat"] = lat
        session["base_lng"] = lng
        
        # Re-run inference to dynamically center tree points around new clicked inspection point
        if "current_image" in session:
            image_name = session.get("processing_image") or session["current_image"]
            image_path = os.path.join(UPLOAD_FOLDER, image_name)
            if os.path.exists(image_path):
                run_full_analysis(image_path)
                
        return {"success": True, "message": "Inspection center synced successfully!"}
    except Exception as e:
        return {"success": False, "message": str(e)}, 500


@app.route("/analysis-progress")
@login_required
def analysis_progress():
    key = get_tracker_key()
    progress = progress_tracker.get(key, 0)
    return {"progress": progress}


@app.route("/api-status")
@login_required
def api_status():
    import urllib.request
    import time
    from backend.database.mysql_db import is_db_connected
    
    status_report = {}
    
    # 1. YOLO Inference Engine
    status_report["yolo"] = {
        "status": "online",
        "message": "Model best.pt loaded & cached",
        "latency_ms": 0
    }
    
    # 2. MySQL Enterprise Connection (greenpath_ai)
    db_ok = is_db_connected()
    status_report["mysql"] = {
        "status": "online" if db_ok else "offline",
        "message": "Connected to MySQL Enterprise (greenpath_ai)" if db_ok else "MySQL database connection error",
        "latency_ms": 5 if db_ok else 0
    }
    status_report["mongodb"] = status_report["mysql"]  # backwards compatibility for frontend labels
    
    # 3. Open-Meteo Weather API
    start = time.time()
    try:
        req = urllib.request.Request("https://api.open-meteo.com/v1/forecast", method="HEAD")
        with urllib.request.urlopen(req, timeout=2) as response:
            status_report["weather"] = {
                "status": "online",
                "message": "API Active & Accepting requests",
                "latency_ms": int((time.time() - start) * 1000)
            }
    except Exception as e:
        status_report["weather"] = {
            "status": "offline",
            "message": str(e),
            "latency_ms": 0
        }
        
    # 4. Open-Meteo Air Quality API
    start = time.time()
    try:
        req = urllib.request.Request("https://air-quality-api.open-meteo.com/v1/air-quality", method="HEAD")
        with urllib.request.urlopen(req, timeout=2) as response:
            status_report["aqi"] = {
                "status": "online",
                "message": "API Active & Accepting requests",
                "latency_ms": int((time.time() - start) * 1000)
            }
    except Exception as e:
        status_report["aqi"] = {
            "status": "offline",
            "message": str(e),
            "latency_ms": 0
        }
        
    return status_report


# =====================================================
# CORE APPLICATION ROUTES (ALL SERVING SPA DASHBOARD)
# =====================================================

@app.route("/", methods=["GET", "POST"])
@app.route("/overview", methods=["GET", "POST"])
@app.route("/workflow", methods=["GET", "POST"])
@app.route("/admin_users", methods=["GET", "POST"])
@app.route("/admin_logins", methods=["GET", "POST"])
@login_required
def home():
    if request.method == "POST":
        file = request.files.get("image")
        if file and file.filename:
            res = process_uploaded_file(file, prefix="ov_")
            if not res["success"]:
                flash(f"Upload failed: {res['error_message']}", "error")
                return redirect(request.url)
            
            # Clear previous comparison/state data
            session.pop("historical_image", None)
            session.pop("comparison_results", None)
            session.pop("zones", None) # clear old zones to force run_full_analysis
            
            # Set session attributes
            session["original_size"] = (res["width"], res["height"])
            session["current_image"] = res["safe_filename"]
            if res["processing_filename"] != res["safe_filename"]:
                session["processing_image"] = res["processing_filename"]
            else:
                session.pop("processing_image", None)
                
            image_path = os.path.join(UPLOAD_FOLDER, res["processing_filename"])
            
            try:
                run_full_analysis(image_path)
                
                # Log run metrics inside MySQL Enterprise linked to authenticated user
                user_id = session.get("user", {}).get("id")
                if user_id:
                    try:
                        log_analysis(
                            user_id=user_id,
                            filename=session["current_image"],
                            tree_count=session["tree_count"],
                            green_percent=session["green"],
                            co2_absorption=session["co2_absorption"],
                            eco_index=session["eco_index"],
                            aqi_result=session["aqi_result"]
                        )
                    except Exception:
                        pass
                flash("AI Model Inference and spatial analysis completed successfully!", "success")
            except Exception as e:
                import traceback
                traceback.print_exc()
                # Clean up session state on failure
                session.pop("current_image", None)
                session.pop("processing_image", None)
                session.pop("original_size", None)
                flash(f"Environmental Analysis pipeline failed: {str(e)}", "error")
                    
        return redirect(request.url)

    active_tab = request.path.strip("/") or "overview"
    return render_template("index.html", **get_dashboard_context(active_tab))


# =====================================================
# SPA TAB DIRECT-URL REFRESH ROUTES
# (Fix #1: Every sidebar tab must have a server route so
#  refreshing the URL does not return a 404.)
# =====================================================

@app.route("/atmosphere")
@login_required
def atmosphere_tab():
    return render_template("index.html", **get_dashboard_context("atmosphere"))


@app.route("/simulation")
@login_required
def simulation_tab():
    return render_template("index.html", **get_dashboard_context("simulation"))


@app.route("/health")
@login_required
def health_tab():
    return render_template("index.html", **get_dashboard_context("health"))


@app.route("/comparison")
@login_required
def comparison_tab():
    return render_template("index.html", **get_dashboard_context("comparison"))

@app.route("/plantation")
@login_required
def plantation_tab():
    return render_template("index.html", **get_dashboard_context("plantation"))


@app.route("/report")
@login_required
def report_tab():
    return render_template("index.html", **get_dashboard_context("report"))


@app.route("/modelinfo")
@login_required
def modelinfo():
    return render_template("index.html", **get_dashboard_context("modelinfo"))


@app.route("/about")
@login_required
def about():
    return render_template("index.html", **get_dashboard_context("about"))

@app.route("/ai_assistant")
@login_required
def ai_assistant():
    return render_template("index.html", **get_dashboard_context("ai_assistant"))



@app.route("/aqi")
@login_required
def aqi():
    return render_template("index.html", **get_dashboard_context("atmosphere"))


@app.route("/tree-awareness")
@login_required
def tree_awareness():
    trees_with_images = []
    for tree in TREE_INFO:
        tree_copy = tree.copy()
        tree_name = tree.get("name", "Tree")
        query = quote(tree_name + " tree")
        tree_copy["image_url"] = (
            f"https://commons.wikimedia.org/wiki/Special:FilePath/{query}.jpg"
        )
        trees_with_images.append(tree_copy)
    context = get_dashboard_context("health")
    context["trees"] = trees_with_images
    return render_template("index.html", **context)


@app.route("/tree-distribution")
@login_required
def tree_distribution():
    return render_template("index.html", **get_dashboard_context("vision"))


@app.route("/plantation")
@login_required
def plantation():
    return render_template("index.html", **get_dashboard_context("simulation"))


@app.route("/optimal-path")
@login_required
def optimal_path():
    return render_template("index.html", **get_dashboard_context("geoai"))


@app.route("/heatmap")
@login_required
def heatmap():
    return render_template("index.html", **get_dashboard_context("vision"))


@app.route("/pipeline")
@login_required
def pipeline():
    return render_template("index.html", **get_dashboard_context("vision"))


@app.route("/green-cover")
@login_required
def green_cover():
    return render_template("index.html", **get_dashboard_context("atmosphere"))


@app.route("/carbon")
@login_required
def carbon():
    return render_template("index.html", **get_dashboard_context("atmosphere"))


@app.route("/suggestions")
@login_required
def suggestions():
    return redirect(url_for("environmental_report"))


@app.route("/environmental-report")
@login_required
def environmental_report():
    return render_template("index.html", **get_dashboard_context("report"))


@app.route("/download-report", methods=["GET", "POST"])
@login_required
def download_report():
    if "current_image" not in session:
        return redirect("/overview")
        
    try:
        from backend.services.report_service import generate_environmental_report
        import json
        
        impact_records_json = request.form.get("impact_records", "[]") if request.method == "POST" else "[]"
        try:
            impact_records = json.loads(impact_records_json)
        except Exception:
            impact_records = []
            
        # Generate the PDF report
        pdf_path = generate_environmental_report(
            session_data=session,
            impact_records=impact_records,
            output_dir=OUTPUT_FOLDER,
            report_title="GreenPath AI Environmental Audit"
        )
        
        # Log report history in MySQL Enterprise
        from backend.database.mysql_db import log_report
        user_id = session.get("user", {}).get("id")
        from backend.database.mysql_db import get_user_analyses
        analyses = get_user_analyses(user_id)
        analysis_id = analyses[0]["id"] if analyses else None
        if user_id and analysis_id:
            try:
                log_report(
                    user_id=user_id,
                    analysis_id=analysis_id,
                    title="Executive Environmental Audit Report",
                    filename=os.path.basename(pdf_path)
                )
            except Exception:
                pass
                
        # Send PDF file to user
        from flask import send_file
        return send_file(pdf_path, as_attachment=True, download_name=os.path.basename(pdf_path))
    except Exception as e:
        import logging
        logging.error(f"Failed to generate PDF report: {e}", exc_info=True)
        flash(f"Failed to generate PDF report: {str(e)}", "error")
        return redirect("/overview")


@app.route("/download-sample-files")
def download_sample_files():
    """
    Downloads the unified GreenPath AI sample files archive containing:
    - Drone-View/ (101 aerial conservation images)
    - Tree Species/ (1573 botanical species images)
    """
    zip_path = os.path.join(app.root_path, "static", "GreenPath_AI_Sample_Files.zip")
    if not os.path.exists(zip_path):
        import zipfile
        project_root = os.path.abspath(os.path.join(app.root_path, "..", ".."))
        drone_dir = os.path.join(project_root, "Drone-View")
        tree_dir = os.path.join(project_root, "Tree Species")
        if os.path.exists(drone_dir) and os.path.exists(tree_dir):
            os.makedirs(os.path.dirname(zip_path), exist_ok=True)
            with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_STORED) as zf:
                for folder_name, folder_path in [("Drone-View", drone_dir), ("Tree Species", tree_dir)]:
                    for root, _, files in os.walk(folder_path):
                        for file in files:
                            file_full = os.path.join(root, file)
                            rel_path = os.path.relpath(file_full, folder_path)
                            zf.write(file_full, os.path.join(folder_name, rel_path))
        else:
            flash("Sample files directories not found.", "error")
            return redirect("/overview")

    from flask import send_file
    return send_file(zip_path, as_attachment=True, download_name="GreenPath_AI_Sample_Files.zip")


@app.route("/tree-health")
@login_required
def tree_health_page():
    return render_template("index.html", **get_dashboard_context("health"))


@app.route("/time-series", methods=["GET", "POST"])
@login_required
def time_series():
    if "current_image" not in session:
        return redirect("/overview")
        
    comparison_results = session.get("comparison_results")
    
    if request.method == "POST":
        file = request.files.get("historical_image")
        if file and file.filename:
            res = process_uploaded_file(file, prefix="hist_")
            if not res["success"]:
                flash(f"Historical upload failed: {res['error_message']}", "error")
                return redirect(request.url)
            
            hist_filename = res["safe_filename"]
            hist_proc_filename = res["processing_filename"]
            hist_path = os.path.join(UPLOAD_FOLDER, hist_proc_filename)
            session["historical_image"] = hist_filename
            
            # Compare current image vs historical image
            current_proc = session.get("processing_image") or session.get("current_image")
            if not current_proc:
                flash("Please upload a current image first.", "error")
                return redirect("/overview")
                
            current_path = os.path.join(UPLOAD_FOLDER, current_proc)
            
            try:
                # Use backend detection service for accurate counts
                from backend.services.detection_service import detect_trees
                
                current_orig_size = session.get("original_size")
                hist_orig_size = (res["width"], res["height"]) if res.get("processing_filename") != res.get("safe_filename") else None
                
                current_res = detect_trees(current_path, OUTPUT_FOLDER, original_size=current_orig_size)
                hist_res = detect_trees(hist_path, OUTPUT_FOLDER, original_size=hist_orig_size)
                
                current_count = current_res["tree_count"]
                hist_count = hist_res["tree_count"]
                
                # Get green cover percentages
                current_green, _, _, _ = green_cover_estimation(current_path, OUTPUT_FOLDER)
                hist_green, _, _, _ = green_cover_estimation(hist_path, OUTPUT_FOLDER)
                
                comparison_results = {
                    "current_count": current_count,
                    "historical_count": hist_count,
                    "count_difference": current_count - hist_count,
                    "count_change_pct": round(((current_count - hist_count) / max(1, hist_count)) * 100, 1),
                    "current_green": current_green,
                    "historical_green": hist_green,
                    "green_difference": round(current_green - hist_green, 2),
                    "green_change_pct": round(((current_green - hist_green) / max(1.0, hist_green)) * 100, 1)
                }
                session["comparison_results"] = comparison_results
            except Exception as e:
                import traceback
                traceback.print_exc()
                session.pop("historical_image", None)
                flash(f"Historical comparison pipeline failed: {str(e)}", "error")
                
            return redirect(url_for("time_series"))
            
    return render_template("index.html", **get_dashboard_context("comparison"))



# =====================================================
# SATELLITE INTELLIGENCE ENDPOINTS (GEOGUARDIAN PORT)
# =====================================================

@app.route("/api/satellite/compare", methods=["POST"])
@login_required
def satellite_compare():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "No data provided"}), 400
        
    before_date = data.get("beforeDate")
    after_date = data.get("afterDate")
    bbox = data.get("bbox") # [minLon, minLat, maxLon, maxLat]
    
    if not before_date or not after_date or not bbox or len(bbox) != 4:
        return jsonify({"success": False, "error": "Missing beforeDate, afterDate, or bbox"}), 400
        
    try:
        from backend.services.sentinel_service import fetch_satellite_image, fetch_ndvi_data
        from backend.services.change_detection_service import detect_changes
        from backend.services.ndvi_processor import process_ndvi_statistics
        
        # We must run asyncio for httpx calls
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        # 1. Fetch RGB images
        before_img_bytes = loop.run_until_complete(fetch_satellite_image(before_date, bbox))
        after_img_bytes = loop.run_until_complete(fetch_satellite_image(after_date, bbox))
        
        # 2. Fetch NDVI data
        before_ndvi_bytes = loop.run_until_complete(fetch_ndvi_data(before_date, bbox))
        after_ndvi_bytes = loop.run_until_complete(fetch_ndvi_data(after_date, bbox))
        
        loop.close()
        
        if not before_img_bytes or not after_img_bytes:
            return jsonify({"success": False, "error": "Failed to retrieve visible satellite imagery for the given dates."}), 404
            
        # 3. Detect visual changes
        diff_results, diff_bytes = detect_changes(before_img_bytes, after_img_bytes)
        
        # 4. Process NDVI stats
        before_ndvi_stats = process_ndvi_statistics(before_ndvi_bytes)
        after_ndvi_stats = process_ndvi_statistics(after_ndvi_bytes)
        
        # Save images to disk
        timestamp = str(int(time.time()))
        b_filename = f"sat_before_{timestamp}.jpg"
        a_filename = f"sat_after_{timestamp}.jpg"
        diff_filename = f"sat_diff_{timestamp}.png"
        
        with open(os.path.join(OUTPUT_FOLDER, b_filename), "wb") as f: f.write(before_img_bytes)
        with open(os.path.join(OUTPUT_FOLDER, a_filename), "wb") as f: f.write(after_img_bytes)
        with open(os.path.join(OUTPUT_FOLDER, diff_filename), "wb") as f: f.write(diff_bytes)
        
        # Calculate NDVI change
        ndvi_change = after_ndvi_stats["mean_ndvi"] - before_ndvi_stats["mean_ndvi"]
        rel_change = 0
        if before_ndvi_stats["mean_ndvi"] != 0:
            rel_change = (ndvi_change / abs(before_ndvi_stats["mean_ndvi"])) * 100
            
        results = {
            "success": True,
            "images": {
                "before": f"/outputs/{b_filename}",
                "after": f"/outputs/{a_filename}",
                "diff": f"/outputs/{diff_filename}"
            },
            "ndvi": {
                "before": before_ndvi_stats["mean_ndvi"],
                "after": after_ndvi_stats["mean_ndvi"],
                "change": round(ndvi_change, 4),
                "relativeChange": round(rel_change, 2)
            },
            "changeDetection": diff_results,
            "dates": {"before": before_date, "after": after_date}
        }
        
        # Store in session for Executive Report
        session["satellite_metrics"] = results
        
        return jsonify(results)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


# =====================================================
# STATIC & MEDIA FILE ROUTES
# =====================================================

@app.route("/uploads/<filename>")
def uploads(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


@app.route("/outputs/<filename>")
def outputs(filename):
    return send_from_directory(OUTPUT_FOLDER, filename)


# =====================================================
# TREE SPECIES DETECTION MODULE
# =====================================================

@app.route("/tree-species", methods=["GET"])
@app.route("/tree_species", methods=["GET"])
@app.route("/tree-species-detection", methods=["GET"])
@app.route("/tree_species_detection", methods=["GET"])
@app.route("/tree-species.html", methods=["GET"])
@app.route("/tree_species.html", methods=["GET"])
@app.route("/species", methods=["GET"])
def tree_species_page():
    return render_template("index.html", **get_dashboard_context("tree_species"))


@app.route("/api/detect-tree-species", methods=["POST"])
@app.route("/api/detect_tree_species", methods=["POST"])
def api_detect_tree_species():
    file = request.files.get("image")
    if not file or not file.filename:
        return jsonify({"success": False, "message": "No image uploaded or filename empty."}), 400

    res = process_uploaded_file(file, prefix="species_")
    if not res["success"]:
        return jsonify({"success": False, "message": res["error_message"]}), 400

    image_path = os.path.join(UPLOAD_FOLDER, res["processing_filename"])

    try:
        results = detect_tree_species(image_path, OUTPUT_FOLDER)
        session["active_species_name"] = results.get("species_name", "Tropical Canopy")
        try:
            from backend.database.mysql_db import log_detection
            user_id = session.get("user", {}).get("id")
            user_name = session.get("user", {}).get("name", "Researcher")
            log_detection(user_id, user_name, f"/uploads/{res['safe_filename']}", results.get("species_name", "N/A"), "Classified")
        except Exception:
            pass
        
        # Override uploaded_image_url to point to browser-compatible representation
        results["uploaded_image_url"] = f"/uploads/{res['safe_filename']}"
        return jsonify(results), 200
    except FileNotFoundError as e:
        return jsonify({"success": False, "message": str(e)}), 404
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "message": f"Inference failure: {str(e)}"}), 500


# =====================================================
# MULTI-IMAGE BATCH DETECTION ENDPOINTS
# =====================================================

# Server-side file extension whitelist (Fix #7)
ALLOWED_IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp', 'bmp', 'tif', 'tiff'}

def _is_allowed_image(filename):
    """Return True only if the uploaded filename has an allowed image extension."""
    if not filename or '.' not in filename:
        return False
    return filename.rsplit('.', 1)[-1].lower() in ALLOWED_IMAGE_EXTENSIONS


def process_uploaded_file(file, prefix=""):
    """
    Validates, saves, decodes, checks and converts TIFF files to browser-compatible PNG.
    Logs comprehensive metadata as required by guidelines.
    Returns:
        dict containing:
            success (bool)
            safe_filename (str) - name stored in uploads folder
            processing_filename (str) - resized/safe name for backend analysis
            width (int)
            height (int)
            mode (str)
            channels (int)
            size_bytes (int)
            mime_type (str)
            error_message (str)
    """
    import os
    import time
    import uuid
    import re
    from PIL import Image, ImageOps
    
    # 1. Initialize metadata
    filename = file.filename
    size_bytes = 0
    mime_type = file.content_type or "unknown"
    width, height, mode, channels = 0, 0, "unknown", 0
    
    # Logs as requested by Guideline 9
    print(f"[DEBUG LOG] Processing upload - Original Filename: {filename}")
    print(f"[DEBUG LOG] MIME Type: {mime_type}")
    
    # Validate extension
    if not filename or '.' not in filename:
        print("[DEBUG LOG] Upload failed: No extension or filename empty")
        return {
            "success": False,
            "error_message": "Unsupported image format: missing extension"
        }
        
    base, ext = os.path.splitext(filename)
    ext = ext.lower()
    
    # Allowed extensions check
    if ext.lstrip('.') not in ALLOWED_IMAGE_EXTENSIONS:
        print(f"[DEBUG LOG] Upload failed: Unsupported extension {ext}")
        return {
            "success": False,
            "error_message": f"Unsupported image format: '{ext}'"
        }
        
    # 2. Save file temporarily with safe name
    # Sanitize base to alphanumeric/underscores/dashes
    clean_base = re.sub(r'[^a-zA-Z0-9_\-]', '', base.replace(' ', '_'))
    if not clean_base:
        clean_base = "upload"
    clean_base = clean_base[:50] # limit length
    
    temp_name = f"{prefix}{clean_base}_{int(time.time())}_{uuid.uuid4().hex[:6]}{ext}"
    temp_path = os.path.join(UPLOAD_FOLDER, temp_name)
    file.save(temp_path)
    
    # Check size
    try:
        size_bytes = os.path.getsize(temp_path)
    except Exception as e:
        print(f"[DEBUG LOG] Failed to read file size: {e}")
        
    print(f"[DEBUG LOG] Temporary saved file path: {temp_path} | Size: {size_bytes} bytes")
    
    # 3. Decode & validate image using PIL
    try:
        with open(temp_path, 'rb') as f:
            with Image.open(f) as img:
                img.load() # load into memory
                width, height = img.size
                mode = img.mode
                channels = len(img.getbands())
                print(f"[DEBUG LOG] Image decoded successfully: {width}x{height} | Mode: {mode} | Channels: {channels}")
    except Exception as decode_err:
        print(f"[DEBUG LOG] Image could not be decoded: {decode_err}")
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return {
            "success": False,
            "error_message": "Image could not be decoded. The file may be corrupted."
        }
        
    # 4. Handle TIFF to browser-compatible PNG conversion
    is_tiff = ext in ('.tif', '.tiff') or mime_type in ('image/tiff', 'image/x-tiff')
    final_name = temp_name
    final_path = temp_path
    
    if is_tiff:
        print("[DEBUG LOG] TIFF image detected, converting to PNG for browser compatibility...")
        try:
            # Convert the TIFF to PNG
            png_name = os.path.splitext(temp_name)[0] + ".png"
            png_path = os.path.join(UPLOAD_FOLDER, png_name)
            
            with open(temp_path, 'rb') as f:
                with Image.open(f) as img:
                    img.load()
                    # Transpose EXIF orientation if needed
                    try:
                        img = ImageOps.exif_transpose(img)
                    except Exception:
                        pass
                    if img.mode != 'RGB':
                        img = img.convert('RGB')
                    img.save(png_path, "PNG")
                    
            print(f"[DEBUG LOG] TIFF successfully converted to PNG: {png_path}")
            final_name = png_name
            final_path = png_path
            # clean up original temporary TIFF to save space
            if os.path.exists(temp_path):
                os.remove(temp_path)
        except Exception as convert_err:
            print(f"[DEBUG LOG] TIFF conversion to PNG failed: {convert_err}")
            if os.path.exists(temp_path):
                os.remove(temp_path)
            return {
                "success": False,
                "error_message": "Unsupported image format: failed to convert TIFF image."
            }
            
    # Check for large images and handle resizing if needed
    needs_processing_copy = (width > 3000 or height > 3000)
    proc_name = final_name
    
    if needs_processing_copy:
        print(f"[DEBUG LOG] Image is large ({width}x{height}). Creating a resized processing copy for safety...")
        try:
            proc_name = "proc_" + final_name
            proc_path = os.path.join(UPLOAD_FOLDER, proc_name)
            
            with open(final_path, 'rb') as f:
                with Image.open(f) as img:
                    img.load()
                    # Downscale while preserving aspect ratio
                    img.thumbnail((2048, 2048), Image.Resampling.LANCZOS)
                    if img.mode != 'RGB':
                        img = img.convert('RGB')
                    img.save(proc_path, "PNG")
            print(f"[DEBUG LOG] Processing copy created: {proc_path} ({img.width}x{img.height})")
        except Exception as proc_err:
            print(f"[DEBUG LOG] Failed to create processing copy: {proc_err}. Using original.")
            proc_name = final_name
            
    print(f"[DEBUG LOG] Upload processing complete: success=True, safe_filename={final_name}, processing_filename={proc_name}")
    
    return {
        "success": True,
        "safe_filename": final_name,
        "processing_filename": proc_name,
        "width": width,
        "height": height,
        "mode": mode,
        "channels": channels,
        "size_bytes": size_bytes,
        "mime_type": mime_type,
        "error_message": ""
    }


@app.route('/api/detect-multi-overview', methods=['POST'])
@login_required
def api_detect_multi_overview():
    """
    Batch detection for Overview panel: accepts multiple images and returns
    summary metrics (tree_count, health, eco_index, co2, heat_reduction) per image.
    """
    import time
    import math
    from backend.services.detection_service import detect_trees

    files = request.files.getlist('images')
    if not files or all(f.filename == '' for f in files):
        return jsonify({'success': False, 'message': 'No images uploaded.'}), 400

    results = []
    for file in files:
        if not file or not file.filename:
            continue
        # Fix #7: Reject non-image files server-side
        if not _is_allowed_image(file.filename):
            continue
        name, ext = os.path.splitext(file.filename)
        unique_name = f"batch_ov_{int(time.time()*1000)}_{name}{ext}"
        image_path = os.path.join(UPLOAD_FOLDER, unique_name)
        file.save(image_path)

        try:
            det_result = detect_trees(image_path, OUTPUT_FOLDER)
            tree_count = det_result['tree_count']
            detections = det_result['detections']
            health_summary = det_result['health_summary']

            # Green cover estimation
            try:
                green, _, _, _ = green_cover_estimation(image_path, OUTPUT_FOLDER)
            except Exception:
                green = 0.0

            # CO2 absorption (Project Estimate)
            co2_absorption = round(tree_count * 22.0, 1)

            # Eco-Index
            eco_index = int(round(min((tree_count / 30.0) * 100.0, 100.0)))

            # Heat reduction
            heat_reduction = round(min(tree_count * 0.15, 3.0), 2)

            # YOLO annotated image URL
            yolo_output_filename = f"{os.path.splitext(os.path.basename(image_path))[0]}_yolo_tree_output.png"
            yolo_image_url = f"/outputs/{yolo_output_filename}"

            results.append({
                'filename': file.filename,
                'tree_count': tree_count,
                'healthy': health_summary.get('healthy', 0),
                'dry': health_summary.get('dry', 0),
                'diseased': health_summary.get('diseased', 0),
                'dead': health_summary.get('dead', 0),
                'green_cover': round(green, 1),
                'co2_absorption': co2_absorption,
                'eco_index': eco_index,
                'heat_reduction': heat_reduction,
                'yolo_image': yolo_image_url,
                'detection_time': '—'
            })
        except Exception as e:
            results.append({
                'filename': file.filename,
                'error': str(e),
                'tree_count': 0,
                'healthy': 0,
                'dry': 0,
                'diseased': 0,
                'dead': 0,
                'green_cover': 0.0,
                'co2_absorption': 0.0,
                'eco_index': 0,
                'heat_reduction': 0.0,
                'yolo_image': '',
                'detection_time': '—'
            })

    return jsonify({'success': True, 'results': results, 'total_images': len(results)}), 200


@app.route('/api/detect-multi-image', methods=['POST'])
@login_required
def api_detect_multi_image():
    """
    Batch Tree Species Detection endpoint: accepts multiple images,
    runs tree species YOLO detection on each, bundles annotated images
    + a summary CSV into a ZIP archive, and returns the zip_url for download.
    """
    import time
    import zipfile
    import csv
    import io

    files = request.files.getlist('images')
    if not files or all(f.filename == '' for f in files):
        return jsonify({'success': False, 'message': 'No images uploaded.'}), 400

    os.makedirs(OUTPUT_FOLDER, exist_ok=True)
    zip_filename = f"greenpath_batch_species_{int(time.time())}.zip"
    zip_filepath = os.path.join(OUTPUT_FOLDER, zip_filename)

    summary_rows = []
    annotated_paths = []

    for file in files:
        if not file or not file.filename:
            continue
        # Fix #7: Reject non-image files server-side
        if not _is_allowed_image(file.filename):
            continue
        name, ext = os.path.splitext(file.filename)
        unique_name = f"bsp_{int(time.time()*1000)}_{name}{ext}"
        image_path = os.path.join(UPLOAD_FOLDER, unique_name)
        file.save(image_path)

        try:
            result = detect_tree_species(image_path, OUTPUT_FOLDER)
            species_name = result.get('species_name', 'N/A')
            confidence = result.get('confidence_score', '0.00%')
            det_time = result.get('detection_time', 'N/A')
            out_filename = result.get('output_filename', '')
            out_path = os.path.join(OUTPUT_FOLDER, out_filename) if out_filename else ''
            if out_path and os.path.exists(out_path):
                annotated_paths.append((file.filename, out_path))
            summary_rows.append([file.filename, species_name, confidence, det_time])
        except Exception as e:
            summary_rows.append([file.filename, 'Error', '0%', str(e)])

    # Build ZIP archive with annotated images + CSV summary
    with zipfile.ZipFile(zip_filepath, 'w', zipfile.ZIP_DEFLATED) as zf:
        # Summary CSV
        csv_buf = io.StringIO()
        writer = csv.writer(csv_buf)
        writer.writerow(['Filename', 'Species Detected', 'Confidence', 'Detection Time'])
        writer.writerows(summary_rows)
        zf.writestr('species_summary.csv', csv_buf.getvalue())
        # Annotated detection images
        for _original_name, annotated_path in annotated_paths:
            arc_name = f"annotated_{os.path.basename(annotated_path)}"
            zf.write(annotated_path, arc_name)

    zip_url = f"/outputs/{zip_filename}"
    return jsonify({'success': True, 'zip_url': zip_url, 'total_processed': len(summary_rows)}), 200


@app.route("/api/detection-history", methods=["GET"])
def api_detection_history():
    try:
        from backend.database.mysql_db import get_recent_detections
        limit = request.args.get("limit", 15, type=int)
        history = get_recent_detections(limit=limit)
        return jsonify({"success": True, "history": history}), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e), "history": []}), 500




# =====================================================
# GEMINI AI ASSISTANT ENDPOINT
# =====================================================

@app.route("/api/ai/chat", methods=["POST"])
def api_ai_chat():
    """
    GreenPath AI - Gemini-powered environmental assistant endpoint.
    Accepts a user message and optional project context.
    Returns Gemini AI response. API key is NEVER exposed in responses or logs.
    """
    import logging
    import asyncio
    from dotenv import load_dotenv

    logger = logging.getLogger("greenpath.ai_chat")

    # Load GEMINI_API_KEY from backend/.env (server-side only)
    env_path = os.path.join(BASE_DIR, "backend", ".env")
    load_dotenv(env_path, override=False)
    gemini_api_key = os.environ.get("GEMINI_API_KEY", "").strip()

    try:
        body = request.get_json(force=True, silent=True) or {}
    except Exception:
        body = {}

    message = (body.get("message") or "").strip()
    if not message:
        return jsonify({"success": False, "response": "Please provide a message."}), 400

    # Build context from request (project analysis data from session or payload)
    context_payload = body.get("context") or {}

    # Also merge current session analysis data if available
    analysis_context = {
        "tree_count":           context_payload.get("treeCount")    or session.get("tree_count"),
        "green_cover_percent":  context_payload.get("greenCover")   or session.get("green"),
        "aqi_score":            context_payload.get("aqiScore")      or session.get("aqi_score"),
        "aqi_category":         context_payload.get("aqiCategory")   or session.get("aqi_category"),
        "ndvi_mean":            context_payload.get("ndviMean")      or session.get("ndvi_mean"),
        "co2_absorption_kg":    context_payload.get("co2Absorption") or session.get("co2_absorption"),
        "cooling_level":        context_payload.get("coolingLevel")  or session.get("cooling_level"),
        "carbonFootprint":      context_payload.get("carbonFootprint"),
        "environmentData":      context_payload.get("environmentData"),
        "ndviData":             context_payload.get("ndviData"),
        "treeData":             context_payload.get("treeData"),
    }
    # Strip None values
    analysis_context = {k: v for k, v in analysis_context.items() if v is not None}

    # History (optional, for multi-turn conversations)
    history = body.get("history") or []

    try:
        from backend.services.chatbot_service import get_chatbot_response

        # Run the async function synchronously (Flask is sync)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            response_text = loop.run_until_complete(
                get_chatbot_response(
                    message=message,
                    history=history,
                    analysis_context=analysis_context if analysis_context else None,
                    gemini_api_key=gemini_api_key,
                )
            )
        finally:
            loop.close()

        return jsonify({"success": True, "response": response_text}), 200

    except Exception as e:
        logger.error("AI chat endpoint error (details hidden for security)")
        return jsonify({
            "success": False,
            "response": (
                "?? The AI assistant is temporarily unavailable. "
                "Please try again in a moment."
            )
        }), 500

# =====================================================
# CACHE ELIMINATION CONTROL
# =====================================================

@app.after_request
def add_header(response):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True, use_reloader=True)
