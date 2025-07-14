"""API routes for sessions."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db

router = APIRouter()

@router.get("/")
async def list_sessions(db: AsyncSession = Depends(get_db)):
    """List sessions - placeholder."""
    return {"message": "Sessions endpoint - to be implemented"}

@router.post("/")
async def create_session(db: AsyncSession = Depends(get_db)):
    """Create session - placeholder.""" 
    return {"message": "Create session - to be implemented"}