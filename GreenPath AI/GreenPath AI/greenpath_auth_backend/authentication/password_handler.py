"""
GreenPath AI — Password Security Handler (bcrypt)
Provides secure password hashing and timing-resistant password verification.
"""

import bcrypt


def hash_password(plain_password: str, rounds: int = 12) -> str:
    """
    Hashes a plaintext password using bcrypt with a configurable work factor (default 12 rounds).
    Returns utf-8 decoded string suitable for MySQL VARCHAR(255) storage.
    """
    if not plain_password:
        raise ValueError("Password cannot be empty.")
    salt = bcrypt.gensalt(rounds=rounds)
    hashed_bytes = bcrypt.hashpw(plain_password.encode("utf-8"), salt)
    return hashed_bytes.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plaintext password against a stored bcrypt hash.
    Uses timing-attack resistant comparison built into bcrypt.checkpw.
    """
    if not plain_password or not hashed_password:
        return False
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except (ValueError, TypeError):
        return False
