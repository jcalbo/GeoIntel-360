import asyncio
import logging
from services.fetcher import fetch_rss_feed

logging.basicConfig(level=logging.DEBUG)

async def test():
    urls = [
        "https://warontherocks.com/feed/",
        "https://www.cfr.org/rss/all"
    ]
    for url in urls:
        print(f"Testing {url}")
        articles = await fetch_rss_feed(url, "Geopolitics")
        print(f"Found {len(articles)}")
        if articles:
            print(f"First item: {articles[0]['title']}")

asyncio.run(test())
