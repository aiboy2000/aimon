"""Database models for activity data."""

from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import (
    Column, Integer, String, DateTime, Text, Float, Boolean, JSON,
    Index, ForeignKey, UniqueConstraint
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

Base = declarative_base()


class InputEvent(Base):
    """Model for input events from input-monitor."""
    
    __tablename__ = "input_events"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Event metadata
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    session_id = Column(String(255), nullable=False, index=True)
    device_id = Column(String(255), nullable=False, index=True)
    
    # Event type and data
    event_type = Column(String(50), nullable=False, index=True)  # KeyPress, MouseClick, etc.
    event_data = Column(JSON, nullable=False)  # Event-specific data
    
    # Optional processed data
    processed_text = Column(Text, nullable=True)  # Reconstructed text for key events
    application_context = Column(String(255), nullable=True, index=True)
    window_title = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_events_timestamp_type', 'timestamp', 'event_type'),
        Index('idx_events_session_timestamp', 'session_id', 'timestamp'),
        Index('idx_events_device_timestamp', 'device_id', 'timestamp'),
    )


class Session(Base):
    """Model for user sessions."""
    
    __tablename__ = "sessions"
    
    id = Column(String(255), primary_key=True)
    device_id = Column(String(255), nullable=False, index=True)
    
    # Session timing
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    
    # Session metadata
    user_id = Column(String(255), nullable=True, index=True)
    os_info = Column(JSON, nullable=True)
    screen_resolution = Column(String(50), nullable=True)
    
    # Activity summary
    total_events = Column(Integer, default=0)
    key_events = Column(Integer, default=0)
    mouse_events = Column(Integer, default=0)
    application_switches = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    events = relationship("InputEvent", backref="session_info", lazy="select")


class Application(Base):
    """Model for tracked applications."""
    
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    executable_path = Column(String(500), nullable=True)
    category = Column(String(100), nullable=True, index=True)
    
    # Application metadata
    version = Column(String(100), nullable=True)
    vendor = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    
    # Privacy settings
    is_sensitive = Column(Boolean, default=False, index=True)
    track_content = Column(Boolean, default=True)
    
    # Usage statistics
    total_usage_time = Column(Integer, default=0)  # seconds
    last_used = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ActivitySummary(Base):
    """Model for daily/hourly activity summaries."""
    
    __tablename__ = "activity_summaries"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Time period
    date = Column(DateTime(timezone=True), nullable=False, index=True)
    period_type = Column(String(10), nullable=False)  # 'hour', 'day'
    device_id = Column(String(255), nullable=False, index=True)
    session_id = Column(String(255), nullable=True, index=True)
    
    # Activity metrics
    total_events = Column(Integer, default=0)
    active_time_seconds = Column(Integer, default=0)
    idle_time_seconds = Column(Integer, default=0)
    
    # Input metrics
    keystrokes = Column(Integer, default=0)
    mouse_clicks = Column(Integer, default=0)
    mouse_distance_pixels = Column(Float, default=0.0)
    scroll_events = Column(Integer, default=0)
    
    # Application usage
    applications_used = Column(JSON, nullable=True)  # {app_name: usage_seconds}
    most_used_app = Column(String(255), nullable=True)
    
    # Productivity metrics
    productivity_score = Column(Float, nullable=True)  # 0.0 - 1.0
    focus_time_seconds = Column(Integer, default=0)
    distraction_events = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('date', 'period_type', 'device_id', name='uq_summary_period'),
        Index('idx_summary_date_device', 'date', 'device_id'),
    )


class Screenshot(Base):
    """Model for screenshot data."""
    
    __tablename__ = "screenshots"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Reference to input event
    event_id = Column(Integer, ForeignKey('input_events.id'), nullable=False, index=True)
    
    # Screenshot metadata
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    device_id = Column(String(255), nullable=False, index=True)
    session_id = Column(String(255), nullable=False, index=True)
    
    # Image data
    image_data = Column(Text, nullable=False)  # Base64 encoded
    image_format = Column(String(10), default='png')
    image_size_bytes = Column(Integer, nullable=True)
    
    # Screen information
    screen_width = Column(Integer, nullable=True)
    screen_height = Column(Integer, nullable=True)
    screen_number = Column(Integer, default=0)
    
    # Analysis results (populated by AI services)
    ocr_text = Column(Text, nullable=True)
    detected_ui_elements = Column(JSON, nullable=True)
    content_summary = Column(Text, nullable=True)
    
    # Privacy and processing
    is_sensitive = Column(Boolean, default=False, index=True)
    processed = Column(Boolean, default=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship
    event = relationship("InputEvent", backref="screenshot")


class APIKey(Base):
    """Model for API key management."""
    
    __tablename__ = "api_keys"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Key information
    key_id = Column(String(255), nullable=False, unique=True, index=True)
    hashed_key = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Access control
    is_active = Column(Boolean, default=True, index=True)
    permissions = Column(JSON, nullable=True)  # List of allowed endpoints/actions
    rate_limit = Column(Integer, nullable=True)  # Requests per minute
    
    # Usage tracking
    last_used = Column(DateTime(timezone=True), nullable=True)
    usage_count = Column(Integer, default=0)
    
    # Timestamps
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())