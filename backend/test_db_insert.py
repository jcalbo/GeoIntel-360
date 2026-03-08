import asyncio
from services.fetcher import fetch_newsapi
from services.processor import process_and_store_articles, generate_title_hash, normalize_date
from database import get_es_client, INDEX_NAME
import uuid

async def test_insert():
    articles = await fetch_newsapi()
    if not articles: return
    
    item = articles[0]
    title = item["title"]
    title_hash = generate_title_hash(title)
    
    es = await get_es_client()
    res = await es.search(index=INDEX_NAME, query={"term": {"title_hash": title_hash}}, size=1)
    
    if res['hits']['total']['value'] > 0:
        print(f"Article '{title}' already exists. Skipping.")
    else:
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
        try:
            await es.index(index=INDEX_NAME, document=article_doc)
            print("Successfully inserted raw dict!")
        except Exception as e:
            print(f"ES Index Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_insert())
