"""
SQLAlchemy Models for Fasal.AI Application Database (MySQL).
Covers Users, Profiles, Fields, Recommendations, Disease Scans, Plans, Chat, Feedback, and Weather Alerts.
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, JSON, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    phone = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=True)
    password = Column(String(255), nullable=False)
    name = Column(String(150), default="", nullable=False)
    auth_provider = Column(String(50), default="local", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    profile = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    fields = relationship("Field", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("RecommendationHistory", back_populates="user", cascade="all, delete-orphan")
    disease_scans = relationship("DiseaseScan", back_populates="user", cascade="all, delete-orphan")
    crop_plans = relationship("CropPlan", back_populates="user", cascade="all, delete-orphan")
    messages = relationship("CommunityMessage", back_populates="user", cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="user", cascade="all, delete-orphan")
    weather_alerts = relationship("WeatherAlert", back_populates="user", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "phone": self.phone,
            "email": self.email,
            "name": self.name,
            "auth_provider": self.auth_provider,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    name = Column(String(150), default="", nullable=False)
    district = Column(String(100), default="", nullable=False)
    state = Column(String(100), default="", nullable=False)
    language = Column(String(20), default="en", nullable=False)
    role = Column(String(50), default="farmer", nullable=False)
    farm_size = Column(Float, nullable=True)
    crops_grown = Column(JSON, default=list)
    notifications = Column(JSON, default=dict)
    email = Column(String(255), default="")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="profile")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "full_name": self.name,
            "district": self.district,
            "state": self.state,
            "language": self.language,
            "preferred_language": self.language,
            "role": self.role,
            "farm_size": self.farm_size,
            "crops_grown": self.crops_grown if isinstance(self.crops_grown, list) else [],
            "notifications": self.notifications if isinstance(self.notifications, dict) else {},
            "email": self.email,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Field(Base):
    __tablename__ = "fields"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    label = Column(String(150), default="Unnamed Field", nullable=False)
    area_ha = Column(Float, default=1.0, nullable=False)
    irrigation = Column(String(50), default="rainfed", nullable=False)
    soil_n = Column(Float, default=0.0)
    soil_p = Column(Float, default=0.0)
    soil_k = Column(Float, default=0.0)
    soil_ph = Column(Float, default=7.0)
    soil_type = Column(String(100), default="")
    previous_crop = Column(String(100), default="")
    current_crop = Column(String(100), default="")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    status = Column(String(50), default="active", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="fields")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "label": self.label,
            "name": self.label,
            "area_ha": self.area_ha,
            "irrigation": self.irrigation,
            "soil_n": self.soil_n,
            "soil_p": self.soil_p,
            "soil_k": self.soil_k,
            "soil_ph": self.soil_ph,
            "soil_type": self.soil_type,
            "previous_crop": self.previous_crop,
            "current_crop": self.current_crop,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class RecommendationHistory(Base):
    __tablename__ = "recommendation_history"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    field_id = Column(Integer, ForeignKey("fields.id", ondelete="SET NULL"), nullable=True)
    input_data = Column(JSON, nullable=False)
    recommendations = Column(JSON, nullable=False)
    model_version = Column(String(100), default="")
    inference_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="recommendations")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "field_id": self.field_id,
            "input_data": self.input_data,
            "recommendations": self.recommendations,
            "model_version": self.model_version,
            "inference_ms": self.inference_ms,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class DiseaseScan(Base):
    __tablename__ = "disease_scans"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    field_id = Column(Integer, ForeignKey("fields.id", ondelete="SET NULL"), nullable=True)
    crop = Column(String(100), nullable=False)
    disease = Column(String(150), nullable=False)
    disease_key = Column(String(150), default="")
    confidence = Column(Float, default=0.0)
    is_healthy = Column(Boolean, default=False)
    treatment = Column(JSON, default=dict)
    all_predictions = Column(JSON, default=list)
    image_path = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="disease_scans")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "field_id": self.field_id,
            "crop": self.crop,
            "disease": self.disease,
            "disease_key": self.disease_key,
            "confidence": self.confidence,
            "is_healthy": self.is_healthy,
            "treatment": self.treatment,
            "all_predictions": self.all_predictions,
            "image_path": self.image_path,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class CropPlan(Base):
    __tablename__ = "crop_plans"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    field_id = Column(Integer, ForeignKey("fields.id", ondelete="SET NULL"), nullable=True)
    plot_label = Column(String(150), default="Unnamed Plot", nullable=False)
    year = Column(Integer, default=2026, nullable=False)
    crop = Column(String(100), default="", nullable=False)
    season = Column(String(50), default="", nullable=False)
    start_month = Column(Integer, default=1, nullable=False)
    end_month = Column(Integer, default=3, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="crop_plans")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "field_id": self.field_id,
            "plot_label": self.plot_label,
            "year": self.year,
            "crop": self.crop,
            "season": self.season,
            "start_month": self.start_month,
            "end_month": self.end_month,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class CommunityMessage(Base):
    __tablename__ = "community_messages"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    user_name = Column(String(150), default="Anonymous", nullable=False)
    message = Column(Text, nullable=False)
    message_type = Column(String(50), default="text", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="messages")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_name": self.user_name,
            "message": self.message,
            "message_type": self.message_type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    user_name = Column(String(150), default="Anonymous", nullable=False)
    area = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="feedback")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_name": self.user_name,
            "area": self.area,
            "message": self.message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class WeatherAlert(Base):
    __tablename__ = "weather_alerts"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    alert_type = Column(String(50), default="rain", nullable=False)
    severity = Column(String(50), default="warning", nullable=False)
    message = Column(Text, default="", nullable=False)
    weather_data = Column(JSON, default=dict)
    email_sent = Column(Boolean, default=False)
    sent_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="weather_alerts")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "alert_type": self.alert_type,
            "severity": self.severity,
            "message": self.message,
            "weather_data": self.weather_data,
            "email_sent": self.email_sent,
            "sent_at": self.sent_at.isoformat() if self.sent_at else None,
        }
