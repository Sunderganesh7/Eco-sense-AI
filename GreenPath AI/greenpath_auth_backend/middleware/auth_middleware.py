"""
GreenPath AI — JWT Authentication Middleware
Provides `@jwt_required` decorator to protect routes and inject authenticated `User` into Flask `g.current_user`.
"""

from functools import wraps
from typing import Optional
from flask import request, g, jsonify
from authentication.jwt_handler import decode_access_token
from models.user import User


def get_current_user() -> Optional[User]:
    """Returns the currently authenticated User instance from Flask global context `g`."""
    return getattr(g, "current_user", None)


def jwt_required(optional: bool = False):
    """
    Decorator that enforces JWT Bearer token authentication on Flask endpoints.
    Checks signature, expiration, and MySQL token revocation list.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            auth_header = request.headers.get("Authorization", "")
            token = None
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1].strip()
            elif auth_header.startswith("bearer "):
                token = auth_header.split(" ")[1].strip()

            if not token:
                if optional:
                    g.current_user = None
                    return f(*args, **kwargs)
                return jsonify({
                    "success": False,
                    "message": "Authentication required. Please provide a valid Bearer token."
                }), 401

            payload = decode_access_token(token, check_revocation=True)
            if not payload:
                if optional:
                    g.current_user = None
                    return f(*args, **kwargs)
                return jsonify({
                    "success": False,
                    "message": "Invalid, expired, or revoked token. Please log in again."
                }), 401

            user_id = int(payload.get("sub", 0))
            user = User.get_by_id(user_id)
            if not user or not user.is_active:
                if optional:
                    g.current_user = None
                    return f(*args, **kwargs)
                return jsonify({
                    "success": False,
                    "message": "User account not found or has been deactivated."
                }), 401

            # Inject into request context
            g.current_user = user
            g.jwt_payload = payload
            g.jwt_id = payload.get("jti")

            return f(*args, **kwargs)
        return decorated_function
    return decorator
