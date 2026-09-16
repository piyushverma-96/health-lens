from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, List
from app.models.biomarker import BiomarkerResponse

class ReportCreate(BaseModel):
    file_path: str
    file_name: str
    mime_type: str
    recorded_at: date

class ReportResponse(BaseModel):
    id: str
    user_id: str
    file_path: str
    file_name: str
    mime_type: str
    status: str
    raw_ocr_text: Optional[str] = None
    summary: Optional[str] = None
    explanation: Optional[str] = None
    error_message: Optional[str] = None
    patient_name: Optional[str] = None
    is_mismatched: Optional[bool] = False
    approved_for_history: Optional[bool] = False
    recorded_at: date
    uploaded_at: datetime
    updated_at: datetime
    biomarkers: Optional[List[BiomarkerResponse]] = None
