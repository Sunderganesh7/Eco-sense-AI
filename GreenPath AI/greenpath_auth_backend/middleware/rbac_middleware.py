"""
GreenPath AI — Role-Based Access Control (RBAC) Middleware
Provides `@require_role` decorator to restrict API endpoints to authorized roles
(Admin, Researcher, Officer) as defined in Feature 3.
"""

from functools import wraps
from typing import List
from flask import g, request, jsonify
from models.role import RBACRole
from models.activity import ActivityLog
from utils.telemetry import extract_request_telemetry


# Define default RBAC Permission Matrix matching Feature 3
ROLE_PERMISSIONS = {
    RBACRole.ADMIN.value: {
        "manage_users": True,
        "delete_users": True,
        "view_analytics": True,
        "access_admin_dashboard": True,
        "view_activity_logs": True,
        "upload_images": True,
        "run_ai_detection": True,
        "generate_reports": True,
        "view_reports": True,
        "download_reports": True,
        "delete_data": True,
    },
    RBACRole.RESEARCHER.value: {
        "manage_users": False,
        "delete_users": False,
        "view_analytics": False,
        "access_admin_dashboard": False,
        "view_activity_logs": False,
        "upload_images": True,
        "run_ai_detection": True,
        "generate_reports": True,
        "view_reports": True,
        "download_reports": True,
        "delete_data": False,
    },
    RBACRole.OFFICER.value: {
        "manage_users": False,
        "delete_users": False,
        "view_analytics": False,
        "access_admin_dashboard": False,
        "view_activity_logs": False,
        "upload_images": False,
        "run_ai_detection": False,
        "generate_reports": False,
        "view_reports": True,
        "download_reports": True,
        "delete_data": False,
    },
}


def require_role(*allowed_roles: str):
    """
    Decorator that checks if the authenticated user has at least one of the `allowed_roles`.
    Must be stacked after `@jwt_required()`.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user = getattr(g, "current_user", None)
            if not user:
                return jsonify({
                    "success": False,
                    "message": "Authentication required before role verification."
                }), 401

            user_roles = [r.lower() for r in user.roles]
            allowed_lower = [r.lower() for r in allowed_roles]

            if not any(r in user_roles for r in allowed_lower):
                # Audit log unauthorized access attempt
                telemetry = extract_request_telemetry(request)
                ActivityLog.log(
                    user_id=user.id,
                    activity="Unauthorized Access Attempt",
                    details=f"Attempted access to protected endpoint requiring roles: {allowed_roles}. User roles: {user.roles}",
                    **telemetry
                )
                return jsonify({
                    "success": False,
                    "message": f"Forbidden: This endpoint requires one of the following roles: {', '.join(allowed_roles)}.",
                    "user_roles": user.roles
                }), 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator


def require_permission(permission_key: str):
    """
    Decorator that checks the Feature 3 permission matrix for the authenticated user's roles.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user = getattr(g, "current_user", None)
            if not user:
                return jsonify({
                    "success": False,
                    "message": "Authentication required."
                }), 401

            has_perm = False
            for role_name in user.roles:
                role_perms = ROLE_PERMISSIONS.get(role_name, {})
                if role_perms.get(permission_key, False):
                    has_perm = True
                    break

            if not has_perm:
                telemetry = extract_request_telemetry(request)
                ActivityLog.log(
                    user_id=user.id,
                    activity="Permission Denied",
                    details=f"Missing required permission: '{permission_key}'. User roles: {user.roles}",
                    **telemetry
                )
                return jsonify({
                    "success": False,
                    "message": f"Forbidden: You do not have permission to perform action: '{permission_key}'."
                }), 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator
