"""
Test script for three example cases:
- Clemson Men's Basketball
- Ohio State Football
- Stanford Women's Soccer

This script runs the full pipeline for each example and logs detailed results.
"""

import asyncio
import logging
import os
import sys
from dotenv import load_dotenv
from openai import OpenAI

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.discovery import DiscoveryAgent
from agents.extraction import ExtractionAgent
from agents.verification import VerificationAgent
from agents.normalization import NormalizationAgent
from utils.web_scraper import WebScraper
from utils.csv_writer import CSVWriter

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)


TEST_CASES = [
    {
        'school': "Clemson University",
        'sport': "Men's Basketball"
    },
    {
        'school': "Ohio State",
        'sport': "Football"
    },
    {
        'school': "Stanford University",
        'sport': "Women's Soccer"
    }
]


async def test_case(school_name: str, sport: str, gemini_api_key: str, openai_client: OpenAI, web_scraper: WebScraper):
    """
    Test a single case and log detailed results.
    
    Args:
        school_name: School name
        sport: Sport name
        gemini_api_key: Gemini API key
        openai_client: OpenAI client
        web_scraper: WebScraper instance
    """
    logger.info("")
    logger.info("=" * 80)
    logger.info(f"TEST CASE: {school_name} - {sport}")
    logger.info("=" * 80)
    logger.info("")
    
    try:
        # Step 1: Discovery
        logger.info(">>> STEP 1: Discovery Agent")
        discovery_agent = DiscoveryAgent(gemini_api_key)
        urls = await discovery_agent.discover_urls(school_name, sport)
        
        logger.info(f"URLs Discovered ({len(urls)}):")
        for i, url in enumerate(urls, 1):
            logger.info(f"  {i}. {url}")
        
        if not urls:
            logger.warning("No URLs found. Skipping remaining steps.")
            return
        
        # Step 2: Extraction
        logger.info("")
        logger.info(">>> STEP 2: Extraction Agent")
        extraction_agent = ExtractionAgent(openai_client, web_scraper)
        coaches = await extraction_agent.extract_from_multiple_urls(urls)
        
        logger.info(f"Coaches Extracted: {len(coaches)}")
        for i, coach in enumerate(coaches, 1):
            logger.info(f"  {i}. {coach.get('name', 'N/A')} - {coach.get('position', 'N/A')}")
            if coach.get('email'):
                logger.info(f"     Email: {coach.get('email')}")
            if coach.get('twitter'):
                logger.info(f"     Twitter: {coach.get('twitter')}")
        
        if not coaches:
            logger.warning("No coaches extracted. Skipping remaining steps.")
            return
        
        # Step 3: Verification
        logger.info("")
        logger.info(">>> STEP 3: Verification Agent")
        verification_agent = VerificationAgent(web_scraper)
        verified_coaches = await verification_agent.verify_coaches(coaches)
        
        # Track what was removed
        removed_emails = []
        removed_twitters = []
        
        for original, verified in zip(coaches, verified_coaches):
            orig_email = original.get('email', '').strip()
            verif_email = verified.get('email', '').strip()
            if orig_email and not verif_email:
                removed_emails.append(f"{original.get('name')}: {orig_email}")
            
            orig_twitter = original.get('twitter', '').strip()
            verif_twitter = verified.get('twitter', '').strip()
            if orig_twitter and not verif_twitter:
                removed_twitters.append(f"{original.get('name')}: {orig_twitter}")
        
        logger.info(f"Coaches Verified: {len(verified_coaches)}")
        logger.info(f"Emails Removed (not found in HTML): {len(removed_emails)}")
        if removed_emails:
            for item in removed_emails:
                logger.info(f"  - {item}")
        
        logger.info(f"Twitter Handles Removed (not found in HTML): {len(removed_twitters)}")
        if removed_twitters:
            for item in removed_twitters:
                logger.info(f"  - {item}")
        
        # Step 4: Normalization
        logger.info("")
        logger.info(">>> STEP 4: Normalization Agent")
        normalization_agent = NormalizationAgent()
        normalized_coaches = normalization_agent.normalize_coaches(verified_coaches)
        
        logger.info(f"Coaches After Normalization: {len(normalized_coaches)}")
        
        # Step 5: CSV Output
        logger.info("")
        logger.info(">>> STEP 5: CSV Output")
        filename = CSVWriter.generate_filename(school_name, sport)
        success = CSVWriter.write_coaches(normalized_coaches, filename)
        
        if success:
            logger.info(f"CSV file created: {filename}")
            
            # Final summary
            logger.info("")
            logger.info("FINAL SUMMARY:")
            logger.info(f"  Total coaches: {len(normalized_coaches)}")
            logger.info(f"  With email: {sum(1 for c in normalized_coaches if c.get('email'))}")
            logger.info(f"  With Twitter: {sum(1 for c in normalized_coaches if c.get('twitter'))}")
            logger.info(f"  Without email: {sum(1 for c in normalized_coaches if not c.get('email'))}")
            logger.info(f"  Without Twitter: {sum(1 for c in normalized_coaches if not c.get('twitter'))}")
            
            # Source URLs used
            source_urls = set(c.get('source_url', '') for c in normalized_coaches)
            logger.info(f"  Source URLs used: {len(source_urls)}")
            for url in source_urls:
                if url:
                    logger.info(f"    - {url}")
        else:
            logger.error(f"Failed to create CSV file: {filename}")
    
    except Exception as e:
        logger.error(f"Error processing test case: {str(e)}", exc_info=True)


async def main():
    """Run all test cases."""
    # Load environment variables
    load_dotenv()
    openai_api_key = os.getenv('OPENAI_API_KEY')
    gemini_api_key = os.getenv('GEMINI_API_KEY')
    
    if not openai_api_key:
        logger.error("OPENAI_API_KEY not found in environment variables")
        logger.error("Please create a .env file with: OPENAI_API_KEY=your_key_here")
        sys.exit(1)
    
    if not gemini_api_key:
        logger.error("GEMINI_API_KEY not found in environment variables")
        logger.error("Please create a .env file with: GEMINI_API_KEY=your_key_here")
        sys.exit(1)
    
    # Initialize OpenAI client
    openai_client = OpenAI(api_key=openai_api_key)
    
    # Initialize web scraper
    web_scraper = WebScraper(headless=True)
    
    logger.info("Starting test suite with 3 examples")
    logger.info("")
    
    async with web_scraper:
        for test_case_data in TEST_CASES:
            await test_case(
                test_case_data['school'],
                test_case_data['sport'],
                gemini_api_key,
                openai_client,
                web_scraper
            )
            logger.info("")
            logger.info("Waiting 5 seconds before next test case...")
            await asyncio.sleep(5)  # Rate limiting between tests
    
    logger.info("=" * 80)
    logger.info("TEST SUITE COMPLETE")
    logger.info("=" * 80)


if __name__ == '__main__':
    asyncio.run(main())

