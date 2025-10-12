from apis.models import APIEndpoint
from databases.models import DatabaseConnection
from mappings.models import DataMapping as Mapping
from activities.models import Activity
import json

def collect_api_data():
    api_endpoints = APIEndpoint.objects.all()
    return [{
        'name': api.name,
        'description': api.description,
        'http_method': api.http_method,
        'path': api.endpoint_path,                     # corrected
        'base_url': api.base_url,
        'auth_type': api.auth_type,                   # corrected
        'headers': api.headers,
        'query_params': api.query_params,
        'body_template': api.body_template,
        'response_format': api.expected_response_format,  # corrected
        'version': api.version,
        'tags': api.tags
    } for api in api_endpoints]

def collect_database_data():
    db_connections = DatabaseConnection.objects.all()
    return [{
        'database_type': db.db_type,   # corrected
        'host': db.host,
        'port': db.port,
        'name': db.name,
        'schema': db.schema,
        'connection_options': db.connection_options,
        'cached_schema': db.cached_schema
    } for db in db_connections]

def collect_mapping_data():
    mappings = Mapping.objects.all()
    return [{
        'name': mapping.name,
        'description': mapping.description,
        'source_endpoint': mapping.api_endpoint.name if mapping.api_endpoint else None,  # corrected
        'target_database': mapping.database.name if mapping.database else None,          # corrected
        'target_table': mapping.target_table,
        'field_mappings': mapping.field_mappings,
        'batch_size': mapping.batch_size,
        'conflict_columns': mapping.conflict_columns,
        'status': mapping.status
    } for mapping in mappings]

import json
def collect_sample_requests():
    # Get last 2 successful activity logs
    sample_logs = Activity.objects.filter(status='success').order_by('-timestamp')[:2]
    result = []

    for log in sample_logs:
        details = {}
        if log.details:
            if isinstance(log.details, str):
                try:
                    details = json.loads(log.details)
                except json.JSONDecodeError:
                    details = {}
            elif isinstance(log.details, dict):
                details = log.details

        result.append({
            'request': details.get('request_data'),
            'response': details.get('response_data'),
            'timestamp': log.timestamp.isoformat() if log.timestamp else None
        })

    return result

def collect_all_data():
    try:
        data = {
            'api_endpoints': collect_api_data(),
            'databases': collect_database_data(),
            'mappings': collect_mapping_data(),
            'sample_requests': collect_sample_requests()
        }
        
        # Validate that we have at least some data
        if not any([
            data['api_endpoints'],
            data['databases'],
            data['mappings'],
            data['sample_requests']
        ]):
            print("Warning: No data collected from any source")
            
        return data
        
    except Exception as e:
        print(f"Error collecting data: {str(e)}")
        return None