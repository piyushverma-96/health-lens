import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "HealthLens AI API"
    API_V1_STR: str = "/api/v1"
    
    # Supabase Configuration
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_JWT_SECRET: Optional[str] = None
    
    # LLM Settings
    GROQ_API_KEY: str
    GROQ_MODEL: str = "qwen/qwen3.8-27b"
    
    # DB settings
    DATABASE_URL: str
    
    # OCR settings
    TESSERACT_CMD: Optional[str] = None
    
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
