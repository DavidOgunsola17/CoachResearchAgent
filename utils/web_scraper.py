"""
Web scraper utility using Playwright for browser automation.

This module provides async functions to fetch and extract HTML content from web pages,
handling dynamic content, anti-scraping measures, and error cases gracefully.
"""

import asyncio
import logging
from typing import Optional
from playwright.async_api import async_playwright, Browser, Page, TimeoutError as PlaywrightTimeoutError

logger = logging.getLogger(__name__)


class WebScraper:
    """
    Web scraper that uses Playwright for browser automation.
    
    Handles:
    - Page fetching with error handling
    - Dynamic content loading
    - Anti-scraping measures (rate limiting, retries)
    - Timeout management
    """
    
    def __init__(self, headless: bool = True, timeout: int = 30000):
        """
        Initialize the web scraper.
        
        Args:
            headless: Run browser in headless mode (default: True)
            timeout: Page load timeout in milliseconds (default: 30000)
        """
        self.headless = headless
        self.timeout = timeout
        self.browser: Optional[Browser] = None
        self.playwright = None
    
    async def __aenter__(self):
        """Async context manager entry."""
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=self.headless)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
    
    async def fetch_page(self, url: str, retries: int = 3, delay: float = 1.0) -> Optional[Page]:
        """
        Fetch a page with retry logic and error handling.
        
        Args:
            url: URL to fetch
            retries: Number of retry attempts (default: 3)
            delay: Delay between retries in seconds (default: 1.0)
        
        Returns:
            Page object if successful, None otherwise
        """
        if not self.browser:
            raise RuntimeError("WebScraper must be used as async context manager")
        
        for attempt in range(retries):
            try:
                logger.info(f"Fetching page (attempt {attempt + 1}/{retries}): {url}")
                page = await self.browser.new_page()
                
                # Set a reasonable user agent to avoid blocking
                await page.set_extra_http_headers({
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                })
                
                # Navigate with timeout
                await page.goto(url, wait_until='networkidle', timeout=self.timeout)
                
                # Wait for page to be fully loaded
                await self.wait_for_load(page)
                
                logger.info(f"Successfully fetched page: {url}")
                return page
                
            except PlaywrightTimeoutError:
                logger.warning(f"Timeout fetching {url} (attempt {attempt + 1}/{retries})")
                if page:
                    await page.close()
                if attempt < retries - 1:
                    await asyncio.sleep(delay * (attempt + 1))  # Exponential backoff
            except Exception as e:
                logger.error(f"Error fetching {url} (attempt {attempt + 1}/{retries}): {str(e)}")
                if 'page' in locals():
                    await page.close()
                if attempt < retries - 1:
                    await asyncio.sleep(delay * (attempt + 1))
                else:
                    logger.error(f"Failed to fetch {url} after {retries} attempts")
        
        return None
    
    async def extract_html(self, url: str) -> Optional[str]:
        """
        Extract HTML content from a URL.
        
        Args:
            url: URL to extract HTML from
        
        Returns:
            HTML content as string if successful, None otherwise
        """
        page = await self.fetch_page(url)
        if not page:
            return None
        
        try:
            html = await page.content()
            await page.close()
            return html
        except Exception as e:
            logger.error(f"Error extracting HTML from {url}: {str(e)}")
            await page.close()
            return None
    
    async def wait_for_load(self, page: Page, max_wait: int = 5000):
        """
        Wait for dynamic content to load.
        
        Args:
            page: Playwright page object
            max_wait: Maximum wait time in milliseconds (default: 5000)
        """
        try:
            # Wait for any loading indicators to disappear
            await page.wait_for_load_state('domcontentloaded')
            await page.wait_for_load_state('networkidle', timeout=max_wait)
        except PlaywrightTimeoutError:
            # It's okay if networkidle times out - we'll use what we have
            logger.debug(f"Network idle timeout for page, using available content")
        except Exception as e:
            logger.debug(f"Wait for load completed with exception: {str(e)}")


async def fetch_html(url: str, headless: bool = True) -> Optional[str]:
    """
    Convenience function to fetch HTML from a URL.
    
    Args:
        url: URL to fetch
        headless: Run browser in headless mode
    
    Returns:
        HTML content as string if successful, None otherwise
    """
    async with WebScraper(headless=headless) as scraper:
        return await scraper.extract_html(url)

