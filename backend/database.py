import os
import logging
from elasticsearch import AsyncElasticsearch
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

ES_URL = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")
INDEX_NAME = "geointel_articles"
RADAR_INDEX_NAME = "geointel_radar_events"

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
            
        # Initialize Radar events index
        radar_exists = await es_client.indices.exists(index=RADAR_INDEX_NAME)
        if not radar_exists:
            radar_mapping = {
                "mappings": {
                    "date_detection": False,
                    "properties": {
                        "id": {"type": "keyword"},
                        "timestamp": {"type": "date"},
                        "event_type": {"type": "keyword"}, # e.g. "outage", "threat_actor", "victim"
                        "title": {"type": "text"},
                        "content": {"type": "text"},
                        "metadata": {"type": "keyword"}
                    }
                }
            }
            await es_client.indices.create(index=RADAR_INDEX_NAME, body=radar_mapping)
            logger.info(f"Created index: {RADAR_INDEX_NAME}")
        else:
            logger.info(f"Index {RADAR_INDEX_NAME} already exists.")
            
    except Exception as e:
        logger.error(f"Error initializing Elasticsearch: {e}")

async def get_es_client():
    return es_client
