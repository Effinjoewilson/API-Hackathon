from typing import Dict, List, Any
from fuzzywuzzy import fuzz
import re


class FieldMatcher:
    """Suggest field mappings based on similarity"""
    
    def __init__(self):
        self.common_mappings = {
            'email': ['email', 'email_address', 'emailaddress', 'mail', 'user_email'],
            'name': ['name', 'full_name', 'fullname', 'display_name', 'username'],
            'first_name': ['first_name', 'firstname', 'fname', 'given_name'],
            'last_name': ['last_name', 'lastname', 'lname', 'surname', 'family_name'],
            'phone': ['phone', 'phone_number', 'phonenumber', 'telephone', 'mobile'],
            'address': ['address', 'street_address', 'street', 'location'],
            'city': ['city', 'town', 'locality'],
            'state': ['state', 'province', 'region'],
            'country': ['country', 'country_code', 'nation'],
            'zip': ['zip', 'zipcode', 'zip_code', 'postal_code', 'postcode'],
            'created': ['created', 'created_at', 'createdat', 'date_created', 'created_date'],
            'updated': ['updated', 'updated_at', 'updatedat', 'date_updated', 'modified'],
            'id': ['id', 'identifier', 'key', 'uuid', 'guid'],
        }
    
    def suggest_mappings(self, api_data: Any, db_schema: Dict) -> List[Dict]:
        """Suggest field mappings between API response and database schema"""
        suggestions = []
        
        # Extract all field paths from API data
        api_fields = self._extract_field_paths(api_data)
        
        # Get database columns
        db_columns = []
        if 'columns' in db_schema:  # SQL database
            db_columns = [col['name'] for col in db_schema['columns']]
        elif 'fields' in db_schema:  # MongoDB
            db_columns = [field['name'] for field in db_schema['fields']]
        
        # Match fields
        for api_field_path, api_field_name in api_fields:
            best_match = self._find_best_match(api_field_name, db_columns)
            
            if best_match['score'] > 70:  # Threshold for auto-suggestion
                suggestions.append({
                    'source_path': api_field_path,
                    'source_name': api_field_name,
                    'target_column': best_match['column'],
                    'confidence': best_match['score'],
                    'match_type': best_match['type']
                })
        
        return sorted(suggestions, key=lambda x: x['confidence'], reverse=True)
    
    def _extract_field_paths(self, data: Any, prefix: str = '') -> List[tuple]:
        """Extract all field paths from nested data structure"""
        fields = []
        
        if isinstance(data, dict):
            for key, value in data.items():
                path = f"{prefix}.{key}" if prefix else key
                fields.append((path, key))
                
                # Recurse for nested objects
                if isinstance(value, dict):
                    fields.extend(self._extract_field_paths(value, path))
                elif isinstance(value, list) and value and isinstance(value[0], dict):
                    # Handle arrays of objects
                    fields.extend(self._extract_field_paths(value[0], f"{path}[0]"))
        
        elif isinstance(data, list) and data and isinstance(data[0], dict):
            # If root is array
            fields.extend(self._extract_field_paths(data[0], '[0]'))
        
        return fields
    
    def _find_best_match(self, api_field: str, db_columns: List[str]) -> Dict:
        """Find best matching database column for an API field"""
        best_match = {
            'column': None,
            'score': 0,
            'type': 'none'
        }
        
        # Normalize field name
        normalized_api = self._normalize_field_name(api_field)
        
        # Check exact match first
        for column in db_columns:
            if normalized_api == self._normalize_field_name(column):
                return {
                    'column': column,
                    'score': 100,
                    'type': 'exact'
                }
        
        # Check common mappings
        for common_field, variations in self.common_mappings.items():
            if normalized_api in [self._normalize_field_name(v) for v in variations]:
                for column in db_columns:
                    normalized_col = self._normalize_field_name(column)
                    if normalized_col in [self._normalize_field_name(v) for v in variations]:
                        return {
                            'column': column,
                            'score': 95,
                            'type': 'common'
                        }
        
        # Fuzzy matching
        for column in db_columns:
            # Simple ratio
            simple_score = fuzz.ratio(normalized_api, self._normalize_field_name(column))
            
            # Token sort ratio (handles word order)
            token_score = fuzz.token_sort_ratio(api_field.lower(), column.lower())
            
            # Take the higher score
            score = max(simple_score, token_score)
            
            if score > best_match['score']:
                best_match = {
                    'column': column,
                    'score': score,
                    'type': 'fuzzy'
                }
        
        return best_match
    
    def _normalize_field_name(self, field: str) -> str:
        """Normalize field name for comparison"""
        # Convert camelCase to snake_case
        field = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', field)
        field = re.sub('([a-z0-9])([A-Z])', r'\1_\2', field)
        
        # Remove common prefixes/suffixes
        field = re.sub(r'^(get_|set_|is_|has_)', '', field)
        field = re.sub(r'(_id|_at|_by)$', '', field)
        
        # Convert to lowercase and remove special characters
        return re.sub(r'[^a-z0-9]', '', field.lower())