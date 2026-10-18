"""
Optional Supabase Client Module — Used exclusively for Google OAuth token validation if configured.
Primary application database is MySQL managed via database.py.
"""

import os
from typing import Optional

_supabase_client = None


def get_supabase():
    """Return Supabase client if configured, else None."""
    global _supabase_client
    if _supabase_client is None:
        url = os.environ.get("SUPABASE_URL", "").strip()
        key = os.environ.get("SUPABASE_KEY", "").strip()
        if not url or not key:
            return None
        try:
            from supabase import create_client
            _supabase_client = create_client(url, key)
        except Exception as e:
            print(f"  [WARN] Supabase client initialization error: {e}")
            return None
    return _supabase_client


def check_connection() -> bool:
    """Check if Supabase credentials are configured and reachable."""
    sb = get_supabase()
    if not sb:
        return False
    try:
        sb.table("users").select("id").limit(1).execute()
        return True
    except Exception:
        return False
