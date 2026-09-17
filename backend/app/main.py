import shutil
import pytesseract
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.reports import router as reports_router
from app.api.biomarkers import router as biomarkers_router
from app.api.chat import router as chat_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Include API Routers
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(biomarkers_router, prefix=settings.API_V1_STR)
app.include_router(chat_router, prefix=settings.API_V1_STR)

# Set up CORS middleware to allow requests from the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Tesseract CLI path on Windows if specified in settings
if settings.TESSERACT_CMD:
    pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD

@app.on_event("startup")
def startup_event():
    from app.core.db import init_db_pool, is_db_available

    try:
        init_db_pool()
    except Exception as exc:
        app.state.startup_warning = f"Database initialization failed: {exc}"

    if is_db_available():
        try:
            from app.services.rag import seed_medical_knowledge_if_empty
            seed_medical_knowledge_if_empty()
        except Exception as exc:
            app.state.startup_warning = f"RAG seed skipped: {exc}"

@app.on_event("shutdown")
def shutdown_event():
    from app.core.db import close_db_pool
    close_db_pool()

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Welcome to HealthLens AI API"}

@app.get(f"{settings.API_V1_STR}/health")
def health_check():
    from app.core.db import is_db_available, last_db_error

    db_available = is_db_available()
    return {
        "status": "healthy" if db_available else "degraded",
        "project": settings.PROJECT_NAME,
        "ocr_available": bool(settings.TESSERACT_CMD or shutil.which("tesseract")),
        "db_available": db_available,
        "db_error": None if db_available else last_db_error,
        "startup_warning": getattr(app.state, "startup_warning", None),
    }
