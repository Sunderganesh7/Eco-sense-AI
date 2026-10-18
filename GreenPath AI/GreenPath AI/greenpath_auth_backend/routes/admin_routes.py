"""
GreenPath AI — Admin Routes (Flask Blueprint)
Defines REST API endpoints for /api/v1/admin protected by Admin RBAC checks.
"""

from flask import Blueprint
from controllers.admin_controller import AdminController
from middleware.auth_middleware import jwt_required
from middleware.rbac_middleware import require_role
from models.role import RBACRole

admin_bp = Blueprint("admin", __name__, url_prefix="/api/v1/admin")


def admin_protected(view_func):
    """Helper decorator applying JWT authentication AND Admin role requirement."""
    return jwt_required()(require_role(RBACRole.ADMIN.value)(view_func))


admin_bp.add_url_rule("/logs/activity", view_func=admin_protected(AdminController.get_activity_logs), methods=["GET"])
admin_bp.add_url_rule("/logs/logins", view_func=admin_protected(AdminController.get_login_history), methods=["GET"])
admin_bp.add_url_rule("/roles", view_func=admin_protected(AdminController.list_roles), methods=["GET"])
admin_bp.add_url_rule("/users", view_func=admin_protected(AdminController.list_users), methods=["GET"])
admin_bp.add_url_rule("/users/<int:user_id>/role", view_func=admin_protected(AdminController.assign_user_role), methods=["PUT"])
admin_bp.add_url_rule("/users/<int:user_id>", view_func=admin_protected(AdminController.delete_user), methods=["DELETE"])
