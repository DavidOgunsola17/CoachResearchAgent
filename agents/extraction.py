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
from openai import OpenAI
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
        input_text = f"""Visit the following coaching staff directory URL and extract all coaching staff into a structured JSON array: {source_url}

**Instructions:**
1.  **Extract all coaches**: Identify every person listed with a coaching title (e.g., Head Coach, Assistant Coach, Director of Operations).
2.  **Required Fields**: For each coach, extract the following information, ensuring it is explicitly visible on the page:
    *   `name`: The coach's full name.
    *   `position`: Their official title.
    *   `email`: Their email address.
    *   `phone`: Their phone number.
    *   `twitter`: Their Twitter handle (e.g., `@handle`) or URL.
3.  **JSON Format**: Return the data as a single JSON array of objects. Each object should represent one coach.
4.  **Handling Missing Data**: If a piece of information (email, phone, twitter) is not available for a coach, set the corresponding JSON value to `null` or an empty string.
5.  **Exclusions**: Do not include non-coaching staff like medical trainers or administrative assistants unless they hold a clear operational title (e.g., "Director of Football Operations").

**Example JSON Output:**
```json
[
  {{
    "name": "John Doe",
    "position": "Head Coach",
    "email": "johndoe@example.com",
    "phone": "123-456-7890",
    "twitter": "@johndoe"
  }},
  {{
    "name": "Jane Smith",
    "position": "Assistant Coach",
    "email": "janesmith@example.com",
    "phone": null,
    "twitter": "https://twitter.com/janesmith"
  }}
]
```

Return **only** the JSON data, enclosed in a markdown code block if necessary.
"""

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
            
            # Validate and supplement contact info using regex
            validated_coaches = self._validate_contact_info(coaches, result_text)

            logger.info(f"Extraction Agent: Parsed and validated {len(validated_coaches)} coaches from response")
            return validated_coaches
                
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
        Parse the response, prioritizing JSON and falling back to legacy text parsing.
        """
        # Attempt to parse as JSON first
        try:
            # Clean up potential markdown code blocks
            if text.strip().startswith("```json"):
                text = text.strip()[7:-4].strip()

            coaches_data = json.loads(text)

            if isinstance(coaches_data, list):
                # Add source_url and validate
                validated_coaches = []
                for coach in coaches_data:
                    if isinstance(coach, dict) and coach.get('name') and coach.get('position'):
                        # Ensure all keys are present
                        validated_coach = {
                            'name': coach.get('name', ''),
                            'position': coach.get('position', ''),
                            'email': coach.get('email', ''),
                            'phone': coach.get('phone', ''),
                            'twitter': coach.get('twitter', ''),
                            'source_url': source_url
                        }
                        validated_coaches.append(validated_coach)
                logger.info(f"Successfully parsed JSON response with {len(validated_coaches)} coaches.")
                return validated_coaches
        except json.JSONDecodeError:
            logger.warning("JSON parsing failed. Falling back to legacy text parsing.")
            # Fallback to legacy parsing if JSON fails
            return self._parse_legacy_text_response(text, source_url)
        
        return []

    def _parse_legacy_text_response(self, text: str, source_url: str) -> List[Dict[str, str]]:
        """
        Legacy parser for the old text-based format.
        """
        coaches = []
        sections = re.split(r'---+|\n\n+', text)
        
        for section in sections:
            coach_data = {}
            lines = section.strip().split('\n')
            for line in lines:
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
            
            if coach_data.get('name') and coach_data.get('position'):
                coach_data['source_url'] = source_url
                coaches.append(coach_data)
        
        return coaches
    
    def _validate_contact_info(self, coaches: List[Dict[str, str]], text: str) -> List[Dict[str, str]]:
        """
        Use regex to validate and supplement contact info missed by the LLM.
        This version uses a safer approach for associating phone numbers.
        """
        # Regex patterns
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        # Per user spec + review feedback: optional country code, flexible area code parens
        phone_pattern = r'(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
        twitter_pattern = r'@\w+|twitter\.com/\w+'

        # Find all potential contacts just once
        all_emails = re.findall(email_pattern, text)
        all_twitters = re.findall(twitter_pattern, text, re.IGNORECASE)

        for coach in coaches:
            coach_name = coach.get('name')
            if not coach_name:
                continue

            last_name = coach_name.split(' ')[-1].lower()

            # If email is missing or invalid, try to find a plausible match
            if not coach.get('email') or '@' not in coach.get('email', ''):
                for email in all_emails:
                    if last_name in email.split('@')[0].lower():
                        coach['email'] = email
                        all_emails.remove(email) # Prevent re-assignment
                        break

            # If twitter is missing, try to find a plausible match
            if not coach.get('twitter'):
                for twitter in all_twitters:
                    if last_name in twitter.lower():
                        coach['twitter'] = twitter
                        all_twitters.remove(twitter) # Prevent re-assignment
                        break

            # If phone is missing, search for it near the coach's name in the text
            if not coach.get('phone'):
                try:
                    # Find the coach's name and search in a window after it
                    name_match = re.search(re.escape(coach_name), text, re.IGNORECASE)
                    if name_match:
                        # Search in a 150 character window after the name
                        start = name_match.end()
                        search_window = text[start : start + 150]
                        phone_match = re.search(phone_pattern, search_window)
                        if phone_match:
                            coach['phone'] = phone_match.group(0).strip()
                except re.error:
                    logger.debug(f"Could not perform regex search for phone number for {coach_name}")

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
