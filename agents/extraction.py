"""
Extraction Agent - Extracts raw coach data from HTML pages.

This agent parses staff DIRECTORY pages and extracts names, roles, and any listed contact info.
NOW EXTRACTS FROM DIRECTORY PAGES (not individual pages) and grabs WHATEVER contact info
is visible: email, phone, Twitter/social media, etc.
"""

import json
import logging
import sys
from typing import List, Dict, Optional
from openai import OpenAI
from openai import AuthenticationError, RateLimitError, APIError

from utils.web_scraper import WebScraper

logger = logging.getLogger(__name__)


class ExtractionAgent:
    """
    Extraction Agent extracts coach data from HTML directory pages.
    
    Process:
    - Fetches HTML content using web scraper
    - Uses OpenAI to extract structured coach information from directory pages
    - Grabs WHATEVER contact info is visible (email, phone, Twitter, etc.)
    - Only extracts explicitly visible data (no inference)
    - Filters out non-coaching staff
    - NOW RETURNS UP TO 15 COACHES (was 10)
    """
    
    def __init__(self, openai_api_key: str, web_scraper: WebScraper, model_name: str = "gpt-4o-mini-search-preview"):
        """
        Initialize the Extraction Agent.
        
        Args:
            openai_api_key: OpenAI API key
            web_scraper: WebScraper instance for fetching pages
            model_name: OpenAI model name (default: gpt-4o-mini-search-preview)
        """
        self.client = OpenAI(api_key=openai_api_key)
        self.model_name = model_name
        self.web_scraper = web_scraper
    
    async def extract_from_url(self, url: str) -> List[Dict[str, str]]:
        """
        Extract coach data from a single directory URL.
        
        Args:
            url: Directory URL to extract data from
        
        Returns:
            List of coach dictionaries with keys: name, position, email, phone, twitter
            (any field can be empty string if not found on page)
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
        Use OpenAI to extract structured coach data from HTML directory page.
        
        UPDATED SYSTEM PROMPT: Now asks for ALL visible contact info (email, phone, Twitter, etc.)
        
        Args:
            html: HTML content
            source_url: Source URL for reference
        
        Returns:
            List of coach dictionaries with name, position, email, phone, twitter fields
        """
        # NEW SYSTEM PROMPT: Extract whatever contact info is visible
        system_message = """You are a data extraction assistant. Analyze HTML from coaching staff directory pages.

CRITICAL RULES - READ CAREFULLY:
1. Extract ALL coaches listed on the page (not just head coach)
2. For each coach, grab WHATEVER contact info is visible on the page:
   - Email (if shown)
   - Phone number (if shown)
   - Twitter/X handle or URL (if shown)
   - Any other social media (treat as twitter field)
3. ONLY extract information that is EXPLICITLY visible in the HTML - do NOT guess or infer
4. Include all coaching positions: Head Coach, Assistant Coach, Associate Coach, Coordinator, Director, etc.
5. EXCLUDE: trainers, medical staff, equipment managers, interns (unless title explicitly says "Coach")

For each coach found, extract:
- Full name (as it appears)
- Position/title (as it appears)
- Email address (ONLY if explicitly written/displayed - leave empty if not found)
- Phone number (ONLY if explicitly written/displayed - leave empty if not found)
- Twitter/social media (ONLY if there's an actual link - leave empty if not found)

If email, phone, or Twitter is not visible, use an empty string "".

Return your results as a JSON object with a "coaches" key containing an array of objects.
Each object must have these exact keys: name, position, email, phone, twitter.
If a field is not found, use an empty string "".
Maximum 15 coaches (get the full staff if possible)."""

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
                for coach in coaches[:15]:  # CHANGED: Now limit to 15 (was 10)
                    if isinstance(coach, dict):
                        # NEW: Added phone field
                        validated = {
                            'name': str(coach.get('name', '')).strip(),
                            'position': str(coach.get('position', '')).strip(),
                            'email': str(coach.get('email', '')).strip(),
                            'phone': str(coach.get('phone', '')).strip(),  # NEW FIELD
                            'twitter': str(coach.get('twitter', '')).strip(),
                            'source_url': source_url
                        }
                        
                        # Only include if name and position are present
                        if validated['name'] and validated['position']:
                            # Filter out non-coaching staff
                            position_lower = validated['position'].lower()
                            if any(keyword in position_lower for keyword in ['coach', 'head', 'assistant', 'associate', 'director', 'coordinator']):
                                validated_coaches.append(validated)
                            else:
                                logger.debug(f"Filtered out non-coach: {validated['name']} - {validated['position']}")
                
                logger.info(f"Extraction Agent: Validated {len(validated_coaches)} coaches")
                return validated_coaches  # CHANGED: No longer limit to [:10] here
                
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
                                for coach in coaches[:15]:  # CHANGED: 15 instead of 10
                                    if isinstance(coach, dict):
                                        validated = {
                                            'name': str(coach.get('name', '')).strip(),
                                            'position': str(coach.get('position', '')).strip(),
                                            'email': str(coach.get('email', '')).strip(),
                                            'phone': str(coach.get('phone', '')).strip(),  # NEW
                                            'twitter': str(coach.get('twitter', '')).strip(),
                                            'source_url': source_url
                                        }
                                        if validated['name'] and validated['position']:
                                            position_lower = validated['position'].lower()
                                            if any(keyword in position_lower for keyword in ['coach', 'head', 'assistant', 'associate', 'director', 'coordinator']):
                                                validated_coaches.append(validated)
                                return validated_coaches
                        except json.JSONDecodeError:
                            pass
                return []
                
        except AuthenticationError as e:
            logger.error("ERROR: OpenAI API key is invalid or not configured.")
            logger.error("Please verify your OPENAI_API_KEY in the .env file.")
            logger.error(f"Details: {str(e)}")
            sys.exit(1)
        except RateLimitError as e:
            logger.error("ERROR: OpenAI API rate limit exceeded or insufficient tokens.")
            logger.error("Please check your API account and try again later.")
            logger.error(f"Details: {str(e)}")
            sys.exit(1)
        except APIError as e:
            logger.error("ERROR: OpenAI API error occurred.")
            logger.error(f"Details: {str(e)}")
            sys.exit(1)
        except Exception as e:
            logger.error(f"ERROR: Unexpected error in Extraction Agent: {str(e)}")
            logger.error("Please check your OpenAI API configuration and try again.")
            sys.exit(1)
    
    async def extract_from_multiple_urls(self, urls: List[str]) -> List[Dict[str, str]]:
        """
        Extract coach data from multiple directory URLs.
        
        CHANGED: Now tries each URL until we get good results (since we expect directory pages
        to have most/all coaches on one page). Stops after finding 10+ coaches or trying all URLs.
        
        Args:
            urls: List of directory URLs to extract from
        
        Returns:
            Combined list of all coaches found
        
        Raises:
            SystemExit: If OpenAI API is not configured or tokens are exhausted
        """
        all_coaches = []
        
        for url in urls:
            # API errors will be caught and exit in extract_from_url
            # Only catch non-API errors here (e.g., network issues for specific URLs)
            try:
                coaches = await self.extract_from_url(url)
                all_coaches.extend(coaches)
                
                # CHANGED: Stop if we have 10+ coaches (directory pages should have most staff)
                if len(all_coaches) >= 10:
                    logger.info(f"Extraction Agent: Found {len(all_coaches)} coaches, stopping extraction")
                    break
                    
            except (AuthenticationError, RateLimitError, APIError):
                # Re-raise API errors - they will be handled in extract_from_url
                raise
            except Exception as e:
                # Log non-API errors for specific URLs but continue with other URLs
                logger.warning(f"Extraction Agent: Error extracting from {url}: {str(e)}")
                continue
        
        # CHANGED: Return up to 15 coaches (was 10)
        return all_coaches[:15]
