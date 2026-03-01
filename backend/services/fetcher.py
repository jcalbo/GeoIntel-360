import os
import httpx
from bs4 import BeautifulSoup
import logging
from typing import List, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

# RSS Feed URLs
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

async def fetch_rss_feed(url: str, category: str) -> List[Dict[str, Any]]:
    """Fetch an RSS feed and parse it using BeautifulSoup."""
    articles = []
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/rss+xml, application/xml, text/xml, */*"
    }
    
    try:
        async with httpx.AsyncClient(headers=headers, follow_redirects=True) as client:
            response = await client.get(url, timeout=10.0)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, features="xml")
            items = soup.find_all("item")
            
            for item in items:
                title = item.find("title").text if item.find("title") else "No Title"
                link = item.find("link").text if item.find("link") else ""
                pubDate = item.find("pubDate").text if item.find("pubDate") else datetime.now().isoformat()
                description = item.find("description").text if item.find("description") else ""
                
                # Basic cleanup of description
                summary = BeautifulSoup(description, "html.parser").get_text()[:300] + "..." if description else ""

                articles.append({
                    "title": title,
                    "url": link,
                    "source": url,
                    "date": pubDate,
                    "summary": summary,
                    "category": category
                })
    except Exception as e:
        logger.error(f"Error fetching RSS {url}: {e}")
    
    return articles

async def fetch_all_categories() -> List[Dict[str, Any]]:
    """Fetch recent news across all categories."""
    all_articles = []
    for category, urls in RSS_FEEDS.items():
        for url in urls:
            articles = await fetch_rss_feed(url, category)
            all_articles.extend(articles)
    return all_articles
