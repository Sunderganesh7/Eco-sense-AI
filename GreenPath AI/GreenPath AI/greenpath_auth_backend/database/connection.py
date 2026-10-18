"""
GreenPath AI — MySQL Database Connection Manager & Pooler
Provides clean connection context managers with automatic transaction handling
and dictionary cursors for easy MVC model integration.
"""

import os
import logging
from contextlib import contextmanager
from typing import Generator, Any
import pymysql
import pymysql.cursors
from config.settings import settings

# Configure module logger
logger = logging.getLogger("greenpath.database")


def get_raw_connection(database: str = None) -> pymysql.connections.Connection:
    """
    Creates and returns a raw PyMySQL connection to the configured MySQL server.
    """
    return pymysql.connect(
        host=settings.MYSQL_HOST,
        port=settings.MYSQL_PORT,
        user=settings.MYSQL_USER,
        password=settings.MYSQL_PASSWORD,
        database=database or settings.MYSQL_DATABASE,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
    )


@contextmanager
def get_db_connection() -> Generator[pymysql.connections.Connection, None, None]:
    """
    Context manager for borrowing a MySQL database connection.
    Automatically closes connection upon exiting block.
    """
    conn = get_raw_connection()
    try:
        yield conn
    finally:
        conn.close()


@contextmanager
def get_db_cursor(commit_on_success: bool = True) -> Generator[pymysql.cursors.DictCursor, None, None]:
    """
    Context manager that provides a DictCursor.
    Automatically commits transaction if commit_on_success is True and no errors occur.
    Automatically rolls back transaction on exception.
    
    Usage:
        with get_db_cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
            user = cursor.fetchone()
    """
    conn = get_raw_connection()
    try:
        with conn.cursor() as cursor:
            yield cursor
        if commit_on_success:
            conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Database transaction error (rolled back): {e}")
        raise
    finally:
        conn.close()


def init_database_schema(schema_file_path: str = None) -> bool:
    """
    Executes DDL script to initialize normalized MySQL tables and sample data.
    If database does not exist, connects without DB first to create it.
    """
    if not schema_file_path:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        schema_file_path = os.path.join(base_dir, "schema.sql")

    if not os.path.exists(schema_file_path):
        logger.error(f"Schema file not found at: {schema_file_path}")
        return False

    try:
        # First connect without database selected to run CREATE DATABASE IF NOT EXISTS
        init_conn = pymysql.connect(
            host=settings.MYSQL_HOST,
            port=settings.MYSQL_PORT,
            user=settings.MYSQL_USER,
            password=settings.MYSQL_PASSWORD,
            charset="utf8mb4",
            autocommit=True
        )
        with init_conn.cursor() as cursor:
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{settings.MYSQL_DATABASE}` "
                "DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
            )
        init_conn.close()

        # Now connect to the database and run schema commands
        with open(schema_file_path, "r", encoding="utf-8") as f:
            sql_script = f.read()

        # Split script by semicolons while avoiding inline comment issues
        statements = [stmt.strip() for stmt in sql_script.split(";") if stmt.strip()]

        conn = get_raw_connection()
        try:
            with conn.cursor() as cursor:
                for statement in statements:
                    if statement.upper().startswith("USE "):
                        continue
                    cursor.execute(statement)
            conn.commit()
            logger.info("Database schema and initial RBAC records initialized successfully.")
            return True
        except Exception as e:
            conn.rollback()
            logger.error(f"Failed to execute schema statements: {e}")
            raise
        finally:
            conn.close()

    except Exception as e:
        logger.error(f"Could not initialize MySQL database schema: {e}")
        return False
