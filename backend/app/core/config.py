from pydantic_settings import BaseSettings
from pydantic import model_validator
from functools import lru_cache


class Settings(BaseSettings):
    PROJECT_NAME: str = "vscx"
    VERSION: str = "0.1.0"
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str = "postgresql+asyncpg://vscx:vscx@postgres:5432/vscx"

    SECRET_KEY: str = "changeme-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    REDIS_URL: str = "redis://redis:6379/0"
    CELERY_BROKER_URL: str = "redis://redis:6379/1"

    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:8000"]

    ALLOW_PRIVATE_TARGETS: bool = False

    NVD_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None
    ANTHROPIC_API_KEY: str | None = None
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    @model_validator(mode='after')
    def validate_secret_key(self):
        if self.SECRET_KEY == "changeme-in-production":
            raise ValueError("SECRET_KEY cannot be the default value. Set a secure secret key in environment variables.")
        return self

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()
