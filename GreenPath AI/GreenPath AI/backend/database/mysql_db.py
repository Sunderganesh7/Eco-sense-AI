"""
GreenPath AI — Pure Enterprise MySQL Database Operations Module
All database operations connect exclusively to the MySQL database 'greenpath_ai'.
No MongoDB packages, no MongoClient usage, no MONGO_URI, no retry loops, and no SQLite fallback.
"""

import logging
from typing import Tuple, Dict, Any, List, Optional
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

from backend.database.connection import get_db_cursor, is_mysql_online, init_database_schema

logger = logging.getLogger("greenpath.database")


def is_db_connected() -> bool:
    """Returns True if the primary MySQL enterprise server is reachable."""
    return is_mysql_online()


def get_db_connection():
    """Compatibility helper returning a PyMySQL connection if needed."""
    import pymysql
    from backend.database.connection import (
        MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE
    )
    return pymysql.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DATABASE,
        charset="utf8mb4"
    )


def init_db() -> bool:
    """
    Initializes the enterprise MySQL schema for 'greenpath_ai'.
    Creates required MySQL tables if they do not exist.
    """
    return init_database_schema()


def register_user(
    name: str,
    email: str,
    password: str,
    role_name: str = "Researcher",
    phone_number: str = None,
    designation: str = None,
    organization: str = None
) -> Tuple[bool, str, Optional[int]]:
    """
    Registers a new user in the enterprise MySQL database with bcrypt hashed password and RBAC role.
    Prevents duplicate email registration and returns validation messages.
    """
    try:
        if not name or len(name.strip()) < 2:
            return False, "Full name must be at least 2 characters.", None
        if not email or "@" not in email or "." not in email or len(email.strip()) < 5:
            return False, "Please enter a valid academic email address.", None
        if not password or len(password) < 6:
            return False, "Password must be at least 6 characters long.", None

        email_clean = email.strip().lower()
        name_clean = name.strip()

        with get_db_cursor(commit_on_success=True) as cursor:
            # 1. Check duplicate email in MySQL users table
            cursor.execute("SELECT id FROM users WHERE email = %s", (email_clean,))
            if cursor.fetchone():
                return False, "An account with this email address already exists.", None

            # 2. Hash password using bcrypt (12 salt rounds)
            import bcrypt
            hashed_pwd = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(12)).decode("utf-8")
            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            # 3. Insert user into MySQL users table
            cursor.execute(
                "INSERT INTO users (email, password_hash, is_active, created_at) "
                "VALUES (%s, %s, 1, %s)",
                (email_clean, hashed_pwd, now_str)
            )
            user_id = cursor.lastrowid

            # 4. Resolve RBAC role
            cursor.execute("SELECT id FROM roles WHERE name = %s", (role_name,))
            role_row = cursor.fetchone()
            role_id = role_row["id"] if role_row else 2  # Default to Researcher (2)

            cursor.execute(
                "INSERT INTO user_roles (user_id, role_id) VALUES (%s, %s)",
                (user_id, role_id)
            )

            # 5. Create user profile in MySQL user_profiles table
            cursor.execute(
                "INSERT INTO user_profiles (user_id, full_name, phone_number, designation, organization, account_created_date) "
                "VALUES (%s, %s, %s, %s, %s, %s)",
                (user_id, name_clean, phone_number or "", designation or "", organization or "", now_str)
            )

            # 6. Log registration activity in MySQL activity_logs table
            cursor.execute(
                "INSERT INTO activity_logs (user_id, activity, details, ip_address, browser, device, timestamp) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (user_id, "USER_REGISTERED", f"User {email_clean} registered with role {role_name}", "127.0.0.1", "System", "Desktop", now_str)
            )

            logger.info(f"🟢 Registered user {email_clean} (ID: {user_id}) in MySQL greenpath_ai.")
            return True, "Registration successful!", user_id

    except Exception as e:
        logger.error(f"Error registering user in MySQL: {e}")
        return False, f"Database error during registration: {e}", None


def authenticate_user(
    email: str,
    password: str,
    ip_address: str = "127.0.0.1",
    browser: str = "Web Client",
    os_name: str = "Windows"
) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
    """
    Authenticates a user against the MySQL 'greenpath_ai' users table.
    Verifies credentials, creates a JWT session in 'sessions', inserts a record into 'login_history',
    inserts a corresponding record into 'activity_logs', updates 'last_login_at', and returns user details.
    """
    try:
        email_clean = email.strip().lower()
        with get_db_cursor(commit_on_success=True) as cursor:
            query = """
                SELECT u.id, u.email, u.password_hash, u.is_active,
                       p.full_name AS profile_name, r.name AS role
                FROM users u
                LEFT JOIN user_profiles p ON u.id = p.user_id
                LEFT JOIN user_roles ur ON u.id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.id
                WHERE u.email = %s
            """
            cursor.execute(query, (email_clean,))
            user_row = cursor.fetchone()

            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            if not user_row:
                return False, "Invalid email address or password.", None

            if not user_row.get("is_active", 1):
                cursor.execute(
                    "INSERT INTO login_history (user_id, login_time, ip_address, browser, operating_system, status) "
                    "VALUES (%s, %s, %s, %s, %s, %s)",
                    (user_row["id"], now_str, ip_address, browser, os_name, "FAILED")
                )
                return False, "Account is disabled. Please contact system administrator.", None

            stored_hash = user_row["password_hash"]
            verified = False

            # Try werkzeug scrypt/pbkdf2 hash check
            try:
                if check_password_hash(stored_hash, password):
                    verified = True
            except ValueError:
                pass

            # Try bcrypt checkpw for $2b$ / $2a$ / $2y$ hashes
            if not verified and (stored_hash.startswith("$2a$") or stored_hash.startswith("$2b$") or stored_hash.startswith("$2y$")):
                try:
                    import bcrypt
                    if bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8")):
                        verified = True
                except Exception:
                    pass

            # Fallback check for plaintext legacy demo accounts
            if not verified and stored_hash == password:
                verified = True

            if not verified:
                # Log failed login attempt in login_history
                cursor.execute(
                    "INSERT INTO login_history (user_id, login_time, ip_address, browser, operating_system, status) "
                    "VALUES (%s, %s, %s, %s, %s, %s)",
                    (user_row["id"], now_str, ip_address, browser, os_name, "FAILED")
                )
                return False, "Invalid email address or password.", None

            # 1. Update last login timestamp in user_profiles
            cursor.execute(
                "UPDATE user_profiles SET last_login_at = %s WHERE user_id = %s",
                (now_str, user_row["id"])
            )

            # 2. Insert record into login_history (status = SUCCESS)
            cursor.execute(
                "INSERT INTO login_history (user_id, login_time, ip_address, browser, operating_system, status) "
                "VALUES (%s, %s, %s, %s, %s, %s)",
                (user_row["id"], now_str, ip_address, browser, os_name, "SUCCESS")
            )

            # 3. Insert corresponding record into activity_logs
            cursor.execute(
                "INSERT INTO activity_logs (user_id, activity, details, ip_address, browser, device, timestamp) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (user_row["id"], "USER_LOGGED_IN", f"User {email_clean} signed in successfully", ip_address, browser, "Desktop", now_str)
            )

            # 4. Create JWT session token and insert record into sessions table
            import uuid
            from datetime import timedelta
            from jose import jwt
            from backend.config import settings

            jwt_id = uuid.uuid4().hex
            expires_delta = timedelta(days=1)
            expires_at = (datetime.now() + expires_delta).strftime("%Y-%m-%d %H:%M:%S")

            cursor.execute(
                "INSERT INTO sessions (user_id, jwt_id, expires_at, is_revoked) VALUES (%s, %s, %s, 0)",
                (user_row["id"], jwt_id, expires_at)
            )

            role_name = user_row["role"] or "Researcher"
            display_name = user_row["profile_name"] or user_row["email"].split("@")[0]

            token_payload = {
                "sub": str(user_row["id"]),
                "email": user_row["email"],
                "role": role_name,
                "jti": jwt_id,
                "exp": datetime.utcnow() + expires_delta
            }
            jwt_token = jwt.encode(token_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

            user_data = {
                "id": user_row["id"],
                "name": display_name,
                "email": user_row["email"],
                "role": role_name,
                "jwt_token": jwt_token,
                "jti": jwt_id
            }
            logger.info(f"🟢 Successfully authenticated {email_clean} ({role_name}) against MySQL greenpath_ai.")
            return True, "Authentication successful!", user_data

    except Exception as e:
        logger.error(f"MySQL authentication error: {e}")
        return False, f"Authentication database error: {e}", None


def log_analysis(
    user_id: int,
    filename: str,
    tree_count: int,
    green_percent: float,
    co2_absorption: float,
    eco_index: int,
    aqi_result: str
) -> bool:
    """Logs AI tree & environment detection results to MySQL 'analyses' table."""
    try:
        with get_db_cursor(commit_on_success=True) as cursor:
            cursor.execute(
                "INSERT INTO analyses (user_id, filename, tree_count, green_percent, co2_absorption, eco_index, aqi_result, created_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                (user_id, filename, tree_count, green_percent, co2_absorption, eco_index, str(aqi_result), datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
            )
            return True
    except Exception as e:
        logger.error(f"Error logging analysis to MySQL: {e}")
        return False


def get_user_analyses(user_id: int, limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieves previous AI analysis runs for a user from MySQL."""
    try:
        with get_db_cursor(commit_on_success=False) as cursor:
            cursor.execute(
                "SELECT id, user_id, filename, tree_count, green_percent, co2_absorption, eco_index, aqi_result, created_at "
                "FROM analyses WHERE user_id = %s ORDER BY id DESC LIMIT %s",
                (user_id, limit)
            )
            return cursor.fetchall()
    except Exception as e:
        logger.error(f"Error fetching analyses from MySQL: {e}")
        return []


def log_report(user_id: int, analysis_id: int, title: str, filename: str) -> bool:
    """Logs generated PDF/CSV environmental reports to MySQL 'reports' table."""
    try:
        with get_db_cursor(commit_on_success=True) as cursor:
            cursor.execute(
                "INSERT INTO reports (user_id, analysis_id, title, filename, created_at) "
                "VALUES (%s, %s, %s, %s, %s)",
                (user_id, analysis_id, title, filename, datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
            )
            return True
    except Exception as e:
        logger.error(f"Error logging report to MySQL: {e}")
        return False


def get_user_reports(user_id: int, limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieves generated reports for a user from MySQL."""
    try:
        with get_db_cursor(commit_on_success=False) as cursor:
            cursor.execute(
                "SELECT id, user_id, analysis_id, title, filename, created_at "
                "FROM reports WHERE user_id = %s ORDER BY id DESC LIMIT %s",
                (user_id, limit)
            )
            return cursor.fetchall()
    except Exception as e:
        logger.error(f"Error fetching user reports from MySQL: {e}")
        return []


def get_global_stats() -> Dict[str, Any]:
    """Computes global dashboard statistics directly from MySQL enterprise tables."""
    try:
        with get_db_cursor(commit_on_success=False) as cursor:
            cursor.execute("SELECT COUNT(*) AS count FROM analyses")
            total_analyses = cursor.fetchone()["count"] or 0

            cursor.execute("SELECT SUM(tree_count) AS total_trees, AVG(green_percent) AS avg_green, SUM(co2_absorption) AS total_co2 FROM analyses")
            agg = cursor.fetchone() or {}
            total_trees_detected = int(agg.get("total_trees") or 0)
            avg_green_cover = round(float(agg.get("avg_green") or 0.0), 1)
            total_co2_offset_tons = round(float(agg.get("total_co2") or 0.0), 2)

            cursor.execute("SELECT COUNT(*) AS count FROM reports")
            total_reports_generated = cursor.fetchone()["count"] or 0

            cursor.execute("SELECT COUNT(*) AS count FROM users WHERE is_active = 1")
            active_researchers = cursor.fetchone()["count"] or 0

            return {
                "total_analyses": total_analyses,
                "total_trees_detected": total_trees_detected,
                "avg_green_cover": avg_green_cover,
                "total_co2_offset_tons": total_co2_offset_tons,
                "total_reports_generated": total_reports_generated,
                "active_researchers": active_researchers
            }
    except Exception as e:
        logger.error(f"Error calculating global MySQL stats: {e}")
        return {
            "total_analyses": 0,
            "total_trees_detected": 0,
            "avg_green_cover": 0.0,
            "total_co2_offset_tons": 0.0,
            "total_reports_generated": 0,
            "active_researchers": 0
        }


# ============================================================================
# ENTERPRISE ADMIN USER MANAGEMENT & LOGIN HISTORY MODULE (PURE MYSQL)
# ============================================================================

def list_admin_users(search: str = "", role_filter: str = "", status_filter: str = "") -> List[Dict[str, Any]]:
    """
    Retrieves all registered users from MySQL users table for the Admin Dashboard.
    Includes User ID, Full Name, Email Address, Mobile Number, Requested Role, Account Status,
    Registration Date, Last Login Time, and Login Count.
    NOTE: NEVER queries, exposes, or displays plain-text passwords or bcrypt hashes.
    """
    try:
        with get_db_cursor(commit_on_success=False) as cursor:
            query = """
                SELECT u.id, u.email, u.is_active, u.created_at,
                       p.full_name, p.phone_number, p.designation, p.organization, p.last_login_at,
                       r.name AS role,
                       (SELECT COUNT(*) FROM login_history lh WHERE lh.user_id = u.id AND lh.status = 'SUCCESS') AS login_count
                FROM users u
                LEFT JOIN user_profiles p ON u.id = p.user_id
                LEFT JOIN user_roles ur ON u.id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.id
                WHERE 1=1
            """
            params = []
            if search:
                query += " AND (p.full_name LIKE %s OR u.email LIKE %s OR r.name LIKE %s)"
                s_like = f"%{search.strip()}%"
                params.extend([s_like, s_like, s_like])

            if role_filter and role_filter != "ALL":
                query += " AND r.name = %s"
                params.append(role_filter)

            if status_filter == "ACTIVE":
                query += " AND u.is_active = 1"
            elif status_filter == "DISABLED":
                query += " AND u.is_active = 0"

            query += " ORDER BY u.id ASC"
            cursor.execute(query, tuple(params))
            rows = cursor.fetchall()

            users_list = []
            for row in rows:
                users_list.append({
                    "id": row["id"],
                    "full_name": row["full_name"] or row["email"].split("@")[0],
                    "email": row["email"],
                    "phone_number": row["phone_number"] or "N/A",
                    "role": row["role"] or "Researcher",
                    "is_active": int(row["is_active"]),
                    "status_text": "Active" if row["is_active"] else "Deactivated",
                    "created_at": str(row["created_at"]) if row["created_at"] else "N/A",
                    "last_login_at": str(row["last_login_at"]) if row["last_login_at"] else "Never",
                    "login_count": int(row["login_count"] or 0)
                })
            return users_list
    except Exception as e:
        logger.error(f"Error listing admin users from MySQL: {e}")
        return []


def get_user_details(user_id: int) -> Optional[Dict[str, Any]]:
    """
    Retrieves detailed profile information for an individual user.
    Never exposes passwords or bcrypt hashes.
    """
    try:
        with get_db_cursor(commit_on_success=False) as cursor:
            query = """
                SELECT u.id, u.email, u.is_active, u.created_at,
                       p.full_name, p.phone_number, p.designation, p.organization, p.last_login_at,
                       r.name AS role,
                       (SELECT COUNT(*) FROM login_history lh WHERE lh.user_id = u.id AND lh.status = 'SUCCESS') AS login_count
                FROM users u
                LEFT JOIN user_profiles p ON u.id = p.user_id
                LEFT JOIN user_roles ur ON u.id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.id
                WHERE u.id = %s
            """
            cursor.execute(query, (user_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return {
                "id": row["id"],
                "full_name": row["full_name"] or row["email"].split("@")[0],
                "email": row["email"],
                "phone_number": row["phone_number"] or "N/A",
                "designation": row["designation"] or "N/A",
                "organization": row["organization"] or "GreenPath AI",
                "role": row["role"] or "Researcher",
                "is_active": int(row["is_active"]),
                "status_text": "Active" if row["is_active"] else "Deactivated",
                "created_at": str(row["created_at"]) if row["created_at"] else "N/A",
                "last_login_at": str(row["last_login_at"]) if row["last_login_at"] else "Never",
                "login_count": int(row["login_count"] or 0)
            }
    except Exception as e:
        logger.error(f"Error fetching user details from MySQL: {e}")
        return None


def toggle_user_status(user_id: int, admin_email: str = "Admin") -> Tuple[bool, str, Optional[int]]:
    """
    Toggles a user's account status (is_active) between 1 (Active) and 0 (Deactivated).
    """
    try:
        with get_db_cursor(commit_on_success=True) as cursor:
            # Prevent disabling primary root admin
            cursor.execute("SELECT id, email, is_active FROM users WHERE id = %s", (user_id,))
            user_row = cursor.fetchone()
            if not user_row:
                return False, "User not found.", None

            if user_row["email"].lower() == "admin@greenpath.ai":
                return False, "Cannot disable the primary system administrator account.", None

            new_status = 0 if user_row["is_active"] == 1 else 1
            cursor.execute("UPDATE users SET is_active = %s WHERE id = %s", (new_status, user_id))

            # Record activity log
            action_desc = "ACTIVATED" if new_status == 1 else "DEACTIVATED"
            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute(
                "INSERT INTO activity_logs (user_id, activity, details, ip_address, browser, device, timestamp) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (user_id, "USER_STATUS_CHANGED", f"Account status changed to {action_desc} by {admin_email}", "127.0.0.1", "Admin Console", "Desktop", now_str)
            )
            return True, f"User account successfully {'activated' if new_status else 'deactivated'}.", new_status
    except Exception as e:
        logger.error(f"Error toggling user status in MySQL: {e}")
        return False, str(e), None


def delete_user_account(user_id: int, admin_email: str = "Admin") -> Tuple[bool, str]:
    """
    Permanently deletes a user account and associated profile/roles from MySQL.
    """
    try:
        with get_db_cursor(commit_on_success=True) as cursor:
            cursor.execute("SELECT id, email FROM users WHERE id = %s", (user_id,))
            user_row = cursor.fetchone()
            if not user_row:
                return False, "User not found."

            if user_row["email"].lower() == "admin@greenpath.ai":
                return False, "Cannot delete the primary system administrator account."

            target_email = user_row["email"]
            cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))

            # Record activity log
            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute(
                "INSERT INTO activity_logs (user_id, activity, details, ip_address, browser, device, timestamp) "
                "VALUES (NULL, %s, %s, %s, %s, %s, %s)",
                ("USER_DELETED", f"User {target_email} (ID: {user_id}) deleted by {admin_email}", "127.0.0.1", "Admin Console", "Desktop", now_str)
            )
            return True, f"User {target_email} permanently deleted."
    except Exception as e:
        logger.error(f"Error deleting user in MySQL: {e}")
        return False, str(e)


def update_user_role(user_id: int, role_name: str, admin_email: str = "Admin") -> Tuple[bool, str]:
    """
    Updates a user's RBAC role in MySQL.
    """
    try:
        with get_db_cursor(commit_on_success=True) as cursor:
            cursor.execute("SELECT id FROM roles WHERE name = %s", (role_name,))
            role_row = cursor.fetchone()
            if not role_row:
                return False, f"Invalid role name '{role_name}'."
            role_id = role_row["id"]

            cursor.execute("DELETE FROM user_roles WHERE user_id = %s", (user_id,))
            cursor.execute("INSERT INTO user_roles (user_id, role_id) VALUES (%s, %s)", (user_id, role_id))

            now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute(
                "INSERT INTO activity_logs (user_id, activity, details, ip_address, browser, device, timestamp) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (user_id, "USER_ROLE_UPDATED", f"User role changed to {role_name} by {admin_email}", "127.0.0.1", "Admin Console", "Desktop", now_str)
            )
            return True, f"Role updated to {role_name}."
    except Exception as e:
        logger.error(f"Error updating user role in MySQL: {e}")
        return False, str(e)


def list_admin_login_history(limit: int = 150) -> List[Dict[str, Any]]:
    """
    Retrieves comprehensive login history records from MySQL login_history table.
    Includes User Name, Email, Mobile Number, Role, Login Time, Logout Time,
    IP Address, Browser, Device, Operating System, and Login Status (Success/Failed).
    """
    try:
        with get_db_cursor(commit_on_success=False) as cursor:
            query = """
                SELECT lh.id, lh.user_id, lh.login_time, lh.logout_time, lh.ip_address,
                       lh.browser, lh.device, lh.operating_system, lh.status,
                       u.email, p.full_name, p.phone_number, r.name AS role
                FROM login_history lh
                LEFT JOIN users u ON lh.user_id = u.id
                LEFT JOIN user_profiles p ON lh.user_id = p.user_id
                LEFT JOIN user_roles ur ON lh.user_id = ur.user_id
                LEFT JOIN roles r ON ur.role_id = r.id
                ORDER BY lh.id DESC
                LIMIT %s
            """
            cursor.execute(query, (limit,))
            rows = cursor.fetchall()
            history = []
            for row in rows:
                login_t = str(row["login_time"]) if row["login_time"] else "N/A"
                logout_t = str(row["logout_time"]) if row["logout_time"] else ("Active Session" if row["status"] == "SUCCESS" else "N/A")
                history.append({
                    "id": row["id"],
                    "user_name": row["full_name"] or (row["email"].split("@")[0] if row["email"] else "System / Unknown"),
                    "email": row["email"] or "N/A",
                    "phone_number": row["phone_number"] or "N/A",
                    "role": row["role"] or "N/A",
                    "login_time": login_t,
                    "logout_time": logout_t,
                    "ip_address": row["ip_address"] or "127.0.0.1",
                    "browser": row["browser"] or "Web Client",
                    "device": row["device"] or "Desktop",
                    "operating_system": row["operating_system"] or "Windows",
                    "status": row["status"] or "SUCCESS"
                })
            return history
    except Exception as e:
        logger.error(f"Error listing admin login history from MySQL: {e}")
        return []


def record_logout(user_id: int) -> bool:
    """
    Records logout timestamp in login_history and revokes active sessions for the user.
    """
    try:
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with get_db_cursor(commit_on_success=True) as cursor:
            cursor.execute(
                "UPDATE login_history SET logout_time = %s WHERE user_id = %s AND logout_time IS NULL ORDER BY id DESC LIMIT 1",
                (now_str, user_id)
            )
            cursor.execute("UPDATE sessions SET is_revoked = 1 WHERE user_id = %s", (user_id,))
            cursor.execute(
                "INSERT INTO activity_logs (user_id, activity, details, ip_address, browser, device, timestamp) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (user_id, "USER_LOGGED_OUT", "User signed out successfully", "127.0.0.1", "Web Client", "Desktop", now_str)
            )
        return True
    except Exception as e:
        logger.error(f"Error recording logout in MySQL: {e}")
        return False


def init_detection_history_table() -> bool:
    """Creates the detection_history table if it does not exist in MySQL."""
    try:
        with get_db_cursor(commit_on_success=True) as cursor:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS detection_history (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    user_id INT UNSIGNED NULL,
                    user_name VARCHAR(150) NULL,
                    image_url VARCHAR(255) NOT NULL,
                    species_name VARCHAR(255) NULL,
                    health_status VARCHAR(100) NULL,
                    detection_date VARCHAR(50) NOT NULL,
                    detection_time VARCHAR(50) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """)
            return True
    except Exception as e:
        logger.error(f"Error initializing detection_history table: {e}")
        return False


def log_detection(
    user_id: Optional[int],
    user_name: str,
    image_url: str,
    species_name: str = "N/A",
    health_status: str = "N/A"
) -> bool:
    """Logs a detection event (Species or Health) to MySQL detection_history table."""
    try:
        init_detection_history_table()
        now = datetime.now()
        det_date = now.strftime("%Y-%m-%d")
        det_time = now.strftime("%H:%M:%S")
        with get_db_cursor(commit_on_success=True) as cursor:
            cursor.execute(
                "INSERT INTO detection_history (user_id, user_name, image_url, species_name, health_status, detection_date, detection_time, created_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                (user_id, user_name or "Researcher", image_url, species_name, health_status, det_date, det_time, now.strftime("%Y-%m-%d %H:%M:%S"))
            )
        return True
    except Exception as e:
        logger.error(f"Error logging detection to MySQL: {e}")
        return False


def get_recent_detections(limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieves recent detection records from MySQL detection_history table."""
    try:
        init_detection_history_table()
        with get_db_cursor(commit_on_success=False) as cursor:
            cursor.execute(
                "SELECT id, user_id, user_name, image_url, species_name, health_status, detection_date, detection_time, created_at "
                "FROM detection_history ORDER BY id DESC LIMIT %s",
                (limit,)
            )
            rows = cursor.fetchall()
            out = []
            for r in rows:
                out.append({
                    "id": r["id"],
                    "user_id": r["user_id"],
                    "user_name": r["user_name"] or "Researcher",
                    "image_url": r["image_url"],
                    "species_name": r["species_name"] or "N/A",
                    "health_status": r["health_status"] or "N/A",
                    "detection_date": r["detection_date"],
                    "detection_time": r["detection_time"],
                    "created_at": str(r["created_at"]) if r["created_at"] else "N/A"
                })
            return out
    except Exception as e:
        logger.error(f"Error fetching recent detections: {e}")
        return []


def get_analytics_statistics() -> Dict[str, Any]:
    """
    Computes comprehensive analytics statistics from MySQL (detection_history & analyses tables)
    for the interactive Chart.js Analytics Dashboard.
    """
    stats = {
        "species_distribution": {"labels": [], "data": []},
        "healthy_vs_dry": {"labels": ["Healthy", "Dry", "Diseased", "Dead"], "data": [0, 0, 0, 0]},
        "monthly_detection_count": {"labels": [], "data": []},
        "total_trees_analysed": 0,
        "most_frequent_species": "None Detected Yet",
        "most_frequent_count": 0,
        "detection_trends": {"labels": [], "data": []}
    }
    try:
        init_detection_history_table()
        with get_db_cursor(commit_on_success=False) as cursor:
            # 1. Species Distribution (Top 8)
            cursor.execute(
                "SELECT species_name, COUNT(*) as cnt FROM detection_history "
                "WHERE species_name IS NOT NULL AND species_name != 'N/A' "
                "GROUP BY species_name ORDER BY cnt DESC LIMIT 8"
            )
            spec_rows = cursor.fetchall()
            for r in spec_rows:
                stats["species_distribution"]["labels"].append(r["species_name"])
                stats["species_distribution"]["data"].append(r["cnt"])
            if spec_rows:
                stats["most_frequent_species"] = spec_rows[0]["species_name"]
                stats["most_frequent_count"] = spec_rows[0]["cnt"]

            # 2. Healthy vs Dry Trees
            cursor.execute(
                "SELECT health_status, COUNT(*) as cnt FROM detection_history "
                "WHERE health_status IS NOT NULL GROUP BY health_status"
            )
            health_rows = cursor.fetchall()
            health_map = {"Healthy": 0, "Dry": 0, "Diseased": 0, "Dead": 0}
            for r in health_rows:
                status_key = (r["health_status"] or "").capitalize()
                if status_key in health_map:
                    health_map[status_key] += r["cnt"]
                else:
                    health_map["Healthy"] += r["cnt"]  # default
            stats["healthy_vs_dry"]["data"] = [
                health_map["Healthy"], health_map["Dry"], health_map["Diseased"], health_map["Dead"]
            ]

            # 3. Monthly Detection Count
            cursor.execute(
                "SELECT DATE_FORMAT(detection_date, '%Y-%m') as m, COUNT(*) as cnt "
                "FROM detection_history GROUP BY m ORDER BY m ASC LIMIT 12"
            )
            month_rows = cursor.fetchall()
            for r in month_rows:
                if r["m"]:
                    stats["monthly_detection_count"]["labels"].append(str(r["m"]))
                    stats["monthly_detection_count"]["data"].append(r["cnt"])

            # 4. Total Trees Analysed (from analyses and detection_history)
            cursor.execute("SELECT COUNT(*) as det_cnt FROM detection_history")
            det_cnt = cursor.fetchone()["det_cnt"] or 0
            try:
                cursor.execute("SELECT COALESCE(SUM(tree_count), 0) as tree_sum FROM analyses")
                tree_sum = int(cursor.fetchone()["tree_sum"] or 0)
            except Exception:
                tree_sum = 0
            stats["total_trees_analysed"] = int(det_cnt) + tree_sum

            # 5. Detection Trends (Last 14 dates)
            cursor.execute(
                "SELECT detection_date, COUNT(*) as cnt FROM detection_history "
                "GROUP BY detection_date ORDER BY detection_date ASC LIMIT 14"
            )
            trend_rows = cursor.fetchall()
            for r in trend_rows:
                if r["detection_date"]:
                    stats["detection_trends"]["labels"].append(str(r["detection_date"]))
                    stats["detection_trends"]["data"].append(r["cnt"])

    except Exception as e:
        logger.error(f"Error calculating analytics statistics: {e}")

    return stats


