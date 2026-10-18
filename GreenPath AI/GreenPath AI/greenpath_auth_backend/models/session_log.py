"""
GreenPath AI — Session & Login History Models
Manages active JWT session tokens and tracks login/logout telemetry in MySQL.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from database.connection import get_db_cursor
from config.settings import settings


class SessionToken:
    """
    MVC Model wrapper for the MySQL `sessions` table.
    Ensures secure token revocation and logout tracking.
    """
    def __init__(
        self,
        id: int,
        user_id: int,
        jwt_id: str,
        refresh_token_hash: Optional[str] = None,
        is_revoked: bool = False,
        expires_at: Any = None,
        created_at: Any = None,
    ):
        self.id = id
        self.user_id = user_id
        self.jwt_id = jwt_id
        self.refresh_token_hash = refresh_token_hash
        self.is_revoked = bool(is_revoked)
        self.expires_at = expires_at
        self.created_at = created_at

    @classmethod
    def create(
        cls,
        user_id: int,
        jwt_id: str,
        refresh_token_hash: Optional[str] = None,
        expires_at: Optional[datetime] = None,
    ) -> "SessionToken":
        if not expires_at:
            expires_at = datetime.now() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        with get_db_cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO sessions (user_id, jwt_id, refresh_token_hash, is_revoked, expires_at)
                VALUES (%s, %s, %s, 0, %s)
                """,
                (user_id, jwt_id, refresh_token_hash, expires_at)
            )
            session_id = cursor.lastrowid

        return cls(id=session_id, user_id=user_id, jwt_id=jwt_id, refresh_token_hash=refresh_token_hash, expires_at=expires_at)

    @classmethod
    def is_revoked_jti(cls, jwt_id: str) -> bool:
        with get_db_cursor(commit_on_success=False) as cursor:
            cursor.execute("SELECT is_revoked FROM sessions WHERE jwt_id = %s", (jwt_id,))
            row = cursor.fetchone()
            if row:
                return bool(row["is_revoked"])
        return False

    @classmethod
    def revoke_by_jti(cls, jwt_id: str) -> bool:
        with get_db_cursor() as cursor:
            cursor.execute("UPDATE sessions SET is_revoked = 1 WHERE jwt_id = %s", (jwt_id,))
        return True

    @classmethod
    def revoke_all_for_user(cls, user_id: int) -> bool:
        with get_db_cursor() as cursor:
            cursor.execute("UPDATE sessions SET is_revoked = 1 WHERE user_id = %s", (user_id,))
        return True


class LoginHistory:
    """
    MVC Model wrapper for the MySQL `login_history` table.
    Tracks login time, logout time, IP address, browser, OS, country, and status.
    """
    def __init__(
        self,
        id: int,
        user_id: Optional[int],
        login_time: Any,
        logout_time: Optional[Any],
        ip_address: str,
        browser: str,
        operating_system: str,
        country: str = "India",
        status: str = "SUCCESS",
    ):
        self.id = id
        self.user_id = user_id
        self.login_time = login_time
        self.logout_time = logout_time
        self.ip_address = ip_address
        self.browser = browser
        self.operating_system = operating_system
        self.country = country
        self.status = status

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "login_time": str(self.login_time) if self.login_time else None,
            "logout_time": str(self.logout_time) if self.logout_time else "Active",
            "ip_address": self.ip_address,
            "browser": self.browser,
            "operating_system": self.operating_system,
            "country": self.country or "India",
            "status": self.status,
        }

    @classmethod
    def record_login(
        cls,
        user_id: Optional[int],
        ip_address: str,
        browser: str = "Unknown",
        operating_system: str = "Unknown",
        country: str = "India",
        status: str = "SUCCESS",
    ) -> int:
        """Inserts a new login attempt record and returns its database ID."""
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO login_history
                (user_id, ip_address, browser, operating_system, country, status)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (user_id, ip_address, browser, operating_system, country, status)
            )
            return cursor.lastrowid

    @classmethod
    def record_logout(cls, user_id: int) -> bool:
        """Updates the logout timestamp for the most recent active login session of this user."""
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                UPDATE login_history
                SET logout_time = CURRENT_TIMESTAMP
                WHERE user_id = %s AND logout_time IS NULL
                ORDER BY id DESC LIMIT 1
                """,
                (user_id,)
            )
        return True

    @classmethod
    def get_user_history(cls, user_id: int, limit: int = 50) -> List["LoginHistory"]:
        with get_db_cursor(commit_on_success=False) as cursor:
            cursor.execute(
                """
                SELECT id, user_id, login_time, logout_time, ip_address,
                       browser, operating_system, country, status
                FROM login_history
                WHERE user_id = %s
                ORDER BY id DESC LIMIT %s
                """,
                (user_id, limit)
            )
            rows = cursor.fetchall()
            return [cls(**r) for r in rows]

    @classmethod
    def get_all(cls, limit: int = 100) -> List[Dict[str, Any]]:
        """Admin helper to fetch recent login history across all users."""
        with get_db_cursor(commit_on_success=False) as cursor:
            cursor.execute(
                """
                SELECT lh.*, u.email, up.full_name
                FROM login_history lh
                LEFT JOIN users u ON lh.user_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                ORDER BY lh.id DESC LIMIT %s
                """,
                (limit,)
            )
            rows = cursor.fetchall()
            results = []
            for r in rows:
                item = cls(
                    id=r["id"],
                    user_id=r["user_id"],
                    login_time=r["login_time"],
                    logout_time=r["logout_time"],
                    ip_address=r["ip_address"],
                    browser=r["browser"],
                    operating_system=r["operating_system"],
                    country=r.get("country", "India"),
                    status=r["status"],
                ).to_dict()
                item["email"] = r.get("email", "Unknown / Failed")
                item["full_name"] = r.get("full_name", "Anonymous")
                results.append(item)
            return results
