from pydantic import BaseModel
from datetime import date
from typing import Optional

class BiomarkerResponse(BaseModel):
    id: str
    report_id: str
    user_id: str
    name: str
    value: float
    unit: str
    reference_range: Optional[str] = None
    status: str
    recorded_at: date
