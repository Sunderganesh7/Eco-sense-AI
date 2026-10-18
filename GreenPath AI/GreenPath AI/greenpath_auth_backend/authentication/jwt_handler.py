"""
GreenPath AI — JWT Authentication Engine
Handles Access and Refresh Token generation, verification, and revocation checks
against the MySQL sessions registry.
"""

import uuid
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List, Tuple
import jwt
from config.settings import settings

logger = logging.getLogger("greenpath.auth.jwt")


def create_access_token(
    user_id: int,
    email: str,
    roles: List[str],
    expires_in_minutes: Optional[int] = None,
) -> Tuple[str, str, datetime]:
    """
    Generates a secure JWT Access Token with a unique JTI (UUID v4).
    Returns tuple: (token_str, jti_str, expires_at_datetime).
    """
    jti = str(uuid.uuid4())
    ttl = expires_in_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=ttl)

    payload = {
        "sub": str(user_id),
        "email": email,
        "roles": roles,
        "jti": jti,
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }

    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    # Convert UTC to local naive datetime for MySQL TIMESTAMP compatibility
    return token, jti, expires_at.replace(tzinfo=None)


def create_refresh_token(
    user_id: int,
    jti: str,
    expires_in_days: Optional[int] = None,
) -> Tuple[str, datetime]:
    """
    Generates a JWT Refresh Token tied to the access token's JTI.
    Returns tuple: (refresh_token_str, expires_at_datetime).
    """
    ttl = expires_in_days or settings.REFRESH_TOKEN_EXPIRE_DAYS
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=ttl)

    payload = {
        "sub": str(user_id),
        "jti": jti,
        "type": "refresh",
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }

    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token, expires_at.replace(tzinfo=None)


def decode_access_token(token: str, check_revocation: bool = True) -> Optional[Dict[str, Any]]:
    """
    Decodes and validates a JWT Access Token.
    Checks signature, expiration, token type, and MySQL session revocation status.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        if payload.get("type") != "access":
            logger.warning("Token verification failed: Invalid token type (not access token).")
            return None

        # Check session revocation in MySQL
        if check_revocation:
            from models.session_log import SessionToken
            jti = payload.get("jti")
            if not jti or SessionToken.is_revoked_jti(jti):
                logger.warning(f"Token verification failed: JTI {jti} has been revoked or logged out.")
                return None

        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token verification failed: Token has expired.")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Token verification failed: {str(e)}")
        return None


def decode_refresh_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodes and validates a JWT Refresh Token.
    Checks signature, expiration, and MySQL session revocation status.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        if payload.get("type") != "refresh":
            logger.warning("Token verification failed: Invalid token type (not refresh token).")
            return None

        from models.session_log import SessionToken
        jti = payload.get("jti")
        if not jti or SessionToken.is_revoked_jti(jti):
            logger.warning(f"Refresh token verification failed: JTI {jti} is revoked.")
            return None

        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def revoke_token(jti: str) -> bool:
    """
    Revokes a token session by its JTI in MySQL.
    """
    from models.session_log import SessionToken
    return SessionToken.revoke_by_jti(jti)
