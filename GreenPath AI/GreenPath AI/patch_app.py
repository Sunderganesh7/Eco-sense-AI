import os
import re

filepath = "app.py"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Add imports at the top
if "from backend.services.sentinel_service import fetch_satellite_image, fetch_ndvi_data" not in content:
    content = content.replace("from flask import Flask, render_template,", "import asyncio\nfrom flask import Flask, render_template, jsonify,")

route_code = """
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

"""

# Insert before STATIC & MEDIA FILE ROUTES
content = content.replace("# =====================================================\n# STATIC & MEDIA FILE ROUTES", route_code + "\n# =====================================================\n# STATIC & MEDIA FILE ROUTES")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Added satellite route to app.py")
