"""
GreenPath AI — Authentication Routes (Flask Blueprint)
Defines REST API endpoints for /api/v1/auth.
"""

from flask import Blueprint
from controllers.auth_controller import AuthController
from middleware.auth_middleware import jwt_required

auth_bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")

# Public routes
auth_bp.add_url_rule("/register", view_func=AuthController.register, methods=["POST"])
auth_bp.add_url_rule("/login", view_func=AuthController.login, methods=["POST"])
auth_bp.add_url_rule("/refresh", view_func=AuthController.refresh, methods=["POST"])
auth_bp.add_url_rule("/forgot-password", view_func=AuthController.forgot_password, methods=["POST"])
auth_bp.add_url_rule("/verify-otp", view_func=AuthController.verify_otp, methods=["POST"])
auth_bp.add_url_rule("/reset-password", view_func=AuthController.reset_password, methods=["POST"])

# Protected routes (Requires Bearer Token)
auth_bp.add_url_rule("/logout", view_func=jwt_required()(AuthController.logout), methods=["POST"])
auth_bp.add_url_rule("/me", view_func=jwt_required()(AuthController.me), methods=["GET"])
