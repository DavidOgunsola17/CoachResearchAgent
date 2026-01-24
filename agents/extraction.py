"""
Extraction Agent - Extracts raw coach data from directory pages using web_search.

This agent uses OpenAI's Responses API with web_search to visit and analyze directory pages,
eliminating HTML parsing issues and hallucinations.
"""

import json
import logging
import sys
import re
from typing import List, Dict
from openai import AsyncOpenAI
from openai import AuthenticationError, RateLimitError, APIError

logger = logging.getLogger(__name__)


class ExtractionAgent:
    """
    Extraction Agent extracts coach data by visiting directory pages with web_search.
    
    Process:
    - Uses OpenAI Responses API with web_search to visit and analyze directory URLs
    - Extracts structured coach information from visible page content
    - Grabs all visible contact info (email, phone, Twitter, etc.)
    - Returns up to 15 coaches per URL
    """
    
    def __init__(self, openai_api_key: str, model_name: str = "gpt-4o-mini"):
        """
        Initialize the Extraction Agent.
        
        Args:
            openai_api_key: OpenAI API key
            model_name: OpenAI model name
        """
        self.client = AsyncOpenAI(api_key=openai_api_key)
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
        
        # Extract using OpenAI Responses API with web_search
        coaches = await self._extract_with_responses_api(url)
        
        logger.info(f"Extraction Agent: Extracted {len(coaches)} coaches from {url}")
        
        return coaches
    
    async def _extract_with_responses_api(self, source_url: str) -> List[Dict[str, str]]:
        """
        Use OpenAI Responses API with web_search to visit and extract coach data.
        
        Args:
            source_url: URL to visit and extract from
        
        Returns:
            List of coach dictionaries
        """
        input_text = f"""Visit this coaching staff directory URL: {source_url}

Extract ALL coaches listed on the page with their contact information:

For each coach, extract ONLY what is EXPLICITLY visible on the page:
- Full name (exactly as shown)
- Position/title (exactly as shown)  
- Email address (ONLY if displayed)
- Phone number (ONLY if displayed)
- Twitter/social media handle or URL (ONLY if displayed)

CRITICAL RULES:
- Do NOT guess or infer any information
- Include all coaching positions: Head Coach, Assistant Coach, Associate Coach, Coordinator, Director, etc.
- EXCLUDE: trainers, medical staff, equipment managers, non-coaching staff
- If a field is not visible, leave it empty

Return the data in this EXACT format for each coach (one per line):
NAME: [full name]
POSITION: [position/title]
EMAIL: [email or empty]
PHONE: [phone or empty]
TWITTER: [twitter or empty]
---

List all coaches found (up to 15 maximum)."""

        try:
            response = self.client.responses.create(
                model=self.model_name,
                tools=[{"type": "web_search"}],
                input=input_text
            )
            
            # Extract text from response
            result_text = ""
            if hasattr(response, 'output_text') and response.output_text:
                result_text = response.output_text.strip()
            
            if not result_text:
                logger.warning("Extraction Agent: No output from Responses API")
                return []
            
            # Parse the structured text response
            coaches = self._parse_structured_response(result_text, source_url)
            
            logger.info(f"Extraction Agent: Parsed {len(coaches)} coaches from response")
            return coaches
                
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
    
    def _parse_structured_response(self, text: str, source_url: str) -> List[Dict[str, str]]:
        """
        Parse structured text response into coach dictionaries.
        
        Args:
            text: Response text with coaches in structured format
            source_url: Source URL for attribution
        
        Returns:
            List of coach dictionaries
        """
        coaches = []
        current_coach = {}
        
        # Split by coach separator or double newlines
        sections = re.split(r'---+|\n\n+', text)
        
        for section in sections:
            lines = section.strip().split('\n')
            coach_data = {}
            
            for line in lines:
                line = line.strip()
                if ':' in line:
                    key, value = line.split(':', 1)
                    key = key.strip().upper()
                    value = value.strip()
                    
                    if key == 'NAME':
                        coach_data['name'] = value
                    elif key == 'POSITION':
                        coach_data['position'] = value
                    elif key == 'EMAIL':
                        coach_data['email'] = value
                    elif key == 'PHONE':
                        coach_data['phone'] = value
                    elif key == 'TWITTER':
                        coach_data['twitter'] = value
            
            # Validate and add coach if has name and position
            if coach_data.get('name') and coach_data.get('position'):
                validated = {
                    'name': coach_data.get('name', '').strip(),
                    'position': coach_data.get('position', '').strip(),
                    'email': coach_data.get('email', '').strip(),
                    'phone': coach_data.get('phone', '').strip(),
                    'twitter': coach_data.get('twitter', '').strip(),
                    'source_url': source_url
                }
                
                # Filter out non-coaching staff
                position_lower = validated['position'].lower()
                if any(keyword in position_lower for keyword in ['coach', 'head', 'assistant', 'associate', 'director', 'coordinator']):
                    coaches.append(validated)
                    
                    if len(coaches) >= 15:
                        break
        
        return coaches
    
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
