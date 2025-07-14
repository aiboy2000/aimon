"""API routes for activity summaries."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db

router = APIRouter()

@router.get("/")
async def list_summaries(db: AsyncSession = Depends(get_db)):
    """List summaries - placeholder."""
    return {"message": "Summaries endpoint - to be implemented"}

@router.post("/")
async def create_summary(db: AsyncSession = Depends(get_db)):
    """Create summary - placeholder."""
    return {"message": "Create summary - to be implemented"}