"""
Extraction Agent - Extracts raw coach data from HTML pages.

This agent parses staff pages and extracts names, roles, and any listed contact info.
It uses OpenAI to understand page structure and extract structured data, ensuring
only explicit information is captured (no inference or guessing).
"""

import json
import logging
from typing import List, Dict, Optional
from openai import OpenAI

from utils.web_scraper import WebScraper

logger = logging.getLogger(__name__)


class ExtractionAgent:
    """
    Extraction Agent extracts coach data from HTML pages.
    
    Process:
    - Fetches HTML content using web scraper
    - Uses OpenAI to extract structured coach information
    - Only extracts explicitly visible data (no inference)
    - Filters out non-coaching staff
    - Limits to 10 coaches per page
    """
    
    def __init__(self, openai_api_key: str, web_scraper: WebScraper, model_name: str = "o4-mini"):
        """
        Initialize the Extraction Agent.
        
        Args:
            openai_api_key: OpenAI API key
            web_scraper: WebScraper instance for fetching pages
            model_name: OpenAI model name (default: o4-mini)
        """
        self.client = OpenAI(api_key=openai_api_key)
        self.model_name = model_name
        self.web_scraper = web_scraper
    
    async def extract_from_url(self, url: str) -> List[Dict[str, str]]:
        """
        Extract coach data from a single URL.
        
        Args:
            url: URL to extract data from
        
        Returns:
            List of coach dictionaries with keys: name, position, email, twitter
        """
        logger.info(f"Extraction Agent: Extracting from {url}")
        
        # Fetch HTML
        html = await self.web_scraper.extract_html(url)
        if not html:
            logger.warning(f"Extraction Agent: Failed to fetch HTML from {url}")
            return []
        
        # Truncate HTML if too long (OpenAI token limits)
        # Most pages should be fine, but some can be very large
        max_html_length = 150000  # Roughly 37k tokens (with some buffer)
        if len(html) > max_html_length:
            logger.info(f"Extraction Agent: HTML too long ({len(html)} chars), truncating")
            # Try to keep the beginning (often contains main content)
            html = html[:max_html_length] + "... [truncated]"
        
        # Extract using OpenAI
        coaches = await self._extract_with_openai(html, url)
        
        logger.info(f"Extraction Agent: Extracted {len(coaches)} coaches from {url}")
        
        return coaches
    
    async def _extract_with_openai(self, html: str, source_url: str) -> List[Dict[str, str]]:
        """
        Use OpenAI to extract structured coach data from HTML.
        
        Args:
            html: HTML content
            source_url: Source URL for reference
        
        Returns:
            List of coach dictionaries
        """
        system_message = """You are a data extraction assistant. Analyze HTML pages and extract coaching staff information.

CRITICAL RULES - READ CAREFULLY:
1. ONLY extract information that is EXPLICITLY visible in the HTML
2. Do NOT guess or infer emails from names or patterns
3. Do NOT assume Twitter handles - only extract if there's an actual link
4. Focus on COACHING staff: Head Coach, Assistant Coach, Associate Coach, etc.
5. EXCLUDE: trainers, interns, managers, support staff (unless their title explicitly includes "Coach")
6. Maximum 10 coaches per page

For each coach found, extract:
- Full name (as it appears)
- Position/title (as it appears)
- Email address (ONLY if it's explicitly written/displayed on the page - not hidden in scripts)
- Twitter handle or URL (ONLY if there's an actual clickable link)

If email or Twitter is not visible, leave that field empty.

Return your results as a JSON object with a "coaches" key containing an array of objects.
Each object must have these exact keys: name, position, email, twitter.
If email or twitter is not found, use an empty string "".
Limit to maximum 10 coaches."""

        user_message = f"""Source URL: {source_url}

HTML Content:
{html[:100000]}"""  # Further truncate for the prompt

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_message}
                ],
                response_format={"type": "json_object"},
                temperature=0.1  # Low temperature for accurate extraction
            )
            
            result = response.choices[0].message.content.strip()
            
            # Remove markdown code blocks if present
            if result.startswith("```json"):
                result = result[7:]  # Remove ```json
            if result.startswith("```"):
                result = result[3:]  # Remove ```
            if result.endswith("```"):
                result = result[:-3]  # Remove closing ```
            result = result.strip()
            
            # Parse JSON response
            try:
                parsed = json.loads(result)
                
                # Extract coaches array from JSON object
                if isinstance(parsed, dict):
                    if 'coaches' in parsed:
                        coaches = parsed['coaches']
                    elif 'data' in parsed:
                        coaches = parsed['data']
                    else:
                        # Try to find any array value
                        coaches = next((v for v in parsed.values() if isinstance(v, list)), [])
                elif isinstance(parsed, list):
                    coaches = parsed
                else:
                    coaches = []
                
                # Validate and clean coach data
                validated_coaches = []
                for coach in coaches[:10]:  # Limit to 10
                    if isinstance(coach, dict):
                        validated = {
                            'name': str(coach.get('name', '')).strip(),
                            'position': str(coach.get('position', '')).strip(),
                            'email': str(coach.get('email', '')).strip(),
                            'twitter': str(coach.get('twitter', '')).strip(),
                            'source_url': source_url
                        }
                        
                        # Only include if name and position are present
                        if validated['name'] and validated['position']:
                            # Filter out non-coaching staff
                            position_lower = validated['position'].lower()
                            if any(keyword in position_lower for keyword in ['coach', 'head', 'assistant', 'associate', 'director']):
                                validated_coaches.append(validated)
                            else:
                                logger.debug(f"Filtered out non-coach: {validated['name']} - {validated['position']}")
                
                logger.info(f"Extraction Agent: Validated {len(validated_coaches)} coaches")
                return validated_coaches
                
            except json.JSONDecodeError as e:
                logger.error(f"Extraction Agent: Failed to parse JSON response: {str(e)}")
                logger.debug(f"Response content: {result}")
                # Try to extract JSON from markdown code blocks if present
                if "```json" in result:
                    json_start = result.find("```json") + 7
                    json_end = result.find("```", json_start)
                    if json_end > json_start:
                        try:
                            parsed = json.loads(result[json_start:json_end].strip())
                            if isinstance(parsed, dict) and 'coaches' in parsed:
                                coaches = parsed['coaches']
                                # Re-process with same validation logic
                                validated_coaches = []
                                for coach in coaches[:10]:
                                    if isinstance(coach, dict):
                                        validated = {
                                            'name': str(coach.get('name', '')).strip(),
                                            'position': str(coach.get('position', '')).strip(),
                                            'email': str(coach.get('email', '')).strip(),
                                            'twitter': str(coach.get('twitter', '')).strip(),
                                            'source_url': source_url
                                        }
                                        if validated['name'] and validated['position']:
                                            position_lower = validated['position'].lower()
                                            if any(keyword in position_lower for keyword in ['coach', 'head', 'assistant', 'associate', 'director']):
                                                validated_coaches.append(validated)
                                return validated_coaches
                        except json.JSONDecodeError:
                            pass
                return []
                
        except Exception as e:
            logger.error(f"Extraction Agent: Error using OpenAI: {str(e)}")
            return []
    
    async def extract_from_multiple_urls(self, urls: List[str]) -> List[Dict[str, str]]:
        """
        Extract coach data from multiple URLs.
        
        Args:
            urls: List of URLs to extract from
        
        Returns:
            Combined list of all coaches found
        """
        all_coaches = []
        
        for url in urls:
            try:
                coaches = await self.extract_from_url(url)
                all_coaches.extend(coaches)
                
                # Stop if we have 10+ coaches
                if len(all_coaches) >= 10:
                    logger.info(f"Extraction Agent: Found 10+ coaches, stopping extraction")
                    break
                    
            except Exception as e:
                logger.warning(f"Extraction Agent: Error extracting from {url}: {str(e)}")
                continue
        
        return all_coaches[:10]  # Limit to 10 total
