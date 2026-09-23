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
    # Model used for long-form report generation (explanation, summary).
    # Needs to be a capable model for coherent clinical narrative.
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    # Faster model used for structured biomarker extraction.
    # Must support JSON mode. Smaller/faster = fewer instructor retry loops.
    GROQ_EXTRACTION_MODEL: str = "openai/gpt-oss-20b"

    # Maximum characters of OCR text sent to Groq for biomarker extraction.
    # Prevents unnecessarily large token payloads from scanned PDFs.
    # Increase if reports are being truncated and biomarkers missed.
    MAX_GROQ_INPUT_CHARS: int = 8000
    
    # DB settings
    DATABASE_URL: str
    
    # OCR settings
    TESSERACT_CMD: Optional[str] = None

    # Poppler binary path for pdf2image (scanned PDF rasterisation).
    # Windows: set to the /bin subfolder of your Poppler installation.
    # Linux/Docker: leave blank — poppler-utils is found on PATH automatically.
    POPPLER_PATH: Optional[str] = None

    # Maximum seconds to wait for Tesseract OCR on a single PDF page.
    # Pages that exceed this are skipped with a warning rather than hanging.
    OCR_PAGE_TIMEOUT: int = 30
    
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
