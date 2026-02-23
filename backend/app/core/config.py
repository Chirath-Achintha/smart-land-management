from pydantic_settings import BaseSettings
from pathlib import Path

# Resolve .env from the backend/ directory (parent of app/)
ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    class Config:
        env_file = str(ENV_FILE)

settings = Settings()
