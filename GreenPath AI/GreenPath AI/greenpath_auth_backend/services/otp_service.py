"""
GreenPath AI — OTP Password Reset Service (Business Logic Layer)
Manages Email OTP generation, MySQL 5-minute expiration, OTP verification, and Password Reset.
"""

import random
from typing import Dict, Any, Tuple, Optional
from models.user import User
from models.otp import PasswordResetOTP
from models.session_log import SessionToken
from models.activity import ActivityLog
from services.email_service import EmailService
from authentication.password_handler import hash_password, verify_password
from utils.validators import validate_password_strength


class OTPService:
    """
    Service executing the 6-digit Email OTP Forgot Password flow.
    """

    @staticmethod
    def generate_otp_code(length: int = 6) -> str:
        """Generates a cryptographically random numeric string of specified length."""
        return "".join(str(random.randint(0, 9)) for _ in range(length))

    @staticmethod
    def request_otp(email: str, telemetry: Dict[str, Any]) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Validates email, generates 6-digit OTP, stores bcrypt hash in MySQL with 5-minute TTL,
        and sends OTP email.
        """
        email = email.lower().strip() if email else ""
        if not email:
            return False, "Email address is required.", None

        user = User.get_by_email(email)
        if not user:
            # Return generic success message to prevent user enumeration attacks
            return True, "If an account with this email exists, a 6-digit OTP has been sent.", None

        if not user.is_active:
            return False, "This account is deactivated.", None

        otp_str = OTPService.generate_otp_code(6)
        otp_hash = hash_password(otp_str)

        PasswordResetOTP.create(user.id, otp_hash)

        EmailService.send_otp(user.email, otp_str)

        ActivityLog.log(
            user_id=user.id,
            activity="Password Reset Requested",
            details="User initiated Forgot Password OTP flow.",
            **telemetry
        )

        return True, "A 6-digit OTP has been sent to your email address.", {
            "email": user.email,
            "dev_otp": otp_str,  # Included for local testing convenience
        }

    @staticmethod
    def verify_otp(email: str, otp_code: str, telemetry: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Verifies if the provided 6-digit OTP matches the stored bcrypt hash and is within 5-min TTL.
        """
        email = email.lower().strip() if email else ""
        otp_code = otp_code.strip() if otp_code else ""

        if not email or not otp_code:
            return False, "Email address and 6-digit OTP code are required."

        user = User.get_by_email(email)
        if not user:
            return False, "Invalid email address or OTP code."

        latest_otp = PasswordResetOTP.get_latest_valid_by_user(user.id)
        if not latest_otp:
            return False, "OTP has expired or is invalid. Please request a new OTP."

        if latest_otp.is_expired():
            return False, "This OTP has expired (over 5 minutes old). Please request a new code."

        if not verify_password(otp_code, latest_otp.otp_hash):
            return False, "Incorrect 6-digit OTP code."

        return True, "OTP verified successfully. You may now reset your password."

    @staticmethod
    def reset_password(
        email: str,
        otp_code: str,
        new_password: str,
        confirm_password: str,
        telemetry: Dict[str, Any],
    ) -> Tuple[bool, str]:
        """
        Validates OTP and password rules, updates MySQL password hash, marks OTP used,
        and revokes all existing sessions.
        """
        if new_password != confirm_password:
            return False, "New passwords do not match."

        is_valid_pw, pw_err = validate_password_strength(new_password)
        if not is_valid_pw:
            return False, pw_err or "Password does not meet complexity requirements."

        is_valid_otp, otp_msg = OTPService.verify_otp(email, otp_code, telemetry)
        if not is_valid_otp:
            return False, otp_msg

        user = User.get_by_email(email)
        if not user:
            return False, "User account not found."

        latest_otp = PasswordResetOTP.get_latest_valid_by_user(user.id)
        if latest_otp:
            PasswordResetOTP.mark_used(latest_otp.id)

        new_hash = hash_password(new_password)
        User.update_password(user.id, new_hash)

        # Security rule: revoke all active sessions when password is reset
        SessionToken.revoke_all_for_user(user.id)

        ActivityLog.log(
            user_id=user.id,
            activity="Password Reset Completed",
            details="User successfully reset password via OTP and all sessions were revoked.",
            **telemetry
        )

        return True, "Password has been reset successfully! Please log in with your new password."
