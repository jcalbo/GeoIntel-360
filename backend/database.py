import os
import logging
from elasticsearch import AsyncElasticsearch
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

ES_URL = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")
INDEX_NAME = "geointel_articles"

# Initialize Async Elasticsearch client
es_client = AsyncElasticsearch(ES_URL)

async def init_db():
    """Initialize Elasticsearch index with proper mappings if it doesn't exist."""
    try:
        exists = await es_client.indices.exists(index=INDEX_NAME)
        if not exists:
            mapping = {
                "mappings": {
                    "properties": {
                        "id": {"type": "keyword"},
                        "title": {"type": "text"},
                        "source": {"type": "keyword"},
                        "date": {"type": "date"},
                        "summary": {"type": "text"},
                        "url": {"type": "keyword"},
                        "category": {"type": "keyword"},
                        "ai_analysis": {"type": "text"},
                        "title_hash": {"type": "keyword"} # Used for deduplication
                    }
                }
            }
            await es_client.indices.create(index=INDEX_NAME, body=mapping)
            logger.info(f"Created index: {INDEX_NAME}")
        else:
            logger.info(f"Index {INDEX_NAME} already exists.")
    except Exception as e:
        logger.error(f"Error initializing Elasticsearch: {e}")

async def get_es_client():
    return es_client
