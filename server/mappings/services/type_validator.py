from typing import Dict, List, Any, Tuple
import re
from datetime import datetime


class TypeValidator:
    """Validate and check type compatibility between source and target fields"""
    
    # Define type compatibility matrix
    TYPE_COMPATIBILITY = {
        'string': ['text', 'varchar', 'char', 'string', 'str'],
        'integer': ['int', 'integer', 'bigint', 'smallint', 'tinyint', 'number'],
        'float': ['float', 'double', 'decimal', 'numeric', 'real'],
        'boolean': ['bool', 'boolean', 'bit'],
        'date': ['date'],
        'datetime': ['datetime', 'timestamp'],
        'json': ['json', 'jsonb', 'object', 'dict'],
        'array': ['array', 'list']
    }
    
    def validate_mappings(self, mappings: List[Dict], api_sample: Any, db_schema: Dict) -> Dict:
        """Validate type compatibility for suggested mappings"""
        validations = {}
        
        for mapping in mappings:
            source_path = mapping['source_path']
            target_column = mapping['target_column']
            
            # Get source type from sample data
            source_type, source_value = self._get_source_type(api_sample, source_path)
            
            # Get target type from schema
            target_type = self._get_target_type(db_schema, target_column)
            
            # Check compatibility
            compatibility = self._check_type_compatibility(source_type, target_type)
            
            validations[f"{source_path}->{target_column}"] = {
                'source_type': source_type,
                'target_type': target_type,
                'compatible': compatibility['compatible'],
                'conversion_needed': compatibility['conversion_needed'],
                'warning': compatibility['warning'],
                'sample_value': str(source_value)[:50] if source_value is not None else None
            }
        
        return validations

    def _get_source_type(self, data: Any, path: str) -> Tuple[str, Any]:
        """Determine the type of a source field from sample data"""
        # Extract value
        value = self._extract_value(data, path)
        
        if value is None:
            return 'null', None
        
        # Determine Python type
        if isinstance(value, bool):
            return 'boolean', value
        elif isinstance(value, int):
            return 'integer', value
        elif isinstance(value, float):
            return 'float', value
        elif isinstance(value, str):
            # Check for special string types
            if self._is_date(value):
                return 'date', value
            elif self._is_datetime(value):
                return 'datetime', value
            elif self._is_email(value):
                return 'email', value
            elif self._is_url(value):
                return 'url', value
            else:
                return 'string', value
        elif isinstance(value, dict):
            return 'json', value
        elif isinstance(value, list):
            return 'array', value
        else:
            return 'unknown', value
    
    def _get_target_type(self, schema: Dict, column_name: str) -> str:
        """Get the target column type from database schema"""
        if 'columns' in schema:  # SQL database
            for col in schema['columns']:
                if col['name'] == column_name:
                    return col['type'].lower()
        elif 'fields' in schema:  # MongoDB
            for field in schema['fields']:
                if field['name'] == column_name:
                    return field['type'].lower()
        
        return 'unknown'
    
    def _check_type_compatibility(self, source_type: str, target_type: str) -> Dict:
        """Check if source type is compatible with target type"""
        result = {
            'compatible': False,
            'conversion_needed': False,
            'warning': None
        }
        
        source = source_type.lower()
        target = target_type.lower()
        
        # Direct compatible mappings (no transformation needed)
        direct_compatible = {
            # String types
            'string': ['varchar', 'text', 'char', 'character varying', 'nvarchar', 'ntext', 
                    'longtext', 'mediumtext', 'tinytext', 'string'],
            'str': ['varchar', 'text', 'char', 'character varying', 'nvarchar', 'ntext'],
            
            # Integer types  
            'integer': ['int', 'integer', 'bigint', 'smallint', 'tinyint', 'int2', 'int4', 
                        'int8', 'serial', 'bigserial', 'smallserial'],
            'int': ['int', 'integer', 'bigint', 'smallint', 'tinyint'],
            
            # Float types
            'float': ['float', 'double', 'decimal', 'numeric', 'real', 'double precision', 
                    'float4', 'float8', 'money'],
            
            # Boolean types
            'boolean': ['bool', 'boolean', 'bit', 'tinyint(1)'],
            'bool': ['bool', 'boolean', 'bit'],
            
            # Date types
            'date': ['date', 'datetime', 'timestamp', 'timestamptz', 
                    'timestamp with time zone', 'timestamp without time zone'],
            'datetime': ['datetime', 'timestamp', 'timestamptz', 
                        'timestamp with time zone', 'timestamp without time zone'],
            
            # JSON types
            'dict': ['json', 'jsonb', 'text', 'longtext', 'nvarchar(max)'],
            'object': ['json', 'jsonb', 'text'],
            'list': ['json', 'jsonb', 'text', 'longtext'],
            'array': ['json', 'jsonb', 'text'],
            
            # Special string subtypes
            'email': ['varchar', 'text', 'char', 'nvarchar'],
            'url': ['varchar', 'text', 'nvarchar'],
        }
        
        # MongoDB to SQL type mappings
        mongodb_to_sql = {
            'objectid': ['varchar', 'text', 'char'],
            'string': ['varchar', 'text', 'char'],
            'int32': ['int', 'integer'],
            'int64': ['bigint', 'int8'],
            'double': ['double', 'float', 'decimal'],
            'decimal128': ['decimal', 'numeric'],
            'bool': ['boolean', 'bool', 'bit'],
            'date': ['timestamp', 'datetime'],
            'object': ['json', 'jsonb', 'text'],
            'array': ['json', 'jsonb', 'text'],
        }
        
        # Check direct compatibility
        for src_type, compatible_types in direct_compatible.items():
            if source == src_type or src_type in source:
                for comp_type in compatible_types:
                    if comp_type in target or target == comp_type:
                        result['compatible'] = True
                        result['conversion_needed'] = False
                        return result
        
        # Check MongoDB compatibility
        for mongo_type, sql_types in mongodb_to_sql.items():
            if source == mongo_type:
                for sql_type in sql_types:
                    if sql_type in target:
                        result['compatible'] = True
                        result['conversion_needed'] = False
                        return result
        
        # Cases that need transformation
        transformation_needed = [
            # String to numeric
            (['string', 'str'], ['int', 'integer', 'bigint', 'smallint'], 
            'String to integer conversion - use parse_int transformation'),
            (['string', 'str'], ['float', 'double', 'decimal', 'numeric'], 
            'String to float conversion - use parse_float transformation'),
            (['string', 'str'], ['bool', 'boolean', 'bit'], 
            'String to boolean conversion - use parse_bool transformation'),
            (['string', 'str'], ['date'], 
            'String to date conversion - use parse_date transformation'),
            (['string', 'str'], ['datetime', 'timestamp'], 
            'String to datetime conversion - use parse_datetime transformation'),
            
            # Numeric to string
            (['int', 'integer', 'float', 'number'], ['varchar', 'text', 'char'], 
            'Number to string conversion - use to_string transformation'),
            
            # Boolean to string
            (['boolean', 'bool'], ['varchar', 'text'], 
            'Boolean to string conversion - use to_string transformation'),
            
            # Object to string
            (['dict', 'object'], ['varchar', 'text', 'nvarchar'], 
            'Object to string conversion - use json_stringify transformation'),
            
            # Numeric precision changes
            (['float'], ['int', 'integer'], 
            'Float to integer conversion - use parse_int (precision loss)'),
        ]
        
        # Check if transformation is needed
        for src_types, tgt_types, warning in transformation_needed:
            src_match = any(st == source or st in source for st in src_types)
            tgt_match = any(tt in target for tt in tgt_types)
            
            if src_match and tgt_match:
                result['compatible'] = True
                result['conversion_needed'] = True
                result['warning'] = warning
                return result
        
        # Handle null
        if source == 'null' or source == 'none':
            result['compatible'] = True
            result['warning'] = 'Source field is null in sample data'
            return result
        
        # Default incompatible
        result['compatible'] = False
        result['conversion_needed'] = True
        result['warning'] = f'Incompatible types: {source_type} → {target_type}'
        
        return result
    
    def _extract_value(self, data: Any, path: str) -> Any:
        """Extract value from nested data structure"""
        parts = path.replace('[0]', '.0').split('.')
        value = data
        
        for part in parts:
            if part.isdigit() and isinstance(value, list):
                idx = int(part)
                value = value[idx] if idx < len(value) else None
            elif isinstance(value, dict) and part in value:
                value = value[part]
            else:
                return None
        
        return value
    
    def _is_date(self, value: str) -> bool:
        """Check if string is a date"""
        date_patterns = [
            r'^\d{4}-\d{2}-\d{2}$',  # YYYY-MM-DD
            r'^\d{2}/\d{2}/\d{4}$',  # MM/DD/YYYY
            r'^\d{2}-\d{2}-\d{4}$',  # DD-MM-YYYY
        ]
        return any(re.match(pattern, value) for pattern in date_patterns)
    
    def _is_datetime(self, value: str) -> bool:
        """Check if string is a datetime"""
        # ISO 8601 and common formats
        datetime_patterns = [
            r'^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}',  # ISO format
            r'^\d{2}/\d{2}/\d{4}\s\d{2}:\d{2}:\d{2}',     # MM/DD/YYYY HH:MM:SS
        ]
        return any(re.match(pattern, value) for pattern in datetime_patterns)
    
    def _is_email(self, value: str) -> bool:
        """Check if string is an email"""
        return re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', value) is not None
    
    def _is_url(self, value: str) -> bool:
        """Check if string is a URL"""
        return re.match(r'^https?://', value) is not None