"""
Test script: Verify Cloudflare Radar MCP client connectivity.

Run from the project root:
  cd /home/jorge/Desktop/anti_test01
  python backend/test_mcp_client.py
"""

import asyncio
import sys
import os

# Ensure backend module path is available
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from services.mcp_client import (
    get_internet_traffic_summary,
    get_global_outages,
    get_attack_summary,
    get_cloudflare_intelligence_context,
)


async def main():
    print("=" * 60)
    print("GeoIntel-360 — Cloudflare Radar MCP Client Test")
    print("=" * 60)

    token = os.getenv("CLOUDFLARE_API_TOKEN", "")
    if not token:
        print("ERROR: CLOUDFLARE_API_TOKEN is not set in .env")
        return

    print(f"Using token: {token[:8]}...{token[-4:]}\n")

    print("[1/3] Testing get_internet_traffic_summary()...")
    traffic = await get_internet_traffic_summary()
    if traffic:
        print(f"  ✓ Traffic data received ({len(traffic)} chars)")
        print(f"  Preview: {traffic[:200]}...\n")
    else:
        print("  ⚠ No traffic data returned (may be auth/network issue)\n")

    print("[2/3] Testing get_global_outages()...")
    outages = await get_global_outages()
    if outages:
        print(f"  ✓ Outage data received ({len(outages)} chars)")
        print(f"  Preview: {outages[:200]}...\n")
    else:
        print("  ⚠ No outage data returned\n")

    print("[3/3] Testing get_cloudflare_intelligence_context() (aggregated)...")
    context = await get_cloudflare_intelligence_context()
    if context:
        print(f"  ✓ Aggregate context received ({len(context)} chars)")
        print(f"  Preview:\n{context[:400]}...\n")
    else:
        print("  ⚠ No aggregate context returned\n")

    print("=" * 60)
    print("Test complete.")


if __name__ == "__main__":
    asyncio.run(main())
