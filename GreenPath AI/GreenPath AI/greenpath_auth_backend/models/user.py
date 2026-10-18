"""
GreenPath AI — User & UserProfile MVC Models
Encapsulates all database queries for users and profiles with strict SQL injection protection.
"""

from typing import Optional, List, Dict, Any
from database.connection import get_db_cursor
from models.role import Role, RBACRole


class UserProfile:
    """
    MVC Model wrapper for the MySQL `user_profiles` table.
    """
    def __init__(
        self,
        user_id: int,
        full_name: str,
        phone_number: Optional[str] = None,
        designation: Optional[str] = None,
        organization: Optional[str] = None,
        profile_photo_url: Optional[str] = None,
        account_created_date: Any = None,
        last_login_at: Any = None,
    ):
        self.user_id = user_id
        self.full_name = full_name
        self.phone_number = phone_number
        self.designation = designation
        self.organization = organization
        self.profile_photo_url = profile_photo_url
        self.account_created_date = account_created_date
        self.last_login_at = last_login_at

    def to_dict(self) -> Dict[str, Any]:
        return {
            "user_id": self.user_id,
            "full_name": self.full_name,
            "phone_number": self.phone_number or "",
            "designation": self.designation or "",
            "organization": self.organization or "",
            "profile_photo_url": self.profile_photo_url or "",
            "account_created_date": str(self.account_created_date) if self.account_created_date else None,
            "last_login_at": str(self.last_login_at) if self.last_login_at else "Never",
        }

    @classmethod
    def get_by_user_id(cls, user_id: int) -> Optional["UserProfile"]:
        with get_db_cursor(commit_on_success=False) as cursor:
            cursor.execute(
                """
                SELECT user_id, full_name, phone_number, designation, organization,
                       profile_photo_url, account_created_date, last_login_at
                FROM user_profiles WHERE user_id = %s
                """,
                (user_id,)
            )
            row = cursor.fetchone()
            if row:
                return cls(**row)
        return None

    @classmethod
    def create(
        cls,
        user_id: int,
        full_name: str,
        phone_number: str = "",
        designation: str = "",
        organization: str = "",
        profile_photo_url: str = None,
    ) -> "UserProfile":
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO user_profiles
                (user_id, full_name, phone_number, designation, organization, profile_photo_url)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (user_id, full_name, phone_number, designation, organization, profile_photo_url)
            )
        return cls.get_by_user_id(user_id)

    @classmethod
    def update(
        cls,
        user_id: int,
        full_name: str,
        phone_number: str,
        designation: str,
        organization: str,
        profile_photo_url: Optional[str] = None,
    ) -> Optional["UserProfile"]:
        with get_db_cursor() as cursor:
            if profile_photo_url is not None:
                cursor.execute(
                    """
                    UPDATE user_profiles
                    SET full_name = %s, phone_number = %s, designation = %s,
                        organization = %s, profile_photo_url = %s
                    WHERE user_id = %s
                    """,
                    (full_name, phone_number, designation, organization, profile_photo_url, user_id)
                )
            else:
                cursor.execute(
                    """
                    UPDATE user_profiles
                    SET full_name = %s, phone_number = %s, designation = %s,
                        organization = %s
                    WHERE user_id = %s
                    """,
                    (full_name, phone_number, designation, organization, user_id)
                )
        return cls.get_by_user_id(user_id)

    @classmethod
    def update_last_login(cls, user_id: int) -> None:
        with get_db_cursor() as cursor:
            cursor.execute(
                "UPDATE user_profiles SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = %s",
                (user_id,)
            )


class User:
    """
    MVC Model wrapper for the MySQL `users` table with RBAC role integration.
    """
    def __init__(
        self,
        id: int,
        email: str,
        password_hash: str,
        is_active: bool = True,
        created_at: Any = None,
        updated_at: Any = None,
        roles: Optional[List[str]] = None,
        profile: Optional[UserProfile] = None,
    ):
        self.id = id
        self.email = email
        self.password_hash = password_hash
        self.is_active = bool(is_active)
        self.created_at = created_at
        self.updated_at = updated_at
        self._roles = roles or []
        self._profile = profile

    @property
    def roles(self) -> List[str]:
        if not self._roles and self.id:
            self._roles = Role.get_user_roles(self.id)
        return self._roles

    @property
    def profile(self) -> Optional[UserProfile]:
        if not self._profile and self.id:
            self._profile = UserProfile.get_by_user_id(self.id)
        return self._profile

    def has_role(self, role_name: str) -> bool:
        """Checks if user has the specified RBAC role (case insensitive)."""
        user_roles = [r.lower() for r in self.roles]
        return role_name.lower() in user_roles

    def is_admin(self) -> bool:
        return self.has_role(RBACRole.ADMIN.value)

    def is_researcher(self) -> bool:
        return self.has_role(RBACRole.RESEARCHER.value)

    def is_officer(self) -> bool:
        return self.has_role(RBACRole.OFFICER.value)

    def to_dict(self, include_profile: bool = True) -> Dict[str, Any]:
        data = {
            "id": self.id,
            "email": self.email,
            "is_active": self.is_active,
            "roles": self.roles,
            "created_at": str(self.created_at) if self.created_at else None,
        }
        if include_profile and self.profile:
            data["profile"] = self.profile.to_dict()
        return data

    @classmethod
    def get_by_id(cls, user_id: int) -> Optional["User"]:
        with get_db_cursor(commit_on_success=False) as cursor:
            cursor.execute(
                "SELECT id, email, password_hash, is_active, created_at, updated_at FROM users WHERE id = %s",
                (user_id,)
            )
            row = cursor.fetchone()
            if row:
                user = cls(**row)
                user._roles = Role.get_user_roles(user.id)
                user._profile = UserProfile.get_by_user_id(user.id)
                return user
        return None

    @classmethod
    def get_by_email(cls, email: str) -> Optional["User"]:
        with get_db_cursor(commit_on_success=False) as cursor:
            cursor.execute(
                "SELECT id, email, password_hash, is_active, created_at, updated_at FROM users WHERE email = %s",
                (email.lower().strip(),)
            )
            row = cursor.fetchone()
            if row:
                user = cls(**row)
                user._roles = Role.get_user_roles(user.id)
                user._profile = UserProfile.get_by_user_id(user.id)
                return user
        return None

    @classmethod
    def create(
        cls,
        email: str,
        password_hash: str,
        full_name: str,
        phone_number: str = "",
        designation: str = "",
        organization: str = "",
        role_name: str = RBACRole.RESEARCHER.value,
    ) -> "User":
        """
        Creates a new user, profile, and assigns the specified RBAC role in a single transaction.
        """
        with get_db_cursor() as cursor:
            cursor.execute(
                "INSERT INTO users (email, password_hash, is_active) VALUES (%s, %s, 1)",
                (email.lower().strip(), password_hash)
            )
            user_id = cursor.lastrowid

            # Insert profile
            cursor.execute(
                """
                INSERT INTO user_profiles
                (user_id, full_name, phone_number, designation, organization)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (user_id, full_name, phone_number, designation, organization)
            )

            # Look up role_id
            cursor.execute("SELECT id FROM roles WHERE name = %s", (role_name,))
            role_row = cursor.fetchone()
            if role_row:
                role_id = role_row["id"]
            else:
                role_id = 2  # Default to Researcher (2)

            cursor.execute(
                "INSERT INTO user_roles (user_id, role_id) VALUES (%s, %s)",
                (user_id, role_id)
            )

        return cls.get_by_id(user_id)

    @classmethod
    def update_password(cls, user_id: int, new_password_hash: str) -> bool:
        with get_db_cursor() as cursor:
            cursor.execute(
                "UPDATE users SET password_hash = %s WHERE id = %s",
                (new_password_hash, user_id)
            )
        return True

    @classmethod
    def set_active_status(cls, user_id: int, is_active: bool) -> bool:
        with get_db_cursor() as cursor:
            cursor.execute(
                "UPDATE users SET is_active = %s WHERE id = %s",
                (1 if is_active else 0, user_id)
            )
        return True

    @classmethod
    def get_all(cls) -> List["User"]:
        """Fetches all users with profiles and roles for Admin management."""
        with get_db_cursor(commit_on_success=False) as cursor:
            cursor.execute("SELECT id, email, password_hash, is_active, created_at, updated_at FROM users ORDER BY id ASC")
            rows = cursor.fetchall()
            users = []
            for row in rows:
                u = cls(**row)
                u._roles = Role.get_user_roles(u.id)
                u._profile = UserProfile.get_by_user_id(u.id)
                users.append(u)
            return users
