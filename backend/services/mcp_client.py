"""
Cloudflare MCP Client Service
-------------------------------
Connects to the Cloudflare Radar MCP server over HTTP using the stateful
session protocol (MCP v2024-11-05):

  1. POST /mcp without Mcp-Session-Id → initialize, get session ID from header
  2. All subsequent calls include Mcp-Session-Id header

Endpoint: https://radar.mcp.cloudflare.com/mcp
Auth:      Bearer token (CLOUDFLARE_API_TOKEN)

Responses come back as text/event-stream SSE.  We parse the first data frame.
"""

import os
import logging
import json
import asyncio
from typing import Any, Dict, List, Optional
import httpx

logger = logging.getLogger(__name__)

_MCP_BASE = "https://radar.mcp.cloudflare.com/mcp"
_CLOUDFLARE_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN", "")


def _parse_sse(text: str) -> Dict[str, Any]:
    """Extract the first JSON payload from an SSE text/event-stream body."""
    for line in text.splitlines():
        if line.startswith("data:"):
            snippet = line[5:].strip()
            if snippet:
                try:
                    return json.loads(snippet)
                except json.JSONDecodeError:
                    continue
    return {}


def _extract_text(data: Dict[str, Any]) -> str:
    """Pull plain-text content out of a successful MCP tools/call response."""
    if "error" in data:
        logger.warning(f"MCP tool returned error: {data['error']}")
        return ""
    content = data.get("result", {}).get("content", [])
    return "\n".join(
        block.get("text", "") for block in content if isinstance(block, dict) and block.get("type") == "text"
    ).strip()


class _MCPSession:
    """A single-use MCP HTTP session: initialize → call tools → done."""

    def __init__(self, client: httpx.AsyncClient, session_id: str):
        self._client = client
        self._session_id = session_id
        self._id_counter = 2  # 1 was used for initialize

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {_CLOUDFLARE_API_TOKEN}",
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
            "Mcp-Session-Id": self._session_id,
        }

    async def call(self, tool: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Call a tool and return the parsed JSON-RPC response."""
        req_id = self._id_counter
        self._id_counter += 1
        payload = {
            "jsonrpc": "2.0",
            "id": req_id,
            "method": "tools/call",
            "params": {"name": tool, "arguments": arguments},
        }
        try:
            r = await self._client.post(_MCP_BASE, headers=self._headers(), json=payload)
            r.raise_for_status()
            return _parse_sse(r.text)
        except Exception as e:
            logger.error(f"MCP tool '{tool}' call failed: {e}")
            return {}


async def _open_session(client: httpx.AsyncClient) -> Optional[_MCPSession]:
    """Initialize an MCP session (no Mcp-Session-Id) and return it."""
    if not _CLOUDFLARE_API_TOKEN:
        logger.warning("CLOUDFLARE_API_TOKEN is not set.")
        return None

    headers = {
        "Authorization": f"Bearer {_CLOUDFLARE_API_TOKEN}",
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
    }
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "geointel-360", "version": "1.0"},
        },
    }
    try:
        r = await client.post(_MCP_BASE, headers=headers, json=payload)
        r.raise_for_status()
        session_id = r.headers.get("mcp-session-id")
        if not session_id:
            logger.error("No mcp-session-id in Cloudflare response headers.")
            return None
        logger.info(f"Cloudflare MCP session opened: {session_id[:12]}...")
        return _MCPSession(client, session_id)
    except Exception as e:
        logger.error(f"Failed to initialize Cloudflare MCP session: {e}")
        return None


# ────────────────────────────────────────────────────────────────────────────────
# Formatting Helpers
# ────────────────────────────────────────────────────────────────────────────────

def _format_http_summary(json_str: str) -> str:
    """Format HTTP summary JSON into a readable string."""
    try:
        parsed = json.loads(json_str)
        # Handle the case where the JSON might be wrapped in MCP-style response
        if "result" in parsed and isinstance(parsed["result"], dict):
            # If it's the raw inner tool result
            payload = parsed["result"]
        else:
            payload = parsed

        summary = (payload.get("summary_0") or {})
        if not summary:
            return "No traffic data available."

        desktop = float(summary.get("desktop") or 0)
        mobile = float(summary.get("mobile") or 0)
        other = float(summary.get("other") or 0)

        return (
            f"**Desktop Distribution:** {desktop:.1f}%\n"
            f"**Mobile Distribution:** {mobile:.1f}%\n"
            f"**Other Devices:** {other:.1f}%"
        )
    except Exception as e:
        logger.error(f"Error formatting HTTP summary: {e}")
        return json_str


def _format_traffic_anomalies(json_str: str) -> str:
    """Format traffic anomalies JSON into a readable list."""
    try:
        parsed = json.loads(json_str)
        # The JSON returned by the tool might be {"result": [...]} or just [...]
        if isinstance(parsed, dict) and "result" in parsed:
            anomalies = parsed.get("result", [])
        else:
            anomalies = parsed

        if not isinstance(anomalies, list) or not anomalies:
            return "No active internet outages reported."

        lines = []
        for a in anomalies[:8]:
            if not isinstance(a, dict):
                continue
                
            # Safely navigate nested nulls
            loc_details = a.get("locationDetails") or {}
            asn_details = a.get("asnDetails") or {}
            asn_loc = asn_details.get("location") or {}
            
            loc = loc_details.get("name") or asn_loc.get("name") or "Global"
            type_ = a.get("type", "Anomaly")
            status = a.get("status", "Active")
            name = asn_details.get("name", "")
            asn = asn_details.get("asn", "")
            
            if name and asn:
                suffix = f" - {name} ([AS{asn}](https://bgp.he.net/AS{asn}))"
            elif name:
                suffix = f" - {name}"
            else:
                suffix = ""
            
            lines.append(f"**{loc}** ({type_}): {status}{suffix}")

        return "\n".join(lines)
    except Exception as e:
        logger.error(f"Error formatting traffic anomalies: {e}")
        return json_str


def _format_attack_summary(json_str: str) -> str:
    """Format attack summary JSON into a readable list."""
    try:
        parsed = json.loads(json_str)
        if "result" in parsed and "top_0" in parsed["result"]:
            top = parsed["result"]["top_0"]
        elif "top_0" in parsed:
            top = parsed["top_0"]
        else:
            top = []

        if not top:
            return "No significant attack trends detected."

        lines = []
        for t in top[:8]:
            if not isinstance(t, dict):
                continue
            name = t.get("name") or "Unknown"
            val = float(t.get("value") or 0)
            lines.append(f"**{name}:** {val:.1f}% of total traffic")

        return "\n".join(lines)
    except Exception as e:
        logger.error(f"Error formatting attack summary: {e}")
        return json_str


def _format_l3_attack_summary(json_str: str) -> str:
    """Format L3 attack bitrate distribution summary into a readable list.
    
    Cloudflare returns PERCENTAGE distribution across bitrate buckets,
    not raw bitrate values. Each key is a bucket like UNDER_500_MBPS.
    """
    # Human-readable labels for Cloudflare's bitrate bucket keys
    BUCKET_LABELS = {
        "UNDER_500_MBPS":         "< 500 Mbps",
        "_500_MBPS_TO_1_GBPS":    "500 Mbps – 1 Gbps",
        "_1_GBPS_TO_10_GBPS":     "1 Gbps – 10 Gbps",
        "_10_GBPS_TO_100_GBPS":   "10 Gbps – 100 Gbps",
        "OVER_100_GBPS":          "> 100 Gbps  🚨",
    }
    try:
        parsed = json.loads(json_str)
        if "result" in parsed and "summary_0" in parsed["result"]:
            summary = parsed["result"]["summary_0"]
        elif "summary_0" in parsed:
            summary = parsed["summary_0"]
        else:
            summary = parsed

        if not isinstance(summary, dict) or not summary:
            return "No significant L3 attack data detected."

        lines = []
        for key, val in summary.items():
            label = BUCKET_LABELS.get(key, key.replace("_", " ").title())
            try:
                pct = float(val)
                # Build a simple ASCII bar
                bar_len = max(1, round(pct / 5))
                bar = "█" * bar_len
                lines.append(f"**{label}:** {pct:.1f}%  {bar}")
            except (ValueError, TypeError):
                lines.append(f"**{label}:** {val}")

        return "\n".join(lines) if lines else "L3 attack distribution: no data."
    except Exception as e:
        logger.error(f"Error formatting L3 summary: {e}")
        return json_str


# ────────────────────────────────────────────────────────────────────────────────
# Public helpers  (each opens its own session for simplicity / thread-safety)
# ────────────────────────────────────────────────────────────────────────────────

async def get_traffic_anomalies() -> str:
    """
    Real-time internet traffic anomalies and outages from Cloudflare Radar.
    Returns a formatted string or empty string on failure.
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        session = await _open_session(client)
        if not session:
            return ""
        data = await session.call("get_traffic_anomalies", {"dateRange": "1d", "limit": 10})
    raw_text = _extract_text(data)
    return _format_traffic_anomalies(raw_text) if raw_text else ""


async def get_http_traffic_summary() -> str:
    """
    HTTP traffic breakdown by device type (desktop / mobile) over the last 24 h.
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        session = await _open_session(client)
        if not session:
            return ""
        data = await session.call("get_http_data", {
            "dateRange": ["1d"],
            "dimension": "summary/device_type",
        })
    raw_text = _extract_text(data)
    return _format_http_summary(raw_text) if raw_text else ""


async def get_attack_summary() -> str:
    """
    Top industries targeted by L7 DDoS attacks in the last 24 h.
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        session = await _open_session(client)
        if not session:
            return ""
        data = await session.call("get_l7_attack_data", {
            "dateRange": ["1d"],
            "dimension": "top/industry",
        })
    raw_text = _extract_text(data)
    return _format_attack_summary(raw_text) if raw_text else ""


async def get_l3_attack_summary() -> str:
    """
    L3 network-layer DDoS attack bit-rate trends over the last 24 h.
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        session = await _open_session(client)
        if not session:
            return ""
        data = await session.call("get_l3_attack_data", {
            "dateRange": ["1d"],
            "dimension": "summary/bitrate",
        })
    raw_text = _extract_text(data)
    return _format_l3_attack_summary(raw_text) if raw_text else ""


async def get_internet_traffic_summary() -> str:
    """
    Alias: HTTP traffic summary, used by mcp_server and ai router.
    Returns the device-type breakdown as a context string.
    """
    return await get_http_traffic_summary()


async def get_global_outages() -> str:
    """
    Alias: traffic anomalies / outages, used by mcp_server and ai router.
    """
    return await get_traffic_anomalies()


async def get_cloudflare_intelligence_context() -> str:
    """
    Aggregate: fetch summary data and return a single formatted markdown block.
    """
    traffic, anomalies, attacks = await asyncio.gather(
        get_http_traffic_summary(),
        get_traffic_anomalies(),
        get_attack_summary(),
        return_exceptions=True,
    )

    sections: list[str] = []

    if isinstance(traffic, str) and traffic:
        sections.append(f"**Global Traffic Breakdown:**\n{traffic}")

    if isinstance(anomalies, str) and anomalies:
        sections.append(f"**Internet Outages / Quality Issues:**\n{anomalies}")

    if isinstance(attacks, str) and attacks:
        sections.append(f"**L7 DDoS Attack Trends:**\n{attacks}")

    return "\n\n".join(sections)
