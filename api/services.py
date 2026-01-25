import os
import asyncio
import logging
from typing import List, Dict
from agents.discovery import DiscoveryAgent
from agents.extraction import ExtractionAgent
from agents.normalization import NormalizationAgent
from api.models import CoachProfile

logger = logging.getLogger(__name__)

async def run_agent_pipeline(school_name: str, sport: str) -> List[Dict[str, str]]:
    """
    Runs the full agent pipeline to discover URLs, extract coach data, and normalize it.
    """
    openai_api_key = os.getenv('OPENAI_API_KEY')
    if not openai_api_key:
        logger.error("OPENAI_API_KEY not found in environment variables")
        raise ValueError("OPENAI_API_KEY is not set")

    # 1. Discovery Agent
    discovery_agent = DiscoveryAgent(openai_api_key)
    urls = await discovery_agent.discover_urls(school_name, sport)
    if not urls:
        logger.warning(f"No URLs found for {school_name} {sport}")
        return []

    # 2. Extraction Agent
    extraction_agent = ExtractionAgent(openai_api_key)
    raw_coaches = await extraction_agent.extract_from_multiple_urls(urls)
    if not raw_coaches:
        logger.warning(f"No coaches extracted for {school_name} {sport}")
        return []

    # 3. Normalization Agent
    normalization_agent = NormalizationAgent()
    normalized_coaches = normalization_agent.normalize_coaches(raw_coaches)
    )

    # 4. Pydantic Validation
    validated_coaches = [
        CoachProfile(**coach, school=school_name, sport=sport).model_dump()
        for coach in normalized_coaches
    ]

    return validated_coaches
