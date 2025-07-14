"""API routes for input events."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..schemas import (
    InputEvent, InputEventCreate, InputEventUpdate,
    EventQueryParams, ListResponse
)
from ..services.event_service import EventService

router = APIRouter()


@router.post("/", response_model=InputEvent, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_data: InputEventCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new input event."""
    service = EventService(db)
    try:
        event = await service.create(event_data)
        await db.commit()
        return event
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create event: {str(e)}"
        )


@router.get("/", response_model=ListResponse)
async def list_events(
    params: EventQueryParams = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """List input events with filtering and pagination."""
    service = EventService(db)
    return await service.list_events(params)


@router.get("/{event_id}", response_model=InputEvent)
async def get_event(
    event_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific input event."""
    service = EventService(db)
    event = await service.get_by_id(event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    return event


@router.put("/{event_id}", response_model=InputEvent)
async def update_event(
    event_id: int,
    event_data: InputEventUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update an input event."""
    service = EventService(db)
    try:
        event = await service.update(event_id, event_data)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        await db.commit()
        return event
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update event: {str(e)}"
        )


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Delete an input event."""
    service = EventService(db)
    try:
        deleted = await service.delete(event_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete event: {str(e)}"
        )


@router.get("/session/{session_id}", response_model=List[InputEvent])
async def get_session_events(
    session_id: str,
    limit: int = 1000,
    db: AsyncSession = Depends(get_db)
):
    """Get all events for a specific session."""
    service = EventService(db)
    return await service.get_events_by_session(session_id, limit)


@router.get("/statistics/", response_model=dict)
async def get_event_statistics(
    device_id: str = None,
    start_date: str = None,
    end_date: str = None,
    db: AsyncSession = Depends(get_db)
):
    """Get event statistics."""
    from datetime import datetime
    
    # Parse dates if provided
    start_dt = datetime.fromisoformat(start_date) if start_date else None
    end_dt = datetime.fromisoformat(end_date) if end_date else None
    
    service = EventService(db)
    return await service.get_event_statistics(device_id, start_dt, end_dt)