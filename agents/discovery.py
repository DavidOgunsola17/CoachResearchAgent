"""
Discovery Agent - Finds official athletics staff directory URLs.

This agent searches for official athletics websites containing coaching staff information.
It NOW focuses on finding DIRECTORY PAGES (one page with all coaches) rather than 
individual coach bio pages. Prefers .edu domains and official athletics subdomains.
"""

import logging
import re
import sys
from typing import List
from urllib.parse import urlparse
from openai import OpenAI
from openai import AuthenticationError, RateLimitError, APIError

logger = logging.getLogger(__name__)


class DiscoveryAgent:
    """
    Discovery Agent finds official athletics staff directory pages.
    
    Strategy:
    - Uses OpenAI Responses API with web_search tool to search and analyze results
    - Prefers .edu domains and athletics subdomains
    - Filters out social media, news, non-official sites
    - NOW FOCUSES ON DIRECTORY PAGES (not individual coach pages)
    """
    
    def __init__(self, openai_api_key: str, model_name: str = "gpt-4o-mini"):
        """
        Initialize the Discovery Agent.
        
        Args:
            openai_api_key: OpenAI API key
            model_name: OpenAI model name (default: gpt-4o-mini)
        """
        self.client = OpenAI(api_key=openai_api_key)
        self.model_name = model_name
    
    async def discover_urls(self, school_name: str, sport: str) -> List[str]:
        """
        Discover official athletics staff directory URLs.
        
        Args:
            school_name: Name of the school
            sport: Sport name (e.g., "Men's Basketball")
        
        Returns:
            List of candidate directory URLs prioritized by trustworthiness
        
        Raises:
            SystemExit: If OpenAI API is not configured or tokens are exhausted
        """
        logger.info(f"Discovery Agent: Searching for {school_name} {sport} coaching staff directory")
        
        # Use OpenAI with web_search to find and analyze URLs
        try:
            search_urls = await self._search_with_openai(school_name, sport)
            logger.info(f"Discovery Agent: Found {len(search_urls)} directory URLs via OpenAI search")
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
            logger.error(f"ERROR: Unexpected error in Discovery Agent: {str(e)}")
            logger.error("Please check your OpenAI API configuration and try again.")
            sys.exit(1)
        
        if not search_urls:
            logger.warning("Discovery Agent: No URLs found via OpenAI search")
            return []
        
        # Log top results for debugging
        logger.info(f"Discovery Agent: Found {len(search_urls)} candidate directory URLs")
        for i, url in enumerate(search_urls[:5], 1):  # Log top 5
            logger.info(f"  {i}. {url}")
        
        return search_urls
    
    async def _search_with_openai(self, school_name: str, sport: str) -> List[str]:
        """
        Use OpenAI Responses API with web_search tool to find official athletics directory pages.
        
        UPDATED PROMPT: Now explicitly asks for directory pages, not individual coach pages.
        
        Args:
            school_name: Name of the school
            sport: Sport name
        
        Returns:
            List of prioritized directory URLs
        """
        # NEW PROMPT: Focus on directory pages with all coaches listed
        sport_keywords = sport.lower().replace(" ", "-")
        input_text = f"""Please find the specific coaching staff directory for {school_name}'s {sport} team.

I need URLs that are highly specific to the coaching staff for this sport. The best URLs will contain sport-specific identifiers in their path.

Requirements:
1.  **Sport-Specific Directory**: The page must be the official coaching staff directory for {sport}. Avoid general athletic staff directories if a sport-specific one exists.
2.  **URL Path**: The URL path should ideally contain sport identifiers like `/{sport_keywords}/`, `/wsoc/`, `/womens-soccer/`, `/staff`, or `/coaches`.
3.  **Content**: The page should list multiple coaches with their names, titles, and contact information (email, phone, etc.).
4.  **Exclusions**: Do NOT return individual coach bio pages, general athletic homepages, social media links, or news articles.

**Good URL Examples (for Women's Soccer):**
- `seminoles.com/sports/womens-soccer/coaches/`
- `goheels.com/sports/womens-soccer/staff`
- `goducks.com/sports/wsoc/coaches`

**Bad URL Examples:**
- `seminoles.com/staff` (too general)
- `goheels.com/sports/` (not a directory)
- `goducks.com/sports/womens-soccer/roster` (roster, not coaches)

Return 3-5 of the most accurate and specific URLs you can find, one per line.
"""

        try:
            # Use OpenAI Responses API with web_search tool
            response = self.client.responses.create(
                model=self.model_name,
                tools=[{"type": "web_search"}],
                input=input_text
            )
            
            # Layer 1: Prioritize structured URL annotations
            urls = []
            if hasattr(response, 'output_items') and response.output_items:
                for item in response.output_items:
                    if hasattr(item, 'type') and item.type == 'message' and hasattr(item, 'status') and item.status == 'completed':
                        if hasattr(item, 'content') and item.content:
                            for content_item in item.content:
                                if hasattr(content_item, 'type') and content_item.type == 'output_text':
                                    if hasattr(content_item, 'annotations') and content_item.annotations:
                                        for annotation in content_item.annotations:
                                            if hasattr(annotation, 'type') and annotation.type == 'url_citation' and hasattr(annotation, 'url') and annotation.url:
                                                urls.append(annotation.url)
            
            # If annotations are found, validate and return the best one
            if urls:
                logger.debug("Found URLs via annotations. Validating...")
                validated_url = self._validate_and_select_url(urls, sport)
                if validated_url:
                    return [validated_url]

            # Layer 2: Fallback to Regex on output_text for sport-specific patterns
            output_text = response.output_text.strip() if hasattr(response, 'output_text') and response.output_text else ""
            if output_text:
                sport_regex = r'https?://[^\s<>"\']*/(?:' + '|'.join(self._get_sport_keywords(sport)) + r')[^\s<>"\']*'
                regex_urls = re.findall(sport_regex, output_text, re.IGNORECASE)
                if regex_urls:
                    logger.debug("Found URLs via sport-specific regex. Validating...")
                    validated_url = self._validate_and_select_url(regex_urls, sport)
                    if validated_url:
                        return [validated_url]

            # Layer 3: Fallback to general URL extraction and filtering
            if output_text:
                all_urls = re.findall(r'https?://[^\s<>"\']+', output_text)
                if all_urls:
                    logger.debug("Found URLs via general extraction. Filtering and validating...")
                    validated_url = self._validate_and_select_url(all_urls, sport)
                    if validated_url:
                        return [validated_url]
            
            logger.warning("No valid URL found after all fallbacks.")
            return []
            
        except AuthenticationError:
            # Re-raise authentication errors with context
            raise
        except RateLimitError:
            # Re-raise rate limit errors with context
            raise
        except APIError:
            # Re-raise API errors with context
            raise
        except Exception as e:
            # Wrap other exceptions as API errors
            logger.error(f"Discovery Agent: Error using OpenAI search: {str(e)}")
            raise APIError(f"OpenAI API request failed: {str(e)}") from e

    def _get_sport_keywords(self, sport: str) -> List[str]:
        """Generate sport-specific keywords for URL matching."""
        sport = sport.lower()
        keywords = [sport.replace(" ", "-"), sport.replace(" ", "")]
        if "women's" in sport:
            keywords.append("wsoc")
            keywords.append("w-soccer")
        if "men's" in sport:
            keywords.append("msoc")
            keywords.append("m-soccer")
        keywords.extend(["staff", "coaches", "directory"])
        return list(set(keywords))

    def _validate_and_select_url(self, urls: List[str], sport: str) -> str:
        """Filter URLs and select the best one based on sport-specificity and path length."""
        valid_urls = []
        sport_keywords = self._get_sport_keywords(sport)

        for url in urls:
            url_lower = url.lower()
            if not any(site in url_lower for site in ['twitter', 'facebook', 'instagram', 'linkedin', 'youtube', 'news', 'article', 'espn']):
                if not re.search(r'/coaches/[^/]+/\d+', url_lower) and not re.search(r'/roster/coaches/[^/]+', url_lower):
                    valid_urls.append(url)

        if not valid_urls:
            return ""

        # Score URLs based on keyword matches and path length
        best_url = ""
        max_score = -1

        for url in valid_urls:
            score = 0
            path = urlparse(url).path.lower()
            for keyword in sport_keywords:
                if keyword in path:
                    score += 1

            # Tie-breaker: prefer longer paths (more specific)
            path_length = len(path.split('/'))

            # Combine score and path length for a final score
            final_score = score * 100 + path_length

            if final_score > max_score:
                max_score = final_score
                best_url = url

        return best_url
