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
        input_text = f"""Find the main coaching staff directory page for {school_name} {sport}.

Requirements:
1. ONE page that lists ALL coaches in a directory/roster format (not individual bio pages)
2. Official athletics website (.edu domain strongly preferred)
3. Page should show: names, titles, and contact information (emails, phone, Twitter, etc.)
4. NOT individual coach bio pages (URLs should NOT have coach names in them)
5. NOT social media, news articles, or third-party sites

Good examples of directory pages:
- goduke.com/sports/football/coaches (lists all coaches)
- ohiostatebuckeyes.com/sports/m-baskbl/staff (staff directory)
- gostanford.com/sports/wsoc/coaches (coaching staff page)

Bad examples (individual pages):
- goduke.com/sports/football/roster/coaches/mike-elko/4315 (one coach only)
- twitter.com/DukeFOOTBALL (social media)
- espn.com/college-football/story (news article)

Return 3-5 directory page URLs, most relevant first. URLs only, one per line.
"""

        try:
            # Use OpenAI Responses API with web_search tool
            response = self.client.responses.create(
                model=self.model_name,
                tools=[{"type": "web_search"}],
                input=input_text
            )
            
            # Extract URLs from response
            urls = []
            
            # Parse output_items to find message items with annotations
            # The OpenAI SDK returns objects with attributes
            if hasattr(response, 'output_items') and response.output_items:
                for item in response.output_items:
                    # Access attributes (OpenAI SDK returns objects, not dicts)
                    if hasattr(item, 'type') and item.type == 'message':
                        if hasattr(item, 'status') and item.status == 'completed':
                            if hasattr(item, 'content') and item.content:
                                for content_item in item.content:
                                    if hasattr(content_item, 'type') and content_item.type == 'output_text':
                                        if hasattr(content_item, 'annotations') and content_item.annotations:
                                            for annotation in content_item.annotations:
                                                if hasattr(annotation, 'type') and annotation.type == 'url_citation':
                                                    if hasattr(annotation, 'url') and annotation.url:
                                                        urls.append(annotation.url)
            
            # Also try to extract URLs from the output_text if annotations weren't found
            if not urls and hasattr(response, 'output_text') and response.output_text:
                result_text = response.output_text.strip()
                # Parse URLs from response text
                for line in result_text.split('\n'):
                    line = line.strip()
                    # Extract URLs (handle various formats)
                    if line.startswith('http'):
                        url = line.rstrip('.,;:)').split()[0]  # Take first word if multiple
                        if url.startswith('http'):
                            urls.append(url)
                    # Also look for URLs embedded in text
                    elif 'http' in line:
                        url_matches = re.findall(r'https?://[^\s<>"\']+', line)
                        urls.extend(url_matches)
            
            # Filter and validate URLs
            validated_urls = []
            for url in urls:
                url_lower = url.lower()
                # Filter out social media and news
                if not any(site in url_lower for site in ['twitter', 'facebook', 'instagram', 'linkedin', 'youtube', 'news.com', 'article', 'espn.com']):
                    # NEW: Filter out individual coach pages (URLs with coach names/IDs at end)
                    # We want directory pages like /coaches or /staff, not /coaches/john-smith/123
                    if not re.search(r'/coaches/[^/]+/\d+', url_lower) and not re.search(r'/roster/coaches/[^/]+', url_lower):
                        validated_urls.append(url)
            
            # Remove duplicates while preserving order
            seen = set()
            unique_urls = []
            for url in validated_urls:
                if url not in seen:
                    seen.add(url)
                    unique_urls.append(url)
            
            logger.debug(f"Discovery Agent: OpenAI returned {len(unique_urls)} validated directory URLs")
            return unique_urls[:5]  # Return top 5 directory pages (was 15 individual pages)
            
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
