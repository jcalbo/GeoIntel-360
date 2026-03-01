from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Article(BaseModel):
    id: str
    title: str
    source: str
    date: datetime
    summary: str
    url: str
    category: str
    ai_analysis: Optional[str] = None
    title_hash: str

class SummarizeRequest(BaseModel):
    text: str
    article_id: Optional[str] = None

class SummarizeResponse(BaseModel):
    summary: str
