"""
Database Module — MySQL connection & session management using SQLAlchemy & PyMySQL.
Configured via environment variables: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Automatically load environment variables from project root .env
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

import pymysql
from contextlib import contextmanager
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, scoped_session

# Load configuration from environment
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = int(os.environ.get("DB_PORT", "3306"))
DB_NAME = os.environ.get("DB_NAME", "fasalai")
DB_USER = os.environ.get("DB_USER", "root")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "")

# Fallback: support full DATABASE_URL if provided
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
)

Base = declarative_base()

_engine = None
_SessionFactory = None


def ensure_database_exists():
    """Ensure that the target MySQL database exists on the server before connecting."""
    try:
        conn = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            charset="utf8mb4",
        )
        with conn.cursor() as cursor:
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
            )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"  [WARN] Could not automatically create database `{DB_NAME}`: {e}")


def get_engine():
    """Return singleton SQLAlchemy engine with pre-ping and connection pooling."""
    global _engine
    if _engine is None:
        ensure_database_exists()
        try:
            _engine = create_engine(
                DATABASE_URL,
                pool_pre_ping=True,
                pool_recycle=3600,
                pool_size=10,
                max_overflow=20,
                echo=False,
            )
        except Exception as e:
            print(f"  [ERROR] Failed to initialize SQLAlchemy engine: {e}")
            raise
    return _engine


def get_session_factory():
    """Return thread-safe sessionmaker factory."""
    global _SessionFactory
    if _SessionFactory is None:
        engine = get_engine()
        _SessionFactory = scoped_session(
            sessionmaker(autocommit=False, autoflush=False, bind=engine)
        )
    return _SessionFactory


def get_db():
    """FastAPI dependency for yielding database session with automatic transaction cleanup."""
    SessionFactory = get_session_factory()
    db = SessionFactory()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@contextmanager
def get_db_context():
    """Context manager for standalone functions and background tasks."""
    SessionFactory = get_session_factory()
    db = SessionFactory()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


get_db_session = get_db_context


def check_connection() -> bool:
    """Verify MySQL connectivity by executing a lightweight query."""
    try:
        engine = get_engine()
        with engine.connect() as conn:
            conn.execute(text("SELECT 1;"))
        return True
    except Exception as e:
        print(f"  [ERROR] MySQL connection check failed: {e}")
        return False


def init_db():
    """Initialize database tables and constraints. Never drops existing tables or data."""
    try:
        ensure_database_exists()
        engine = get_engine()
        import models  # Ensure all SQLAlchemy models are imported and registered
        Base.metadata.create_all(bind=engine)
        print(f"  [OK] MySQL database `{DB_NAME}` connected & schema verified")
        return True
    except Exception as e:
        print(f"  [ERROR] Database initialization failed: {e}")
        print(f"  Please ensure MySQL is running on {DB_HOST}:{DB_PORT} and user `{DB_USER}` has access.")
        return False
