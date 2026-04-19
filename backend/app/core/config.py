from pydantic_settings import BaseSettings
from pathlib import Path

# Resolve .env from the backend/ directory (parent of app/)
ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"

class Settings(BaseSettings):
    DATABASE_URL: str = "mongodb+srv://sithum:ueWaPwIL7bTESjeu@cluster0.yckakom.mongodb.net/smart_land_db?retryWrites=true&w=majority"
    SECRET_KEY: str = "93f6d4da3b1fd5c200979e98ad6bac71a3b951a711f70c12b97cf09edfcf5e50"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    USE_GOOGLE_DNS_FOR_MONGO: bool = False

    # Email configurations
    EMAIL_HOST: str = "smtp.gmail.com"
    EMAIL_PORT: int = 587
    EMAIL_USER: str = "managementsmartland@gmail.com"
    EMAIL_PASSWORD: str = "bqzc ngom xknv mucq"

    class Config:
        env_file = str(ENV_FILE)

settings = Settings()
