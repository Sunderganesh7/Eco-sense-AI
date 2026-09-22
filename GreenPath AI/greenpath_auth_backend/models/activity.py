"""
GreenPath AI — Activity Log Model
Tracks every important activity in MySQL and supports search/filter queries for Admin Dashboard.
"""

from typing import Optional, List, Dict, Any
from database.connection import get_db_cursor


class ActivityLog:
    """
    MVC Model wrapper for the MySQL `activity_logs` table.
    """
    def __init__(
        self,
        id: int,
        user_id: Optional[int],
        activity: str,
        details: Optional[str] = None,
        ip_address: str = "127.0.0.1",
        browser: str = "Unknown",
        device: str = "Unknown",
        timestamp: Any = None,
    ):
        self.id = id
        self.user_id = user_id
        self.activity = activity
        self.details = details
        self.ip_address = ip_address
        self.browser = browser
        self.device = device
        self.timestamp = timestamp

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "activity": self.activity,
            "details": self.details or "",
            "ip_address": self.ip_address,
            "browser": self.browser,
            "device": self.device,
            "timestamp": str(self.timestamp) if self.timestamp else None,
        }

    @classmethod
    def log(
        cls,
        activity: str,
        user_id: Optional[int] = None,
        details: str = "",
        ip_address: str = "127.0.0.1",
        browser: str = "Unknown",
        device: str = "Unknown",
    ) -> int:
        """
        Inserts a new activity log entry into `activity_logs`.
        """
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO activity_logs
                (user_id, activity, details, ip_address, browser, device)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (user_id, activity, details, ip_address, browser, device)
            )
            return cursor.lastrowid

    @classmethod
    def get_by_user(cls, user_id: int, limit: int = 50) -> List["ActivityLog"]:
        with get_db_cursor(commit_on_success=False) as cursor:
            cursor.execute(
                """
                SELECT id, user_id, activity, details, ip_address, browser, device, timestamp
                FROM activity_logs
                WHERE user_id = %s
                ORDER BY id DESC LIMIT %s
                """,
                (user_id, limit)
            )
            rows = cursor.fetchall()
            return [cls(**r) for r in rows]

    @classmethod
    def get_all_filtered(
        cls,
        search_query: Optional[str] = None,
        activity_type: Optional[str] = None,
        user_id: Optional[int] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Fetches activity logs with optional searching and filtering for Admin Dashboard.
        """
        sql = """
            SELECT al.*, u.email, up.full_name, r.name as role_name
            FROM activity_logs al
            LEFT JOIN users u ON al.user_id = u.id
            LEFT JOIN user_profiles up ON u.id = up.user_id
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.id
            WHERE 1=1
        """
        params = []

        if search_query:
            sql += " AND (al.activity LIKE %s OR al.details LIKE %s OR u.email LIKE %s OR up.full_name LIKE %s)"
            sq_val = f"%{search_query.strip()}%"
            params.extend([sq_val, sq_val, sq_val, sq_val])

        if activity_type and activity_type.strip() != "ALL":
            sql += " AND al.activity = %s"
            params.append(activity_type.strip())

        if user_id:
            sql += " AND al.user_id = %s"
            params.append(user_id)

        sql += " ORDER BY al.id DESC LIMIT %s"
        params.append(limit)

        with get_db_cursor(commit_on_success=False) as cursor:
            cursor.execute(sql, tuple(params))
            rows = cursor.fetchall()
            results = []
            for r in rows:
                item = cls(
                    id=r["id"],
                    user_id=r["user_id"],
                    activity=r["activity"],
                    details=r["details"],
                    ip_address=r["ip_address"],
                    browser=r["browser"],
                    device=r["device"],
                    timestamp=r["timestamp"],
                ).to_dict()
                item["email"] = r.get("email", "System / Anonymous")
                item["full_name"] = r.get("full_name", "System")
                item["role_name"] = r.get("role_name", "N/A")
                results.append(item)
            return results
