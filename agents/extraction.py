"""
Extraction Agent - Extracts raw coach data from directory pages using web_search.

This agent uses OpenAI's Responses API with web_search to visit and analyze directory pages,
eliminating HTML parsing issues and hallucinations.
"""

import asyncio
import logging
import re
from typing import List, Dict, Optional
from openai import OpenAI
from openai import AuthenticationError, RateLimitError, APIError

logger = logging.getLogger(__name__)


class ExtractionError(Exception):
    """Custom exception for extraction errors that don't require system exit."""
    pass


class ExtractionAgent:
    """
    Extraction Agent extracts coach data by visiting directory pages with web_search.
    
    Process:
    - Uses OpenAI Responses API with web_search to visit and analyze directory URLs
    - Extracts structured coach information from visible page content
    - Grabs all visible contact info (email, phone, Twitter, etc.)
    - Returns up to 15 coaches per URL
    """
    
    # Compiled regex patterns for performance
    FIELD_PATTERN = re.compile(r'^(NAME|POSITION|EMAIL|PHONE|TWITTER):\s*(.+)$', re.IGNORECASE | re.MULTILINE)
    SECTION_SEPARATOR = re.compile(r'---+|\n\n+')
    COACH_KEYWORDS = re.compile(
        r'\b(coach|head\s+coach|assistant|associate|coordinator|director|manager|specialist|analyst|recruiting)\b',
        re.IGNORECASE
    )
    NON_COACH_KEYWORDS = re.compile(
        r'\b(trainer|physician|doctor|nurse|medical|equipment|facility|athletic\s+director|ad|sports\s+information|sports\s+medicine|strength|conditioning|nutritionist)\b',
        re.IGNORECASE
    )
    EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    PHONE_PATTERN = re.compile(r'^[\d\s()\-+.x]+$')
    
    def __init__(self, openai_api_key: str, model_name: str = "gpt-4o-mini", max_retries: int = 3):
        """
        Initialize the Extraction Agent.
        
        Args:
            openai_api_key: OpenAI API key
            model_name: OpenAI model name
            max_retries: Maximum number of retries for transient failures (default: 3)
        """
        self.client = OpenAI(api_key=openai_api_key)
        self.model_name = model_name
        self.max_retries = max_retries
    
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
        
        Includes retry logic with exponential backoff for transient failures.
        
        Args:
            source_url: URL to visit and extract from
        
        Returns:
            List of coach dictionaries
        
        Raises:
            AuthenticationError: If API key is invalid (propagates to caller)
            ExtractionError: For other extraction failures
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

        last_exception = None
        
        for attempt in range(self.max_retries):
        try:
                logger.debug(f"Extraction Agent: API call attempt {attempt + 1}/{self.max_retries} for {source_url}")
                
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
                    logger.warning(f"Extraction Agent: No output from Responses API for {source_url}")
                    logger.debug(f"Extraction Agent: Response object: {response}")
                return []
            
            # Parse the structured text response
            coaches = self._parse_structured_response(result_text, source_url)
            
                logger.info(f"Extraction Agent: Parsed {len(coaches)} coaches from {source_url}")
            return coaches
                
        except AuthenticationError as e:
                # Authentication errors should propagate - no retry
            logger.error("ERROR: OpenAI API key is invalid or not configured.")
            logger.error("Please verify your OPENAI_API_KEY in the .env file.")
            logger.error(f"Details: {str(e)}")
                raise
            
        except RateLimitError as e:
                last_exception = e
                if attempt < self.max_retries - 1:
                    # Exponential backoff: 2^attempt seconds
                    wait_time = 2 ** attempt
                    logger.warning(
                        f"Extraction Agent: Rate limit exceeded for {source_url}, "
                        f"retrying in {wait_time}s (attempt {attempt + 1}/{self.max_retries})"
                    )
                    await asyncio.sleep(wait_time)
                else:
                    logger.error(f"Extraction Agent: Rate limit exceeded after {self.max_retries} attempts for {source_url}")
                    raise ExtractionError(f"Rate limit exceeded after {self.max_retries} attempts: {str(e)}") from e
            
        except APIError as e:
                last_exception = e
                # Check if it's a transient error (retryable)
                error_msg = str(e).lower()
                if any(keyword in error_msg for keyword in ['timeout', 'network', 'connection', '503', '502', '500']):
                    if attempt < self.max_retries - 1:
                        wait_time = 2 ** attempt
                        logger.warning(
                            f"Extraction Agent: Transient API error for {source_url}, "
                            f"retrying in {wait_time}s (attempt {attempt + 1}/{self.max_retries}): {str(e)}"
                        )
                        await asyncio.sleep(wait_time)
                    else:
                        logger.error(f"Extraction Agent: API error after {self.max_retries} attempts for {source_url}: {str(e)}")
                        raise ExtractionError(f"API error after {self.max_retries} attempts: {str(e)}") from e
                else:
                    # Non-transient error, don't retry
                    logger.error(f"Extraction Agent: Non-transient API error for {source_url}: {str(e)}")
                    raise ExtractionError(f"API error: {str(e)}") from e
            
        except Exception as e:
                last_exception = e
                logger.error(f"Extraction Agent: Unexpected error for {source_url}: {str(e)}", exc_info=True)
                raise ExtractionError(f"Unexpected error: {str(e)}") from e
        
        # Should not reach here, but handle case where all retries exhausted
        raise ExtractionError(f"Failed after {self.max_retries} attempts: {str(last_exception)}") from last_exception
    
    def _parse_structured_response(self, text: str, source_url: str) -> List[Dict[str, str]]:
        """
        Parse structured text response into coach dictionaries.
        
        Uses multi-pass parsing with fallback strategies for robustness.
        
        Args:
            text: Response text with coaches in structured format
            source_url: Source URL for attribution
        
        Returns:
            List of coach dictionaries
        """
        if not text or not text.strip():
            logger.debug("Extraction Agent: Empty response text")
            return []
        
        coaches = []
        
        # Try primary structured parsing first
        coaches = self._parse_structured_format(text, source_url)
        
        # If no coaches found, try fallback parsing
        if not coaches:
            logger.debug("Extraction Agent: Primary parsing failed, trying fallback parsing")
            coaches = self._parse_fallback_format(text, source_url)
        
        logger.debug(f"Extraction Agent: Parsed {len(coaches)} coaches from response text (length: {len(text)} chars)")
        
        if not coaches:
            logger.warning(f"Extraction Agent: Failed to parse any coaches from response. Sample text: {text[:200]}")
        
        return coaches
    
    def _parse_structured_format(self, text: str, source_url: str) -> List[Dict[str, str]]:
        """
        Primary parsing method for structured format.
        
        Uses regex to match field labels with better handling of colons in values.
        
        Args:
            text: Response text
            source_url: Source URL
        
        Returns:
            List of coach dictionaries
        """
        coaches = []
        
        # Split by coach separator or double newlines
        sections = self.SECTION_SEPARATOR.split(text)
        
        for section in sections:
            section = section.strip()
            if not section:
                continue
            
            coach_data = {}
            
            # Use regex to extract fields with better colon handling
            for match in self.FIELD_PATTERN.finditer(section):
                field_name = match.group(1).upper()
                field_value = match.group(2).strip()
                
                if field_name == 'NAME':
                    coach_data['name'] = field_value
                elif field_name == 'POSITION':
                    coach_data['position'] = field_value
                elif field_name == 'EMAIL':
                    coach_data['email'] = field_value
                elif field_name == 'PHONE':
                    coach_data['phone'] = field_value
                elif field_name == 'TWITTER':
                    coach_data['twitter'] = field_value
            
            # Fallback: if regex didn't work, try line-by-line parsing
            if not coach_data:
                lines = section.split('\n')
            for line in lines:
                line = line.strip()
                if ':' in line:
                        # Split on first colon only (handles values with colons)
                        parts = line.split(':', 1)
                        if len(parts) == 2:
                            key = parts[0].strip().upper()
                            value = parts[1].strip()
                    
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
            
            # Validate and add coach
            if self._validate_coach_data(coach_data):
                validated = self._create_coach_dict(coach_data, source_url)
                if validated:
                    coaches.append(validated)
                    
                    if len(coaches) >= 15:
                        break
        
        return coaches
    
    def _parse_fallback_format(self, text: str, source_url: str) -> List[Dict[str, str]]:
        """
        Fallback parsing for non-standard response formats.
        
        Tries to extract coach information from looser text patterns.
        
        Args:
            text: Response text
            source_url: Source URL
        
        Returns:
            List of coach dictionaries
        """
        coaches = []
        
        # Look for patterns like "Name - Position" or "Name, Position"
        # This is a simplified fallback - could be enhanced further
        lines = text.split('\n')
        current_coach = {}
        
        for line in lines:
            line = line.strip()
            if not line:
                if current_coach and self._validate_coach_data(current_coach):
                    validated = self._create_coach_dict(current_coach, source_url)
                    if validated:
                        coaches.append(validated)
                        if len(coaches) >= 15:
                            break
                    current_coach = {}
                continue
            
            # Try to extract name and position from line
            # Look for patterns: "Name - Position" or "Name, Position"
            match = re.match(r'^(.+?)\s*[-–—,]\s*(.+)$', line)
            if match:
                name = match.group(1).strip()
                position = match.group(2).strip()
                
                if name and len(name) > 2:
                    current_coach['name'] = name
                    current_coach['position'] = position
        
        # Add last coach if exists
        if current_coach and self._validate_coach_data(current_coach):
            validated = self._create_coach_dict(current_coach, source_url)
            if validated:
                coaches.append(validated)
        
        return coaches
    
    def _validate_coach_data(self, coach_data: Dict[str, str]) -> bool:
        """
        Validate coach data quality before adding.
        
        Args:
            coach_data: Coach data dictionary
        
        Returns:
            True if coach data is valid, False otherwise
        """
        name = coach_data.get('name', '').strip()
        position = coach_data.get('position', '').strip()
        
        # Must have name and position
        if not name or not position:
            return False
        
        # Name must be reasonable length (2-100 characters)
        if len(name) < 2 or len(name) > 100:
            logger.debug(f"Extraction Agent: Invalid name length: {name}")
            return False
        
        # Position must be reasonable length (2-100 characters)
        if len(position) < 2 or len(position) > 100:
            logger.debug(f"Extraction Agent: Invalid position length: {position}")
            return False
        
        # Check if position is coaching-related
        position_lower = position.lower()
        
        # Exclude non-coaching roles
        if self.NON_COACH_KEYWORDS.search(position_lower):
            logger.debug(f"Extraction Agent: Excluded non-coaching position: {position}")
            return False
        
        # Must contain coaching keywords
        if not self.COACH_KEYWORDS.search(position_lower):
            logger.debug(f"Extraction Agent: Position doesn't match coaching keywords: {position}")
            return False
        
        return True
    
    def _validate_email(self, email: str) -> bool:
        """
        Validate email format.
        
        Args:
            email: Email string
        
        Returns:
            True if email is valid, False otherwise
        """
        if not email:
            return True  # Empty is allowed
        
        email = email.strip().lower()
        
        # Remove mailto: prefix if present
        email = re.sub(r'^mailto:', '', email)
        
        return bool(self.EMAIL_PATTERN.match(email))
    
    def _validate_phone(self, phone: str) -> bool:
        """
        Validate phone format.
        
        Args:
            phone: Phone string
        
        Returns:
            True if phone format is reasonable, False otherwise
        """
        if not phone:
            return True  # Empty is allowed
        
        phone = phone.strip()
        
        # Remove tel: prefix if present
        phone = re.sub(r'^(tel:|phone:|p:)', '', phone, flags=re.IGNORECASE)
        
        # Check if it contains digits
        if not re.search(r'\d', phone):
            return False
        
        # Basic format check
        return bool(self.PHONE_PATTERN.match(phone))
    
    def _create_coach_dict(self, coach_data: Dict[str, str], source_url: str) -> Optional[Dict[str, str]]:
        """
        Create validated coach dictionary with data validation.
        
        Args:
            coach_data: Raw coach data
            source_url: Source URL
        
        Returns:
            Validated coach dictionary or None if invalid
        """
        name = coach_data.get('name', '').strip()
        position = coach_data.get('position', '').strip()
        email = coach_data.get('email', '').strip()
        phone = coach_data.get('phone', '').strip()
        twitter = coach_data.get('twitter', '').strip()
        
        # Validate email
        if email and not self._validate_email(email):
            logger.debug(f"Extraction Agent: Invalid email format: {email}")
            email = ''  # Clear invalid email
        
        # Validate phone
        if phone and not self._validate_phone(phone):
            logger.debug(f"Extraction Agent: Invalid phone format: {phone}")
            phone = ''  # Clear invalid phone
        
        return {
            'name': name,
            'position': position,
            'email': email,
            'phone': phone,
            'twitter': twitter,
            'source_url': source_url
        }
    
    async def extract_from_multiple_urls(self, urls: List[str], max_concurrent: int = 3) -> List[Dict[str, str]]:
        """
        Extract coach data from multiple directory URLs using parallel processing.
        
        Stops after finding 10+ coaches or trying all URLs.
        Processes URLs concurrently with configurable concurrency limit.
        
        Args:
            urls: List of directory URLs to extract from
            max_concurrent: Maximum number of concurrent URL extractions (default: 3)
        
        Returns:
            Combined list of all coaches found (max 15)
        """
        if not urls:
            return []
        
        all_coaches = []
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def extract_with_semaphore(url: str) -> List[Dict[str, str]]:
            """Extract from URL with semaphore limiting concurrency."""
            async with semaphore:
                try:
                    logger.info(f"Extraction Agent: Starting extraction from {url}")
                    coaches = await self.extract_from_url(url)
                    logger.info(f"Extraction Agent: Successfully extracted {len(coaches)} coaches from {url}")
                    return coaches
                except AuthenticationError:
                    # Re-raise authentication errors - they should stop everything
                    raise
                except ExtractionError as e:
                    logger.warning(f"Extraction Agent: Extraction error for {url}: {str(e)}")
                    return []
                except Exception as e:
                    logger.warning(f"Extraction Agent: Unexpected error extracting from {url}: {str(e)}", exc_info=True)
                    return []
        
        # Create tasks for all URLs
        tasks = [asyncio.create_task(extract_with_semaphore(url)) for url in urls]
        
        # Process tasks and collect results as they complete
        # Use as_completed to check for early termination
        completed = 0
        for coro in asyncio.as_completed(tasks):
            try:
                coaches = await coro
                all_coaches.extend(coaches)
                completed += 1
                
                # Stop if we have 10+ coaches
                if len(all_coaches) >= 10:
                    logger.info(
                        f"Extraction Agent: Found {len(all_coaches)} coaches, "
                        f"stopping extraction (completed {completed}/{len(urls)} URLs)"
                    )
                    # Cancel remaining tasks and wait for them to be canceled
                    for task in tasks:
                        if not task.done():
                            task.cancel()
                    # Wait for canceled tasks to complete (suppresses CancelledError)
                    await asyncio.gather(*[t for t in tasks if not t.done()], return_exceptions=True)
                    break
            except AuthenticationError:
                # Cancel remaining tasks and wait for them to be canceled, then re-raise
                for task in tasks:
                    if not task.done():
                        task.cancel()
                await asyncio.gather(*[t for t in tasks if not t.done()], return_exceptions=True)
                raise
            except Exception as e:
                logger.warning(f"Extraction Agent: Error in parallel extraction: {str(e)}")
                completed += 1
        
        # Limit to 15 coaches total
        result = all_coaches[:15]
        logger.info(
            f"Extraction Agent: Completed extraction from {completed}/{len(urls)} URLs, "
            f"found {len(result)} coaches (from {len(all_coaches)} total)"
        )
        return result
