"""
Discovery Agent - Finds official athletics staff directory URLs.

This agent searches for official athletics websites containing coaching staff information.
It prefers .edu domains and official athletics subdomains, filtering out social media,
news articles, and non-official sites. Uses OpenAI Responses API with web_search tool
for reliable web search and result analysis.
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
    """
    
    def __init__(self, openai_api_key: str, model_name: str = "o4-mini"):
        """
        Initialize the Discovery Agent.
        
        Args:
            openai_api_key: OpenAI API key
            model_name: OpenAI model name (default: o4-mini)
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
            List of candidate URLs prioritized by trustworthiness
        
        Raises:
            SystemExit: If OpenAI API is not configured or tokens are exhausted
        """
        logger.info(f"Discovery Agent: Searching for {school_name} {sport} coaching staff")
        
        # Use OpenAI with web_search to find and analyze URLs
        try:
            search_urls = await self._search_with_openai(school_name, sport)
            logger.info(f"Discovery Agent: Found {len(search_urls)} URLs via OpenAI search")
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
        
        logger.info(f"Discovery Agent: Found {len(search_urls)} candidate URLs")
        for i, url in enumerate(search_urls[:10], 1):  # Log top 10
            logger.info(f"  {i}. {url}")
        
        return search_urls
    
    async def _search_with_openai(self, school_name: str, sport: str) -> List[str]:
        """
        Use OpenAI Responses API with web_search tool to find official athletics pages.
        
        This method performs web search and analyzes results in a single API call.
        
        Args:
            school_name: Name of the school
            sport: Sport name
        
        Returns:
            List of prioritized URLs
        """
        input_text = f"""Find individual coach profile pages for {school_name} {sport} coaching staff.

Search for and return ONLY URLs to individual coach profile/bio pages (one coach per page).

Requirements:
1. Must be official athletics websites
2. Should be individual coach profile pages (NOT directory/roster pages with multiple coaches)
3. Each URL should be a specific coach's page with their name
4. NOT social media, news articles, or third-party sites
5. Prefer pages that include email addresses and contact information

Return ONLY a list of URLs, one per line, in order of relevance (most relevant first).
Include only the URLs, nothing else.
Aim for 10-15 individual coach profile URLs.

Example format:
https://goduke.com/sports/football/roster/coaches/manny-diaz/5190
https://goduke.com/sports/football/roster/coaches/harland-bower/5188
https://ohiostatebuckeyes.com/sports/football/roster/coaches/ryan-day/2081
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
                # Filter out social media and news
                url_lower = url.lower()
                if not any(site in url_lower for site in ['twitter', 'facebook', 'instagram', 'linkedin', 'youtube', 'news.com', 'article']):
                    validated_urls.append(url)
            
            # Remove duplicates while preserving order
            seen = set()
            unique_urls = []
            for url in validated_urls:
                if url not in seen:
                    seen.add(url)
                    unique_urls.append(url)
            
            logger.debug(f"Discovery Agent: OpenAI returned {len(unique_urls)} validated URLs")
            return unique_urls[:15]  # Limit to top 15
            
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
