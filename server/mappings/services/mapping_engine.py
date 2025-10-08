from typing import Dict, List, Any, Optional
import json
import requests
import time
from django.utils import timezone
from django.db import transaction
from jsonpath_ng import parse as jsonpath_parse
import logging

from databases.db_adapters.factory import DatabaseAdapterFactory
from .transformers import DataTransformer
from .type_validator import TypeValidator

logger = logging.getLogger(__name__)


class MappingEngine:
    def __init__(self, mapping, execution=None):
        self.mapping = mapping
        self.execution = execution
        self.transformer = DataTransformer()
        self.validator = TypeValidator()
        self.retry_config = {
            'max_retries': 3,
            'backoff_factor': 2,
            'retry_errors': ['Lock wait timeout', 'Deadlock found', 'Connection reset']
        }
    
    def execute(self) -> Dict[str, Any]:
        """Execute the mapping and return results"""
        start_time = time.time()
        
        try:
            # 1. Call API
            api_data = self._call_api()
            
            if self.execution:
                self.execution.api_response = api_data
                self.execution.save()
            
            # 2. Extract records from API response
            records = self._extract_records(api_data)
            total_records = len(records)
            
            if self.execution:
                self.execution.total_records = total_records
                self.execution.save()
            
            # 3. Process records with transaction support
            processed = 0
            failed = 0
            errors = []
            
            # Get database adapter
            db_adapter = self._get_db_adapter()
            
            # Process in batches with transactions
            batch_size = self.mapping.batch_size
            for i in range(0, total_records, batch_size):
                batch = records[i:i + batch_size]
                
                # Process batch with retry logic
                batch_results = self._process_batch_with_retry(batch, db_adapter)
                
                processed += batch_results['success']
                failed += batch_results['failed']
                errors.extend(batch_results['errors'])
                
                if self.execution:
                    self.execution.processed_records = processed
                    self.execution.failed_records = failed
                    self.execution.save()
            
            # 4. Update execution status
            if self.execution:
                execution_time = int((time.time() - start_time) * 1000)
                self.execution.status = 'success' if failed == 0 else 'partial' if processed > 0 else 'failed'
                self.execution.completed_at = timezone.now()
                self.execution.execution_time_ms = execution_time
                self.execution.error_details = errors
                self.execution.save()
            
            return {
                'status': 'success' if failed == 0 else 'partial',
                'total_records': total_records,
                'processed_records': processed,
                'failed_records': failed,
                'execution_time_ms': int((time.time() - start_time) * 1000),
                'errors': errors[:10]  # Return first 10 errors
            }
            
        except Exception as e:
            if self.execution:
                self.execution.status = 'failed'
                self.execution.completed_at = timezone.now()
                self.execution.error_details = [{'general_error': str(e)}]
                self.execution.save()
            raise
    
    def _process_batch_with_retry(self, batch: List[Dict], db_adapter) -> Dict:
        """Process batch with retry logic"""
        for attempt in range(self.retry_config['max_retries']):
            try:
                return self._process_batch_with_transaction(batch, db_adapter)
            except Exception as e:
                error_str = str(e)
                
                # Check if error is retryable
                is_retryable = any(
                    retry_error in error_str 
                    for retry_error in self.retry_config['retry_errors']
                )
                
                if is_retryable and attempt < self.retry_config['max_retries'] - 1:
                    # Exponential backoff
                    wait_time = self.retry_config['backoff_factor'] ** attempt
                    logger.warning(f"Retryable error on attempt {attempt + 1}, waiting {wait_time}s: {error_str}")
                    time.sleep(wait_time)
                    continue
                else:
                    # Not retryable or max retries reached
                    raise
        
        return {'success': 0, 'failed': len(batch), 'errors': [{'error': 'Max retries exceeded'}]}
    
    def _process_batch_with_transaction(self, records: List[Dict], db_adapter) -> Dict:
        """Process a batch of records with transaction support"""
        success = 0
        failed = 0
        errors = []
        transformed_records = []
        
        # First, transform all records and validate
        for idx, record in enumerate(records):
            try:
                transformed = self._transform_record(record)
                transformed_records.append({
                    'index': idx,
                    'original': record,
                    'transformed': transformed
                })
            except Exception as e:
                failed += 1
                errors.append({
                    'record_index': idx,
                    'stage': 'transformation',
                    'error': str(e),
                    'error_type': type(e).__name__,
                    'field_values': self._extract_key_fields(record)
                })
        
        # If all transformations failed, return early
        if not transformed_records:
            return {'success': success, 'failed': failed, 'errors': errors}
        
        # Process based on database type
        if self.mapping.database.db_type == 'mongodb':
            # MongoDB doesn't have traditional transactions for single replica sets
            # Process individually with better error handling
            result = self._process_mongodb_batch(transformed_records, db_adapter, errors)
        else:
            # SQL databases - use transaction
            result = self._process_sql_batch_transactional(transformed_records, db_adapter, errors)
        
        success += result['success']
        failed += result['failed']
        
        return {
            'success': success,
            'failed': failed,
            'errors': errors
        }
    
    def _process_sql_batch_transactional(self, transformed_records: List[Dict], db_adapter, errors: List) -> Dict:
        """Process SQL batch with transaction support"""
        success = 0
        failed = 0
        
        db_adapter.connect()
        
        try:
            # Start transaction
            if hasattr(db_adapter.connection, 'begin'):
                db_adapter.connection.begin()
            elif hasattr(db_adapter.connection, 'autocommit'):
                db_adapter.connection.autocommit = False
            
            try:
                for record_info in transformed_records:
                    idx = record_info['index']
                    transformed = record_info['transformed']
                    original = record_info['original']
                    
                    try:
                        if self.mapping.update_on_conflict and self.mapping.conflict_columns:
                            self._upsert_record(transformed, db_adapter)
                        else:
                            self._insert_record(transformed, db_adapter)
                        success += 1
                    except Exception as e:
                        # Record individual error but continue within transaction
                        failed += 1
                        errors.append({
                            'record_index': idx,
                            'stage': 'database_insert',
                            'error': str(e),
                            'error_type': type(e).__name__,
                            'field_values': self._extract_key_fields(original),
                            'transformed_values': transformed
                        })
                        # For SQL, we'll rollback the entire batch on any error
                        raise
                
                # Commit transaction if all successful
                if hasattr(db_adapter.connection, 'commit'):
                    db_adapter.connection.commit()
                    
            except Exception as batch_error:
                # Rollback on any error
                if hasattr(db_adapter.connection, 'rollback'):
                    db_adapter.connection.rollback()
                
                # Mark all as failed if transaction failed
                return {
                    'success': 0,
                    'failed': len(transformed_records),
                    'errors': errors if errors else [{
                        'batch_error': str(batch_error),
                        'error_type': type(batch_error).__name__,
                        'message': 'Entire batch rolled back due to error'
                    }]
                }
                
        finally:
            db_adapter.disconnect()
        
        return {'success': success, 'failed': failed}
    
    def _process_mongodb_batch(self, transformed_records: List[Dict], db_adapter, errors: List) -> Dict:
        """Process MongoDB batch with better error handling"""
        success = 0
        failed = 0
        
        db_adapter.connect()
        
        try:
            db = db_adapter.connection[db_adapter.config['database']]
            collection = db[self.mapping.target_table]
            
            # Use bulk operations for better performance
            bulk_operations = []
            
            for record_info in transformed_records:
                transformed = record_info['transformed']
                
                if self.mapping.update_on_conflict and self.mapping.conflict_columns:
                    # Create filter for upsert
                    filter_doc = {
                        col: transformed.get(col) 
                        for col in self.mapping.conflict_columns 
                        if col in transformed
                    }
                    bulk_operations.append({
                        'filter': filter_doc,
                        'update': {'$set': transformed},
                        'upsert': True
                    })
                else:
                    bulk_operations.append(transformed)
            
            # Execute bulk operation
            if self.mapping.update_on_conflict and bulk_operations:
                # Bulk upsert
                for op in bulk_operations:
                    try:
                        collection.update_one(
                            op['filter'],
                            op['update'],
                            upsert=op.get('upsert', False)
                        )
                        success += 1
                    except Exception as e:
                        failed += 1
                        errors.append({
                            'record_index': bulk_operations.index(op),
                            'stage': 'mongodb_upsert',
                            'error': str(e),
                            'error_type': type(e).__name__
                        })
            else:
                # Bulk insert
                try:
                    result = collection.insert_many(bulk_operations, ordered=False)
                    success = len(result.inserted_ids)
                except Exception as e:
                    # Handle partial success in bulk insert
                    if hasattr(e, 'details'):
                        write_errors = e.details.get('writeErrors', [])
                        success = len(bulk_operations) - len(write_errors)
                        failed = len(write_errors)
                        
                        for error in write_errors:
                            errors.append({
                                'record_index': error.get('index'),
                                'stage': 'mongodb_insert',
                                'error': error.get('errmsg'),
                                'error_code': error.get('code')
                            })
                    else:
                        failed = len(bulk_operations)
                        errors.append({
                            'batch_error': str(e),
                            'error_type': type(e).__name__
                        })
                        
        finally:
            db_adapter.disconnect()
        
        return {'success': success, 'failed': failed}
    
    def _extract_key_fields(self, record: Dict) -> Dict:
        """Extract key fields from record for error reporting"""
        key_fields = {}
        common_keys = ['id', 'email', 'name', 'username', 'code', 'identifier']
        
        for key in common_keys:
            if key in record:
                key_fields[key] = record[key]
            # Also check nested common locations
            if isinstance(record, dict):
                for nested_key in ['data', 'attributes', 'properties']:
                    if nested_key in record and isinstance(record[nested_key], dict):
                        if key in record[nested_key]:
                            key_fields[f"{nested_key}.{key}"] = record[nested_key][key]
        
        # If no common keys found, take first few fields
        if not key_fields and isinstance(record, dict):
            for i, (k, v) in enumerate(record.items()):
                if i >= 3:  # Limit to 3 fields
                    break
                if not isinstance(v, (dict, list)):  # Only simple values
                    key_fields[k] = v
        
        return key_fields

    # Keep all other existing methods unchanged
    def test_mapping(self, sample_size: int = 5) -> Dict[str, Any]:
        """Test mapping with sample data without executing"""
        # 1. Get sample API data
        api_data = self._call_api()
        records = self._extract_records(api_data)[:sample_size]
        
        # 2. Transform sample records
        transformed = []
        for record in records:
            transformed_record = self._transform_record(record)
            transformed.append({
                'original': record,
                'transformed': transformed_record
            })
        
        # 3. Generate SQL preview
        if transformed:
            sql_preview = self._generate_sql_preview(transformed[0]['transformed'])
        else:
            sql_preview = "No data to preview"
        
        return {
            'sample_size': len(records),
            'transformed_data': transformed,
            'sql_preview': sql_preview,
            'target_table': self.mapping.target_table
        }
    
    def _call_api(self) -> Dict[str, Any]:
        """Call the API endpoint and return response data"""
        api = self.mapping.api_endpoint
        
        # Build request parameters
        url = api.get_full_url()
        headers = api.headers.copy()
        params = api.query_params.copy()
        body = api.body_template if api.http_method in ['POST', 'PUT', 'PATCH'] else None
        
        # Add authentication
        if api.auth_type == 'api_key':
            api_key = api.auth_credentials.get('api_key')
            key_location = api.auth_credentials.get('key_location', 'header')
            key_name = api.auth_credentials.get('key_name', 'X-API-Key')
            
            if key_location == 'header':
                headers[key_name] = api_key
            else:
                params[key_name] = api_key
                
        elif api.auth_type == 'bearer':
            token = api.auth_credentials.get('token')
            headers['Authorization'] = f'Bearer {token}'
        
        # Make request
        if api.http_method in ['POST', 'PUT', 'PATCH']:
            response = requests.request(
                method=api.http_method,
                url=url,
                headers=headers,
                params=params,
                json=body,
                timeout=30
            )
        else:
            response = requests.request(
                method=api.http_method,
                url=url,
                headers=headers,
                params=params,
                timeout=30
            )
        
        response.raise_for_status()
        return response.json()
    
    def _extract_records(self, api_data: Any) -> List[Dict]:
        """Extract records from API response"""
        # If api_data is already a list, return it
        if isinstance(api_data, list):
            return api_data
        
        # If it's a dict, try common patterns
        if isinstance(api_data, dict):
            # Check for common data keys
            for key in ['data', 'results', 'items', 'records']:
                if key in api_data and isinstance(api_data[key], list):
                    return api_data[key]
        
        # If single object, wrap in list
        return [api_data]
    
    def _transform_record(self, record: Dict) -> Dict:
        """Transform a single record based on field mappings"""
        transformed = {}
        
        for mapping in self.mapping.field_mappings:
            source_path = mapping['source_path']
            target_column = mapping['target_column']
            transformations = mapping.get('transformations', [])
            default_value = mapping.get('default_value', None)
            skip_if_null = mapping.get('skip_if_null', False)
            
            # Extract value using JSONPath
            value = self._extract_value(record, source_path)
            
            # Handle null values
            if value is None:
                if skip_if_null:
                    continue
                value = default_value
            
            # Apply transformations
            for transform in transformations:
                value = self.transformer.apply(transform, value)
            
            transformed[target_column] = value
        
        return transformed
    
    def _extract_value(self, data: Dict, path: str) -> Any:
        """Extract value from nested dict using JSONPath"""
        if not path:
            return None
        
        # Handle simple dot notation
        if '$' not in path:
            parts = path.split('.')
            value = data
            for part in parts:
                if isinstance(value, dict) and part in value:
                    value = value[part]
                else:
                    return None
            return value
        
        # Handle JSONPath
        try:
            jsonpath_expr = jsonpath_parse(path)
            matches = jsonpath_expr.find(data)
            return matches[0].value if matches else None
        except:
            return None
    
    def _get_db_adapter(self):
        """Get database adapter for target database"""
        db = self.mapping.database
        config = {
            'host': db.host,
            'port': db.port,
            'database': db.database,
            'schema': db.schema,
            'username': db.username,
            'password': db.password,
            'ssl_enabled': db.ssl_enabled,
            'options': db.connection_options
        }
        
        if db.db_type == 'mongodb':
            config['mongodb_connection_type'] = db.mongodb_connection_type
        
        return DatabaseAdapterFactory.create_adapter(db.db_type, config)
    
    def _insert_record(self, record: Dict, db_adapter):
        """Insert a record into the database"""
        table = self.mapping.target_table
        columns = list(record.keys())
        values = list(record.values())
        
        if self.mapping.database.db_type == 'mongodb':
            # MongoDB insert
            db_adapter.connection[db_adapter.config['database']][table].insert_one(record)
        else:
            # SQL insert
            placeholders = ', '.join(['%s'] * len(columns))
            columns_str = ', '.join([f'"{col}"' for col in columns])
            
            query = f'INSERT INTO {table} ({columns_str}) VALUES ({placeholders})'
            db_adapter.execute_query(query, values)
    
    def _upsert_record(self, record: Dict, db_adapter):
        """Upsert (insert or update) a record"""
        table = self.mapping.target_table
        
        if self.mapping.database.db_type == 'postgresql':
            # PostgreSQL UPSERT
            columns = list(record.keys())
            values = list(record.values())
            columns_str = ', '.join([f'"{col}"' for col in columns])
            placeholders = ', '.join(['%s'] * len(columns))
            conflict_cols = ', '.join([f'"{col}"' for col in self.mapping.conflict_columns])
            update_str = ', '.join([f'"{col}" = EXCLUDED."{col}"' for col in columns if col not in self.mapping.conflict_columns])
            
            query = f"""
                INSERT INTO {table} ({columns_str}) 
                VALUES ({placeholders})
                ON CONFLICT ({conflict_cols}) 
                DO UPDATE SET {update_str}
            """
            db_adapter.execute_query(query, values)
            
        elif self.mapping.database.db_type == 'mysql':
            # MySQL UPSERT
            columns = list(record.keys())
            values = list(record.values())
            columns_str = ', '.join([f'`{col}`' for col in columns])
            placeholders = ', '.join(['%s'] * len(columns))
            update_str = ', '.join([f'`{col}` = VALUES(`{col}`)' for col in columns if col not in self.mapping.conflict_columns])
            
            query = f"""
                INSERT INTO {table} ({columns_str}) 
                VALUES ({placeholders})
                ON DUPLICATE KEY UPDATE {update_str}
            """
            db_adapter.execute_query(query, values)
            
        elif self.mapping.database.db_type == 'mongodb':
            # MongoDB upsert
            filter_doc = {col: record.get(col) for col in self.mapping.conflict_columns if col in record}
            db_adapter.connection[db_adapter.config['database']][table].update_one(
                filter_doc,
                {'$set': record},
                upsert=True
            )
        else:
            # Fallback to regular insert for other databases
            self._insert_record(record, db_adapter)
    
    def _generate_sql_preview(self, record: Dict) -> str:
        """Generate SQL preview for a transformed record"""
        table = self.mapping.target_table
        columns = list(record.keys())
        values = list(record.values())
        
        columns_str = ', '.join([f'"{col}"' for col in columns])
        values_str = ', '.join([
            f"'{v}'" if isinstance(v, str) else 
            'NULL' if v is None else 
            str(v) 
            for v in values
        ])
        
        if self.mapping.update_on_conflict and self.mapping.conflict_columns:
            if self.mapping.database.db_type == 'postgresql':
                conflict_cols = ', '.join([f'"{col}"' for col in self.mapping.conflict_columns])
                update_str = ', '.join([f'"{col}" = EXCLUDED."{col}"' for col in columns if col not in self.mapping.conflict_columns])
                return f"""INSERT INTO {table} ({columns_str}) 
VALUES ({values_str})
ON CONFLICT ({conflict_cols}) 
DO UPDATE SET {update_str};"""
            elif self.mapping.database.db_type == 'mysql':
                columns_str_mysql = ', '.join([f'`{col}`' for col in columns])
                update_str = ', '.join([f'`{col}` = VALUES(`{col}`)' for col in columns if col not in self.mapping.conflict_columns])
                return f"""INSERT INTO {table} ({columns_str_mysql}) 
VALUES ({values_str})
ON DUPLICATE KEY UPDATE {update_str};"""
        
        return f"INSERT INTO {table} ({columns_str}) VALUES ({values_str});"            