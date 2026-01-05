"""
Verification Agent - Validates that emails and Twitter handles appear explicitly in HTML.

This agent double-checks that extracted contact information actually exists in the
page source. It performs strict validation: NO pattern matching, NO inference,
only exact matches from page content.
"""

import logging
import re
from typing import List, Dict
from bs4 import BeautifulSoup

from utils.web_scraper import WebScraper

logger = logging.getLogger(__name__)


class VerificationAgent:
    """
    Verification Agent validates extracted coach data against HTML source.
    
    Strict rules:
    - NO pattern matching (e.g., "first.last@school.edu")
    - NO inference from name patterns
    - Only exact matches from page content
    - Emails must be visible in HTML
    - Twitter handles must exist as actual <a href> tags
    """
    
    def __init__(self, web_scraper: WebScraper):
        """
        Initialize the Verification Agent.
        
        Args:
            web_scraper: WebScraper instance for fetching pages
        """
        self.web_scraper = web_scraper
        self.html_cache = {}  # Cache HTML by URL to avoid refetching
    
    async def verify_coaches(self, coaches: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """
        Verify that extracted coach data exists explicitly in HTML sources.
        
        Args:
            coaches: List of coach dictionaries with source_url
        
        Returns:
            Verified coach list with blank fields for missing data
        """
        if not coaches:
            return []
        
        logger.info(f"Verification Agent: Verifying {len(coaches)} coaches")
        
        verified_coaches = []
        
        for coach in coaches:
            verified = await self._verify_coach(coach)
            verified_coaches.append(verified)
        
        logger.info(f"Verification Agent: Verification complete")
        return verified_coaches
    
    async def _verify_coach(self, coach: Dict[str, str]) -> Dict[str, str]:
        """
        Verify a single coach's data.
        
        Args:
            coach: Coach dictionary
        
        Returns:
            Verified coach dictionary
        """
        source_url = coach.get('source_url', '')
        if not source_url:
            logger.warning(f"Verification Agent: No source URL for coach {coach.get('name')}")
            # Remove contact info if we can't verify
            return {
                'name': coach.get('name', ''),
                'position': coach.get('position', ''),
                'email': '',
                'twitter': '',
                'source_url': source_url
            }
        
        # Fetch HTML if not cached
        if source_url not in self.html_cache:
            html = await self.web_scraper.extract_html(source_url)
            if html:
                self.html_cache[source_url] = html
            else:
                logger.warning(f"Verification Agent: Could not fetch HTML for {source_url}")
                # Remove contact info if we can't verify
                return {
                    'name': coach.get('name', ''),
                    'position': coach.get('position', ''),
                    'email': '',
                    'twitter': '',
                    'source_url': source_url
                }
        
        html = self.html_cache[source_url]
        
        # Verify email
        email = coach.get('email', '').strip()
        if email:
            if not self._verify_email_in_html(email, html):
                logger.debug(f"Verification Agent: Email '{email}' not found in HTML for {coach.get('name')}")
                email = ''
            else:
                logger.debug(f"Verification Agent: Verified email '{email}' for {coach.get('name')}")
        
        # Verify Twitter
        twitter = coach.get('twitter', '').strip()
        if twitter:
            verified_twitter = self._verify_twitter_in_html(twitter, html)
            if not verified_twitter:
                logger.debug(f"Verification Agent: Twitter '{twitter}' not found in HTML for {coach.get('name')}")
                twitter = ''
            else:
                logger.debug(f"Verification Agent: Verified Twitter '{verified_twitter}' for {coach.get('name')}")
                twitter = verified_twitter
        
        return {
            'name': coach.get('name', ''),
            'position': coach.get('position', ''),
            'email': email,
            'twitter': twitter,
            'source_url': source_url
        }
    
    def _verify_email_in_html(self, email: str, html: str) -> bool:
        """
        Verify that an email address appears explicitly in HTML.
        
        Args:
            email: Email address to verify
            html: HTML content
        
        Returns:
            True if email found, False otherwise
        """
        # Escape special regex characters in email
        escaped_email = re.escape(email)
        
        # Look for exact email match in HTML
        # Check both raw HTML and text content (some sites use mailto: links)
        patterns = [
            escaped_email,  # Direct email in text
            f'mailto:{escaped_email}',  # mailto link
            f'href="mailto:{escaped_email}"',  # Full mailto href
            f"href='mailto:{escaped_email}'",  # Full mailto href with single quotes
        ]
        
        for pattern in patterns:
            if re.search(pattern, html, re.IGNORECASE):
                return True
        
        return False
    
    def _verify_twitter_in_html(self, twitter: str, html: str) -> str:
        """
        Verify that a Twitter handle exists as an actual link in HTML.
        
        Args:
            twitter: Twitter handle or URL
            html: HTML content
        
        Returns:
            Verified Twitter handle/URL, or empty string if not found
        """
        # Normalize Twitter input
        # Extract handle from various formats: @handle, handle, https://twitter.com/handle, etc.
        handle_match = re.search(r'(?:@)?([a-zA-Z0-9_]+)', twitter)
        if not handle_match:
            return ''
        
        handle = handle_match.group(1).lower()
        
        # Parse HTML with BeautifulSoup to find Twitter links
        try:
            soup = BeautifulSoup(html, 'html.parser')
            
            # Find all links that might be Twitter
            links = soup.find_all('a', href=True)
            
            for link in links:
                href = link.get('href', '').lower()
                
                # Check if this link goes to Twitter and contains our handle
                if 'twitter.com' in href or 'x.com' in href:
                    link_text = link.get_text(strip=True).lower()
                    
                    # Check if handle appears in href or link text
                    if handle in href or handle in link_text or f'@{handle}' in link_text:
                        # Extract the canonical Twitter URL
                        if '/status/' in href:
                            # This is a tweet link, try to extract handle
                            match = re.search(r'twitter\.com/([a-zA-Z0-9_]+)', href)
                            if match:
                                return f"https://twitter.com/{match.group(1)}"
                        else:
                            # Direct profile link
                            match = re.search(r'(?:twitter|x)\.com/([a-zA-Z0-9_]+)', href)
                            if match:
                                return f"https://twitter.com/{match.group(1)}"
            
            # Also check for plain text mentions (if handle is explicitly in HTML)
            # But only if it's near a Twitter-related context
            handle_pattern = rf'@{re.escape(handle)}\b'
            if re.search(handle_pattern, html, re.IGNORECASE):
                # Check if it's in a link context or near Twitter-related text
                handle_context = re.search(
                    rf'.{{0,100}}twitter[^>]*>.*?{re.escape(handle)}.*?</a>',
                    html,
                    re.IGNORECASE | re.DOTALL
                )
                if handle_context:
                    return f"https://twitter.com/{handle}"
            
        except Exception as e:
            logger.debug(f"Verification Agent: Error parsing HTML for Twitter: {str(e)}")
        
        return ''

