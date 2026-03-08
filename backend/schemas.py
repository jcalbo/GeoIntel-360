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
    fetch_type: Optional[str] = None
    ai_analysis: Optional[str] = None
    title_hash: str

class SummarizeRequest(BaseModel):
    text: str
    article_id: Optional[str] = None
    context_articles: Optional[list[dict]] = None

class SummarizeResponse(BaseModel):
    summary: str
