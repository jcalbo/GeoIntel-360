from fastmcp import FastMCP
import asyncio
from typing import Dict, Any, List

# Note: In a real environment, you'd likely want to ensure the ES client is initialized
from database import get_es_client, INDEX_NAME
from services.fetcher import fetch_all_categories
from services.processor import process_and_store_articles

mcp = FastMCP("GeoIntel-360")

@mcp.tool()
async def fetch_and_store_latest_news() -> str:
    """Fetch the latest OSINT news from all configured sources and store it in Elasticsearch."""
    raw_articles = await fetch_all_categories()
    stored = await process_and_store_articles(raw_articles)
    return f"Successfully fetched and stored {stored} new non-duplicate articles."

@mcp.tool()
async def search_geointel_database(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Search the local Elasticsearch database for stored intelligence articles using a text query."""
    es = await get_es_client()
    try:
        res = await es.search(
            index=INDEX_NAME,
            query={
                "multi_match": {
                    "query": query,
                    "fields": ["title^2", "summary"]
                }
            },
            size=limit
        )
        return [hit["_source"] for hit in res["hits"]["hits"]]
    except Exception as e:
        return [{"error": str(e)}]

@mcp.tool()
async def get_recent_news_by_category(category: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Get the most recent articles for a specific category (e.g., 'Geopolitics', 'Cybersecurity', 'Economics')."""
    es = await get_es_client()
    try:
        res = await es.search(
            index=INDEX_NAME,
            query={"term": {"category": category}},
            sort=[{"date": {"order": "desc"}}],
            size=limit
        )
        return [hit["_source"] for hit in res["hits"]["hits"]]
    except Exception as e:
        return [{"error": str(e)}]

if __name__ == "__main__":
    mcp.run()
