"""Service for API key management."""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..models import APIKey as APIKeyModel
from ..schemas import APIKeyCreate, APIKey


class APIKeyService:
    """Service for API key operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create(self, key_data: APIKeyCreate, key_id: str) -> APIKey:
        """Create a new API key."""
        db_key = APIKeyModel(
            key_id=key_id,
            hashed_key="placeholder_hash",  # TODO: Implement proper hashing
            **key_data.model_dump()
        )
        self.db.add(db_key)
        await self.db.flush()
        await self.db.refresh(db_key)
        return APIKey.model_validate(db_key)
    
    async def get_by_key_id(self, key_id: str) -> Optional[APIKey]:
        """Get API key by key_id."""
        result = await self.db.execute(
            select(APIKeyModel).where(APIKeyModel.key_id == key_id)
        )
        db_key = result.scalar_one_or_none()
        return APIKey.model_validate(db_key) if db_key else None