# ============================================================
# GreenPath AI — Backend Dockerfile
# ============================================================
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

# Install system deps (OpenCV requires libGL; replaced obsolete libgl1-mesa-glx with libgl1)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Ensure /app/backend exists for package imports regardless of build context
RUN [ -d backend ] || ln -s . backend

# Create necessary directories
RUN mkdir -p uploads outputs datasets models

# Copy YOLO model weights if present
# (mount as volume in production: docker run -v ./models:/app/models ...)

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Run with uvicorn binding to 0.0.0.0 and dynamic Render $PORT
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]
