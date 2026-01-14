#!/usr/bin/env python3
"""
Main CLI entry point for the AI Recruiting Agent.

UPDATED: Removed verification step entirely. Now: Discovery → Extraction → Normalization → CSV

Usage:
    python main.py "School Name" "Sport"

Example:
    python main.py "Clemson University" "Men's Basketball"
"""

import argparse
import asyncio
import logging
import os
import sys
from dotenv import load_dotenv

from agents.discovery import DiscoveryAgent
from agents.extraction import ExtractionAgent
# REMOVED: from agents.verification import VerificationAgent  # No longer needed
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


async def main():
    """Main entry point for the CLI."""
    # Parse arguments
    parser = argparse.ArgumentParser(
        description='AI Recruiting Agent - Extract coaching staff information from official athletics websites',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py "Clemson University" "Men's Basketball"
  python main.py "Ohio State" "Football"
  python main.py "Stanford University" "Women's Soccer"
  python main.py "duke" "football"
        """
    )
    parser.add_argument('school', type=str, help='School name (e.g., "Clemson University")')
    parser.add_argument('sport', type=str, help='Sport name (e.g., "Men\'s Basketball")')
    parser.add_argument('--output', '-o', type=str, help='Output CSV filename (auto-generated if not provided)')
    parser.add_argument('--headless', action='store_true', default=True, help='Run browser in headless mode (default: True)')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose logging')
    
    args = parser.parse_args()
    
    # Set logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    school_name = args.school.strip()
    sport = args.sport.strip()
    
    logger.info(f"Starting AI Recruiting Agent")
    logger.info(f"School: {school_name}")
    logger.info(f"Sport: {sport}")
    
    # Load environment variables
    load_dotenv()
    openai_api_key = os.getenv('OPENAI_API_KEY')
    
    if not openai_api_key:
        logger.error("OPENAI_API_KEY not found in environment variables")
        logger.error("Please create a .env file with: OPENAI_API_KEY=your_key_here")
        sys.exit(1)
    
    # Initialize web scraper
    web_scraper = WebScraper(headless=args.headless)
    
    try:
        # Execute agent pipeline (NOW 4 STEPS INSTEAD OF 5)
        async with web_scraper:
            logger.info("=" * 60)
            logger.info("STEP 1: Discovery Agent")
            logger.info("=" * 60)
            
            discovery_agent = DiscoveryAgent(openai_api_key)
            urls = await discovery_agent.discover_urls(school_name, sport)
            
            if not urls:
                logger.error("Discovery Agent: No URLs found. Exiting.")
                sys.exit(1)
            
            logger.info(f"Discovery Agent: Found {len(urls)} candidate directory URLs")
            
            logger.info("=" * 60)
            logger.info("STEP 2: Extraction Agent")
            logger.info("=" * 60)
            
            extraction_agent = ExtractionAgent(openai_api_key, web_scraper)
            coaches = await extraction_agent.extract_from_multiple_urls(urls)
            
            if not coaches:
                logger.error("Extraction Agent: No coaches found. Exiting.")
                sys.exit(1)
            
            logger.info(f"Extraction Agent: Extracted {len(coaches)} coaches")
            
            # REMOVED: STEP 3 Verification Agent (no longer needed)
            # We trust the data from directory pages
            
            # CHANGED: This is now STEP 3 (was STEP 4)
            logger.info("=" * 60)
            logger.info("STEP 3: Normalization Agent")
            logger.info("=" * 60)
            
            normalization_agent = NormalizationAgent()
            # CHANGED: Pass coaches directly (no verification step)
            normalized_coaches = normalization_agent.normalize_coaches(coaches)
            
            logger.info(f"Normalization Agent: Normalized to {len(normalized_coaches)} coaches")
            
            # CHANGED: This is now STEP 4 (was STEP 5)
            logger.info("=" * 60)
            logger.info("STEP 4: CSV Output")
            logger.info("=" * 60)
            
            # Generate filename
            if args.output:
                filename = args.output
            else:
                filename = CSVWriter.generate_filename(school_name, sport)
            
            success = CSVWriter.write_coaches(normalized_coaches, filename)
            
            if success:
                logger.info("=" * 60)
                logger.info("SUCCESS")
                logger.info("=" * 60)
                logger.info(f"Output file: {filename}")
                logger.info(f"Total coaches extracted: {len(normalized_coaches)}")
                
                # Show summary with NEW phone field
                with_email = sum(1 for c in normalized_coaches if c.get('email'))
                with_phone = sum(1 for c in normalized_coaches if c.get('phone'))  # NEW
                with_twitter = sum(1 for c in normalized_coaches if c.get('twitter'))
                
                logger.info(f"  - Coaches with email: {with_email}")
                logger.info(f"  - Coaches with phone: {with_phone}")  # NEW
                logger.info(f"  - Coaches with Twitter: {with_twitter}")
                logger.info("=" * 60)
            else:
                logger.error("Failed to write CSV file")
                sys.exit(1)
    
    except KeyboardInterrupt:
        logger.info("\nInterrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    asyncio.run(main())
