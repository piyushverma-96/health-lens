from pydantic import BaseModel
from datetime import datetime
from typing import List, Dict, Any, Optional

class ChatSessionCreate(BaseModel):
    title: Optional[str] = "New Chat"

class ChatSessionResponse(BaseModel):
    id: str
    user_id: str
    title: str
    created_at: datetime
    updated_at: datetime

class ChatMessageCreate(BaseModel):
    content: str

class ChatMessageResponse(BaseModel):
    id: str
    session_id: str
    sender: str
    content: str
    sources: List[Dict[str, Any]]
    created_at: datetime
