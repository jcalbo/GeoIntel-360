import asyncio
from services.fetcher import RSS_FEEDS, fetch_rss_feed, fetch_newsapi, fetch_gnews, fetch_newsdata, fetch_alpha_vantage
from dotenv import load_dotenv

load_dotenv()

async def test():
    print(f"{'Source':<35} | {'Type':<6} | {'Status':<15} | {'Articles'}")
    print("-" * 75)
    
    # RSS Feeds
    for cat, urls in RSS_FEEDS.items():
        for url in urls:
            short_name = url.split("://")[-1].split("/")[0]
            try:
                articles = await fetch_rss_feed(url, cat)
                status = "UP" if len(articles) > 0 else "EMPTY"
                print(f"{short_name[:34]:<35} | {'RSS':<6} | {status:<15} | {len(articles)}")
            except Exception as e:
                print(f"{short_name[:34]:<35} | {'RSS':<6} | {'ERROR':<15} | 0 ({str(e)[:30]})")

    # APIs
    for name, func in [("NewsAPI", fetch_newsapi), ("GNews", fetch_gnews), ("NewsData.io", fetch_newsdata), ("Alpha Vantage", fetch_alpha_vantage)]:
        try:
            articles = await func()
            status = "UP" if len(articles) > 0 else "EMPTY/AUTH"
            print(f"{name:<35} | {'API':<6} | {status:<15} | {len(articles)}")
        except Exception as e:
            print(f"{name:<35} | {'API':<6} | {'ERROR':<15} | 0 ({str(e)[:30]})")

if __name__ == "__main__":
    asyncio.run(test())
