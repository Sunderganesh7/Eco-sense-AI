"""
GreenPath AI — Security Middleware & CORS Configuration
Configures CORS, HTTP Security response headers, and global exception handlers.
"""

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from config.settings import settings


def setup_security_middleware(app: Flask) -> None:
    """
    Applies security policies, CORS rules, and HTTP response headers to the Flask app.
    """
    # 1. Configure CORS
    CORS(
        app,
        resources={r"/api/*": {"origins": settings.get_allowed_origins()}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    )

    # 2. Inject Security HTTP Headers on every response
    @app.after_request
    def add_security_headers(response: Response) -> Response:
        # Prevent browsers from MIME-sniffing a response away from the declared Content-Type
        response.headers["X-Content-Type-Options"] = "nosniff"
        # Clickjacking protection
        response.headers["X-Frame-Options"] = "DENY"
        # XSS filtering
        response.headers["X-XSS-Protection"] = "1; mode=block"
        # Strict Transport Security (HSTS) in production
        if not settings.DEBUG:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        # Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

    # 3. Global Exception Handlers for clean JSON API responses
    @app.errorhandler(404)
    def resource_not_found(e):
        return jsonify({
            "success": False,
            "message": "Resource endpoint not found."
        }), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({
            "success": False,
            "message": "HTTP Method not allowed for this endpoint."
        }), 405

    @app.errorhandler(500)
    def internal_server_error(e):
        return jsonify({
            "success": False,
            "message": "An internal server error occurred. Please contact support."
        }), 500
