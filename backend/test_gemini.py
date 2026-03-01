import asyncio
import os
import sys
from dotenv import load_dotenv

load_dotenv()
from google import genai

async def test():
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    prompt = "Provide a 3-bullet point executive summary of the following intelligence snippet:\n\nSpaceX successfully launched a new batch of 200 Starlink satellites from Kennedy Space Center using a Falcon 9 rocket. This expands their network coverage significantly in rural areas globally. The rocket booster landed safely on a droneship in the Atlantic."
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=f"You are a senior intelligence analyst. {prompt}",
        config=genai.types.GenerateContentConfig(
            max_output_tokens=250,
        )
    )
    print(response.text)

asyncio.run(test())
