"""
GreenPath AI — Analysis Router
Core image analysis endpoints: upload, analyse, history, compare.
"""

import os
import uuid
import shutil
import logging
from datetime import datetime
from typing import Optional

from fastapi import (
    APIRouter, UploadFile, File, HTTPException,
    Depends, BackgroundTasks, Form, status, Request,
)
from fastapi.responses import FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from backend.config import settings
from backend.database.schemas import (
    AnalysisDocument, AnalysisStatus, FullAnalysisResponse,
    AnalysisSummaryResponse, APIResponse, UserDocument,
)
from backend.routers.auth import get_current_user, security, decode_token, get_user_by_id
from backend.services.detection_service import detect_trees
from backend.services.aqi_service import analyze_environment
from backend.services.green_cover_service import green_cover_estimation
from backend.services.heatmap_service import create_tree_heatmap
from backend.services.ndvi_service import calculate_ndvi
from backend.services.distribution_service import (
    calculate_tree_distribution, classify_zones,
)


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[UserDocument]:
    """Optional auth dependency — returns user if token provided, else None."""
    if not credentials:
        return None
    payload = decode_token(credentials.credentials)
    if not payload:
        return None
    return await get_user_by_id(payload.get("sub"))

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analysis", tags=["Analysis"])

UPLOAD_DIR = settings.UPLOAD_FOLDER
OUTPUT_DIR = settings.OUTPUT_FOLDER
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".tiff", ".bmp"}


# ── Helper: validate uploaded image file ───────────────────────────────────
def _validate_image(file: UploadFile) -> str:
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {ALLOWED_EXTENSIONS}",
        )
    return ext


# ================================================================
# POST /analysis/upload  — Upload & fully analyse an image
# ================================================================
@router.post("/upload", status_code=202)
async def upload_and_analyse(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    location_name: Optional[str] = Form(None),
    current_user: Optional[UserDocument] = Depends(get_optional_user),
):
    """
    Upload an image and trigger full AI analysis in background.
    Returns an analysis_id immediately for polling.
    """
    ext = _validate_image(file)

    # Unique filenames
    unique_id = uuid.uuid4().hex
    safe_filename = f"{unique_id}{ext}"
    image_path = os.path.join(UPLOAD_DIR, safe_filename)
    analysis_output_dir = os.path.join(OUTPUT_DIR, unique_id)

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    os.makedirs(analysis_output_dir, exist_ok=True)

    # Save uploaded file
    with open(image_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Create pending analysis record
    analysis = AnalysisDocument(
        user_id=str(current_user.id) if current_user else None,
        image_filename=safe_filename,
        original_filename=file.filename or safe_filename,
        status=AnalysisStatus.PENDING,
        latitude=latitude,
        longitude=longitude,
        location_name=location_name,
    )
    await analysis.insert()
    analysis_id = str(analysis.id)

    # Run analysis in background
    background_tasks.add_task(
        _run_full_analysis,
        analysis_id=analysis_id,
        image_path=image_path,
        output_dir=analysis_output_dir,
        user_id=str(current_user.id) if current_user else None,
    )

    return {
        "success": True,
        "analysis_id": analysis_id,
        "message": "Analysis started. Poll /analysis/{id} for results.",
        "filename": safe_filename,
    }


async def _run_full_analysis(
    analysis_id: str,
    image_path: str,
    output_dir: str,
    user_id: Optional[str],
):
    """
    Background task: runs the full AI pipeline and updates the DB record.
    Order: YOLO detection → health → AQI → green cover → heatmap → NDVI
    """
    from beanie import PydanticObjectId

    try:
        analysis = await AnalysisDocument.get(PydanticObjectId(analysis_id))
        analysis.status = AnalysisStatus.PROCESSING
        await analysis.save()

        # 1️⃣ Tree detection + health classification
        det = detect_trees(image_path, output_dir)
        tree_count = det["tree_count"]
        detections = det["detections"]
        health_summary = det["health_summary"]

        # 2️⃣ AQI analysis
        aqi_result = analyze_environment(image_path)

        # 3️⃣ Green cover
        gc_result = green_cover_estimation(image_path, output_dir)
        green_pct = gc_result["green_percent"]

        # 4️⃣ Tree heatmap
        boxes = [tuple(d.box) for d in detections]
        heatmap_path = create_tree_heatmap(image_path, boxes, output_dir)

        # 5️⃣ NDVI
        ndvi_result = calculate_ndvi(image_path, output_dir)

        # 6️⃣ Zone distribution + classification
        dist = calculate_tree_distribution(image_path, boxes)
        zone_classes = classify_zones(dist, green_pct)

        # 7️⃣ Derived metrics
        co2 = round(tree_count * 22.0, 1)
        eco_index = int(round(min((tree_count / 30.0) * 100.0, 100.0)))

        BASE_TEMP = 35.0
        heat_red = round(min(tree_count * 0.15, 3.0), 2)
        final_temp = round(BASE_TEMP - heat_red, 2)
        cooling = (
            "High Cooling Effect" if heat_red >= 3 else
            "Moderate Cooling Effect" if heat_red >= 1 else
            "Low Cooling Effect"
        )

        # 8️⃣ Update analysis document
        analysis.status = AnalysisStatus.COMPLETED
        analysis.completed_at = datetime.utcnow()
        analysis.tree_count = tree_count
        analysis.detections = detections
        analysis.health_summary = {k: v for k, v in health_summary.items()}
        analysis.tree_health_summary = health_summary
        analysis.aqi_score = aqi_result["aqi_value"]
        analysis.aqi_category = aqi_result["aqi_category"]
        analysis.vegetation_score = aqi_result["vegetation_score"]
        analysis.clarity_score = aqi_result["clarity_score"]
        analysis.green_cover_percent = green_pct
        analysis.non_green_percent = gc_result["non_green_percent"]
        analysis.co2_absorption_kg = co2
        analysis.eco_index = eco_index
        analysis.heat_reduction_celsius = heat_red
        analysis.estimated_temp_celsius = final_temp
        analysis.cooling_level = cooling
        analysis.ndvi_mean = ndvi_result["ndvi_mean"]
        analysis.ndvi_min = ndvi_result["ndvi_min"]
        analysis.ndvi_max = ndvi_result["ndvi_max"]
        analysis.ndvi_image_path = ndvi_result.get("ndvi_image_path")
        analysis.zone_distribution = dist
        analysis.zone_classifications = zone_classes
        analysis.yolo_output_path = det.get("output_image_path")
        analysis.heatmap_path = heatmap_path
        analysis.green_cover_path = gc_result.get("green_image_path")
        await analysis.save()

        # Update user stats
        if user_id:
            user = await UserDocument.get(PydanticObjectId(user_id))
            if user:
                user.total_analyses += 1
                await user.save()

        logger.info(f"✅ Analysis {analysis_id} completed. Trees: {tree_count}")

    except Exception as e:
        logger.error(f"❌ Analysis {analysis_id} failed: {e}", exc_info=True)
        try:
            from beanie import PydanticObjectId as OID
            analysis = await AnalysisDocument.get(OID(analysis_id))
            analysis.status = AnalysisStatus.FAILED
            analysis.error_message = str(e)
            await analysis.save()
        except Exception:
            pass


# ================================================================
# GET /analysis/{analysis_id}  — Poll analysis result
# ================================================================
@router.get("/{analysis_id}")
async def get_analysis(analysis_id: str):
    """Get full analysis result by ID. Poll until status=completed."""
    try:
        from beanie import PydanticObjectId
        analysis = await AnalysisDocument.get(PydanticObjectId(analysis_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    return {
        "id": str(analysis.id),
        "status": analysis.status,
        "original_filename": analysis.original_filename,
        "tree_count": analysis.tree_count,
        "green_cover_percent": analysis.green_cover_percent,
        "non_green_percent": analysis.non_green_percent,
        "co2_absorption_kg": analysis.co2_absorption_kg,
        "eco_index": analysis.eco_index,
        "aqi_score": analysis.aqi_score,
        "aqi_category": analysis.aqi_category,
        "vegetation_score": analysis.vegetation_score,
        "heat_reduction_celsius": analysis.heat_reduction_celsius,
        "estimated_temp_celsius": analysis.estimated_temp_celsius,
        "cooling_level": analysis.cooling_level,
        "ndvi_mean": analysis.ndvi_mean,
        "ndvi_min": analysis.ndvi_min,
        "ndvi_max": analysis.ndvi_max,
        "tree_health_summary": analysis.tree_health_summary,
        "zone_distribution": analysis.zone_distribution,
        "zone_classifications": analysis.zone_classifications,
        "yolo_output_path": analysis.yolo_output_path,
        "heatmap_path": analysis.heatmap_path,
        "ndvi_image_path": analysis.ndvi_image_path,
        "green_cover_path": analysis.green_cover_path,
        "latitude": analysis.latitude,
        "longitude": analysis.longitude,
        "location_name": analysis.location_name,
        "created_at": analysis.created_at,
        "completed_at": analysis.completed_at,
        "error_message": analysis.error_message,
    }


# ================================================================
# GET /analysis/  — List analyses (with pagination)
# ================================================================
@router.get("/")
async def list_analyses(
    page: int = 1,
    limit: int = 10,
    status_filter: Optional[str] = None,
):
    """List recent analyses with pagination."""
    skip = (page - 1) * limit
    query = AnalysisDocument.find_all()

    if status_filter:
        try:
            sf = AnalysisStatus(status_filter)
            query = AnalysisDocument.find(AnalysisDocument.status == sf)
        except ValueError:
            pass

    total = await query.count()
    items = await query.sort(-AnalysisDocument.created_at).skip(skip).limit(limit).to_list()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
        "items": [
            {
                "id": str(a.id),
                "original_filename": a.original_filename,
                "tree_count": a.tree_count,
                "green_cover_percent": a.green_cover_percent,
                "aqi_score": a.aqi_score,
                "aqi_category": a.aqi_category,
                "eco_index": a.eco_index,
                "status": a.status,
                "created_at": a.created_at,
            }
            for a in items
        ],
    }


# ================================================================
# POST /analysis/compare  — Time-series comparison
# ================================================================
@router.post("/compare")
async def compare_images(
    file_old: UploadFile = File(...),
    file_new: UploadFile = File(...),
):
    """Compare two satellite images for green cover change detection."""
    from backend.services.prediction_service import compare_images_timeseries

    for f in [file_old, file_new]:
        _validate_image(f)

    uid = uuid.uuid4().hex
    old_path = os.path.join(UPLOAD_DIR, f"old_{uid}{os.path.splitext(file_old.filename)[1]}")
    new_path = os.path.join(UPLOAD_DIR, f"new_{uid}{os.path.splitext(file_new.filename)[1]}")
    out_dir = os.path.join(OUTPUT_DIR, f"compare_{uid}")
    os.makedirs(out_dir, exist_ok=True)

    with open(old_path, "wb") as f:
        shutil.copyfileobj(file_old.file, f)
    with open(new_path, "wb") as f:
        shutil.copyfileobj(file_new.file, f)

    result = compare_images_timeseries(old_path, new_path, out_dir)
    return {"success": True, **result}


# ================================================================
# GET /analysis/output/{filename}  — Serve output images
# ================================================================
@router.get("/output/{analysis_id}/{filename}")
async def serve_output(analysis_id: str, filename: str):
    """Serve a processed output image."""
    file_path = os.path.join(OUTPUT_DIR, analysis_id, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Output file not found.")
    return FileResponse(file_path)
