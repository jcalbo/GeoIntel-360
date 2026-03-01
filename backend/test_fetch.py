import asyncio
import logging
from services.fetcher import fetch_all_categories
from services.processor import process_and_store_articles
from database import init_db

logging.basicConfig(level=logging.DEBUG)

async def test():
    await init_db()
    print("Fetching...")
    raw = await fetch_all_categories()
    print(f"Fetched {len(raw)} articles.")
    stored = await process_and_store_articles(raw)
    print(f"Stored {stored} articles.")

asyncio.run(test())
