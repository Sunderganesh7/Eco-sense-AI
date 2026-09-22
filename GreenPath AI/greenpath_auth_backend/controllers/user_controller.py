"""
GreenPath AI — User Profile Controller (MVC Layer)
Handles profile display, edit profile, profile photo upload, and change password requests.
"""

from flask import request, jsonify, g
from services.user_service import UserService
from utils.telemetry import extract_request_telemetry


class UserController:
    """
    MVC Controller for User Profile and Account endpoints.
    """

    @staticmethod
    def get_profile():
        """Handles GET /api/v1/users/profile"""
        user = getattr(g, "current_user", None)
        if not user:
            return jsonify({"success": False, "message": "Authentication required."}), 401

        success, message, result_dict = UserService.get_user_profile(user.id)
        if not success:
            return jsonify({"success": False, "message": message}), 404

        return jsonify({
            "success": True,
            "message": message,
            "data": {"user": result_dict}
        }), 200

    @staticmethod
    def update_profile():
        """Handles PUT /api/v1/users/profile"""
        user = getattr(g, "current_user", None)
        if not user:
            return jsonify({"success": False, "message": "Authentication required."}), 401

        data = request.get_json(silent=True) or {}
        telemetry = extract_request_telemetry(request)

        success, message, result_dict = UserService.update_user_profile(user.id, data, telemetry)
        if not success:
            return jsonify({"success": False, "message": message}), 400

        return jsonify({
            "success": True,
            "message": message,
            "data": {"user": result_dict}
        }), 200

    @staticmethod
    def upload_profile_image():
        """Handles POST /api/v1/users/profile-image"""
        user = getattr(g, "current_user", None)
        if not user:
            return jsonify({"success": False, "message": "Authentication required."}), 401

        file = request.files.get("image") or request.files.get("file")
        telemetry = extract_request_telemetry(request)

        success, message, result_dict = UserService.upload_profile_photo(user.id, file, telemetry)
        if not success:
            return jsonify({"success": False, "message": message}), 400

        return jsonify({
            "success": True,
            "message": message,
            "data": {"user": result_dict}
        }), 200

    @staticmethod
    def change_password():
        """Handles PUT /api/v1/users/change-password"""
        user = getattr(g, "current_user", None)
        if not user:
            return jsonify({"success": False, "message": "Authentication required."}), 401

        data = request.get_json(silent=True) or {}
        telemetry = extract_request_telemetry(request)

        old_pw = data.get("current_password") or data.get("old_password")
        new_pw = data.get("new_password")
        confirm_pw = data.get("confirm_password")

        success, message = UserService.change_user_password(
            user.id, old_pw, new_pw, confirm_pw, telemetry
        )
        if not success:
            return jsonify({"success": False, "message": message}), 400

        return jsonify({
            "success": True,
            "message": message
        }), 200
