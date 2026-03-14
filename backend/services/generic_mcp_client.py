"""
VirusTotal Threat Intelligence Client
Queries the VirusTotal REST API to gather threat actor intelligence,
then uses the Gemini LLM to synthesize a dossier.
"""
import os
import logging
import httpx
import json

logger = logging.getLogger(__name__)

VT_API_BASE = "https://www.virustotal.com/api/v3"


async def _vt_get(endpoint: str, api_key: str) -> dict:
    """Helper to make an authenticated GET request to VirusTotal."""
    headers = {"x-apikey": api_key, "Accept": "application/json"}
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(f"{VT_API_BASE}{endpoint}", headers=headers)
        resp.raise_for_status()
        return resp.json()


def _truncate(text: str, max_len: int = 3000) -> str:
    return text[:max_len] + "..." if len(text) > max_len else text


async def get_threat_actor_dossier(actor_name: str) -> str:
    """
    Gathers VirusTotal intelligence on a threat actor and synthesizes a dossier
    using the Gemini LLM.
    """
    api_key = os.getenv("VIRUSTOTAL_API_KEY", "")
    if not api_key:
        return "❌ **VirusTotal API Key Not Configured**: Please add VIRUSTOTAL_API_KEY to your backend .env file."

    intel_summary = {}

    # 1. Search for threat actors (VT Collections search)
    try:
        search_results = await _vt_get(
            f"/search?query={httpx.QueryParams({'query': actor_name})}&limit=3",
            api_key
        )
        items = search_results.get("data", [])
        actor_snippets = []
        for item in items:
            attrs = item.get("attributes", {})
            actor_snippets.append({
                "type": item.get("type"),
                "id": item.get("id"),
                "name": attrs.get("name", ""),
                "description": attrs.get("description", "")[:500],
                "tags": attrs.get("tags", [])[:10],
            })
        intel_summary["search_results"] = actor_snippets
    except Exception as e:
        logger.warning(f"VT search failed for '{actor_name}': {e}")
        intel_summary["search_results"] = []

    # 2. Look up as a known Collection by name slug
    try:
        # Try a targeted collection search for threat actors
        slug = actor_name.lower().replace(" ", "-")
        coll_results = await _vt_get(
            f"/threat_actors?filter=name%3A{slug}&limit=2",
            api_key
        )
        coll_data = coll_results.get("data", [])
        collections = []
        for c in coll_data:
            attrs = c.get("attributes", {})
            collections.append({
                "name": attrs.get("name", actor_name),
                "description": attrs.get("description", "")[:800],
                "aliases": attrs.get("aliases", []),
                "motivation": attrs.get("motivation", "Unknown"),
                "labels": attrs.get("labels", []),
                "country": attrs.get("country", "Unknown"),
            })
        intel_summary["threat_actor_profile"] = collections
    except Exception as e:
        logger.warning(f"VT threat_actors endpoint failed: {e}")
        intel_summary["threat_actor_profile"] = []

    # 3. Build the LLM synthesis prompt
    intel_json = json.dumps(intel_summary, indent=2)
    prompt = f"""You are a Cybersecurity Threat Intelligence Analyst. 
A security operator has requested a briefing on the threat actor: **{actor_name}**.

The following raw data was gathered from VirusTotal:
```json
{_truncate(intel_json)}
```

Based on this data (and your training knowledge about this actor), write a concise, 3-paragraph markdown dossier covering:
1. **Who they are**: Type, suspected origin, and known aliases.
2. **Tactics & Capabilities**: Their known attack techniques, tools, or malware families.
3. **Current Threat Posture**: Who they typically target and what defenders should watch for.

If the VirusTotal data is sparse, rely on your training knowledge about this actor.
Use markdown formatting with clear headers. Be factual and defense-oriented."""

    try:
        from google import genai
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=genai.types.GenerateContentConfig(
                max_output_tokens=1024,
                temperature=0.2,
                system_instruction="You are a Cybersecurity Threat Analyst. Output markdown only.",
                safety_settings=[
                    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
                ]
            )
        )
        return response.text
    except Exception as e:
        logger.error(f"LLM synthesis failed: {e}")
        return f"⚠️ VirusTotal data gathered but LLM synthesis failed: {e}\n\nRaw Intel:\n```json\n{_truncate(intel_json, 1000)}\n```"
