"""
CSV Writer utility for writing coach data to CSV files.

This module handles CSV writing with proper formatting, special character handling,
and filename generation from school and sport names.

UPDATED: Added 'coach_phone' column to CSV output.
"""

import csv
import logging
import re
from typing import List, Dict

logger = logging.getLogger(__name__)


class CSVWriter:
    """
    CSV Writer for coach data.
    
    Handles:
    - CSV column formatting
    - Special character escaping
    - Filename generation from school + sport
    - Source URL inclusion
    
    UPDATED: Now includes phone number column
    """
    
    # CHANGED: Added 'coach_phone' column
    CSV_COLUMNS = ['coach_name', 'coach_position', 'coach_email', 'coach_phone', 'coach_twitter', 'source_url']
    
    @staticmethod
    def write_coaches(coaches: List[Dict[str, str]], filename: str) -> bool:
        """
        Write coaches to CSV file.
        
        UPDATED: Now writes phone number field
        
        Args:
            coaches: List of coach dictionaries
            filename: Output CSV filename
        
        Returns:
            True if successful, False otherwise
        """
        if not coaches:
            logger.warning("CSV Writer: No coaches to write")
            return False
        
        try:
            with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=CSVWriter.CSV_COLUMNS)
                
                # Write header
                writer.writeheader()
                
                # Write coach rows
                for coach in coaches:
                    # CHANGED: Added 'coach_phone' field
                    row = {
                        'coach_name': coach.get('name', ''),
                        'coach_position': coach.get('position', ''),
                        'coach_email': coach.get('email', ''),
                        'coach_phone': coach.get('phone', ''),  # NEW FIELD
                        'coach_twitter': coach.get('twitter', ''),
                        'source_url': coach.get('source_url', '')
                    }
                    writer.writerow(row)
            
            logger.info(f"CSV Writer: Successfully wrote {len(coaches)} coaches to {filename}")
            return True
            
        except Exception as e:
            logger.error(f"CSV Writer: Error writing to {filename}: {str(e)}")
            return False
    
    @staticmethod
    def generate_filename(school_name: str, sport: str) -> str:
        """
        Generate CSV filename from school name and sport.
        
        Format: {school_normalized}_{sport_normalized}_coaches.csv
        
        Example: clemson_university_mens_basketball_coaches.csv
        
        Args:
            school_name: School name
            sport: Sport name
        
        Returns:
            Normalized filename
        """
        # Normalize school name
        school_normalized = CSVWriter._normalize_for_filename(school_name)
        
        # Normalize sport name
        sport_normalized = CSVWriter._normalize_for_filename(sport)
        
        filename = f"{school_normalized}_{sport_normalized}_coaches.csv"
        
        logger.debug(f"CSV Writer: Generated filename: {filename}")
        return filename
    
    @staticmethod
    def _normalize_for_filename(text: str) -> str:
        """
        Normalize text for use in filename.
        
        - Convert to lowercase
        - Replace spaces and special characters with underscores
        - Remove multiple consecutive underscores
        - Limit length
        
        Args:
            text: Text to normalize
        
        Returns:
            Normalized string
        """
        if not text:
            return 'unknown'
        
        # Convert to lowercase
        normalized = text.lower()
        
        # Replace spaces and special characters with underscores
        normalized = re.sub(r'[^\w\s-]', '', normalized)  # Remove special chars
        normalized = re.sub(r'[\s_-]+', '_', normalized)  # Replace spaces/hyphens with underscore
        
        # Remove leading/trailing underscores
        normalized = normalized.strip('_')
        
        # Remove multiple consecutive underscores
        normalized = re.sub(r'_+', '_', normalized)
        
        # Limit length (filenames should be reasonable)
        if len(normalized) > 50:
            normalized = normalized[:50]
            normalized = normalized.rstrip('_')
        
        return normalized if normalized else 'unknown'
