import logging
from fastapi import APIRouter, BackgroundTasks, Query, HTTPException
from typing import List, Optional
from datetime import datetime, timezone
import hashlib
from database import get_es_client, INDEX_NAME, RADAR_INDEX_NAME
from services.fetcher import fetch_all_categories
from services.processor import process_and_store_articles
from services.mcp_client import (
    get_internet_traffic_summary,
    get_global_outages,
    get_attack_summary,
    get_l3_attack_summary,
)
from services.intelligence_correlator import get_correlated_threat_intelligence
import asyncio

logger = logging.getLogger(__name__)

router = APIRouter(tags=["News"])

@router.post("/news/refresh")
async def refresh_news(background_tasks: BackgroundTasks):
    """Triggers an async fetch from all configured sources."""
    async def fetch_job():
        logger.info("Starting background news fetch...")
        raw_articles = await fetch_all_categories()
        stored = await process_and_store_articles(raw_articles)
        logger.info(f"Finished fetching. Stored {stored} new articles.")
        
    background_tasks.add_task(fetch_job)
    return {"message": "News refresh triggered in background"}

@router.get("/news")
async def get_news(
    category: Optional[str] = None, 
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    sources: Optional[List[str]] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = 0
):
    """Fetch recent news, optionally filtered by category, dates, and sources."""
    es = await get_es_client()
    
    # Base query structure for multiple filters
    bool_query = {"must": []}
    
    if category:
        bool_query["must"].append({"term": {"category": category}})
        
    if sources:
        bool_query["must"].append({"terms": {"source": sources}})
        
    if start_date or end_date:
        date_range = {}
        if start_date:
            date_range["gte"] = start_date
        if end_date:
            date_range["lte"] = end_date
        bool_query["must"].append({"range": {"date": date_range}})
        
    # If no filters exist, use match_all
    query = {"bool": bool_query} if bool_query["must"] else {"match_all": {}}
        
    try:
        res = await es.search(
            index=INDEX_NAME,
            query=query,
            sort=[{"date": {"order": "desc"}}],
            size=limit,
            from_=offset
        )
        
        articles = [hit["_source"] for hit in res["hits"]["hits"]]
        return {"total": res["hits"]["total"]["value"], "articles": articles}
    except Exception as e:
        logger.error(f"Error fetching news from ES: {e}")
        return {"total": 0, "articles": []}

@router.get("/search")
async def search_news(
    q: str = Query(..., min_length=2),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    sources: Optional[List[str]] = Query(None),
    limit: int = 20
):
    """Full-text search across all stored articles, respecting global filters."""
    es = await get_es_client()
    
    bool_query = {
        "must": [
            {
                "multi_match": {
                    "query": q,
                    "fields": ["title^2", "summary"]
                }
            }
        ]
    }
    
    if sources:
        bool_query["must"].append({"terms": {"source": sources}})
        
    if start_date or end_date:
        date_range = {}
        if start_date:
            date_range["gte"] = start_date
        if end_date:
            date_range["lte"] = end_date
        bool_query["must"].append({"range": {"date": date_range}})
    
    query = {"bool": bool_query}
    
    try:
        res = await es.search(
            index=INDEX_NAME,
            query=query,
            sort=[{"date": {"order": "desc"}}], # Alternatively _score
            size=limit
        )
        articles = [hit["_source"] for hit in res["hits"]["hits"]]
        return {"total": res["hits"]["total"]["value"], "articles": articles}
    except Exception as e:
        logger.error(f"Error searching ES: {e}")
        return {"total": 0, "articles": []}


@router.get("/radar")
async def get_radar_intelligence():
    """
    Fetch real-time Cloudflare Radar intelligence:
    global internet traffic, active outages, and DDoS/attack trends (L3 and L7).
    All calls run concurrently.
    """
    try:
        traffic, outages, attacks, l3_attacks = await asyncio.gather(
            get_internet_traffic_summary(),
            get_global_outages(),
            get_attack_summary(),
            get_l3_attack_summary(),
            return_exceptions=True,
        )
        return {
            "traffic": traffic if isinstance(traffic, str) else "",
            "outages": outages if isinstance(outages, str) else "",
            "attacks": attacks if isinstance(attacks, str) else "",
            "l3_attacks": l3_attacks if isinstance(l3_attacks, str) else "",
        }
    except Exception as e:
        logger.error(f"Error fetching Cloudflare Radar data: {e}")
        return {
            "traffic": "",
            "outages": "",
            "attacks": "",
            "l3_attacks": ""
        }

@router.post("/radar/persist")
async def persist_radar_outages(background_tasks: BackgroundTasks):
    """
    Background hook to persist the current active outages string into ES.
    The frontend or a scheduler can trigger this.
    """
    async def _persist():
        try:
            outages = await get_global_outages()
            if not isinstance(outages, str) or not outages or "No active internet outages" in outages:
                return
            
            es = await get_es_client()
            now = datetime.now(timezone.utc)
            date_str = now.strftime("%Y-%m-%d") # Use today's date for bucketing
            
            # Split lines, each line is an anomaly
            for line in outages.split('\n'):
                line = line.strip()
                if not line:
                    continue
                
                # Create a deterministic ID: hash of date + the exact content string
                content_hash = hashlib.md5((date_str + line).encode()).hexdigest()
                doc_id = f"outage_{content_hash}"
                
                doc = {
                    "id": doc_id,
                    "timestamp": now.isoformat(),
                    "event_type": "outage",
                    "title": line.split(':')[0].replace('**', '').strip() if ':' in line else "Active Outage",
                    "content": line,
                    "metadata": date_str
                }
                
                # Use index to overwrite if exists (upsert)
                await es.index(index=RADAR_INDEX_NAME, id=doc_id, document=doc)
                
        except Exception as e:
            logger.error(f"Error persisting radar outages: {e}")
            
    background_tasks.add_task(_persist)
    return {"status": "persisting"}

@router.get("/radar/threats")
async def get_radar_threats():
    """
    Returns AI-correlated threat intelligence (Threat Actors and Victims)
    combining Cloudflare Radar telemetry with local OSINT news.
    """
    try:
        data = await get_correlated_threat_intelligence()
        return data
    except Exception as e:
        logger.error(f"Error generating correlated threat intel: {e}")
        # Return fallback empty arrays so frontend doesn't crash
        return {
            "threat_actors": [],
            "victims": []
        }

@router.post("/radar/threats/persist")
async def persist_radar_threats(background_tasks: BackgroundTasks):
    """
    Background hook to persist the current threat actors and victims into ES.
    """
    async def _persist():
        try:
            data = await get_correlated_threat_intelligence()
            actors = data.get("threat_actors", [])
            victims = data.get("victims", [])
            
            if not actors and not victims:
                return
                
            es = await get_es_client()
            now = datetime.now(timezone.utc)
            date_str = now.strftime("%Y-%m-%d")
            
            for actor in actors:
                content_hash = hashlib.md5((date_str + actor['name']).encode()).hexdigest()
                doc_id = f"threat_actor_{content_hash}"
                doc = {
                    "id": doc_id,
                    "timestamp": now.isoformat(),
                    "event_type": "threat_actor",
                    "title": actor['name'],
                    "content": actor.get('description', ''),
                    "metadata": actor.get('type', '')
                }
                await es.index(index=RADAR_INDEX_NAME, id=doc_id, document=doc)
                
            for victim in victims:
                content_hash = hashlib.md5((date_str + victim['name'] + victim.get('status', '')).encode()).hexdigest()
                doc_id = f"victim_{content_hash}"
                doc = {
                    "id": doc_id,
                    "timestamp": now.isoformat(),
                    "event_type": "victim",
                    "title": victim['name'],
                    "content": victim.get('status', ''),
                    "metadata": victim.get('industry', '')
                }
                await es.index(index=RADAR_INDEX_NAME, id=doc_id, document=doc)
                
        except Exception as e:
            logger.error(f"Error persisting radar threats: {e}")
            
    background_tasks.add_task(_persist)
    return {"status": "persisting"}

@router.get("/radar/history")
async def get_radar_history(
    event_type: str = Query(..., description="Type of event: outage, threat_actor, victim"),
    limit: int = 50,
    offset: int = 0
):
    """Fetch historical radar events from Elasticsearch."""
    es = await get_es_client()
    query = {
        "bool": {
            "must": [
                {"term": {"event_type": event_type}}
            ]
        }
    }
    
    try:
        res = await es.search(
            index=RADAR_INDEX_NAME,
            query=query,
            sort=[{"timestamp": {"order": "desc"}}],
            size=limit,
            from_=offset
        )
        
        events = [hit["_source"] for hit in res["hits"]["hits"]]
        return {"total": res["hits"]["total"]["value"], "events": events}
    except Exception as e:
        logger.error(f"Error fetching radar history from ES: {e}")
        return {"total": 0, "events": []}

@router.get("/radar/threats/{actor_name}/details")
async def get_threat_actor_mcp_dossier(actor_name: str):
    """
    Fetch extended dossier on the threat actor using VirusTotal MCP tools.
    """
    try:
        from services.generic_mcp_client import get_threat_actor_dossier
        dossier = await get_threat_actor_dossier(actor_name)
        return {"actor": actor_name, "dossier": dossier}
    except Exception as e:
        logger.error(f"Error fetching MCP dossier for {actor_name}: {e}")
        return {"actor": actor_name, "dossier": f"Error: {e}"}
