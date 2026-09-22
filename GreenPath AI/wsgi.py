"""
GreenPath AI — WSGI Entrypoint
Exposes the Flask application instance for production-grade WSGI web servers
such as Gunicorn, uWSGI, or passenger.
"""

from app import app

if __name__ == "__main__":
    app.run()
