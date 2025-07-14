"""Database connection and session management."""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
from .config import get_settings
from .models import Base

settings = get_settings()

# Create async engine
if settings.database_url.startswith("sqlite"):
    # SQLite-specific configuration
    engine = create_async_engine(
        settings.database_url,
        connect_args={
            "check_same_thread": False,
        },
        poolclass=StaticPool,
        echo=settings.debug,
    )
else:
    # PostgreSQL or other databases
    engine = create_async_engine(
        settings.database_url,
        echo=settings.debug,
    )

# Create session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def create_tables() -> None:
    """Create all database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def drop_tables() -> None:
    """Drop all database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database with tables and default data."""
    await create_tables()
    
    # Create default API key for development
    if settings.debug:
        from .services.api_key_service import APIKeyService
        from .schemas import APIKeyCreate
        
        async with AsyncSessionLocal() as session:
            api_key_service = APIKeyService(session)
            
            # Check if default key exists
            existing_key = await api_key_service.get_by_key_id("dev-key")
            if not existing_key:
                await api_key_service.create(
                    APIKeyCreate(
                        name="Development Key",
                        description="Default API key for development",
                        permissions=["*"],  # All permissions
                    ),
                    key_id="dev-key"
                )
                await session.commit()


async def cleanup_old_data() -> None:
    """Clean up old data based on retention policy."""
    from datetime import datetime, timedelta
    from sqlalchemy import delete
    from .models import InputEvent, Screenshot, ActivitySummary
    
    cutoff_date = datetime.utcnow() - timedelta(days=settings.data_retention_days)
    
    async with AsyncSessionLocal() as session:
        # Delete old input events
        await session.execute(
            delete(InputEvent).where(InputEvent.timestamp < cutoff_date)
        )
        
        # Delete old screenshots
        await session.execute(
            delete(Screenshot).where(Screenshot.timestamp < cutoff_date)
        )
        
        # Keep summaries longer (for historical analysis)
        summary_cutoff = datetime.utcnow() - timedelta(days=settings.data_retention_days * 2)
        await session.execute(
            delete(ActivitySummary).where(ActivitySummary.date < summary_cutoff)
        )
        
        await session.commit()