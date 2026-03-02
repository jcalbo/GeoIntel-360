from fastmcp import FastMCP
import asyncio
from typing import Dict, Any, List

# Note: In a real environment, you'd likely want to ensure the ES client is initialized
from database import get_es_client, INDEX_NAME
from services.fetcher import fetch_all_categories
from services.processor import process_and_store_articles
from services.mcp_client import (
    get_cloudflare_intelligence_context,
    get_internet_traffic_summary,
    get_global_outages,
    get_attack_summary,
)

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

@mcp.tool()
async def get_cloudflare_intelligence() -> str:
    """
    Fetch real-time global internet intelligence from Cloudflare Radar via MCP.
    Returns a formatted block covering internet traffic changes, active outages,
    and DDoS/cyber-attack trends for the past 24 hours.
    """
    return await get_cloudflare_intelligence_context()

@mcp.tool()
async def get_internet_traffic() -> str:
    """Get a summary of global internet traffic changes from Cloudflare Radar (last 24h)."""
    return await get_internet_traffic_summary()

@mcp.tool()
async def get_active_outages() -> str:
    """Get information about active internet outages worldwide as detected by Cloudflare Radar."""
    return await get_global_outages()

@mcp.tool()
async def get_cyber_attack_trends() -> str:
    """Get a summary of recent DDoS attacks and cyber-attack trends from Cloudflare Radar."""
    return await get_attack_summary()

if __name__ == "__main__":
    mcp.run()
