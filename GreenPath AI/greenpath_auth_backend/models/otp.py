"""
GreenPath AI — Password Reset OTP Model
Manages 6-digit email OTPs stored in MySQL with automatic 5-minute expiration checking.
"""

from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from database.connection import get_db_cursor
from config.settings import settings


class PasswordResetOTP:
    """
    MVC Model wrapper for the MySQL `password_reset_otps` table.
    """
    def __init__(
        self,
        id: int,
        user_id: int,
        otp_hash: str,
        expires_at: Any,
        is_used: bool = False,
        created_at: Any = None,
    ):
        self.id = id
        self.user_id = user_id
        self.otp_hash = otp_hash
        self.expires_at = expires_at
        self.is_used = bool(is_used)
        self.created_at = created_at

    def is_expired(self) -> bool:
        """Checks if current UTC/local time has surpassed the expires_at timestamp."""
        if not self.expires_at:
            return True
        now = datetime.now()
        # Handle string or datetime
        exp = self.expires_at if isinstance(self.expires_at, datetime) else datetime.fromisoformat(str(self.expires_at))
        return now > exp

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "expires_at": str(self.expires_at),
            "is_used": self.is_used,
            "created_at": str(self.created_at) if self.created_at else None,
        }

    @classmethod
    def create(cls, user_id: int, otp_hash: str, ttl_minutes: Optional[int] = None) -> "PasswordResetOTP":
        """
        Stores a new OTP hash in MySQL with an expiration timestamp.
        """
        ttl = ttl_minutes or settings.OTP_EXPIRE_MINUTES
        expires_at = datetime.now() + timedelta(minutes=ttl)

        with get_db_cursor() as cursor:
            # Invalidate any older unused OTPs for this user
            cursor.execute(
                "UPDATE password_reset_otps SET is_used = 1 WHERE user_id = %s AND is_used = 0",
                (user_id,)
            )
            cursor.execute(
                """
                INSERT INTO password_reset_otps (user_id, otp_hash, expires_at, is_used)
                VALUES (%s, %s, %s, 0)
                """,
                (user_id, otp_hash, expires_at)
            )
            otp_id = cursor.lastrowid

        return cls.get_by_id(otp_id)

    @classmethod
    def get_by_id(cls, otp_id: int) -> Optional["PasswordResetOTP"]:
        with get_db_cursor(commit_on_success=False) as cursor:
            cursor.execute(
                "SELECT id, user_id, otp_hash, expires_at, is_used, created_at FROM password_reset_otps WHERE id = %s",
                (otp_id,)
            )
            row = cursor.fetchone()
            if row:
                return cls(**row)
        return None

    @classmethod
    def get_latest_valid_by_user(cls, user_id: int) -> Optional["PasswordResetOTP"]:
        """
        Returns the latest unused OTP record for a user that has not expired.
        """
        with get_db_cursor(commit_on_success=False) as cursor:
            cursor.execute(
                """
                SELECT id, user_id, otp_hash, expires_at, is_used, created_at
                FROM password_reset_otps
                WHERE user_id = %s AND is_used = 0 AND expires_at > NOW()
                ORDER BY id DESC LIMIT 1
                """,
                (user_id,)
            )
            row = cursor.fetchone()
            if row:
                return cls(**row)
        return None

    @classmethod
    def mark_used(cls, otp_id: int) -> bool:
        """Marks the specified OTP as used so it cannot be reused."""
        with get_db_cursor() as cursor:
            cursor.execute(
                "UPDATE password_reset_otps SET is_used = 1 WHERE id = %s",
                (otp_id,)
            )
        return True
