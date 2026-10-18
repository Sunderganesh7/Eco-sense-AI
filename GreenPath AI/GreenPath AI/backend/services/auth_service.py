"""
GreenPath AI — Authentication Service
JWT token creation, verification, password hashing, and user management.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from backend.config import settings
from backend.database.schemas import UserDocument, UserRole

logger = logging.getLogger(__name__)

# ----------------------------------------------------------------
# Password hashing context (bcrypt)
# ----------------------------------------------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ================================================================
# PASSWORD UTILITIES
# ================================================================

def hash_password(plain_password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against a bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


# ================================================================
# JWT TOKEN UTILITIES
# ================================================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Create a signed JWT refresh token (longer expiry)."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT token. Returns payload or None."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError as e:
        logger.warning(f"JWT decode error: {e}")
        return None


# ================================================================
# USER CRUD HELPERS
# ================================================================

async def get_user_by_email(email: str) -> Optional[UserDocument]:
    """Fetch a user document by email address."""
    return await UserDocument.find_one(UserDocument.email == email)


async def get_user_by_id(user_id: str) -> Optional[UserDocument]:
    """Fetch a user document by MongoDB ObjectId string."""
    try:
        from beanie import PydanticObjectId
        return await UserDocument.get(PydanticObjectId(user_id))
    except Exception:
        return None


async def create_user(
    name: str,
    email: str,
    password: str,
    role: UserRole = UserRole.USER,
) -> UserDocument:
    """Create and persist a new user document."""
    existing = await get_user_by_email(email)
    if existing:
        raise ValueError(f"User with email '{email}' already exists.")

    user = UserDocument(
        name=name,
        email=email,
        hashed_password=hash_password(password),
        role=role,
    )
    await user.insert()
    logger.info(f"✅ Created user: {email} (role={role})")
    return user


async def authenticate_user(email: str, password: str) -> Optional[UserDocument]:
    """
    Authenticate a user by email + password.
    Returns the user document on success, None on failure.
    """
    user = await get_user_by_email(email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    if not user.is_active:
        return None

    # Update last login timestamp
    user.last_login = datetime.utcnow()
    await user.save()
    return user


async def bootstrap_admin() -> None:
    """
    Create the default admin user on startup if it doesn't exist.
    Uses credentials from .env / settings.
    """
    existing = await get_user_by_email(settings.ADMIN_EMAIL)
    if not existing:
        await create_user(
            name=settings.ADMIN_NAME,
            email=settings.ADMIN_EMAIL,
            password=settings.ADMIN_PASSWORD,
            role=UserRole.ADMIN,
        )
        logger.info(f"🔑 Admin user bootstrapped: {settings.ADMIN_EMAIL}")
    else:
        logger.info("👤 Admin user already exists — skipping bootstrap.")
