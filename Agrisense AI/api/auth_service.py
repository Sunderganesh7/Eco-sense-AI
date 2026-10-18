"""
Auth Service — MySQL & SQLAlchemy-based user registration, login, and JWT management.
"""

import os
import bcrypt
import jwt
from datetime import datetime, timedelta

from database import get_db_context, init_db as init_database, check_connection
from models import User, Profile

# ── Configuration ─────────────────────────────────────
JWT_SECRET = os.environ.get("JWT_SECRET", "smartcrop-fasalai-secret-key-2026-sih25010")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = 30


def init_db():
    """Verify MySQL database connection and schema at startup."""
    return init_database()


def _generate_token(user_id: int, phone: str, name: str) -> str:
    """Generate a JWT token for a user."""
    payload = {
        "user_id": user_id,
        "phone": phone,
        "name": name,
        "exp": datetime.utcnow() + timedelta(days=JWT_EXPIRY_DAYS),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def register_user(phone: str = "", password: str = "", name: str = "", email: str = "") -> dict:
    """
    Register a new user in MySQL. Returns {"token": ..., "access_token": ..., "user": {...}}.
    Raises ValueError if phone/email already registered or inputs are invalid.
    """
    phone = (phone or "").strip()
    email = (email or "").strip().lower()
    name = (name or "").strip()
    if not phone and not email:
        raise ValueError("Phone number or email is required")
    if not password:
        raise ValueError("Password is required")

    # If phone is not provided, use email as the phone identifier to satisfy not-null constraint
    if not phone:
        phone = email

    with get_db_context() as db:
        # Check if user with phone or email already exists
        existing = db.query(User).filter(
            (User.phone == phone) | (User.email == email if email else False)
        ).first()
        if existing:
            raise ValueError("A user with this phone number or email already exists")

        # Hash password using bcrypt
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

        # Create new User
        new_user = User(
            phone=phone,
            email=email if email else None,
            password=hashed,
            name=name,
            auth_provider="local",
        )
        db.add(new_user)
        db.flush()  # Populates new_user.id

        # Create initial Profile
        new_profile = Profile(
            user_id=new_user.id,
            name=name,
            email=email if email else "",
            language="en",
            role="farmer",
            crops_grown=[],
            notifications={"weather": True, "pests": True},
        )
        db.add(new_profile)
        db.flush()

        user_id = new_user.id
        token = _generate_token(user_id, phone, name)
        return {
            "token": token,
            "access_token": token,
            "user": {"id": user_id, "phone": phone, "email": email, "name": name},
        }


def login_user(phone: str, password: str) -> dict:
    """
    Login a user from MySQL by phone or email. Returns {"token": ..., "access_token": ..., "user": {...}}.
    Raises ValueError if credentials are invalid.
    """
    ident = (phone or "").strip()
    if not ident or not password:
        raise ValueError("Email and password are required")

    with get_db_context() as db:
        user = db.query(User).filter(
            (User.phone == ident) | (User.email == ident.lower())
        ).first()
        if not user:
            raise ValueError("Invalid email address or password")

        if not bcrypt.checkpw(password.encode("utf-8"), user.password.encode("utf-8")):
            raise ValueError("Invalid email address or password")

        token = _generate_token(user.id, user.phone, user.name)
        return {
            "token": token,
            "access_token": token,
            "user": {"id": user.id, "phone": user.phone, "name": user.name, "email": user.email},
        }


def get_current_user(token: str) -> dict:
    """
    Decode a JWT token and return the user payload.
    Raises ValueError if token is invalid or expired.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return {
            "user_id": payload["user_id"],
            "phone": payload["phone"],
            "name": payload.get("name", ""),
        }
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired. Please login again.")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token. Please login again.")


def google_login(access_token: str) -> dict:
    """
    Authenticate a user via Google OAuth token.
    If Supabase is configured, verifies with Supabase and syncs user to MySQL.
    Otherwise reports clear configuration requirement.
    """
    try:
        from db import get_supabase
        sb = get_supabase()
        if not sb:
            raise ValueError("Google OAuth requires SUPABASE_URL and SUPABASE_KEY to be configured.")

        user_response = sb.auth.get_user(access_token)
        if not user_response or not user_response.user:
            raise ValueError("Invalid Google authentication token")

        supabase_user = user_response.user
        email = supabase_user.email
        name = ""

        if supabase_user.user_metadata:
            name = (
                supabase_user.user_metadata.get("full_name", "") or
                supabase_user.user_metadata.get("name", "")
            )

        if not email:
            raise ValueError("Could not get email from Google account")

        with get_db_context() as db:
            user = db.query(User).filter(User.email == email).first()
            if user:
                if not user.name and name:
                    user.name = name
                    db.flush()
                token = _generate_token(user.id, user.phone, user.name)
                return {
                    "token": token,
                    "user": {"id": user.id, "phone": user.phone, "name": user.name, "email": email},
                }
            else:
                import secrets
                random_pw = secrets.token_urlsafe(32)
                hashed = bcrypt.hashpw(random_pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

                new_user = User(
                    phone=email,
                    email=email,
                    password=hashed,
                    name=name,
                    auth_provider="google",
                )
                db.add(new_user)
                db.flush()

                new_profile = Profile(
                    user_id=new_user.id,
                    name=name,
                    email=email,
                    language="en",
                    role="farmer",
                )
                db.add(new_profile)
                db.flush()

                token = _generate_token(new_user.id, email, name)
                return {
                    "token": token,
                    "user": {"id": new_user.id, "phone": email, "name": name, "email": email},
                }
    except Exception as e:
        raise ValueError(f"Google login failed: {str(e)}")
