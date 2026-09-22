"""
GreenPath AI — Validation & XSS Protection Utilities
Enforces industry-grade password complexity rules, format validation, and input sanitization.
"""

import re
import html
from typing import Tuple, Optional


def validate_email(email: str) -> Tuple[bool, Optional[str]]:
    """
    Validates email format using standard RFC 5322 regex pattern.
    Returns (is_valid: bool, error_message: str).
    """
    if not email or not isinstance(email, str):
        return False, "Email address is required."
    email = email.strip()
    pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    if not re.match(pattern, email):
        return False, "Invalid email address format."
    if len(email) > 150:
        return False, "Email address exceeds maximum length of 150 characters."
    return True, None


def validate_password_strength(password: str) -> Tuple[bool, Optional[str]]:
    """
    Validates that a password meets industry security standards:
    - Minimum 8 characters in length
    - At least one uppercase letter (A-Z)
    - At least one lowercase letter (a-z)
    - At least one digit (0-9)
    - At least one special character (!@#$%^&*()_+-=[]{}|;':\",./<>?)
    
    Returns (is_valid: bool, error_message: str).
    """
    if not password or not isinstance(password, str):
        return False, "Password is required."
    
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."

    if len(password) > 128:
        return False, "Password exceeds maximum length of 128 characters."

    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter (A-Z)."

    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter (a-z)."

    if not re.search(r"[0-9]", password):
        return False, "Password must contain at least one digit (0-9)."

    if not re.search(r"[!@#$%^&*()_+\-=\[\]{}|;':\",./<>?~`\\]", password):
        return False, "Password must contain at least one special character (e.g. !@#$%^&*)."

    return True, None


def sanitize_input(text: Optional[str]) -> str:
    """
    Sanitizes string input to prevent XSS payloads by escaping HTML tags and entities.
    """
    if text is None:
        return ""
    if not isinstance(text, str):
        text = str(text)
    # Strip leading/trailing whitespaces and convert HTML chars (<, >, &, ", ')
    return html.escape(text.strip())
