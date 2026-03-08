import os
import asyncio
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

prompt = "Provide a comprehensive summary with exactly 3 bullet points of the following Main Event intelligence snippet.\nExpand your explanation on each bullet point to ensure the total response covers AT LEAST 100 words.\nFollowing the bullets, provide a brief 1-sentence paragraph of strategic implications.\nCRITICAL: Your analysis MUST be detailed and comprehensive. Ensure you finish your sentences and thoughts completely. Do NOT cut off mid-sentence.\n\n**Main Event:**\nThe dominant historical account of the Manhattan Project focuses on the scientists at Los Alamos and their success in creating the atomic bomb. But building the bomb required a massive infrastructure, particularly the Hanford Engineer Works, which produced the plutonium. The production of plutonium at Hanford required enormous amounts of water to cool the nuclear reactors, drawn from the Columbia River, and a large workforce to build and operate the complex. Recent studies shed light on the environmental impact on the river and the social history of the workers who lived in a top-secret city."

try:
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=genai.types.GenerateContentConfig(
            max_output_tokens=2048,
            system_instruction="You are a senior intelligence analyst. Provide comprehensive responses (at least 100 words). Expand your explanation on each bullet point. Format with exactly 3 bullet points, a 1-sentence implication, and related news links if provided. DO NOT STOP mid-sentence."
        )
    )
    print("RESPONSE TEXT:", response.text)
    print("CANDIDATE INFO:")
    print(response.candidates[0].finish_reason)
    
except Exception as e:
    print("ERROR:", str(e))

