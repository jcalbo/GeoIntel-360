import hashlib
import uuid
from typing import List, Dict, Any
from dateutil import parser
from database import get_es_client, INDEX_NAME
import logging

logger = logging.getLogger(__name__)

def generate_title_hash(title: str) -> str:
    """Generate SHA-256 hash of the title string to detect duplicates."""
    return hashlib.sha256(title.strip().lower().encode('utf-8')).hexdigest()

def normalize_date(date_str: str) -> str:
    """Normalize various date formats into ISO 8601."""
    try:
        dt = parser.parse(date_str)
        return dt.isoformat()
    except Exception:
        from datetime import datetime
        return datetime.now().isoformat()

async def process_and_store_articles(articles: List[Dict[str, Any]]) -> int:
    """Normalize articles and store non-duplicates in Elasticsearch."""
    es = await get_es_client()
    stored_count = 0
    
    for item in articles:
        title = item.get("title", "")
        if not title:
            continue
            
        title_hash = generate_title_hash(title)
        
        # Check if hash already exists in ES
        try:
            # Simple match query for the keyword
            res = await es.search(
                index=INDEX_NAME, 
                query={"term": {"title_hash": title_hash}},
                size=1
            )
            
            if res['hits']['total']['value'] > 0:
                logger.debug(f"Article '{title}' already exists. Skipping.")
                continue
                
            # Normalize and store
            article_doc = {
                "id": str(uuid.uuid4()),
                "title": title,
                "source": item.get("source", "Unknown"),
                "date": normalize_date(item.get("date", "")),
                "summary": item.get("summary", ""),
                "url": item.get("url", ""),
                "category": item.get("category", "General"),
                "fetch_type": item.get("fetch_type", "RSS"),
                "ai_analysis": None,
                "title_hash": title_hash
            }
            
            await es.index(index=INDEX_NAME, document=article_doc)
            stored_count += 1
            
        except Exception as e:
            logger.error(f"Error processing article '{title}': {e}")
            
    return stored_count
