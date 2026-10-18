"""
GreenPath AI — Reports Router
PDF report generation, download, and management.
"""

import os
import logging
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse

from backend.config import settings
from backend.database.schemas import (
    ReportDocument, AnalysisDocument, AnalysisStatus,
    UserDocument, APIResponse,
)
from backend.services.report_service import generate_environmental_report
from backend.services.prediction_service import generate_predictions
from backend.services.recommendation_service import get_ai_recommendations
from backend.routers.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reports", tags=["Reports"])

REPORTS_DIR = os.path.join(settings.OUTPUT_FOLDER, "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)


# ================================================================
# POST /reports/generate/{analysis_id}
# ================================================================
@router.post("/generate/{analysis_id}")
async def generate_report(
    analysis_id: str,
    current_user: UserDocument = Depends(get_current_user),
):
    """Generate a full PDF report for a completed analysis."""
    from beanie import PydanticObjectId

    # Fetch analysis
    try:
        analysis = await AnalysisDocument.get(PydanticObjectId(analysis_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    if not analysis or analysis.status != AnalysisStatus.COMPLETED:
        raise HTTPException(
            status_code=400,
            detail="Analysis must be completed before generating a report.",
        )

    # Build data dicts for PDF
    analysis_data = {
        "tree_count": analysis.tree_count,
        "green_cover_percent": analysis.green_cover_percent,
        "aqi_score": analysis.aqi_score,
        "aqi_category": analysis.aqi_category,
        "co2_absorption_kg": analysis.co2_absorption_kg,
        "eco_index": analysis.eco_index,
        "heat_reduction_celsius": analysis.heat_reduction_celsius,
        "cooling_level": analysis.cooling_level,
        "tree_health_summary": analysis.tree_health_summary,
        "ndvi_mean": analysis.ndvi_mean,
    }

    # Generate predictions
    prediction_data = generate_predictions(
        tree_count=analysis.tree_count,
        green_cover=analysis.green_cover_percent,
        aqi_score=analysis.aqi_score,
        current_temp=35.0,
    )

    # Generate recommendations
    recommendation_data = get_ai_recommendations(
        tree_count=analysis.tree_count,
        green_cover=analysis.green_cover_percent,
        aqi_score=analysis.aqi_score,
        current_temp=35.0,
        zone_distribution=analysis.zone_distribution,
    )

    # Generate PDF
    try:
        pdf_path = generate_environmental_report(
            analysis=analysis_data,
            predictions=prediction_data,
            recommendations=recommendation_data,
            output_dir=REPORTS_DIR,
            report_title=f"GreenPath AI Report — {analysis.original_filename}",
        )
    except Exception as e:
        logger.error(f"PDF generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")

    # Persist report document
    file_size = os.path.getsize(pdf_path)
    report_doc = ReportDocument(
        user_id=str(current_user.id),
        analysis_id=analysis_id,
        title=f"Environmental Report — {analysis.original_filename}",
        report_filename=os.path.basename(pdf_path),
        file_size_bytes=file_size,
    )
    await report_doc.insert()

    # Update user report count
    current_user.total_reports += 1
    await current_user.save()

    logger.info(f"📄 Report generated: {pdf_path}")
    return {
        "success": True,
        "report_id": str(report_doc.id),
        "filename": os.path.basename(pdf_path),
        "file_size_bytes": file_size,
        "download_url": f"/reports/download/{str(report_doc.id)}",
    }


# ================================================================
# GET /reports/download/{report_id}
# ================================================================
@router.get("/download/{report_id}")
async def download_report(report_id: str):
    """Download a generated PDF report by ID."""
    from beanie import PydanticObjectId

    try:
        report = await ReportDocument.get(PydanticObjectId(report_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Report not found.")

    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    pdf_path = os.path.join(REPORTS_DIR, report.report_filename)
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="PDF file not found on server.")

    report.download_count += 1
    await report.save()

    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=report.report_filename,
        headers={"Content-Disposition": f"attachment; filename={report.report_filename}"},
    )


# ================================================================
# GET /reports/  — List user's reports
# ================================================================
@router.get("/")
async def list_reports(
    current_user: UserDocument = Depends(get_current_user),
    page: int = 1,
    limit: int = 10,
):
    """List reports for the current user."""
    skip = (page - 1) * limit
    user_id = str(current_user.id)

    reports = await ReportDocument.find(
        ReportDocument.user_id == user_id
    ).sort(-ReportDocument.created_at).skip(skip).limit(limit).to_list()

    total = await ReportDocument.find(ReportDocument.user_id == user_id).count()

    return {
        "total": total,
        "page": page,
        "items": [
            {
                "id": str(r.id),
                "title": r.title,
                "filename": r.report_filename,
                "file_size_bytes": r.file_size_bytes,
                "download_count": r.download_count,
                "created_at": r.created_at,
                "download_url": f"/reports/download/{str(r.id)}",
            }
            for r in reports
        ],
    }


# ================================================================
# DELETE /reports/{report_id}
# ================================================================
@router.delete("/{report_id}", response_model=APIResponse)
async def delete_report(
    report_id: str,
    current_user: UserDocument = Depends(get_current_user),
):
    """Delete a report and its PDF file."""
    from beanie import PydanticObjectId

    try:
        report = await ReportDocument.get(PydanticObjectId(report_id))
    except Exception:
        raise HTTPException(status_code=404, detail="Report not found.")

    if report.user_id != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your report.")

    pdf_path = os.path.join(REPORTS_DIR, report.report_filename)
    if os.path.exists(pdf_path):
        os.remove(pdf_path)

    await report.delete()
    return APIResponse(success=True, message="Report deleted.")
