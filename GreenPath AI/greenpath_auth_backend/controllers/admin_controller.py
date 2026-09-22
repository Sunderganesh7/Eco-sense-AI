"""
GreenPath AI — Admin Controller (MVC Layer)
Handles Admin Dashboard APIs: Activity Logs (search/filter), Login History,
User management, and Role assignment.
"""

from flask import request, jsonify, g
from services.activity_service import ActivityService
from models.session_log import LoginHistory, SessionToken
from models.user import User
from models.role import Role, RBACRole
from models.activity import ActivityLog
from utils.telemetry import extract_request_telemetry


class AdminController:
    """
    MVC Controller for RBAC Admin-only endpoints.
    """

    @staticmethod
    def get_activity_logs():
        """Handles GET /api/v1/admin/logs/activity"""
        search_query = request.args.get("search")
        activity_type = request.args.get("activity_type")
        user_id_str = request.args.get("user_id")
        limit = int(request.args.get("limit", 100))

        user_id = int(user_id_str) if user_id_str and user_id_str.isdigit() else None

        logs = ActivityService.get_filtered_logs(
            search_query=search_query,
            activity_type=activity_type,
            user_id=user_id,
            limit=limit,
        )
        types = ActivityService.get_available_activity_types()

        return jsonify({
            "success": True,
            "message": "Activity logs retrieved successfully.",
            "data": {
                "logs": logs,
                "activity_types": types,
                "total_count": len(logs)
            }
        }), 200

    @staticmethod
    def get_login_history():
        """Handles GET /api/v1/admin/logs/logins"""
        limit = int(request.args.get("limit", 100))
        history = LoginHistory.get_all(limit=limit)

        return jsonify({
            "success": True,
            "message": "Login history retrieved successfully.",
            "data": {
                "login_history": history,
                "total_count": len(history)
            }
        }), 200

    @staticmethod
    def list_roles():
        """Handles GET /api/v1/admin/roles"""
        roles = Role.get_all()
        return jsonify({
            "success": True,
            "message": "RBAC roles retrieved successfully.",
            "data": {
                "roles": [r.to_dict() for r in roles]
            }
        }), 200

    @staticmethod
    def list_users():
        """Handles GET /api/v1/admin/users"""
        users = User.get_all()
        return jsonify({
            "success": True,
            "message": "Registered users retrieved successfully.",
            "data": {
                "users": [u.to_dict(include_profile=True) for u in users]
            }
        }), 200

    @staticmethod
    def assign_user_role(user_id: int):
        """Handles PUT /api/v1/admin/users/<int:user_id>/role"""
        data = request.get_json(silent=True) or {}
        new_role_name = data.get("role_name", "").strip()

        role_obj = Role.get_by_name(new_role_name)
        if not role_obj:
            return jsonify({
                "success": False,
                "message": f"Role '{new_role_name}' does not exist. Must be Admin, Researcher, or Officer."
            }), 400

        user = User.get_by_id(user_id)
        if not user:
            return jsonify({"success": False, "message": "User not found."}), 404

        Role.assign_to_user(user.id, role_obj.id)

        telemetry = extract_request_telemetry(request)
        admin_user = getattr(g, "current_user", None)
        ActivityLog.log(
            user_id=admin_user.id if admin_user else None,
            activity="Role Assigned",
            details=f"Assigned role '{new_role_name}' to user {user.email} (ID: {user.id})",
            **telemetry
        )

        return jsonify({
            "success": True,
            "message": f"Successfully assigned role '{new_role_name}' to user {user.email}.",
            "data": {"user": user.to_dict(include_profile=True)}
        }), 200

    @staticmethod
    def delete_user(user_id: int):
        """Handles DELETE /api/v1/admin/users/<int:user_id>"""
        user = User.get_by_id(user_id)
        if not user:
            return jsonify({"success": False, "message": "User not found."}), 404

        if user.is_admin() and user.id == 101:
            return jsonify({
                "success": False,
                "message": "Cannot delete the default root Admin account."
            }), 400

        User.set_active_status(user.id, False)
        SessionToken.revoke_all_for_user(user.id)

        telemetry = extract_request_telemetry(request)
        admin_user = getattr(g, "current_user", None)
        ActivityLog.log(
            user_id=admin_user.id if admin_user else None,
            activity="User Deactivated",
            details=f"Deactivated user account for {user.email} (ID: {user.id})",
            **telemetry
        )

        return jsonify({
            "success": True,
            "message": f"User {user.email} has been deactivated and all active sessions revoked."
        }), 200
