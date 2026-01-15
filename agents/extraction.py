"""
Extraction Agent - Extracts raw coach data from directory pages using web_search.

This agent uses OpenAI's web_search tool to visit and analyze directory pages directly,
eliminating HTML parsing issues and hallucinations.
"""

import json
import logging
import sys
from typing import List, Dict
from openai import OpenAI
from openai import AuthenticationError, RateLimitError, APIError

logger = logging.getLogger(__name__)


class ExtractionAgent:
    """
    Extraction Agent extracts coach data by visiting directory pages with web_search.
    
    Process:
    - Uses OpenAI web_search to visit and analyze directory URLs
    - Extracts structured coach information from visible page content
    - Grabs all visible contact info (email, phone, Twitter, etc.)
    - Returns up to 15 coaches per URL
    """
    
    def __init__(self, openai_api_key: str, model_name: str = "gpt-4o-mini"):
        """
        Initialize the Extraction Agent.
        
        Args:
            openai_api_key: OpenAI API key
            model_name: OpenAI model name with search capability
        """
        self.client = OpenAI(api_key=openai_api_key)
        self.model_name = model_name
    
    async def extract_from_url(self, url: str) -> List[Dict[str, str]]:
        """
        Extract coach data from a single directory URL using web_search.
        
        Args:
            url: Directory URL to extract data from
        
        Returns:
            List of coach dictionaries with keys: name, position, email, phone, twitter
        """
        logger.info(f"Extraction Agent: Analyzing {url}")
        
        # Extract using OpenAI web_search
        coaches = await self._extract_with_websearch(url)
        
        logger.info(f"Extraction Agent: Extracted {len(coaches)} coaches from {url}")
        
        return coaches
    
    async def _extract_with_websearch(self, source_url: str) -> List[Dict[str, str]]:
        """
        Use OpenAI web_search to visit and extract coach data from directory page.
        
        Args:
            source_url: URL to visit and extract from
        
        Returns:
            List of coach dictionaries
        """
        system_message = """You are a data extraction assistant specializing in coaching staff directories.

CRITICAL INSTRUCTIONS:
1. Visit the provided URL and extract ALL coaches listed on the page
2. For each coach, extract ONLY information that is EXPLICITLY visible:
   - Full name (exactly as shown)
   - Position/title (exactly as shown)
   - Email address (ONLY if displayed on the page)
   - Phone number (ONLY if displayed on the page)
   - Twitter/social media handle or URL (ONLY if displayed on the page)
3. Do NOT guess, infer, or make up any information
4. Include all coaching positions: Head Coach, Assistant Coach, Associate Coach, Coordinator, Director, etc.
5. EXCLUDE: trainers, medical staff, equipment managers, non-coaching staff

If a field is not visible on the page, use an empty string "".

Return results as JSON with a "coaches" key containing an array of objects.
Each object must have: name, position, email, phone, twitter
Maximum 15 coaches."""

        user_message = f"""Visit this coaching staff directory URL and extract all visible contact information: {source_url}

Extract the name, position, and any contact details (email, phone, Twitter) shown for each coach on the page."""

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_message}
                ],
                tools=[{"type": "web_search"}],  # Enable web search to visit URL
                response_format={"type": "json_object"},
                temperature=0.1
            )
            
            result = response.choices[0].message.content.strip()
            
            # Remove markdown code blocks if present
            if result.startswith("```json"):
                result = result[7:]
            if result.startswith("```"):
                result = result[3:]
            if result.endswith("```"):
                result = result[:-3]
            result = result.strip()
            
            # Parse JSON response
            try:
                parsed = json.loads(result)
                
                # Extract coaches array
                if isinstance(parsed, dict):
                    coaches = parsed.get('coaches', parsed.get('data', []))
                elif isinstance(parsed, list):
                    coaches = parsed
                else:
                    coaches = []
                
                # Validate and clean coach data
                validated_coaches = []
                for coach in coaches[:15]:
                    if isinstance(coach, dict):
                        validated = {
                            'name': str(coach.get('name', '')).strip(),
                            'position': str(coach.get('position', '')).strip(),
                            'email': str(coach.get('email', '')).strip(),
                            'phone': str(coach.get('phone', '')).strip(),
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
                return validated_coaches
                
            except json.JSONDecodeError as e:
                logger.error(f"Extraction Agent: Failed to parse JSON response: {str(e)}")
                logger.debug(f"Response content: {result}")
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
        
        Stops after finding 10+ coaches or trying all URLs.
        
        Args:
            urls: List of directory URLs to extract from
        
        Returns:
            Combined list of all coaches found (max 15)
        """
        all_coaches = []
        
        for url in urls:
            try:
                coaches = await self.extract_from_url(url)
                all_coaches.extend(coaches)
                
                # Stop if we have 10+ coaches
                if len(all_coaches) >= 10:
                    logger.info(f"Extraction Agent: Found {len(all_coaches)} coaches, stopping extraction")
                    break
                    
            except (AuthenticationError, RateLimitError, APIError):
                raise
            except Exception as e:
                logger.warning(f"Extraction Agent: Error extracting from {url}: {str(e)}")
                continue
        
        return all_coaches[:15]
