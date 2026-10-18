"""
Profile Service — MySQL CRUD operations for user profiles using SQLAlchemy.
"""

from datetime import datetime
from database import get_db_context
from models import Profile, User


def get_profile(user_id: int) -> dict | None:
    """Load a user's profile from MySQL. Returns dict or None."""
    with get_db_context() as db:
        profile = db.query(Profile).filter(Profile.user_id == user_id).first()
        if not profile:
            # Check if user exists, if so create empty profile
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return None
            profile = Profile(
                user_id=user_id,
                name=user.name,
                language="en",
                role="farmer",
                crops_grown=[],
                notifications={"weather": True, "pests": True},
            )
            db.add(profile)
            db.flush()

        data = profile.to_dict()
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            data["phone"] = user.phone
            data["email"] = user.email or data.get("email", "")
        return data


def save_profile(user_id: int, data: dict) -> dict:
    """Save or update a user's profile in MySQL. Returns the saved profile dict."""
    with get_db_context() as db:
        profile = db.query(Profile).filter(Profile.user_id == user_id).first()
        user = db.query(User).filter(User.id == user_id).first()

        name = data.get("name", "").strip()
        if user and name:
            user.name = name

        if not profile:
            profile = Profile(
                user_id=user_id,
                name=name or (user.name if user else ""),
                district=data.get("district", ""),
                state=data.get("state", ""),
                language=data.get("language", "en"),
                role=data.get("role", "farmer"),
                farm_size=data.get("farm_size"),
                crops_grown=data.get("crops_grown", []),
                notifications=data.get("notifications", {}),
                email=data.get("email", ""),
                latitude=data.get("latitude"),
                longitude=data.get("longitude"),
            )
            db.add(profile)
        else:
            if "name" in data and data["name"]:
                profile.name = name
            if "full_name" in data and data["full_name"]:
                profile.name = data["full_name"]
                if user:
                    user.name = data["full_name"]
            if "phone" in data and data["phone"] and user:
                new_phone = data["phone"].strip()
                if new_phone and new_phone != user.phone:
                    dup = db.query(User).filter(User.phone == new_phone, User.id != user_id).first()
                    if dup:
                        raise ValueError("Phone number is already associated with another account")
                    user.phone = new_phone
            if "district" in data:
                profile.district = data["district"]
            if "state" in data:
                profile.state = data["state"]
            if "language" in data:
                profile.language = data["language"]
            if "preferred_language" in data and data["preferred_language"]:
                profile.language = data["preferred_language"]
            if "role" in data:
                profile.role = data["role"]
            if "farm_size" in data:
                profile.farm_size = data["farm_size"]
            if "crops_grown" in data:
                profile.crops_grown = data["crops_grown"]
            if "notifications" in data:
                profile.notifications = data["notifications"]
            if "email" in data:
                profile.email = data["email"]
            if "latitude" in data:
                profile.latitude = data["latitude"]
            if "longitude" in data:
                profile.longitude = data["longitude"]
            profile.updated_at = datetime.utcnow()

        db.flush()
        saved_dict = profile.to_dict()
        if user:
            saved_dict["phone"] = user.phone
            saved_dict["email"] = user.email or saved_dict.get("email", "")
        return saved_dict


def delete_profile(user_id: int) -> bool:
    """Delete a user and cascade to profile and all related records."""
    with get_db_context() as db:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        db.delete(user)
        return True
