"""
GreenPath AI — Application Settings (Pydantic BaseSettings)
Loads all configuration from environment variables / .env file.
"""

from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Application ---
    APP_NAME: str = "GreenPath AI"
    APP_ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "changeme-in-production-at-least-32-characters"
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173,http://localhost:8000,https://eco-sense-ai-greenpathauthfrontend.vercel.app,https://eco-sense-ai-beta.vercel.app,https://eco-sense-ai-w7d6.vercel.app"

    # --- JWT ---
    JWT_SECRET_KEY: str = "changeme-jwt-secret-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # --- MySQL Database ---
    MYSQL_HOST: str = "localhost"
    MYSQL_PORT: int = 3306
    MYSQL_USER: str = "root"
    MYSQL_PASSWORD: str = "Ganesh1242"
    MYSQL_DATABASE: str = "greenpath_ai"
    MYSQL_POOL_SIZE: int = 10

    # --- Gemini AI ---
    GEMINI_API_KEY: str = ""

    # --- File Storage ---
    UPLOAD_FOLDER: str = "uploads"
    OUTPUT_FOLDER: str = "outputs"
    MAX_FILE_SIZE_MB: int = 20

    # --- YOLO ---
    YOLO_MODEL_PATH: str = "models/best.pt"
    YOLO_CONFIDENCE: float = 0.25

    # --- Admin Bootstrap ---
    ADMIN_EMAIL: str = "admin@greenpath.ai"
    ADMIN_PASSWORD: str = "Admin@GreenPath2024"
    ADMIN_NAME: str = "System Admin"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    @property
    def max_file_size_bytes(self) -> int:
        return self.MAX_FILE_SIZE_MB * 1024 * 1024


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
