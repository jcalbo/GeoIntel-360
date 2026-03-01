import os
import httpx
from bs4 import BeautifulSoup
import logging
import asyncio
from typing import List, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

# --- RSS Configuration ---
RSS_FEEDS = {
    "Geopolitics": [
        os.getenv("RSS_WAR_ON_THE_ROCKS", "https://warontherocks.com/feed/"),
        os.getenv("RSS_CFR", "https://www.cfr.org/articles/feed")
    ],
    "Cybersecurity": [
        os.getenv("RSS_HACKER_NEWS", "https://feeds.feedburner.com/TheHackersNews"),
        os.getenv("RSS_CISA_ALERTS", "https://www.cisa.gov/cybersecurity-advisories/all.xml"),
        os.getenv("RSS_BLEEPING_COMPUTER", "https://www.bleepingcomputer.com/feed/")
    ],
    "Economics": [
        os.getenv("RSS_BRUEGEL", "https://www.bruegel.org/rss.xml")
    ]
}

# --- HTTP Utility ---
async def get_json(url: str, params: dict = None, headers: dict = None) -> dict:
    default_headers = {
        "User-Agent": "GeoIntel-360-Bot/1.0"
    }
    hdrs = {**default_headers, **(headers or {})}
    try:
        async with httpx.AsyncClient(headers=hdrs, follow_redirects=True) as client:
            resp = await client.get(url, params=params, timeout=15.0)
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        logger.error(f"Error fetching JSON from {url}: {e}")
        return {}


# --- RSS Fetcher ---
async def fetch_rss_feed(url: str, category: str) -> List[Dict[str, Any]]:
    """Fetch an RSS feed and parse it using BeautifulSoup."""
    articles = []
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/rss+xml, application/xml, text/xml, */*"
    }
    try:
        async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
            response = await client.get(url, timeout=10.0)
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, features="xml")
                items = soup.find_all("item")
                
                for item in items:
                    title = item.find("title").text if item.find("title") else "No Title"
                    link = item.find("link").text if item.find("link") else ""
                    pubDate = item.find("pubDate").text if item.find("pubDate") else datetime.now().isoformat()
                    description = item.find("description").text if item.find("description") else ""
                    summary = BeautifulSoup(description, "html.parser").get_text()[:300] + "..." if description else ""

                    articles.append({
                        "title": title,
                        "url": link,
                        "source": url,
                        "date": pubDate,
                        "summary": summary,
                        "category": category,
                        "fetch_type": "RSS"
                    })
    except Exception as e:
        logger.error(f"Error fetching RSS {url}: {e}")
    return articles

# --- REST API Fetchers ---
async def fetch_newsapi() -> List[Dict[str, Any]]:
    key = os.getenv("NEWSAPI_KEY")
    if not key or "your_" in key: return []
    
    url = "https://newsapi.org/v2/top-headlines"
    data = await get_json(url, params={"category": "general", "language": "en", "pageSize": 10, "apiKey": key})
    
    articles = []
    for item in data.get("articles", []):
        if item.get("title") and item.get("url") and item.title != "[Removed]":
            articles.append({
                "title": item["title"],
                "url": item["url"],
                "source": item.get("source", {}).get("name", "NewsAPI"),
                "date": item.get("publishedAt", datetime.now().isoformat()),
                "summary": item.get("description", "") or "",
                "category": "Geopolitics",
                "fetch_type": "API"
            })
    return articles

async def fetch_gnews() -> List[Dict[str, Any]]:
    key = os.getenv("GNEWS_API_KEY")
    if not key or "your_" in key: return []
    
    url = "https://gnews.io/api/v4/top-headlines"
    data = await get_json(url, params={"category": "world", "lang": "en", "apikey": key, "max": 10})
    
    articles = []
    for item in data.get("articles", []):
        articles.append({
            "title": item["title"],
            "url": item["url"],
            "source": item.get("source", {}).get("name", "GNews"),
            "date": item.get("publishedAt", datetime.now().isoformat()),
            "summary": item.get("description", "") or "",
            "category": "Geopolitics",
            "fetch_type": "API"
        })
    return articles

async def fetch_newsdata() -> List[Dict[str, Any]]:
    key = os.getenv("NEWSDATA_API_KEY")
    if not key or "your_" in key: return []
    
    url = "https://newsdata.io/api/1/news"
    data = await get_json(url, params={"apikey": key, "category": "politics,world", "language": "en"})
    
    articles = []
    for item in data.get("results", []):
        articles.append({
            "title": item.get("title", ""),
            "url": item.get("link", ""),
            "source": item.get("source_id", "NewsData.io"),
            "date": item.get("pubDate", datetime.now().isoformat()),
            "summary": item.get("description", "") or "",
            "category": "Geopolitics",
            "fetch_type": "API"
        })
    return articles

async def fetch_alpha_vantage() -> List[Dict[str, Any]]:
    key = os.getenv("ALPHA_VANTAGE_API_KEY")
    if not key or "your_" in key: return []
    
    url = "https://www.alphavantage.co/query"
    data = await get_json(url, params={"function": "NEWS_SENTIMENT", "topics": "economy_macro", "limit": 10, "apikey": key})
    
    articles = []
    for item in data.get("feed", []):
        articles.append({
            "title": item.get("title", ""),
            "url": item.get("url", ""),
            "source": item.get("source", "Alpha Vantage"),
            "date": item.get("time_published", datetime.now().isoformat()),
            "summary": item.get("summary", "") or "",
            "category": "Economics",
            "fetch_type": "API"
        })
    return articles

# --- Orchestrator ---
async def fetch_all_categories() -> List[Dict[str, Any]]:
    """Fetch recent news across all sources (RSS + REST APIs) simultaneously."""
    tasks = []
    
    # Queue up RSS tasks
    for category, urls in RSS_FEEDS.items():
        for url in urls:
            tasks.append(fetch_rss_feed(url, category))
            
    # Queue up REST API tasks
    tasks.append(fetch_newsapi())
    tasks.append(fetch_gnews())
    tasks.append(fetch_newsdata())
    tasks.append(fetch_alpha_vantage())
    
    # Execute all concurrently
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    all_articles = []
    for res in results:
        if isinstance(res, Exception):
            logger.error(f"Fetch task failed with exception: {res}")
        elif isinstance(res, list):
            all_articles.extend(res)
            
    return all_articles
