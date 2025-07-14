"""Main FastAPI application for activity-db service."""

import asyncio
from contextlib import asynccontextmanager
from datetime import datetime
from typing import AsyncGenerator

import structlog
import uvicorn
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .config import get_settings
from .database import init_db, cleanup_old_data, get_db
from .schemas import HealthCheck
from .api import events, sessions, applications, summaries, screenshots


# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()
settings = get_settings()

# Security
security = HTTPBearer(auto_error=False)


async def periodic_cleanup():
    """Periodic cleanup task for old data."""
    while True:
        try:
            await cleanup_old_data()
            logger.info("Completed periodic data cleanup")
        except Exception as e:
            logger.error("Error during periodic cleanup", error=str(e))
        
        # Wait for next cleanup interval
        await asyncio.sleep(settings.cleanup_interval_hours * 3600)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan events."""
    # Startup
    logger.info("Starting activity-db service", version="0.1.0")
    
    # Initialize database
    await init_db()
    logger.info("Database initialized")
    
    # Start periodic cleanup task
    cleanup_task = asyncio.create_task(periodic_cleanup())
    
    try:
        yield
    finally:
        # Shutdown
        cleanup_task.cancel()
        try:
            await cleanup_task
        except asyncio.CancelledError:
            pass
        logger.info("Activity-db service stopped")


# Create FastAPI app
app = FastAPI(
    title="Activity Database API",
    description="Data storage and API service for AI Activity Monitor",
    version="0.1.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Simple API key authentication (for production, use proper OAuth2/JWT)
async def verify_api_key(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """Verify API key from Authorization header."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # In development, accept any key starting with 'dev-'
    if settings.debug and credentials.credentials.startswith('dev-'):
        return credentials.credentials
    
    # TODO: Implement proper API key validation with database lookup
    # For now, accept any non-empty key
    if not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return credentials.credentials


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": "activity-db",
        "version": "0.1.0",
        "status": "running",
        "docs": "/docs" if settings.debug else "disabled"
    }


# Health check endpoint
@app.get("/health", response_model=HealthCheck)
async def health_check():
    """Health check endpoint."""
    return HealthCheck(
        status="healthy",
        timestamp=datetime.utcnow(),
        version="0.1.0",
        database="connected"  # TODO: Check actual database connection
    )


# Include API routers
app.include_router(
    events.router,
    prefix=settings.api_v1_prefix + "/events",
    tags=["events"],
    dependencies=[Depends(verify_api_key)]
)

app.include_router(
    sessions.router,
    prefix=settings.api_v1_prefix + "/sessions",
    tags=["sessions"],
    dependencies=[Depends(verify_api_key)]
)

app.include_router(
    applications.router,
    prefix=settings.api_v1_prefix + "/applications",
    tags=["applications"],
    dependencies=[Depends(verify_api_key)]
)

app.include_router(
    summaries.router,
    prefix=settings.api_v1_prefix + "/summaries",
    tags=["summaries"],
    dependencies=[Depends(verify_api_key)]
)

app.include_router(
    screenshots.router,
    prefix=settings.api_v1_prefix + "/screenshots",
    tags=["screenshots"],
    dependencies=[Depends(verify_api_key)]
)


def main():
    """Main entry point."""
    uvicorn.run(
        "activity_db.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
        log_level=settings.log_level.lower(),
    )


if __name__ == "__main__":
    main()