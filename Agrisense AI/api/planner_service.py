"""
Planner Service — MySQL CRUD operations for crop rotation plans using SQLAlchemy.
"""

from datetime import datetime
from database import get_db_context
from models import CropPlan


def get_plans(user_id: int, year: int = None) -> list:
    """Get all crop plans for a user, optionally filtered by year."""
    with get_db_context() as db:
        query = db.query(CropPlan).filter(CropPlan.user_id == user_id)
        if year:
            query = query.filter(CropPlan.year == year)
        plans = query.order_by(CropPlan.plot_label.asc(), CropPlan.start_month.asc()).all()
        return [p.to_dict() for p in plans]


def get_plans_grouped(user_id: int, year: int = None) -> list:
    """
    Get plans grouped by plot_label formatted for the frontend Planner calendar.
    Returns: [{ plot: "South Field", entries: [{ id, crop, start, end, season, field_id }, ...] }, ...]
    """
    plans = get_plans(user_id, year)
    grouped = {}
    for plan in plans:
        plot = plan["plot_label"]
        if plot not in grouped:
            grouped[plot] = []
        grouped[plot].append({
            "id": plan["id"],
            "crop": plan["crop"],
            "start": max(0, plan["start_month"] - 1),  # Convert 1-indexed to 0-indexed for frontend
            "end": plan["end_month"],                  # end is exclusive in frontend
            "season": plan.get("season", ""),
            "field_id": plan.get("field_id"),
        })
    return [{"plot": plot, "entries": entries} for plot, entries in grouped.items()]


def create_plan(user_id: int, data: dict) -> dict:
    """Create a new crop plan entry in MySQL."""
    with get_db_context() as db:
        new_plan = CropPlan(
            user_id=user_id,
            field_id=data.get("field_id"),
            plot_label=data.get("plot_label", "Unnamed Plot"),
            year=int(data.get("year", 2026)),
            crop=data.get("crop", ""),
            season=data.get("season", ""),
            start_month=int(data.get("start_month", 1)),
            end_month=int(data.get("end_month", 3)),
        )
        db.add(new_plan)
        db.flush()
        return new_plan.to_dict()


def update_plan(user_id: int, plan_id: int, data: dict) -> dict | None:
    """Update an existing crop plan entry in MySQL."""
    with get_db_context() as db:
        plan = (
            db.query(CropPlan)
            .filter(CropPlan.id == plan_id, CropPlan.user_id == user_id)
            .first()
        )
        if not plan:
            return None

        allowed_fields = ["field_id", "plot_label", "year", "crop", "season", "start_month", "end_month"]
        for key in allowed_fields:
            if key in data:
                val = data[key]
                if key in ("year", "start_month", "end_month") and val is not None:
                    val = int(val)
                setattr(plan, key, val)

        plan.updated_at = datetime.utcnow()
        db.flush()
        return plan.to_dict()


def delete_plan(user_id: int, plan_id: int) -> bool:
    """Delete a single crop plan entry from MySQL."""
    with get_db_context() as db:
        plan = (
            db.query(CropPlan)
            .filter(CropPlan.id == plan_id, CropPlan.user_id == user_id)
            .first()
        )
        if not plan:
            return False
        db.delete(plan)
        return True


def delete_plans_for_plot(user_id: int, plot_label: str, year: int = None) -> bool:
    """Delete all plans for a specific plot label."""
    with get_db_context() as db:
        query = db.query(CropPlan).filter(CropPlan.user_id == user_id, CropPlan.plot_label == plot_label)
        if year:
            query = query.filter(CropPlan.year == year)
        query.delete()
        return True
