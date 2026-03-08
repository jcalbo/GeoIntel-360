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

    context_text = ""
    if req.context_articles:
        context_items = [f"- [{c.get('title', 'Unknown News')}]({c.get('url', '#')})" for c in req.context_articles]
        context_text = "\n".join(context_items)

    base_prompt = (
        f"Provide a comprehensive summary with exactly 3 bullet points of the following Main Event intelligence snippet.\n"
        f"Expand your explanation on each bullet point to ensure the total response covers AT LEAST 100 words.\n"
        f"Following the bullets, provide a brief 1-sentence paragraph of strategic implications.\n"
        f"CRITICAL: Your analysis MUST be detailed and comprehensive. Ensure you finish your sentences and thoughts completely. Do NOT cut off mid-sentence.\n\n"
        f"**Main Event:**\n{req.text}\n"
    )

    if context_text:
        base_prompt += (
            f"\n\n---\n**Recent Related News:**\n{context_text}\n---\n\n"
            f"Additionally, at the end of your response, provide a 'Related News' section that briefly lists the provided Related News using their exact titles and markdown links."
        )

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
                max_tokens=2048,
                messages=[{"role": "user", "content": prompt}]
            )
            summary = response.content[0].text
        elif provider == "gemini":
            client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=genai.types.GenerateContentConfig(
                    max_output_tokens=2048,
                    system_instruction="You are a senior intelligence analyst. Provide comprehensive responses (at least 100 words). Expand your explanation on each bullet point. Format with exactly 3 bullet points, a 1-sentence implication, and related news links if provided. DO NOT STOP mid-sentence."
                )
            )
            summary = response.text
        else:
            # Default to OpenAI
            client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            response = await client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a senior intelligence analyst. Provide comprehensive summaries (at least 100 words). Expand explanations to meet this length. Do not leave sentences unfinished."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=2048
            )
            summary = response.choices[0].message.content

    except Exception as e:
        logger.error(f"Error connecting to LLM provider {provider}: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate AI analysis.")

    return SummarizeResponse(summary=summary)
