"""
Normalization Agent - Standardizes and cleans extracted data.

This agent standardizes names, positions, phone numbers, and social media URLs,
ensures CSV-safe formatting, removes duplicates, and limits the final output to 15 coaches.
"""

import logging
import re
from typing import List, Dict

logger = logging.getLogger(__name__)


class NormalizationAgent:
    """
    Normalization Agent standardizes coach data for CSV output.
    
    Operations:
    - Standardizes name formatting (Title Case)
    - Normalizes position titles
    - Cleans phone numbers (NEW)
    - Converts Twitter/social URLs to canonical format
    - Strips @ symbols from handles
    - Ensures CSV-safe formatting
    - Removes duplicates
    - NOW LIMITS TO 15 COACHES (was 10)
    """
    
    def normalize_coaches(self, coaches: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """
        Normalize and clean coach data.
        
        Args:
            coaches: List of coach dictionaries
        
        Returns:
            Cleaned, normalized coach list (max 15)
        """
        if not coaches:
            return []
        
        logger.info(f"Normalization Agent: Normalizing {len(coaches)} coaches")
        
        normalized = []
        seen = set()  # Track duplicates by (name_lower, position_lower)
        
        for coach in coaches:
            normalized_coach = self._normalize_coach(coach)
            
            # Check for duplicates
            key = (
                normalized_coach['name'].lower(),
                normalized_coach['position'].lower()
            )
            
            if key not in seen:
                seen.add(key)
                normalized.append(normalized_coach)
                
                # CHANGED: Stop at 15 coaches (was 10)
                if len(normalized) >= 15:
                    logger.info("Normalization Agent: Reached limit of 15 coaches")
                    break
        
        logger.info(f"Normalization Agent: Normalized to {len(normalized)} unique coaches")
        return normalized
    
    def _normalize_coach(self, coach: Dict[str, str]) -> Dict[str, str]:
        """
        Normalize a single coach's data.
        
        NEW: Added phone field normalization
        
        Args:
            coach: Coach dictionary
        
        Returns:
            Normalized coach dictionary
        """
        return {
            'name': self._normalize_name(coach.get('name', '')),
            'position': self._normalize_position(coach.get('position', '')),
            'email': self._normalize_email(coach.get('email', '')),
            'phone': self._normalize_phone(coach.get('phone', '')),  # NEW FIELD
            'twitter': self._normalize_twitter(coach.get('twitter', '')),
            'source_url': coach.get('source_url', '')
        }
    
    def _normalize_name(self, name: str) -> str:
        """
        Normalize name to Title Case.
        
        Handles special cases like:
        - "Mc", "Mac", "O'" prefixes
        - All caps names
        - Mixed case names
        
        Args:
            name: Raw name string
        
        Returns:
            Normalized name in Title Case
        """
        if not name:
            return ''
        
        name = name.strip()
        
        # Handle all-caps names
        if name.isupper() and len(name) > 1:
            name = name.title()
        else:
            # Use title case but preserve existing capitalization for special cases
            # Simple approach: convert to title case
            name = name.title()
        
        # Fix common prefixes
        name = re.sub(r'\bMc([A-Z])', r'Mc\1', name)  # McName
        name = re.sub(r'\bMac([A-Z])', r'Mac\1', name)  # MacName
        name = re.sub(r"\bO'([A-Z])", r"O'\1", name)  # O'Name
        name = re.sub(r'\bDe ([A-Z])', r'De \1', name)  # De Name
        name = re.sub(r'\bVan ([A-Z])', r'Van \1', name)  # Van Name
        
        return name
    
    def _normalize_position(self, position: str) -> str:
        """
        Normalize position title.
        
        Removes redundant words and standardizes formatting.
        
        Args:
            position: Raw position string
        
        Returns:
            Normalized position
        """
        if not position:
            return ''
        
        position = position.strip()
        
        # Remove common redundant prefixes/suffixes
        position = re.sub(r'^(assistant|associate|head|volunteer|graduate)\s+', r'\1 ', position, flags=re.IGNORECASE)
        position = re.sub(r'\s+(coach|manager|coordinator|director)$', r' \1', position, flags=re.IGNORECASE)
        
        # Standardize capitalization
        words = position.split()
        if words:
            # Capitalize first letter of each word
            normalized_words = [word.capitalize() for word in words]
            position = ' '.join(normalized_words)
        
        # Common title normalization
        position = re.sub(r'\bAsst\b', 'Assistant', position, flags=re.IGNORECASE)
        position = re.sub(r'\bAssoc\b', 'Associate', position, flags=re.IGNORECASE)
        position = re.sub(r'\bHc\b', 'Head Coach', position, flags=re.IGNORECASE)
        
        return position
    
    def _normalize_email(self, email: str) -> str:
        """
        Normalize email address.
        
        Args:
            email: Email string
        
        Returns:
            Normalized email (lowercase)
        """
        if not email:
            return ''
        
        email = email.strip().lower()
        
        # Remove mailto: prefix if present
        email = re.sub(r'^mailto:', '', email)
        
        # Basic email validation (simple check)
        if '@' in email and '.' in email.split('@')[1]:
            return email
        
        return ''
    
    def _normalize_phone(self, phone: str) -> str:
        """
        Normalize phone number.
        
        NEW METHOD: Cleans up phone numbers while preserving formatting
        
        Args:
            phone: Phone string
        
        Returns:
            Normalized phone (digits and basic formatting only)
        """
        if not phone:
            return ''
        
        phone = phone.strip()
        
        # Remove common prefixes
        phone = re.sub(r'^(tel:|phone:|p:)', '', phone, flags=re.IGNORECASE)
        
        # Keep only digits, spaces, parentheses, hyphens, plus, periods
        phone = re.sub(r'[^\d\s()\-+.x]', '', phone)
        
        # Remove excessive whitespace
        phone = ' '.join(phone.split())
        
        return phone.strip()
    
    def _normalize_twitter(self, twitter: str) -> str:
        """
        Normalize Twitter/social media handle/URL to canonical format.
        
        UPDATED: Now handles Twitter/X and other social media
        Converts to: https://twitter.com/handle
        Strips @ symbols and handles various input formats.
        
        Args:
            twitter: Twitter/social handle or URL
        
        Returns:
            Normalized Twitter URL or empty string
        """
        if not twitter:
            return ''
        
        twitter = twitter.strip()
        
        # Extract handle from various formats
        # https://twitter.com/handle
        # https://x.com/handle
        # @handle
        # handle
        # twitter.com/handle
        
        handle_match = re.search(r'(?:twitter\.com|x\.com)/([a-zA-Z0-9_]+)', twitter)
        if handle_match:
            handle = handle_match.group(1).lower()
            return f"https://twitter.com/{handle}"
        
        # Try to extract handle directly (for @handle or plain handle)
        handle_match = re.search(r'@?([a-zA-Z0-9_]+)', twitter)
        if handle_match:
            handle = handle_match.group(1).lower()
            # Only return if it looks like a valid handle (3-15 chars, alphanumeric + underscore)
            if 3 <= len(handle) <= 15 and re.match(r'^[a-zA-Z0-9_]+$', handle):
                return f"https://twitter.com/{handle}"
        
        return ''
    
    def _escape_csv_field(self, field: str) -> str:
        """
        Escape a field for CSV safety.
        
        Note: Python's csv module handles this automatically, but keeping for reference
        
        Args:
            field: Field value
        
        Returns:
            CSV-safe field value
        """
        if not field:
            return ''
        
        # If field contains comma, quote, or newline, wrap in quotes and escape quotes
        if any(char in field for char in [',', '"', '\n', '\r']):
            # Double any existing quotes
            escaped = field.replace('"', '""')
            return f'"{escaped}"'
        
        return field
