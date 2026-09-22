"""
GreenPath AI — Application Configuration Settings
Loads configuration from .env file or environment variables with defaults.
"""

import os
from typing import List
from dotenv import load_dotenv

# Load .env file from project root if it exists
load_dotenv()


class Config:
    """
    Centralized configuration management for GreenPath AI Authentication & Security Module.
    Follows 12-factor app principles by reading environment variables.
    """
    # --- Application ---
    APP_NAME: str = os.getenv("APP_NAME", "GreenPath AI")
    APP_ENV: str = os.getenv("APP_ENV", "development")
    APP_PORT: int = int(os.getenv("APP_PORT", 5000))
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "default-fallback-secret-key")
    ALLOWED_ORIGINS: str = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173"
    )

    # --- MySQL Database ---
    MYSQL_HOST: str = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT: int = int(os.getenv("MYSQL_PORT", 3306))
    MYSQL_USER: str = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "")
    MYSQL_DATABASE: str = os.getenv("MYSQL_DATABASE", "greenpath_ai")
    MYSQL_POOL_SIZE: int = int(os.getenv("MYSQL_POOL_SIZE", 10))

    # --- JWT Authentication ---
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "default-jwt-secret")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))

    # --- Password Reset OTP ---
    OTP_EXPIRE_MINUTES: int = int(os.getenv("OTP_EXPIRE_MINUTES", 5))
    OTP_LENGTH: int = int(os.getenv("OTP_LENGTH", 6))

    # --- CORS & Security ---
    MAX_CONTENT_LENGTH_BYTES: int = int(os.getenv("MAX_CONTENT_LENGTH_MB", 10)) * 1024 * 1024

    @classmethod
    def get_allowed_origins(cls) -> List[str]:
        """Returns list of allowed origins for CORS configuration."""
        return [origin.strip() for origin in cls.ALLOWED_ORIGINS.split(",") if origin.strip()]


# Global singleton configuration instance
settings = Config()
