"""API routes for screenshots."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db

router = APIRouter()

@router.get("/")
async def list_screenshots(db: AsyncSession = Depends(get_db)):
    """List screenshots - placeholder."""
    return {"message": "Screenshots endpoint - to be implemented"}

@router.post("/")
async def create_screenshot(db: AsyncSession = Depends(get_db)):
    """Create screenshot - placeholder."""
    return {"message": "Create screenshot - to be implemented"}