"""Tests for API endpoints."""

import pytest
from httpx import AsyncClient
from datetime import datetime
from activity_db.main import app


@pytest.fixture
async def client():
    """Test client fixture."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_root_endpoint(client: AsyncClient):
    """Test root endpoint."""
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "activity-db"
    assert data["version"] == "0.1.0"


@pytest.mark.asyncio 
async def test_health_check(client: AsyncClient):
    """Test health check endpoint."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data


@pytest.mark.asyncio
async def test_create_event_without_auth(client: AsyncClient):
    """Test creating event without authentication."""
    event_data = {
        "timestamp": datetime.utcnow().isoformat(),
        "session_id": "test-session",
        "device_id": "test-device", 
        "event_type": "KeyPress",
        "event_data": {"key": "A", "modifiers": []}
    }
    
    response = await client.post("/api/v1/events/", json=event_data)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_event_with_auth(client: AsyncClient):
    """Test creating event with authentication."""
    event_data = {
        "timestamp": datetime.utcnow().isoformat(),
        "session_id": "test-session",
        "device_id": "test-device",
        "event_type": "KeyPress", 
        "event_data": {"key": "A", "modifiers": []}
    }
    
    headers = {"Authorization": "Bearer dev-test-key"}
    response = await client.post("/api/v1/events/", json=event_data, headers=headers)
    assert response.status_code == 201
    
    data = response.json()
    assert data["session_id"] == "test-session"
    assert data["event_type"] == "KeyPress"


@pytest.mark.asyncio
async def test_list_events_with_auth(client: AsyncClient):
    """Test listing events with authentication."""
    headers = {"Authorization": "Bearer dev-test-key"}
    response = await client.get("/api/v1/events/", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "items" in data
    assert "total" in data