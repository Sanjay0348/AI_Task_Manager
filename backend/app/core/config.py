from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/taskdb"
    async_database_url: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/taskdb"
    )

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Google Gemini API
    gemini_api_key: str = ""

    # JWT
    secret_key: str = "your-secret-key-change-this-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # CORS
    allowed_origins: List[str] = ["http://localhost:3000"]

    # Environment
    environment: str = "development"
    debug: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
