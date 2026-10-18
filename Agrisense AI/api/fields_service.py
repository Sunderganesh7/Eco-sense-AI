"""
Fields Service — MySQL CRUD operations for farm plots/fields using SQLAlchemy.
"""

from datetime import datetime
from database import get_db_context
from models import Field


def get_fields(user_id: int) -> list:
    """Get all fields for a user."""
    with get_db_context() as db:
        fields = (
            db.query(Field)
            .filter(Field.user_id == user_id)
            .order_by(Field.created_at.asc())
            .all()
        )
        return [f.to_dict() for f in fields]


def get_field(user_id: int, field_id: int) -> dict | None:
    """Get a single field by ID ensuring ownership."""
    with get_db_context() as db:
        field = (
            db.query(Field)
            .filter(Field.id == field_id, Field.user_id == user_id)
            .first()
        )
        return field.to_dict() if field else None


def create_field(user_id: int, data: dict) -> dict:
    """Create a new field/plot for a user in MySQL."""
    with get_db_context() as db:
        new_field = Field(
            user_id=user_id,
            label=data.get("label", "Unnamed Field"),
            area_ha=float(data.get("area_ha", 1.0)),
            irrigation=data.get("irrigation", "rainfed"),
            soil_n=float(data.get("soil_n", 0.0)),
            soil_p=float(data.get("soil_p", 0.0)),
            soil_k=float(data.get("soil_k", 0.0)),
            soil_ph=float(data.get("soil_ph", 7.0)),
            soil_type=data.get("soil_type", ""),
            previous_crop=data.get("previous_crop", ""),
            current_crop=data.get("current_crop", ""),
            latitude=data.get("latitude"),
            longitude=data.get("longitude"),
            status=data.get("status", "active"),
        )
        db.add(new_field)
        db.flush()
        return new_field.to_dict()


def update_field(user_id: int, field_id: int, data: dict) -> dict | None:
    """Update an existing field in MySQL."""
    with get_db_context() as db:
        field = (
            db.query(Field)
            .filter(Field.id == field_id, Field.user_id == user_id)
            .first()
        )
        if not field:
            return None

        allowed_fields = [
            "label", "area_ha", "irrigation", "soil_n", "soil_p", "soil_k",
            "soil_ph", "soil_type", "previous_crop", "current_crop",
            "latitude", "longitude", "status"
        ]
        for key in allowed_fields:
            if key in data:
                val = data[key]
                if key in ("area_ha", "soil_n", "soil_p", "soil_k", "soil_ph") and val is not None:
                    val = float(val)
                setattr(field, key, val)

        field.updated_at = datetime.utcnow()
        db.flush()
        return field.to_dict()


def delete_field(user_id: int, field_id: int) -> bool:
    """Delete a field from MySQL."""
    with get_db_context() as db:
        field = (
            db.query(Field)
            .filter(Field.id == field_id, Field.user_id == user_id)
            .first()
        )
        if not field:
            return False
        db.delete(field)
        return True
