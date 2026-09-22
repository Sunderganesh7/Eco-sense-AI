"""
GreenPath AI — Predictions Router
ML-based predictive analytics endpoints.
"""

import logging
from fastapi import APIRouter, HTTPException
from backend.database.schemas import PredictionRequest, PredictionDocument, APIResponse
from backend.services.prediction_service import generate_predictions

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/predictions", tags=["Predictions"])


# ================================================================
# POST /predictions/generate
# ================================================================
@router.post("/generate")
async def create_prediction(body: PredictionRequest):
    """
    Generate 12-month environmental predictions using ML models.
    Input: tree_count, green_cover_percent, aqi_score, current_temp.
    """
    try:
        result = generate_predictions(
            tree_count=body.tree_count,
            green_cover=body.green_cover_percent,
            aqi_score=body.aqi_score,
            current_temp=body.current_temp,
            months_ahead=body.months_ahead,
        )

        # Persist prediction
        doc = PredictionDocument(
            current_tree_count=body.tree_count,
            current_green_cover=body.green_cover_percent,
            current_aqi_score=body.aqi_score,
            current_temp=body.current_temp,
            predicted_aqi=result["predicted_aqi"],
            predicted_carbon=result["predicted_carbon_kg"],
            predicted_temp=result["predicted_temp"],
            prediction_months=result["months"],
            aqi_r2_score=result["model_metrics"].get("aqi_r2", 0.0),
            carbon_r2_score=result["model_metrics"].get("carbon_r2", 0.0),
        )
        await doc.insert()

        return {
            "success": True,
            "prediction_id": str(doc.id),
            **result,
        }
    except Exception as e:
        logger.error(f"Prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ================================================================
# GET /predictions/history
# ================================================================
@router.get("/history")
async def prediction_history(limit: int = 10):
    """Return recent prediction records."""
    docs = await PredictionDocument.find_all().sort(
        -PredictionDocument.created_at
    ).limit(limit).to_list()
    return [
        {
            "id": str(d.id),
            "tree_count": d.current_tree_count,
            "green_cover": d.current_green_cover,
            "aqi": d.current_aqi_score,
            "months": d.prediction_months,
            "predicted_aqi": d.predicted_aqi,
            "predicted_carbon": d.predicted_carbon,
            "created_at": d.created_at,
        }
        for d in docs
    ]


# ================================================================
# GET /predictions/dashboard-stats
# ================================================================
@router.get("/dashboard-stats")
async def dashboard_stats():
    """
    Aggregated stats for the admin analytics dashboard:
    - Total analyses, trees, green cover, AQI, CO2 averages
    - Monthly trends
    """
    from backend.database.schemas import AnalysisDocument, ReportDocument, AnalysisStatus
    import calendar
    from datetime import datetime

    analyses = await AnalysisDocument.find(
        AnalysisDocument.status == AnalysisStatus.COMPLETED
    ).to_list()

    total = len(analyses)
    total_trees = sum(a.tree_count for a in analyses)
    avg_green = round(sum(a.green_cover_percent for a in analyses) / max(total, 1), 2)
    avg_aqi = round(sum(a.aqi_score for a in analyses) / max(total, 1), 1)
    total_co2 = round(sum(a.co2_absorption_kg for a in analyses), 1)
    total_reports = await ReportDocument.find_all().count()

    # Monthly aggregation (last 6 months)
    monthly_trees: dict = {}
    monthly_aqi: dict = {}
    for a in analyses:
        month_key = a.created_at.strftime("%b %Y")
        monthly_trees[month_key] = monthly_trees.get(month_key, 0) + a.tree_count
        monthly_aqi.setdefault(month_key, []).append(a.aqi_score)

    monthly_tree_list = [{"month": k, "count": v} for k, v in list(monthly_trees.items())[-6:]]
    monthly_aqi_list = [
        {"month": k, "avg_aqi": round(sum(v) / len(v), 1)}
        for k, v in list(monthly_aqi.items())[-6:]
    ]

    # Zone health distribution
    zone_health: dict = {}
    for a in analyses:
        for zone, label in a.zone_classifications.items():
            zone_health[label] = zone_health.get(label, 0) + 1

    # Recent 5 analyses
    recent = await AnalysisDocument.find(
        AnalysisDocument.status == AnalysisStatus.COMPLETED
    ).sort(-AnalysisDocument.created_at).limit(5).to_list()

    return {
        "total_analyses": total,
        "total_trees_detected": total_trees,
        "avg_green_cover": avg_green,
        "avg_aqi_score": avg_aqi,
        "total_co2_absorbed_kg": total_co2,
        "total_reports": total_reports,
        "monthly_tree_counts": monthly_tree_list,
        "monthly_aqi_scores": monthly_aqi_list,
        "zone_health_distribution": zone_health,
        "recent_analyses": [
            {
                "id": str(a.id),
                "original_filename": a.original_filename,
                "tree_count": a.tree_count,
                "green_cover_percent": a.green_cover_percent,
                "aqi_category": a.aqi_category,
                "eco_index": a.eco_index,
                "status": a.status,
                "created_at": a.created_at,
            }
            for a in recent
        ],
    }
