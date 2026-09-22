"""
GreenPath AI — User Profile Routes (Flask Blueprint)
Defines REST API endpoints for /api/v1/users protected by JWT authentication.
"""

from flask import Blueprint
from controllers.user_controller import UserController
from middleware.auth_middleware import jwt_required

user_bp = Blueprint("users", __name__, url_prefix="/api/v1/users")

user_bp.add_url_rule("/profile", view_func=jwt_required()(UserController.get_profile), methods=["GET"])
user_bp.add_url_rule("/profile", view_func=jwt_required()(UserController.update_profile), methods=["PUT"])
user_bp.add_url_rule("/profile-image", view_func=jwt_required()(UserController.upload_profile_image), methods=["POST"])
user_bp.add_url_rule("/change-password", view_func=jwt_required()(UserController.change_password), methods=["PUT"])
