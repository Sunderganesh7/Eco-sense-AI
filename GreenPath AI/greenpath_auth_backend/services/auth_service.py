"""
GreenPath AI — Authentication Service (Business Logic Layer)
Handles User Registration, Login, Logout, Remember Me, and JWT Session generation.
Integrates with MySQL Activity Logs and Login History.
"""

from typing import Dict, Any, Tuple, Optional
from datetime import timedelta
from models.user import User, UserProfile
from models.session_log import SessionToken, LoginHistory
from models.activity import ActivityLog
from models.role import RBACRole
from authentication.password_handler import hash_password, verify_password
from authentication.jwt_handler import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    revoke_token,
)
from utils.validators import validate_email, validate_password_strength, sanitize_input


class AuthService:
    """
    Service class executing enterprise registration, login, logout, and token refresh workflows.
    """

    @staticmethod
    def register_user(data: Dict[str, Any], telemetry: Dict[str, Any]) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Validates input, checks duplicate email, hashes password, creates MySQL User/Profile/Role,
        and logs activity.
        """
        email = sanitize_input(data.get("email", "")).lower().strip()
        password = data.get("password", "")
        confirm_password = data.get("confirm_password", "")
        full_name = sanitize_input(data.get("full_name") or data.get("name", ""))
        phone_number = sanitize_input(data.get("phone_number", ""))
        designation = sanitize_input(data.get("designation", ""))
        organization = sanitize_input(data.get("organization", ""))
        role_name = sanitize_input(data.get("role", RBACRole.RESEARCHER.value))

        # 1. Validation
        if not full_name:
            return False, "Full Name is required.", None

        is_valid_email, email_err = validate_email(email)
        if not is_valid_email:
            return False, email_err, None

        if password != confirm_password:
            return False, "Passwords do not match.", None

        is_valid_pw, pw_err = validate_password_strength(password)
        if not is_valid_pw:
            return False, pw_err, None

        # 2. Duplicate Email Check
        existing_user = User.get_by_email(email)
        if existing_user:
            return False, "An account with this email address already exists.", None

        # 3. Hash password
        pw_hash = hash_password(password)

        # 4. Create in MySQL
        try:
            new_user = User.create(
                email=email,
                password_hash=pw_hash,
                full_name=full_name,
                phone_number=phone_number,
                designation=designation,
                organization=organization,
                role_name=role_name,
            )

            # 5. Log activity
            ActivityLog.log(
                user_id=new_user.id,
                activity="User Registered",
                details=f"New user registration completed. Assigned Role: {role_name}",
                **telemetry
            )

            return True, "Registration successful!", new_user.to_dict()
        except Exception as e:
            return False, f"Registration failed due to database error: {str(e)}", None

    @staticmethod
    def login_user(
        email: str,
        password: str,
        remember_me: bool,
        telemetry: Dict[str, Any],
    ) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Authenticates user credentials, generates JWT access/refresh tokens,
        records Login History, and creates active MySQL session.
        """
        email = email.lower().strip() if email else ""

        if not email or not password:
            return False, "Email and password are required.", None

        user = User.get_by_email(email)
        if not user:
            # Audit failed login attempt for unknown email
            LoginHistory.record_login(
                user_id=None,
                ip_address=telemetry.get("ip_address", "127.0.0.1"),
                browser=telemetry.get("browser", "Unknown"),
                operating_system=telemetry.get("operating_system", "Unknown"),
                status="FAILED (User Not Found)",
            )
            return False, "Invalid email or password.", None

        if not user.is_active:
            return False, "Your account has been deactivated. Please contact support.", None

        if not verify_password(password, user.password_hash):
            # Record FAILED login attempt in login_history
            LoginHistory.record_login(
                user_id=user.id,
                ip_address=telemetry.get("ip_address", "127.0.0.1"),
                browser=telemetry.get("browser", "Unknown"),
                operating_system=telemetry.get("operating_system", "Unknown"),
                status="FAILED (Bad Password)",
            )
            ActivityLog.log(
                user_id=user.id,
                activity="Failed Login Attempt",
                details="Login attempt failed due to incorrect password.",
                **telemetry
            )
            return False, "Invalid email or password.", None

        # Custom TTL for Remember Me option (30 days instead of 7 days)
        refresh_ttl_days = 30 if remember_me else 7
        access_token, jti, exp_at = create_access_token(
            user_id=user.id,
            email=user.email,
            roles=user.roles,
        )
        refresh_token, ref_exp = create_refresh_token(
            user_id=user.id,
            jti=jti,
            expires_in_days=refresh_ttl_days,
        )

        # Store session in MySQL
        SessionToken.create(
            user_id=user.id,
            jwt_id=jti,
            refresh_token_hash=hash_password(refresh_token[:20]),  # store prefix hash
            expires_at=ref_exp,
        )

        # Update last login timestamp
        if user.profile:
            UserProfile.update_last_login(user.id)

        # Record SUCCESS in login_history
        LoginHistory.record_login(
            user_id=user.id,
            ip_address=telemetry.get("ip_address", "127.0.0.1"),
            browser=telemetry.get("browser", "Unknown"),
            operating_system=telemetry.get("operating_system", "Unknown"),
            status="SUCCESS",
        )

        # Record in activity_logs
        ActivityLog.log(
            user_id=user.id,
            activity="User Logged In",
            details=f"Successful login. Remember me: {remember_me}. Role(s): {', '.join(user.roles)}",
            **telemetry
        )

        return True, "Login successful!", {
            "user": user.to_dict(include_profile=True),
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": int((exp_at - datetime.now()).total_seconds()),
            "token_type": "Bearer",
        }

    @staticmethod
    def logout_user(user: User, jti: str, telemetry: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Revokes active session JWT in MySQL sessions table and sets logout_time in login_history.
        """
        if jti:
            revoke_token(jti)

        LoginHistory.record_logout(user.id)

        ActivityLog.log(
            user_id=user.id,
            activity="User Logged Out",
            details="User explicitly terminated their session.",
            **telemetry
        )
        return True, "Successfully logged out."

    @staticmethod
    def refresh_user_token(refresh_token: str, telemetry: Dict[str, Any]) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Validates refresh token and generates a new access token while maintaining session JTI.
        """
        if not refresh_token:
            return False, "Refresh token is required.", None

        payload = decode_refresh_token(refresh_token)
        if not payload:
            return False, "Invalid, expired, or revoked refresh token. Please log in again.", None

        user_id = int(payload.get("sub", 0))
        jti = payload.get("jti", "")
        user = User.get_by_id(user_id)
        if not user or not user.is_active:
            return False, "User account not found or inactive.", None

        # Generate a fresh access token with same JTI
        access_token, _, exp_at = create_access_token(
            user_id=user.id,
            email=user.email,
            roles=user.roles,
        )

        return True, "Token refreshed successfully.", {
            "access_token": access_token,
            "expires_in": int((exp_at - datetime.now()).total_seconds()),
            "token_type": "Bearer",
        }
