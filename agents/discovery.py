"""
Discovery Agent - Finds official athletics staff directory URLs.

This agent searches for official athletics websites containing coaching staff information.
It prefers .edu domains and official athletics subdomains, filtering out social media,
news articles, and non-official sites. Uses OpenAI Responses API with web_search tool
for reliable web search and result analysis.
"""

import logging
import re
from typing import List
from openai import OpenAI

logger = logging.getLogger(__name__)


class DiscoveryAgent:
    """
    Discovery Agent finds official athletics staff directory pages.
    
    Strategy:
    - Generates candidate URLs from common patterns (fast initial strategy)
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
        """
        logger.info(f"Discovery Agent: Searching for {school_name} {sport} coaching staff")
        
        # Strategy 1: Generate candidate URLs from common patterns (quick fallback)
        direct_urls = self._generate_candidate_urls(school_name, sport)
        logger.info(f"Discovery Agent: Generated {len(direct_urls)} candidate URLs from patterns")
        
        # Strategy 2: Use OpenAI with web_search to find and analyze URLs
        try:
            search_urls = await self._search_with_openai(school_name, sport)
            logger.info(f"Discovery Agent: Found {len(search_urls)} URLs via OpenAI search")
        except Exception as e:
            logger.warning(f"Discovery Agent: OpenAI search failed: {str(e)}")
            logger.info("Discovery Agent: Falling back to pattern-based URLs")
            search_urls = []
        
        # Combine and deduplicate
        all_candidates = list(set(direct_urls + search_urls))
        
        # Prioritize results (prefer OpenAI results if available, then patterns)
        if search_urls:
            # If we have OpenAI results, prioritize them, then add pattern URLs
            prioritized_urls = search_urls + [url for url in direct_urls if url not in search_urls]
        else:
            # Fallback to heuristic prioritization of pattern URLs
            prioritized_urls = self._heuristic_prioritize(all_candidates)
        
        logger.info(f"Discovery Agent: Found {len(prioritized_urls)} candidate URLs")
        for i, url in enumerate(prioritized_urls[:10], 1):  # Log top 10
            logger.info(f"  {i}. {url}")
        
        return prioritized_urls
    
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
        input_text = f"""Find the official athletics staff directory website for {school_name} {sport}.

Search for and return ONLY the most relevant official URLs that contain coaching staff information.

Requirements:
1. Must be official athletics websites (.edu domains or official athletics subdomains)
2. Should contain coaching staff directories, rosters, or staff pages
3. NOT social media, news articles, or third-party sites

Return ONLY a list of URLs, one per line, in order of relevance (most relevant first).
Include only the URLs, nothing else.

Example format:
https://example.edu/athletics/basketball/coaches
https://athletics.example.edu/staff
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
                # Basic validation - must be .edu or athletics domain
                if '.edu' in url or 'athletics' in url.lower():
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
            
        except Exception as e:
            logger.error(f"Discovery Agent: Error using OpenAI search: {str(e)}")
            raise
    
    def _generate_candidate_urls(self, school_name: str, sport: str) -> List[str]:
        """
        Generate candidate URLs based on common athletics website patterns.
        
        This provides a fast initial strategy and fallback if OpenAI search fails.
        
        Args:
            school_name: Name of the school
            sport: Sport name
        
        Returns:
            List of candidate URLs to try
        """
        candidates = []
        
        # Normalize school name for URL generation
        # Extract domain-like part (e.g., "Clemson University" -> "clemson")
        school_key = school_name.lower()
        school_key = re.sub(r'\s+', '', school_key)
        school_key = re.sub(r'university|college|state|tech', '', school_key)
        school_key = school_key.strip()
        
        # Common URL patterns
        base_patterns = [
            f"https://{school_key}.edu/athletics/{sport.lower().replace(' ', '-')}/coaches",
            f"https://{school_key}.edu/athletics/{sport.lower().replace(' ', '-')}/staff",
            f"https://{school_key}.edu/athletics/{sport.lower().replace(' ', '-')}/roster",
            f"https://{school_key}.edu/sports/{sport.lower().replace(' ', '-')}/coaches",
            f"https://{school_key}.edu/sports/{sport.lower().replace(' ', '-')}/staff",
            f"https://{school_key}.edu/sports/{sport.lower().replace(' ', '-')}/roster",
            f"https://athletics.{school_key}.edu/{sport.lower().replace(' ', '-')}/coaches",
            f"https://athletics.{school_key}.edu/{sport.lower().replace(' ', '-')}/staff",
            f"https://{school_key}athletics.com/{sport.lower().replace(' ', '-')}/coaches",
            f"https://www.{school_key}athletics.com/{sport.lower().replace(' ', '-')}/staff",
        ]
        
        # Also try without sport-specific path
        general_patterns = [
            f"https://{school_key}.edu/athletics/staff",
            f"https://{school_key}.edu/athletics/coaches",
            f"https://athletics.{school_key}.edu/staff",
            f"https://athletics.{school_key}.edu/coaches",
        ]
        
        candidates.extend(base_patterns)
        candidates.extend(general_patterns)
        
        return candidates
    
    def _heuristic_prioritize(self, urls: List[str]) -> List[str]:
        """
        Heuristic prioritization when OpenAI search is unavailable.
        
        Args:
            urls: List of URLs to prioritize
        
        Returns:
            Prioritized list
        """
        if not urls:
            return []
        
        def score_url(url: str) -> int:
            score = 0
            url_lower = url.lower()
            
            # Prefer .edu domains
            if '.edu' in url_lower:
                score += 10
            
            # Prefer athletics subdomains
            if 'athletics' in url_lower:
                score += 5
            
            # Prefer keywords
            if 'staff' in url_lower or 'coaches' in url_lower:
                score += 3
            
            if 'roster' in url_lower:
                score += 2
            
            # Penalize social media and news
            if any(site in url_lower for site in ['twitter', 'facebook', 'instagram', 'linkedin', 'youtube']):
                score -= 20
            
            if any(site in url_lower for site in ['news', 'article', 'blog', 'medium']):
                score -= 10
            
            return score
        
        scored = [(url, score_url(url)) for url in urls]
        scored.sort(key=lambda x: x[1], reverse=True)
        
        return [url for url, score in scored if score > 0]
