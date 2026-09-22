"""
GreenPath AI — Email Delivery Service
Simulates sending 6-digit OTP codes via email (or integrates SMTP in production).
"""

import logging
from config.settings import settings

logger = logging.getLogger("greenpath.services.email")


class EmailService:
    """
    Handles outbound email notifications and OTP delivery.
    """

    @staticmethod
    def send_otp(recipient_email: str, otp_code: str) -> bool:
        """
        Sends the 6-digit OTP code to the recipient email address.
        In development mode, prints clean debug logs so testing is instant.
        """
        message = (
            f"\n=== GREENPATH AI SECURITY NOTICE ===\n"
            f"To: {recipient_email}\n"
            f"Subject: Your Password Reset OTP Code\n"
            f"Your 6-digit One-Time Password (OTP) is: [{otp_code}]\n"
            f"This code will expire in {settings.OTP_EXPIRE_MINUTES} minutes.\n"
            f"If you did not request a password reset, please ignore this message.\n"
            f"====================================\n"
        )
        logger.info(message)
        print(message)
        return True
