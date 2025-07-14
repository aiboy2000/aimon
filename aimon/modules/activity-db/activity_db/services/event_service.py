"""Service for managing input events."""

from typing import List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, asc
from sqlalchemy.orm import selectinload

from ..models import InputEvent as InputEventModel
from ..schemas import (
    InputEventCreate, InputEventUpdate, InputEvent,
    EventQueryParams, ListResponse
)


class EventService:
    """Service for input event operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create(self, event_data: InputEventCreate) -> InputEvent:
        """Create a new input event."""
        db_event = InputEventModel(**event_data.model_dump())
        self.db.add(db_event)
        await self.db.flush()
        await self.db.refresh(db_event)
        return InputEvent.model_validate(db_event)
    
    async def get_by_id(self, event_id: int) -> Optional[InputEvent]:
        """Get an input event by ID."""
        result = await self.db.execute(
            select(InputEventModel).where(InputEventModel.id == event_id)
        )
        db_event = result.scalar_one_or_none()
        return InputEvent.model_validate(db_event) if db_event else None
    
    async def update(self, event_id: int, event_data: InputEventUpdate) -> Optional[InputEvent]:
        """Update an input event."""
        result = await self.db.execute(
            select(InputEventModel).where(InputEventModel.id == event_id)
        )
        db_event = result.scalar_one_or_none()
        
        if not db_event:
            return None
        
        update_data = event_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_event, field, value)
        
        await self.db.flush()
        await self.db.refresh(db_event)
        return InputEvent.model_validate(db_event)
    
    async def delete(self, event_id: int) -> bool:
        """Delete an input event."""
        result = await self.db.execute(
            select(InputEventModel).where(InputEventModel.id == event_id)
        )
        db_event = result.scalar_one_or_none()
        
        if not db_event:
            return False
        
        await self.db.delete(db_event)
        return True
    
    async def list_events(self, params: EventQueryParams) -> ListResponse:
        """List input events with filtering and pagination."""
        # Build query
        query = select(InputEventModel)
        count_query = select(func.count(InputEventModel.id))
        
        # Apply filters
        conditions = []
        
        if params.start_date:
            conditions.append(InputEventModel.timestamp >= params.start_date)
        if params.end_date:
            conditions.append(InputEventModel.timestamp <= params.end_date)
        if params.session_id:
            conditions.append(InputEventModel.session_id == params.session_id)
        if params.device_id:
            conditions.append(InputEventModel.device_id == params.device_id)
        if params.event_type:
            conditions.append(InputEventModel.event_type == params.event_type)
        if params.application_context:
            conditions.append(
                InputEventModel.application_context.like(f"%{params.application_context}%")
            )
        
        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))
        
        # Get total count
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()
        
        # Apply ordering and pagination
        query = query.order_by(desc(InputEventModel.timestamp))
        query = query.offset(params.skip).limit(params.limit)
        
        # Execute query
        result = await self.db.execute(query)
        events = result.scalars().all()
        
        return ListResponse(
            items=[InputEvent.model_validate(event) for event in events],
            total=total,
            skip=params.skip,
            limit=params.limit
        )
    
    async def get_events_by_session(
        self, 
        session_id: str, 
        limit: int = 1000
    ) -> List[InputEvent]:
        """Get all events for a specific session."""
        result = await self.db.execute(
            select(InputEventModel)
            .where(InputEventModel.session_id == session_id)
            .order_by(asc(InputEventModel.timestamp))
            .limit(limit)
        )
        events = result.scalars().all()
        return [InputEvent.model_validate(event) for event in events]
    
    async def get_events_by_timerange(
        self,
        device_id: str,
        start_time: datetime,
        end_time: datetime,
        event_types: Optional[List[str]] = None
    ) -> List[InputEvent]:
        """Get events within a time range."""
        conditions = [
            InputEventModel.device_id == device_id,
            InputEventModel.timestamp >= start_time,
            InputEventModel.timestamp <= end_time
        ]
        
        if event_types:
            conditions.append(InputEventModel.event_type.in_(event_types))
        
        result = await self.db.execute(
            select(InputEventModel)
            .where(and_(*conditions))
            .order_by(asc(InputEventModel.timestamp))
        )
        events = result.scalars().all()
        return [InputEvent.model_validate(event) for event in events]
    
    async def get_event_statistics(
        self,
        device_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> dict:
        """Get event statistics."""
        conditions = []
        
        if device_id:
            conditions.append(InputEventModel.device_id == device_id)
        if start_date:
            conditions.append(InputEventModel.timestamp >= start_date)
        if end_date:
            conditions.append(InputEventModel.timestamp <= end_date)
        
        base_query = select(InputEventModel)
        if conditions:
            base_query = base_query.where(and_(*conditions))
        
        # Total events
        total_result = await self.db.execute(
            select(func.count(InputEventModel.id)).select_from(base_query.subquery())
        )
        total_events = total_result.scalar()
        
        # Events by type
        type_result = await self.db.execute(
            select(
                InputEventModel.event_type,
                func.count(InputEventModel.id).label('count')
            )
            .select_from(base_query.subquery())
            .group_by(InputEventModel.event_type)
        )
        events_by_type = {row.event_type: row.count for row in type_result}
        
        # Events by hour
        hour_result = await self.db.execute(
            select(
                func.extract('hour', InputEventModel.timestamp).label('hour'),
                func.count(InputEventModel.id).label('count')
            )
            .select_from(base_query.subquery())
            .group_by(func.extract('hour', InputEventModel.timestamp))
            .order_by('hour')
        )
        events_by_hour = {int(row.hour): row.count for row in hour_result}
        
        return {
            'total_events': total_events,
            'events_by_type': events_by_type,
            'events_by_hour': events_by_hour
        }