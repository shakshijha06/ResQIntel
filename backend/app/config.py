import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ResQIntel Intelligence Platform"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Storage abstraction: "mongodb" or "json"
    STORAGE_BACKEND: str = "json"
    JSON_DATA_DIR: str = ""

    def get_resolved_data_dir(self) -> str:
        if self.JSON_DATA_DIR and os.path.isabs(self.JSON_DATA_DIR):
            return self.JSON_DATA_DIR
        # Default to backend/data relative to config.py
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        return os.path.join(backend_dir, "data")
    
    # MongoDB Atlas config
    MONGODB_URI: str = ""
    MONGODB_DB_NAME: str = "resqintel"
    
    # Authentication & Security
    # REQUIRED: Set JWT_SECRET_KEY in .env — no production default is provided here
    JWT_SECRET_KEY: str = ""
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120

    # Login rate limiting (in-memory per IP)
    LOGIN_MAX_ATTEMPTS: int = 10
    LOGIN_LOCKOUT_MINUTES: int = 15

    # Initial Super Admin bootstrap — configure via .env only
    # Set these in .env before first run. Defaults are intentionally weak
    # so production is never accidentally exposed.
    BOOTSTRAP_ADMIN_EMAIL: str = "admin@resqintel.org"
    BOOTSTRAP_ADMIN_PASSWORD: str = ""
    BOOTSTRAP_ADMIN_NAME: str = "Operations Lead"
    
    # Gemini AI Configuration
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    class Config:
        env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
        extra = "allow"

settings = Settings()
