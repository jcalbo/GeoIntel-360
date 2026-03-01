import asyncio
import logging
from database import get_es_client, INDEX_NAME

logging.basicConfig(level=logging.DEBUG)

async def test_search():
    es = await get_es_client()
    query = {"match_all": {}}
    try:
        res = await es.search(
            index=INDEX_NAME,
            query=query,
            sort=[{"date": {"order": "desc"}}],
            size=20,
            from_=0
        )
        print(f"Total found: {res['hits']['total']['value']}")
        articles = [hit["_source"] for hit in res["hits"]["hits"]]
        print(f"Parsed {len(articles)} articles.")
    except Exception as e:
        print(f"Error querying ES: {e}")

asyncio.run(test_search())
