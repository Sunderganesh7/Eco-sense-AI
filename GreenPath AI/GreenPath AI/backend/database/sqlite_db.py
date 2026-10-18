"""
GreenPath AI — Compatibility Proxy Module
All database operations have been migrated to pure Enterprise MySQL ('greenpath_ai').
This module exports the MySQL implementations from backend.database.mysql_db
so existing imports continue to work without any MongoDB or SQLite code.
"""

from backend.database.mysql_db import (
    is_db_connected,
    get_db_connection,
    init_db,
    register_user,
    authenticate_user,
    log_analysis,
    get_user_analyses,
    log_report,
    get_user_reports,
    get_global_stats,
)

__all__ = [
    "is_db_connected",
    "get_db_connection",
    "init_db",
    "register_user",
    "authenticate_user",
    "log_analysis",
    "get_user_analyses",
    "log_report",
    "get_user_reports",
    "get_global_stats",
]
