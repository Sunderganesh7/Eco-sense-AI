"""
GreenPath AI — Industry-Level Authentication & Security Module
Flask MVC Application Factory & Server Entry Point.
"""

import os
import logging
from flask import Flask, jsonify, send_from_directory
from config.settings import settings
from middleware.security_middleware import setup_security_middleware
from routes.auth_routes import auth_bp
from routes.admin_routes import admin_bp
from routes.user_routes import user_bp
from database.connection import init_database_schema

# Configure basic logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("greenpath.app")


def create_app() -> Flask:
    """
    Application factory for initializing the GreenPath AI Flask Auth & Security backend.
    """
    app = Flask(__name__)
    app.secret_key = settings.SECRET_KEY
    app.config["MAX_CONTENT_LENGTH"] = settings.MAX_CONTENT_LENGTH_BYTES

    # 1. Setup Security & CORS Middleware
    setup_security_middleware(app)

    # 2. Register MVC API Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(user_bp)

    # 3. Serve uploaded profile images
    profiles_upload_dir = os.path.join(os.path.dirname(__file__), "uploads", "profiles")
    os.makedirs(profiles_upload_dir, exist_ok=True)

    @app.route("/uploads/profiles/<path:filename>")
    def serve_profile_image(filename):
        return send_from_directory(profiles_upload_dir, filename)

    # 4. System health and API documentation endpoint
    @app.route("/api/v1/health")
    def health_check():
        return jsonify({
            "status": "online",
            "service": "GreenPath AI Authentication & Security Engine",
            "version": "1.0.0-enterprise",
            "mvc_modules": ["auth", "admin", "users", "rbac", "logs"],
            "database": "MySQL (greenpath_ai)",
        }), 200

    # 5. Initialize MySQL database tables and sample RBAC records
    try:
        init_database_schema()
    except Exception as e:
        logger.warning(
            f"Could not initialize MySQL database schema on startup: {e}. "
            "Ensure MySQL server is running and credentials in .env are correct."
        )

    logger.info("GreenPath AI Auth Backend initialized successfully.")
    return app


# Expose app for WSGI servers (Gunicorn, Waitress, etc.)
app = create_app()

if __name__ == "__main__":
    logger.info(f"Starting {settings.APP_NAME} on http://localhost:{settings.APP_PORT}")
    app.run(
        host="0.0.0.0",
        port=settings.APP_PORT,
        debug=settings.DEBUG,
    )
