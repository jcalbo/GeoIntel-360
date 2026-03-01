import asyncio
import httpx
import json

async def run():
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "http://localhost:8000/api/summarize",
            json={"text": "SpaceX successfully launched a new batch of 200 Starlink satellites from Kennedy Space Center using a Falcon 9 rocket. This expands their network coverage significantly in rural areas globally. The rocket booster landed safely on a droneship in the Atlantic."}
        )
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text}")

asyncio.run(run())
