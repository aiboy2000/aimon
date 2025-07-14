"""Pydantic schemas for API request/response models."""

from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict


# Base schemas
class TimestampMixin(BaseModel):
    """Mixin for timestamp fields."""
    created_at: datetime
    updated_at: Optional[datetime] = None


# Input Event schemas
class InputEventBase(BaseModel):
    """Base schema for input events."""
    timestamp: datetime
    session_id: str = Field(..., min_length=1, max_length=255)
    device_id: str = Field(..., min_length=1, max_length=255)
    event_type: str = Field(..., min_length=1, max_length=50)
    event_data: Dict[str, Any]
    processed_text: Optional[str] = None
    application_context: Optional[str] = Field(None, max_length=255)
    window_title: Optional[str] = Field(None, max_length=500)


class InputEventCreate(InputEventBase):
    """Schema for creating input events."""
    pass


class InputEventUpdate(BaseModel):
    """Schema for updating input events."""
    processed_text: Optional[str] = None
    application_context: Optional[str] = Field(None, max_length=255)
    window_title: Optional[str] = Field(None, max_length=500)


class InputEvent(InputEventBase, TimestampMixin):
    """Schema for input event responses."""
    id: int
    
    model_config = ConfigDict(from_attributes=True)


# Session schemas
class SessionBase(BaseModel):
    """Base schema for sessions."""
    device_id: str = Field(..., min_length=1, max_length=255)
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    user_id: Optional[str] = Field(None, max_length=255)
    os_info: Optional[Dict[str, Any]] = None
    screen_resolution: Optional[str] = Field(None, max_length=50)


class SessionCreate(SessionBase):
    """Schema for creating sessions."""
    id: str = Field(..., min_length=1, max_length=255)


class SessionUpdate(BaseModel):
    """Schema for updating sessions."""
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    total_events: Optional[int] = None
    key_events: Optional[int] = None
    mouse_events: Optional[int] = None
    application_switches: Optional[int] = None


class Session(SessionBase, TimestampMixin):
    """Schema for session responses."""
    id: str
    total_events: int = 0
    key_events: int = 0
    mouse_events: int = 0
    application_switches: int = 0
    
    model_config = ConfigDict(from_attributes=True)


# Application schemas
class ApplicationBase(BaseModel):
    """Base schema for applications."""
    name: str = Field(..., min_length=1, max_length=255)
    executable_path: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = Field(None, max_length=100)
    version: Optional[str] = Field(None, max_length=100)
    vendor: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    is_sensitive: bool = False
    track_content: bool = True


class ApplicationCreate(ApplicationBase):
    """Schema for creating applications."""
    pass


class ApplicationUpdate(BaseModel):
    """Schema for updating applications."""
    executable_path: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = Field(None, max_length=100)
    version: Optional[str] = Field(None, max_length=100)
    vendor: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    is_sensitive: Optional[bool] = None
    track_content: Optional[bool] = None


class Application(ApplicationBase, TimestampMixin):
    """Schema for application responses."""
    id: int
    total_usage_time: int = 0
    last_used: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# Activity Summary schemas
class ActivitySummaryBase(BaseModel):
    """Base schema for activity summaries."""
    date: datetime
    period_type: str = Field(..., regex="^(hour|day)$")
    device_id: str = Field(..., min_length=1, max_length=255)
    session_id: Optional[str] = Field(None, max_length=255)
    total_events: int = 0
    active_time_seconds: int = 0
    idle_time_seconds: int = 0
    keystrokes: int = 0
    mouse_clicks: int = 0
    mouse_distance_pixels: float = 0.0
    scroll_events: int = 0
    applications_used: Optional[Dict[str, int]] = None
    most_used_app: Optional[str] = Field(None, max_length=255)
    productivity_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    focus_time_seconds: int = 0
    distraction_events: int = 0


class ActivitySummaryCreate(ActivitySummaryBase):
    """Schema for creating activity summaries."""
    pass


class ActivitySummaryUpdate(BaseModel):
    """Schema for updating activity summaries."""
    total_events: Optional[int] = None
    active_time_seconds: Optional[int] = None
    idle_time_seconds: Optional[int] = None
    keystrokes: Optional[int] = None
    mouse_clicks: Optional[int] = None
    mouse_distance_pixels: Optional[float] = None
    scroll_events: Optional[int] = None
    applications_used: Optional[Dict[str, int]] = None
    most_used_app: Optional[str] = Field(None, max_length=255)
    productivity_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    focus_time_seconds: Optional[int] = None
    distraction_events: Optional[int] = None


class ActivitySummary(ActivitySummaryBase, TimestampMixin):
    """Schema for activity summary responses."""
    id: int
    
    model_config = ConfigDict(from_attributes=True)


# Screenshot schemas
class ScreenshotBase(BaseModel):
    """Base schema for screenshots."""
    timestamp: datetime
    device_id: str = Field(..., min_length=1, max_length=255)
    session_id: str = Field(..., min_length=1, max_length=255)
    image_data: str = Field(..., min_length=1)  # Base64 encoded
    image_format: str = Field(default="png", max_length=10)
    image_size_bytes: Optional[int] = None
    screen_width: Optional[int] = None
    screen_height: Optional[int] = None
    screen_number: int = 0
    is_sensitive: bool = False


class ScreenshotCreate(ScreenshotBase):
    """Schema for creating screenshots."""
    event_id: int


class ScreenshotUpdate(BaseModel):
    """Schema for updating screenshots."""
    ocr_text: Optional[str] = None
    detected_ui_elements: Optional[Dict[str, Any]] = None
    content_summary: Optional[str] = None
    is_sensitive: Optional[bool] = None
    processed: Optional[bool] = None


class Screenshot(ScreenshotBase, TimestampMixin):
    """Schema for screenshot responses."""
    id: int
    event_id: int
    ocr_text: Optional[str] = None
    detected_ui_elements: Optional[Dict[str, Any]] = None
    content_summary: Optional[str] = None
    processed: bool = False
    
    model_config = ConfigDict(from_attributes=True)


# API Key schemas
class APIKeyBase(BaseModel):
    """Base schema for API keys."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    permissions: Optional[List[str]] = None
    rate_limit: Optional[int] = Field(None, gt=0)
    expires_at: Optional[datetime] = None


class APIKeyCreate(APIKeyBase):
    """Schema for creating API keys."""
    pass


class APIKeyUpdate(BaseModel):
    """Schema for updating API keys."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    permissions: Optional[List[str]] = None
    rate_limit: Optional[int] = Field(None, gt=0)
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None


class APIKey(APIKeyBase, TimestampMixin):
    """Schema for API key responses."""
    id: int
    key_id: str
    is_active: bool = True
    last_used: Optional[datetime] = None
    usage_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)


class APIKeyWithSecret(APIKey):
    """Schema for API key with secret (only returned on creation)."""
    secret_key: str


# Query schemas
class PaginationParams(BaseModel):
    """Schema for pagination parameters."""
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=50, ge=1, le=1000)


class DateRangeParams(BaseModel):
    """Schema for date range parameters."""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class EventQueryParams(PaginationParams, DateRangeParams):
    """Schema for event query parameters."""
    session_id: Optional[str] = None
    device_id: Optional[str] = None
    event_type: Optional[str] = None
    application_context: Optional[str] = None


class SummaryQueryParams(PaginationParams, DateRangeParams):
    """Schema for summary query parameters."""
    device_id: Optional[str] = None
    period_type: Optional[str] = Field(None, regex="^(hour|day)$")


# Response schemas
class ListResponse(BaseModel):
    """Schema for paginated list responses."""
    items: List[Any]
    total: int
    skip: int
    limit: int
    
    
class HealthCheck(BaseModel):
    """Schema for health check response."""
    status: str = "healthy"
    timestamp: datetime
    version: str
    database: str = "connected"