"""
GreenPath AI — User Profile Service (Business Logic Layer)
Handles profile display, editing, image uploads, and secure password changes.
"""

import os
import uuid
from typing import Dict, Any, Tuple, Optional
from werkzeug.utils import secure_filename
from models.user import User, UserProfile
from models.session_log import SessionToken
from models.activity import ActivityLog
from authentication.password_handler import hash_password, verify_password
from utils.validators import validate_password_strength, sanitize_input

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "profiles")


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


class UserService:
    """
    Service class executing user profile modifications and password updates.
    """

    @staticmethod
    def get_user_profile(user_id: int) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        user = User.get_by_id(user_id)
        if not user:
            return False, "User not found.", None
        return True, "Profile retrieved successfully.", user.to_dict(include_profile=True)

    @staticmethod
    def update_user_profile(
        user_id: int,
        data: Dict[str, Any],
        telemetry: Dict[str, Any],
    ) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        user = User.get_by_id(user_id)
        if not user or not user.profile:
            return False, "User profile not found.", None

        full_name = sanitize_input(data.get("full_name") or user.profile.full_name)
        phone_number = sanitize_input(data.get("phone_number", user.profile.phone_number or ""))
        designation = sanitize_input(data.get("designation", user.profile.designation or ""))
        organization = sanitize_input(data.get("organization", user.profile.organization or ""))

        if not full_name:
            return False, "Full Name cannot be empty.", None

        updated_profile = UserProfile.update(
            user_id=user.id,
            full_name=full_name,
            phone_number=phone_number,
            designation=designation,
            organization=organization,
        )

        ActivityLog.log(
            user_id=user.id,
            activity="Profile Updated",
            details="User updated profile details (name, phone, designation, organization).",
            **telemetry
        )

        user._profile = updated_profile
        return True, "Profile updated successfully!", user.to_dict(include_profile=True)

    @staticmethod
    def upload_profile_photo(
        user_id: int,
        file: Any,
        telemetry: Dict[str, Any],
    ) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        user = User.get_by_id(user_id)
        if not user or not user.profile:
            return False, "User account not found.", None

        if not file or not file.filename:
            return False, "No image file selected.", None

        if not allowed_file(file.filename):
            return False, "Invalid image format. Allowed formats: PNG, JPG, JPEG, WEBP.", None

        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        ext = file.filename.rsplit(".", 1)[1].lower()
        new_filename = f"user_{user.id}_{uuid.uuid4().hex[:8]}.{ext}"
        filepath = os.path.join(UPLOAD_FOLDER, new_filename)

        try:
            file.save(filepath)
            photo_url = f"/uploads/profiles/{new_filename}"

            updated_profile = UserProfile.update(
                user_id=user.id,
                full_name=user.profile.full_name,
                phone_number=user.profile.phone_number or "",
                designation=user.profile.designation or "",
                organization=user.profile.organization or "",
                profile_photo_url=photo_url,
            )

            ActivityLog.log(
                user_id=user.id,
                activity="Image Uploaded",
                details=f"User uploaded a new profile avatar: {new_filename}",
                **telemetry
            )

            user._profile = updated_profile
            return True, "Profile photo uploaded successfully!", user.to_dict(include_profile=True)
        except Exception as e:
            return False, f"Failed to save uploaded image: {str(e)}", None

    @staticmethod
    def change_user_password(
        user_id: int,
        old_password: str,
        new_password: str,
        confirm_password: str,
        telemetry: Dict[str, Any],
    ) -> Tuple[bool, str]:
        if not old_password or not new_password or not confirm_password:
            return False, "Current password, new password, and confirmation are required."

        if new_password != confirm_password:
            return False, "New passwords do not match."

        user = User.get_by_id(user_id)
        if not user:
            return False, "User not found."

        if not verify_password(old_password, user.password_hash):
            return False, "Incorrect current password."

        if old_password == new_password:
            return False, "New password must be different from your current password."

        is_valid_pw, pw_err = validate_password_strength(new_password)
        if not is_valid_pw:
            return False, pw_err or "Password does not meet complexity rules."

        new_hash = hash_password(new_password)
        User.update_password(user.id, new_hash)

        # Security rule: revoke active sessions on password change
        SessionToken.revoke_all_for_user(user.id)

        ActivityLog.log(
            user_id=user.id,
            activity="Password Changed",
            details="User successfully changed their password. All active sessions revoked.",
            **telemetry
        )

        return True, "Password changed successfully! Please log in with your new password."
