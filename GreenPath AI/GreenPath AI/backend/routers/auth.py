"""
GreenPath AI — Authentication Router
Endpoints: register, login, refresh, me, logout, admin user list.
"""

import logging
from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from backend.config import settings
from backend.database.schemas import (
    UserRegisterRequest, UserLoginRequest, TokenResponse,
    UserResponse, APIResponse, UserRole,
)
from backend.services.auth_service import (
    authenticate_user, create_user, create_access_token,
    create_refresh_token, decode_token, get_user_by_id,
    get_user_by_email,
)
from backend.database.schemas import UserDocument

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)


# ── Dependency: get current user from Bearer token ─────────────────────────
async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> UserDocument:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please login.",
        )
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        )
    user = await get_user_by_id(payload.get("sub"))
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or deactivated.",
        )
    return user


async def get_current_admin(
    current_user: UserDocument = Depends(get_current_user),
) -> UserDocument:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required.",
        )
    return current_user


# ================================================================
# POST /auth/register
# ================================================================
@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: UserRegisterRequest):
    """Register a new user and return JWT tokens."""
    try:
        user = await create_user(
            name=body.name,
            email=body.email,
            password=body.password,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    user_id = str(user.id)
    access_token = create_access_token({"sub": user_id})
    refresh_token = create_refresh_token({"sub": user_id})

    logger.info(f"New user registered: {body.email}")
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user={
            "id": user_id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
        },
    )


# ================================================================
# POST /auth/login
# ================================================================
@router.post("/login", response_model=TokenResponse)
async def login(body: UserLoginRequest):
    """Authenticate user and return JWT tokens."""
    user = await authenticate_user(body.email, body.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    user_id = str(user.id)
    access_token = create_access_token({"sub": user_id})
    refresh_token = create_refresh_token({"sub": user_id})

    logger.info(f"User logged in: {body.email}")
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user={
            "id": user_id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
        },
    )


# ================================================================
# POST /auth/refresh
# ================================================================
@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Generate a new access token using a valid refresh token."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Refresh token required.")

    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token.")

    user = await get_user_by_id(payload.get("sub"))
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found.")

    user_id = str(user.id)
    new_access = create_access_token({"sub": user_id})
    new_refresh = create_refresh_token({"sub": user_id})

    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user={
            "id": user_id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
        },
    )


# ================================================================
# GET /auth/me
# ================================================================
@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserDocument = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return UserResponse(
        id=str(current_user.id),
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        total_analyses=current_user.total_analyses,
        total_reports=current_user.total_reports,
    )


# ================================================================
# GET /auth/users  (Admin only)
# ================================================================
@router.get("/users")
async def list_users(admin: UserDocument = Depends(get_current_admin)):
    """List all registered users (admin only)."""
    users = await UserDocument.find_all().to_list()
    return [
        {
            "id": str(u.id),
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "total_analyses": u.total_analyses,
            "total_reports": u.total_reports,
            "created_at": u.created_at,
            "last_login": u.last_login,
        }
        for u in users
    ]


# ================================================================
# DELETE /auth/users/{user_id}  (Admin only)
# ================================================================
@router.delete("/users/{user_id}", response_model=APIResponse)
async def deactivate_user(
    user_id: str,
    admin: UserDocument = Depends(get_current_admin),
):
    """Deactivate a user account (soft delete)."""
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.role == UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="Cannot deactivate admin accounts.")

    user.is_active = False
    await user.save()
    return APIResponse(success=True, message=f"User {user.email} deactivated.")
