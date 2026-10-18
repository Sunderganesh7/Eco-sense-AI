"""
History Service — MySQL persistence for recommendation history and disease scans using SQLAlchemy.
"""

from database import get_db_context
from models import RecommendationHistory, DiseaseScan


# ── Recommendation History ────────────────────────────

def save_recommendation(user_id: int, input_data: dict, recommendations: list,
                        model_version: str = "", inference_ms: int = 0,
                        field_id: int = None) -> dict:
    """Save a crop recommendation to MySQL history."""
    with get_db_context() as db:
        record = RecommendationHistory(
            user_id=user_id,
            field_id=field_id,
            input_data=input_data,
            recommendations=recommendations,
            model_version=model_version,
            inference_ms=inference_ms,
        )
        db.add(record)
        db.flush()
        return record.to_dict()


def get_recommendation_history(user_id: int, limit: int = 20) -> list:
    """Get recommendation history for a user, most recent first."""
    with get_db_context() as db:
        records = (
            db.query(RecommendationHistory)
            .filter(RecommendationHistory.user_id == user_id)
            .order_by(RecommendationHistory.created_at.desc())
            .limit(limit)
            .all()
        )
        return [r.to_dict() for r in records]


def delete_recommendation(user_id: int, record_id: int) -> bool:
    """Delete a single recommendation history entry."""
    with get_db_context() as db:
        rec = (
            db.query(RecommendationHistory)
            .filter(RecommendationHistory.id == record_id, RecommendationHistory.user_id == user_id)
            .first()
        )
        if not rec:
            return False
        db.delete(rec)
        return True


# ── Disease Scan History ──────────────────────────────

def save_disease_scan(user_id: int, crop: str, disease: str, confidence: float,
                      is_healthy: bool, treatment: dict = None,
                      all_predictions: list = None, image_path: str = None,
                      field_id: int = None) -> dict:
    """Save a disease detection scan to MySQL history."""
    with get_db_context() as db:
        scan = DiseaseScan(
            user_id=user_id,
            field_id=field_id,
            crop=crop,
            disease=disease,
            confidence=float(confidence),
            is_healthy=bool(is_healthy),
            treatment=treatment or {},
            all_predictions=all_predictions or [],
            image_path=image_path,
        )
        db.add(scan)
        db.flush()
        return scan.to_dict()


def get_disease_history(user_id: int, limit: int = 20) -> list:
    """Get disease scan history for a user, most recent first."""
    with get_db_context() as db:
        scans = (
            db.query(DiseaseScan)
            .filter(DiseaseScan.user_id == user_id)
            .order_by(DiseaseScan.created_at.desc())
            .limit(limit)
            .all()
        )
        return [s.to_dict() for s in scans]


def delete_disease_scan(user_id: int, scan_id: int) -> bool:
    """Delete a single disease scan entry."""
    with get_db_context() as db:
        scan = (
            db.query(DiseaseScan)
            .filter(DiseaseScan.id == scan_id, DiseaseScan.user_id == user_id)
            .first()
        )
        if not scan:
            return False
        db.delete(scan)
        return True
