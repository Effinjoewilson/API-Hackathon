from typing import Any
import re
from datetime import datetime


class DataTransformer:
    """Apply transformations to data values"""
    
    def __init__(self):
        self.transformations = {
            'lowercase': self._lowercase,
            'uppercase': self._uppercase,
            'trim': self._trim,
            'remove_spaces': self._remove_spaces,
            'capitalize': self._capitalize,
            'title_case': self._title_case,
            'parse_int': self._parse_int,
            'parse_float': self._parse_float,
            'parse_bool': self._parse_bool,
            'parse_date': self._parse_date,
            'parse_datetime': self._parse_datetime,
            'to_string': self._to_string,
            'extract_numbers': self._extract_numbers,
            'extract_email': self._extract_email,
            'remove_special_chars': self._remove_special_chars,
            'truncate': self._truncate,
            'default_if_empty': self._default_if_empty,
            'multiply': self._multiply,
            'divide': self._divide,
            'add': self._add,
            'subtract': self._subtract,
             # New transformations
            'snake_case': self._snake_case,
            'camel_case': self._camel_case,
            'truncate_50': lambda v: self._truncate(v, {'length': 50}),
            'truncate_255': lambda v: self._truncate(v, {'length': 255}),
            'json_stringify': self._json_stringify,
            'json_parse': self._json_parse,
            'to_timestamp': self._to_timestamp,
            'format_date_us': self._format_date_us,
            'format_date_iso': self._format_date_iso,
            'escape_sql': self._escape_sql,
            'null_to_empty': self._null_to_empty,
            'empty_to_null': self._empty_to_null,
            'boolean_to_bit': self._boolean_to_bit,
            'normalize_phone': self._normalize_phone,
            'normalize_email': self._normalize_email,
        }
    
    def apply(self, transformation: str, value: Any, params: dict = None) -> Any:
        """Apply a transformation to a value"""
        if transformation not in self.transformations:
            return value
        
        try:
            if params:
                return self.transformations[transformation](value, params)
            return self.transformations[transformation](value)
        except:
            # If transformation fails, return original value
            return value
    
    def _lowercase(self, value: Any) -> str:
        """Convert to lowercase"""
        return str(value).lower() if value is not None else ''
    
    def _uppercase(self, value: Any) -> str:
        """Convert to uppercase"""
        return str(value).upper() if value is not None else ''
    
    def _trim(self, value: Any) -> str:
        """Remove leading/trailing whitespace"""
        return str(value).strip() if value is not None else ''
    
    def _remove_spaces(self, value: Any) -> str:
        """Remove all spaces"""
        return str(value).replace(' ', '') if value is not None else ''
    
    def _capitalize(self, value: Any) -> str:
        """Capitalize first letter"""
        return str(value).capitalize() if value is not None else ''
    
    def _title_case(self, value: Any) -> str:
        """Convert to title case"""
        return str(value).title() if value is not None else ''
    
    def _parse_int(self, value: Any) -> int:
        """Parse integer"""
        if isinstance(value, int):
            return value
        if isinstance(value, float):
            return int(value)
        if isinstance(value, str):
            # Extract numbers from string
            numbers = re.findall(r'-?\d+', value)
            if numbers:
                return int(numbers[0])
        return 0
    
    def _parse_float(self, value: Any) -> float:
        """Parse float"""
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            # Remove currency symbols and commas
            cleaned = re.sub(r'[^\d.-]', '', value)
            try:
                return float(cleaned)
            except:
                pass
        return 0.0
    
    def _parse_bool(self, value: Any) -> bool:
        """Parse boolean"""
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.lower() in ['true', 'yes', '1', 'on']
        return bool(value)
    
    def _parse_date(self, value: Any) -> str:
        """Parse date to YYYY-MM-DD format"""
        if not value:
            return None
        
        date_formats = [
            '%Y-%m-%d',
            '%m/%d/%Y',
            '%d/%m/%Y',
            '%Y/%m/%d',
            '%d-%m-%Y',
            '%m-%d-%Y',
        ]
        
        for fmt in date_formats:
            try:
                dt = datetime.strptime(str(value), fmt)
                return dt.strftime('%Y-%m-%d')
            except:
                continue
        
        return str(value)
    
    def _parse_datetime(self, value: Any) -> str:
        """Parse datetime to ISO format"""
        if not value:
            return None
        
        datetime_formats = [
            '%Y-%m-%dT%H:%M:%S',
            '%Y-%m-%d %H:%M:%S',
            '%m/%d/%Y %H:%M:%S',
            '%d/%m/%Y %H:%M:%S',
        ]
        
        for fmt in datetime_formats:
            try:
                dt = datetime.strptime(str(value), fmt)
                return dt.isoformat()
            except:
                continue
        
        return str(value)
    
    def _to_string(self, value: Any) -> str:
        """Convert to string"""
        if value is None:
            return ''
        if isinstance(value, (dict, list)):
            import json
            return json.dumps(value)
        return str(value)
    
    def _extract_numbers(self, value: Any) -> str:
        """Extract only numbers from string"""
        if not value:
            return ''
        numbers = re.findall(r'\d+', str(value))
        return ''.join(numbers)
    
    def _extract_email(self, value: Any) -> str:
        """Extract email from string"""
        if not value:
            return ''
        match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', str(value))
        return match.group(0) if match else ''
    
    def _remove_special_chars(self, value: Any) -> str:
        """Remove special characters"""
        if not value:
            return ''
        return re.sub(r'[^a-zA-Z0-9\s]', '', str(value))
    
    def _truncate(self, value: Any, params: dict = None) -> str:
        """Truncate string to specified length"""
        if not value:
            return ''
        length = params.get('length', 255) if params else 255
        s = str(value)
        return s[:length] if len(s) > length else s
    
    def _default_if_empty(self, value: Any, params: dict = None) -> Any:
        """Return default value if empty"""
        default = params.get('default', '') if params else ''
        if not value or (isinstance(value, str) and not value.strip()):
            return default
        return value
    
    def _multiply(self, value: Any, params: dict = None) -> float:
        """Multiply by a factor"""
        factor = params.get('factor', 1) if params else 1
        try:
            return float(value) * factor
        except:
            return 0
    
    def _divide(self, value: Any, params: dict = None) -> float:
        """Divide by a factor"""
        factor = params.get('factor', 1) if params else 1
        try:
            return float(value) / factor if factor != 0 else 0
        except:
            return 0
    
    def _add(self, value: Any, params: dict = None) -> float:
        """Add a value"""
        addend = params.get('value', 0) if params else 0
        try:
            return float(value) + addend
        except:
            return 0
    
    def _subtract(self, value: Any, params: dict = None) -> float:
        """Subtract a value"""
        subtrahend = params.get('value', 0) if params else 0
        try:
            return float(value) - subtrahend
        except:
            return 0
        
    def _snake_case(self, value: Any) -> str:
        """Convert to snake_case"""
        s = str(value) if value is not None else ''
        s = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', s)
        s = re.sub('([a-z0-9])([A-Z])', r'\1_\2', s)
        return s.lower().replace(' ', '_')

    def _camel_case(self, value: Any) -> str:
        """Convert to camelCase"""
        s = str(value) if value is not None else ''
        words = s.replace('_', ' ').split()
        if not words:
            return ''
        return words[0].lower() + ''.join(word.capitalize() for word in words[1:])

    def _json_stringify(self, value: Any) -> str:
        """Convert object to JSON string"""
        if isinstance(value, str):
            return value
        import json
        return json.dumps(value)

    def _json_parse(self, value: Any) -> Any:
        """Parse JSON string to object"""
        if not isinstance(value, str):
            return value
        import json
        try:
            return json.loads(value)
        except:
            return value

    def _to_timestamp(self, value: Any) -> int:
        """Convert to Unix timestamp"""
        try:
            dt = datetime.strptime(str(value), '%Y-%m-%d') if isinstance(value, str) else value
            return int(dt.timestamp())
        except:
            return 0

    def _format_date_us(self, value: Any) -> str:
        """Format date as MM/DD/YYYY"""
        try:
            dt = datetime.strptime(str(value), '%Y-%m-%d') if isinstance(value, str) else value
            return dt.strftime('%m/%d/%Y')
        except:
            return str(value)

    def _format_date_iso(self, value: Any) -> str:
        """Format date as YYYY-MM-DD"""
        try:
            dt = datetime.strptime(str(value), '%m/%d/%Y') if isinstance(value, str) else value
            return dt.strftime('%Y-%m-%d')
        except:
            return str(value)

    def _escape_sql(self, value: Any) -> str:
        """Escape SQL special characters"""
        return str(value).replace("'", "''") if value is not None else ''

    def _null_to_empty(self, value: Any) -> Any:
        """Convert null to empty string"""
        return '' if value is None else value

    def _empty_to_null(self, value: Any) -> Any:
        """Convert empty string to null"""
        if isinstance(value, str) and value.strip() == '':
            return None
        return value

    def _boolean_to_bit(self, value: Any) -> int:
        """Convert boolean to bit (0/1)"""
        if isinstance(value, bool):
            return 1 if value else 0
        if isinstance(value, str):
            return 1 if value.lower() in ['true', 'yes', '1', 'on'] else 0
        return 1 if value else 0

    def _normalize_phone(self, value: Any) -> str:
        """Normalize phone number"""
        if not value:
            return ''
        # Remove all non-numeric characters
        phone = re.sub(r'[^0-9]', '', str(value))
        # Format as (XXX) XXX-XXXX if 10 digits
        if len(phone) == 10:
            return f"({phone[:3]}) {phone[3:6]}-{phone[6:]}"
        return phone

    def _normalize_email(self, value: Any) -> str:
        """Normalize email (lowercase and trim)"""
        return str(value).strip().lower() if value else ''