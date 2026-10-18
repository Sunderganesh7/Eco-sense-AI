"""
GreenPath AI — Core Pydantic Data Models (MySQL / Pure Python)
Contains lightweight structured types used by backend services.
NO MongoDB, NO Beanie, NO pymongo dependencies.
"""

from typing import List
from enum import Enum
from pydantic import BaseModel


class TreeHealthStatus(str, Enum):
    HEALTHY = "healthy"
    DRY = "dry"
    DISEASED = "diseased"
    DEAD = "dead"


class TreeDetectionResult(BaseModel):
    """Structured result for a single detected tree bounding box."""
    box: List[int]               # [x1, y1, x2, y2]
    confidence: float
    health_status: TreeHealthStatus
    health_confidence: float
