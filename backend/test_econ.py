import asyncio
from services.fetcher import fetch_alpha_vantage, fetch_rss_feed, get_json
import os
from dotenv import load_dotenv

load_dotenv()

async def main():
    # Test Alpha Vantage full response
    key = os.getenv("ALPHA_VANTAGE_API_KEY")
    av_url = "https://www.alphavantage.co/query"
    av_raw = await get_json(av_url, params={"function": "NEWS_SENTIMENT", "topics": "economy_macro", "limit": 10, "apikey": key})
    print("Alpha Vantage Raw:", av_raw)
    
    # Test RSS dates
    rss_news = await fetch_rss_feed("https://www.bruegel.org/rss.xml", "Economics")
    print("RSS Bruegel count:", len(rss_news))
    
    for i, item in enumerate(rss_news[:3]):
        print(f"Bruegel {i+1}: '{item['title']}' - Date: {item['date']}")

asyncio.run(main())
