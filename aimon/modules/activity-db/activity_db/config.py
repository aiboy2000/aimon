"""Configuration management for activity-db service."""

import os
from typing import Optional
from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Database configuration
    database_url: str = Field(
        default="sqlite+aiosqlite:///./activity_monitor.db",
        env="DATABASE_URL",
        description="Database connection URL"
    )
    
    # API configuration
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8080, env="PORT")
    debug: bool = Field(default=False, env="DEBUG")
    reload: bool = Field(default=False, env="RELOAD")
    
    # Security
    secret_key: str = Field(
        default="your-secret-key-change-in-production",
        env="SECRET_KEY"
    )
    algorithm: str = Field(default="HS256", env="ALGORITHM")
    access_token_expire_minutes: int = Field(
        default=30, 
        env="ACCESS_TOKEN_EXPIRE_MINUTES"
    )
    
    # API versioning
    api_v1_prefix: str = "/api/v1"
    
    # Pagination
    default_page_size: int = Field(default=50, env="DEFAULT_PAGE_SIZE")
    max_page_size: int = Field(default=1000, env="MAX_PAGE_SIZE")
    
    # Data retention
    data_retention_days: int = Field(default=90, env="DATA_RETENTION_DAYS")
    cleanup_interval_hours: int = Field(default=24, env="CLEANUP_INTERVAL_HOURS")
    
    # Message queue configuration (optional)
    rabbitmq_url: Optional[str] = Field(default=None, env="RABBITMQ_URL")
    rabbitmq_exchange: str = Field(default="activity_events", env="RABBITMQ_EXCHANGE")
    rabbitmq_queue: str = Field(default="activity_db_queue", env="RABBITMQ_QUEUE")
    
    # Logging
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    log_format: str = Field(default="json", env="LOG_FORMAT")
    
    # CORS configuration
    cors_origins: list[str] = Field(
        default=["http://localhost:3000", "http://localhost:8080"],
        env="CORS_ORIGINS"
    )
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Get application settings."""
    return settings