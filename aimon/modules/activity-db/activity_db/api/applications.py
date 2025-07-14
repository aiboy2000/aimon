"""API routes for applications."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db

router = APIRouter()

@router.get("/")
async def list_applications(db: AsyncSession = Depends(get_db)):
    """List applications - placeholder."""
    return {"message": "Applications endpoint - to be implemented"}

@router.post("/")  
async def create_application(db: AsyncSession = Depends(get_db)):
    """Create application - placeholder."""
    return {"message": "Create application - to be implemented"}