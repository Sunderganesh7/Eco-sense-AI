"""
GreenPath AI — Activity Logging Service (Business Logic Layer)
Provides methods for logging events and querying Activity Logs with search & filters.
"""

from typing import List, Dict, Any, Optional
from models.activity import ActivityLog


class ActivityService:
    """
    Service class handling activity logs search, filter, and audit trails.
    """

    @staticmethod
    def get_filtered_logs(
        search_query: Optional[str] = None,
        activity_type: Optional[str] = None,
        user_id: Optional[int] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Returns enriched Activity Log entries matching search & filter criteria.
        """
        return ActivityLog.get_all_filtered(
            search_query=search_query,
            activity_type=activity_type,
            user_id=user_id,
            limit=limit,
        )

    @staticmethod
    def get_available_activity_types() -> List[str]:
        """
        Returns a canonical list of trackable activities for frontend filter dropdowns.
        """
        return [
            "ALL",
            "User Registered",
            "User Logged In",
            "User Logged Out",
            "Failed Login Attempt",
            "Image Uploaded",
            "AI Detection Started",
            "AI Detection Completed",
            "Report Generated",
            "Password Changed",
            "Profile Updated",
            "Role Assigned",
            "User Deactivated",
            "Password Reset Requested",
            "Password Reset Completed",
            "Unauthorized Access Attempt",
            "Permission Denied",
        ]
