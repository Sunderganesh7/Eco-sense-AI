"""
GreenPath AI — Request Telemetry Utilities
Parses client IP address, Browser, Operating System, and Device from HTTP request headers.
"""

from typing import Dict, Any
from flask import Request


def get_client_ip(request: Request) -> str:
    """
    Extracts true client IP address, checking proxy X-Forwarded-For headers first.
    """
    x_forwarded_for = request.headers.get("X-Forwarded-For")
    if x_forwarded_for:
        # X-Forwarded-For can contain multiple comma-separated IPs; first is real client
        ip = x_forwarded_for.split(",")[0].strip()
        if ip:
            return ip
    return request.remote_addr or "127.0.0.1"


def get_browser_info(user_agent_str: str) -> str:
    """
    Parses Browser name from user agent string.
    """
    if not user_agent_str:
        return "Unknown"
    ua = user_agent_str.lower()
    if "edg/" in ua or "edge/" in ua:
        return "Microsoft Edge"
    if "chrome/" in ua and "safari/" in ua and "edg/" not in ua:
        return "Google Chrome"
    if "firefox/" in ua:
        return "Mozilla Firefox"
    if "safari/" in ua and "chrome/" not in ua:
        return "Apple Safari"
    if "postman" in ua:
        return "Postman Client"
    if "curl" in ua or "python" in ua:
        return "API Client"
    return "Web Browser"


def get_os_info(user_agent_str: str) -> str:
    """
    Parses Operating System name from user agent string.
    """
    if not user_agent_str:
        return "Unknown"
    ua = user_agent_str.lower()
    if "windows" in ua:
        return "Windows"
    if "mac os x" in ua or "macos" in ua:
        return "macOS"
    if "android" in ua:
        return "Android"
    if "iphone" in ua or "ipad" in ua or "ios" in ua:
        return "iOS"
    if "linux" in ua:
        return "Linux"
    return "Other OS"


def get_device_type(user_agent_str: str) -> str:
    """
    Determines if client device is Desktop, Mobile, or Tablet.
    """
    if not user_agent_str:
        return "Unknown"
    ua = user_agent_str.lower()
    if "ipad" in ua or "tablet" in ua:
        return "Tablet"
    if "mobile" in ua or "android" in ua or "iphone" in ua:
        return "Mobile"
    return "Desktop"


def extract_request_telemetry(request: Request) -> Dict[str, Any]:
    """
    Returns a unified telemetry dictionary for Activity Logs and Login History.
    """
    user_agent_str = request.headers.get("User-Agent", "")
    return {
        "ip_address": get_client_ip(request),
        "browser": get_browser_info(user_agent_str),
        "operating_system": get_os_info(user_agent_str),
        "device": get_device_type(user_agent_str),
    }
