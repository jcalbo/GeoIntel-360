import os
import logging
from fastapi import APIRouter, HTTPException
from schemas import SummarizeRequest, SummarizeResponse
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
from google import genai
from services.mcp_client import get_cloudflare_intelligence_context

logger = logging.getLogger(__name__)

router = APIRouter(tags=["AI"])

@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_text(req: SummarizeRequest):
    """Generates a 3-bullet executive summary of the provided text, enriched with live Cloudflare Radar intelligence."""
    provider_raw = os.getenv("LLM_PROVIDER", "openai").split("#")[0]
    provider = provider_raw.strip().lower()

    # --- Enrich prompt with Cloudflare Radar context ---
    cloudflare_context = ""
    try:
        cloudflare_context = await get_cloudflare_intelligence_context()
    except Exception as e:
        logger.warning(f"Could not fetch Cloudflare MCP context: {e}")

    base_prompt = f"Provide a 3-bullet point executive summary of the following intelligence snippet:\n\n{req.text}"

    if cloudflare_context:
        prompt = (
            f"{base_prompt}\n\n"
            f"---\n"
            f"**Additional Live Internet Intelligence Context from Cloudflare Radar:**\n"
            f"{cloudflare_context}\n"
            f"---\n"
            f"If relevant, incorporate the above Cloudflare Radar data into your analysis."
        )
        logger.info("Cloudflare Radar context injected into LLM prompt.")
    else:
        prompt = base_prompt
        logger.info("No Cloudflare Radar context available; proceeding without it.")

    summary = ""
    try:
        if provider == "anthropic":
            client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
            response = await client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=250,
                messages=[{"role": "user", "content": prompt}]
            )
            summary = response.content[0].text
        elif provider == "gemini":
            client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=genai.types.GenerateContentConfig(
                    max_output_tokens=500,
                    system_instruction="You are a senior intelligence analyst. Format your response strictly as 3 bullet points."
                )
            )
            summary = response.text
        else:
            # Default to OpenAI
            client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            response = await client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a senior intelligence analyst."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=250
            )
            summary = response.choices[0].message.content

    except Exception as e:
        logger.error(f"Error connecting to LLM provider {provider}: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate AI analysis.")

    return SummarizeResponse(summary=summary)
