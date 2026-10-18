"""
GreenPath AI — Authentication Controller (MVC Layer)
Receives HTTP requests, calls AuthService methods, and returns structured JSON responses.
"""

from flask import request, jsonify, g
from services.auth_service import AuthService
from utils.telemetry import extract_request_telemetry


class AuthController:
    """
    MVC Controller for Authentication endpoints.
    """

    @staticmethod
    def register():
        """Handles POST /api/v1/auth/register"""
        data = request.get_json(silent=True) or {}
        telemetry = extract_request_telemetry(request)

        success, message, user_dict = AuthService.register_user(data, telemetry)
        if not success:
            return jsonify({"success": False, "message": message}), 400

        return jsonify({
            "success": True,
            "message": message,
            "data": {"user": user_dict}
        }), 201

    @staticmethod
    def login():
        """Handles POST /api/v1/auth/login"""
        data = request.get_json(silent=True) or {}
        telemetry = extract_request_telemetry(request)

        email = data.get("email")
        password = data.get("password")
        remember_me = bool(data.get("remember_me", False))

        success, message, result_dict = AuthService.login_user(email, password, remember_me, telemetry)
        if not success:
            return jsonify({"success": False, "message": message}), 401

        return jsonify({
            "success": True,
            "message": message,
            "data": result_dict
        }), 200

    @staticmethod
    def logout():
        """Handles POST /api/v1/auth/logout (Protected)"""
        user = getattr(g, "current_user", None)
        jti = getattr(g, "jwt_id", None)
        telemetry = extract_request_telemetry(request)

        success, message = AuthService.logout_user(user, jti, telemetry)
        return jsonify({
            "success": True,
            "message": message
        }), 200

    @staticmethod
    def refresh():
        """Handles POST /api/v1/auth/refresh"""
        data = request.get_json(silent=True) or {}
        telemetry = extract_request_telemetry(request)
        refresh_token = data.get("refresh_token", "")

        success, message, result_dict = AuthService.refresh_user_token(refresh_token, telemetry)
        if not success:
            return jsonify({"success": False, "message": message}), 401

        return jsonify({
            "success": True,
            "message": message,
            "data": result_dict
        }), 200

    @staticmethod
    def me():
        """Handles GET /api/v1/auth/me (Protected)"""
        user = getattr(g, "current_user", None)
        if not user:
            return jsonify({"success": False, "message": "Authentication required."}), 401

        return jsonify({
            "success": True,
            "message": "User profile retrieved successfully.",
            "data": {"user": user.to_dict(include_profile=True)}
        }), 200

    @staticmethod
    def forgot_password():
        """Handles POST /api/v1/auth/forgot-password"""
        data = request.get_json(silent=True) or {}
        telemetry = extract_request_telemetry(request)
        email = data.get("email")

        from services.otp_service import OTPService
        success, message, result_dict = OTPService.request_otp(email, telemetry)
        if not success:
            return jsonify({"success": False, "message": message}), 400

        return jsonify({
            "success": True,
            "message": message,
            "data": result_dict
        }), 200

    @staticmethod
    def verify_otp():
        """Handles POST /api/v1/auth/verify-otp"""
        data = request.get_json(silent=True) or {}
        telemetry = extract_request_telemetry(request)
        email = data.get("email")
        otp_code = data.get("otp_code")

        from services.otp_service import OTPService
        success, message = OTPService.verify_otp(email, otp_code, telemetry)
        if not success:
            return jsonify({"success": False, "message": message}), 400

        return jsonify({
            "success": True,
            "message": message
        }), 200

    @staticmethod
    def reset_password():
        """Handles POST /api/v1/auth/reset-password"""
        data = request.get_json(silent=True) or {}
        telemetry = extract_request_telemetry(request)
        email = data.get("email")
        otp_code = data.get("otp_code")
        new_password = data.get("new_password")
        confirm_password = data.get("confirm_password")

        from services.otp_service import OTPService
        success, message = OTPService.reset_password(
            email, otp_code, new_password, confirm_password, telemetry
        )
        if not success:
            return jsonify({"success": False, "message": message}), 400

        return jsonify({
            "success": True,
            "message": message
        }), 200

