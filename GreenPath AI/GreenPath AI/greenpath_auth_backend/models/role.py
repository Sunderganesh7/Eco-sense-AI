"""
GreenPath AI — RBAC Role Model
Defines standard role constants and MySQL lookup helpers for Admin, Researcher, and Officer.
"""

from enum import Enum
from typing import Optional, List, Dict, Any
from database.connection import get_db_cursor


class RBACRole(str, Enum):
    """Enumeration of system roles matching MySQL roles table."""
    ADMIN = "Admin"
    RESEARCHER = "Researcher"
    OFFICER = "Officer"


class Role:
    """
    MVC Model wrapper for the MySQL `roles` table.
    """
    def __init__(self, id: int, name: str, description: str, created_at: Any = None):
        self.id = id
        self.name = name
        self.description = description
        self.created_at = created_at

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "created_at": str(self.created_at) if self.created_at else None,
        }

    @classmethod
    def get_by_name(cls, name: str) -> Optional["Role"]:
        """Fetches a role by its unique name using parameterized query."""
        with get_db_cursor(commit_on_success=False) as cursor:
            cursor.execute(
                "SELECT id, name, description, created_at FROM roles WHERE name = %s",
                (name,)
            )
            row = cursor.fetchone()
            if row:
                return cls(**row)
        return None

    @classmethod
    def get_all(cls) -> List["Role"]:
        """Returns all available system roles."""
        with get_db_cursor(commit_on_success=False) as cursor:
            cursor.execute("SELECT id, name, description, created_at FROM roles ORDER BY id ASC")
            rows = cursor.fetchall()
            return [cls(**r) for r in rows]

    @classmethod
    def assign_to_user(cls, user_id: int, role_id: int) -> bool:
        """Assigns a role to a user in `user_roles` junction table."""
        with get_db_cursor() as cursor:
            cursor.execute(
                "INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (%s, %s)",
                (user_id, role_id)
            )
        return True

    @classmethod
    def get_user_roles(cls, user_id: int) -> List[str]:
        """Returns string names of all roles assigned to user_id."""
        with get_db_cursor(commit_on_success=False) as cursor:
            cursor.execute(
                """
                SELECT r.name FROM roles r
                JOIN user_roles ur ON r.id = ur.role_id
                WHERE ur.user_id = %s
                """,
                (user_id,)
            )
            rows = cursor.fetchall()
            return [r["name"] for r in rows]
