import logging
from fastapi import APIRouter, BackgroundTasks, Query
from typing import List, Optional
from database import get_es_client, INDEX_NAME
from services.fetcher import fetch_all_categories
from services.processor import process_and_store_articles

logger = logging.getLogger(__name__)

router = APIRouter(tags=["News"])

@router.post("/news/refresh")
async def refresh_news(background_tasks: BackgroundTasks):
    """Triggers an async fetch from all configured sources."""
    async def fetch_job():
        logger.info("Starting background news fetch...")
        raw_articles = await fetch_all_categories()
        stored = await process_and_store_articles(raw_articles)
        logger.info(f"Finished fetching. Stored {stored} new articles.")
        
    background_tasks.add_task(fetch_job)
    return {"message": "News refresh triggered in background"}

@router.get("/news")
async def get_news(
    category: Optional[str] = None, 
    limit: int = Query(20, ge=1, le=100),
    offset: int = 0
):
    """Fetch recent news, optionally filtered by category."""
    es = await get_es_client()
    
    query = {"match_all": {}}
    if category:
        query = {"term": {"category": category}}
        
    try:
        res = await es.search(
            index=INDEX_NAME,
            query=query,
            sort=[{"date": {"order": "desc"}}],
            size=limit,
            from_=offset
        )
        
        articles = [hit["_source"] for hit in res["hits"]["hits"]]
        return {"total": res["hits"]["total"]["value"], "articles": articles}
    except Exception as e:
        logger.error(f"Error fetching news from ES: {e}")
        return {"total": 0, "articles": []}

@router.get("/search")
async def search_news(q: str = Query(..., min_length=2), limit: int = 20):
    """Full-text search across all stored articles."""
    es = await get_es_client()
    
    query = {
        "multi_match": {
            "query": q,
            "fields": ["title^2", "summary"]
        }
    }
    
    try:
        res = await es.search(
            index=INDEX_NAME,
            query=query,
            sort=[{"date": {"order": "desc"}}], # Alternatively _score
            size=limit
        )
        articles = [hit["_source"] for hit in res["hits"]["hits"]]
        return {"total": res["hits"]["total"]["value"], "articles": articles}
    except Exception as e:
        logger.error(f"Error searching ES: {e}")
        return {"total": 0, "articles": []}
