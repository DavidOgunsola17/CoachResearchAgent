#!/usr/bin/env python3
"""
Main CLI entry point for the AI Recruiting Agent.

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
from openai import OpenAI

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
    gemini_api_key = os.getenv('GEMINI_API_KEY')
    
    if not openai_api_key:
        logger.error("OPENAI_API_KEY not found in environment variables")
        logger.error("Please create a .env file with: OPENAI_API_KEY=your_key_here")
        sys.exit(1)
    
    if not gemini_api_key:
        logger.error("GEMINI_API_KEY not found in environment variables")
        logger.error("Please create a .env file with: GEMINI_API_KEY=your_key_here")
        sys.exit(1)
    
    # Initialize OpenAI client (for extraction agent)
    openai_client = OpenAI(api_key=openai_api_key)
    
    # Initialize web scraper
    web_scraper = WebScraper(headless=args.headless)
    
    try:
        # Execute agent pipeline
        async with web_scraper:
            logger.info("=" * 60)
            logger.info("STEP 1: Discovery Agent")
            logger.info("=" * 60)
            
            discovery_agent = DiscoveryAgent(gemini_api_key)
            urls = await discovery_agent.discover_urls(school_name, sport)
            
            if not urls:
                logger.error("Discovery Agent: No URLs found. Exiting.")
                sys.exit(1)
            
            logger.info(f"Discovery Agent: Found {len(urls)} candidate URLs")
            
            logger.info("=" * 60)
            logger.info("STEP 2: Extraction Agent")
            logger.info("=" * 60)
            
            extraction_agent = ExtractionAgent(openai_client, web_scraper)
            coaches = await extraction_agent.extract_from_multiple_urls(urls)
            
            if not coaches:
                logger.error("Extraction Agent: No coaches found. Exiting.")
                sys.exit(1)
            
            logger.info(f"Extraction Agent: Extracted {len(coaches)} coaches")
            
            logger.info("=" * 60)
            logger.info("STEP 3: Verification Agent")
            logger.info("=" * 60)
            
            verification_agent = VerificationAgent(web_scraper)
            verified_coaches = await verification_agent.verify_coaches(coaches)
            
            logger.info(f"Verification Agent: Verified {len(verified_coaches)} coaches")
            
            # Count fields that were removed
            original_with_email = sum(1 for c in coaches if c.get('email'))
            verified_with_email = sum(1 for c in verified_coaches if c.get('email'))
            original_with_twitter = sum(1 for c in coaches if c.get('twitter'))
            verified_with_twitter = sum(1 for c in verified_coaches if c.get('twitter'))
            
            if original_with_email > verified_with_email:
                logger.info(f"Verification Agent: Removed {original_with_email - verified_with_email} unverified emails")
            if original_with_twitter > verified_with_twitter:
                logger.info(f"Verification Agent: Removed {original_with_twitter - verified_with_twitter} unverified Twitter handles")
            
            logger.info("=" * 60)
            logger.info("STEP 4: Normalization Agent")
            logger.info("=" * 60)
            
            normalization_agent = NormalizationAgent()
            normalized_coaches = normalization_agent.normalize_coaches(verified_coaches)
            
            logger.info(f"Normalization Agent: Normalized to {len(normalized_coaches)} coaches")
            
            logger.info("=" * 60)
            logger.info("STEP 5: CSV Output")
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
                
                # Show summary
                with_email = sum(1 for c in normalized_coaches if c.get('email'))
                with_twitter = sum(1 for c in normalized_coaches if c.get('twitter'))
                
                logger.info(f"  - Coaches with email: {with_email}")
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

