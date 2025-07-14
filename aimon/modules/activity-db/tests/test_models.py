"""Tests for database models."""

import pytest
from datetime import datetime
from activity_db.models import InputEvent, Session, Application


def test_input_event_model():
    """Test InputEvent model creation."""
    event = InputEvent(
        timestamp=datetime.utcnow(),
        session_id="test-session",
        device_id="test-device", 
        event_type="KeyPress",
        event_data={"key": "A", "modifiers": []}
    )
    
    assert event.session_id == "test-session"
    assert event.event_type == "KeyPress"
    assert event.event_data["key"] == "A"


def test_session_model():
    """Test Session model creation."""
    session = Session(
        id="test-session-id",
        device_id="test-device",
        start_time=datetime.utcnow()
    )
    
    assert session.id == "test-session-id"
    assert session.device_id == "test-device"
    assert session.total_events == 0


def test_application_model():
    """Test Application model creation."""
    app = Application(
        name="Test Application",
        category="productivity",
        is_sensitive=False
    )
    
    assert app.name == "Test Application"
    assert app.category == "productivity"
    assert app.is_sensitive is False
    assert app.track_content is True