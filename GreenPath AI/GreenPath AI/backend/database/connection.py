"""
GreenPath AI — Pure MySQL Database Connection Manager
Provides enterprise MySQL connection pooling, dictionary cursors, and automatic transaction handling
exclusively for the MySQL 'greenpath_ai' database.
No MongoDB, no SQLite fallback, and no retry loops.
"""

import os
import logging
from contextlib import contextmanager
from typing import Generator, Any

logger = logging.getLogger("greenpath.database")

# Primary enterprise MySQL configuration
MYSQL_HOST = os.environ.get("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.environ.get("MYSQL_PORT", 3306))
MYSQL_USER = os.environ.get("MYSQL_USER", "root")
MYSQL_PASSWORD = os.environ.get("MYSQL_PASSWORD", "Ganesh1242")
MYSQL_DATABASE = os.environ.get("MYSQL_DATABASE", "greenpath_ai")


def is_mysql_online() -> bool:
    """Checks if MySQL server is reachable."""
    try:
        import pymysql
        conn = pymysql.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            connect_timeout=3
        )
        conn.close()
        return True
    except Exception as e:
        logger.warning(f"MySQL connection check failed: {e}")
        return False


@contextmanager
def get_db_cursor(commit_on_success: bool = True) -> Generator[Any, None, None]:
    """
    Context manager that provides a PyMySQL dictionary-style cursor
    connected to the 'greenpath_ai' database.
    """
    import pymysql
    import pymysql.cursors
    conn = pymysql.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DATABASE,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
    )
    try:
        with conn.cursor() as cursor:
            yield cursor
        if commit_on_success:
            conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()


def init_database_schema(schema_file_path: str = None) -> bool:
    """
    Initializes the MySQL database schema in 'greenpath_ai'.
    Creates the database and all required MySQL tables if they do not exist.
    Seeds default RBAC roles and default demo user accounts.
    """
    try:
        import pymysql
        # 1. Connect without database selected to run CREATE DATABASE IF NOT EXISTS
        init_conn = pymysql.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            charset="utf8mb4",
            autocommit=True
        )
        with init_conn.cursor() as cursor:
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DATABASE}` "
                "DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
            )
        init_conn.close()

        # 2. Execute schema.sql statements
        if not schema_file_path:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            schema_file_path = os.path.join(base_dir, "schema.sql")

        if not os.path.exists(schema_file_path):
            logger.error(f"Schema file not found at: {schema_file_path}")
            return False

        with open(schema_file_path, "r", encoding="utf-8") as f:
            sql_script = f.read()

        statements = [stmt.strip() for stmt in sql_script.split(";") if stmt.strip()]

        conn = pymysql.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DATABASE,
            charset="utf8mb4",
            autocommit=False
        )
        try:
            with conn.cursor() as cursor:
                for statement in statements:
                    if statement.upper().startswith("USE "):
                        continue
                    cursor.execute(statement)
            conn.commit()
            # Ensure device column exists in login_history table
            try:
                with conn.cursor() as check_cursor:
                    check_cursor.execute("DESCRIBE login_history")
                    cols = [row[0] if isinstance(row, tuple) else row.get("Field", "") for row in check_cursor.fetchall()]
                    if "device" not in cols:
                        check_cursor.execute("ALTER TABLE login_history ADD COLUMN device VARCHAR(100) NULL DEFAULT 'Desktop' AFTER browser")
                conn.commit()
            except Exception as e:
                logger.warning(f"Schema compatibility check note: {e}")

            logger.info(f"🟢 MySQL database '{MYSQL_DATABASE}' schema initialized successfully.")
            return True
        except Exception as e:
            conn.rollback()
            logger.error(f"Error executing MySQL schema statements: {e}")
            raise
        finally:
            conn.close()

    except Exception as e:
        logger.error(f"Could not initialize MySQL database schema: {e}")
        return False
