from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.utils import timezone
import time

from .models import DataMapping, MappingExecution, TransformationTemplate
from .serializers import (
    DataMappingSerializer, 
    DataMappingDetailSerializer,
    MappingExecutionSerializer, 
    TransformationTemplateSerializer,
    MappingTestSerializer,
    MappingPreviewSerializer
)
from .services.mapping_engine import MappingEngine
from .services.field_matcher import FieldMatcher
from .services.type_validator import TypeValidator


class DataMappingViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return DataMappingDetailSerializer
        return DataMappingSerializer
    
    def get_queryset(self):
        """Filter mappings by owner"""
        queryset = DataMapping.objects.filter(owner=self.request.user)
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search)
            )
        
        # Filter by status
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by API
        api_id = self.request.query_params.get('api_endpoint', None)
        if api_id:
            queryset = queryset.filter(api_endpoint_id=api_id)
        
        # Filter by Database
        db_id = self.request.query_params.get('database', None)
        if db_id:
            queryset = queryset.filter(database_id=db_id)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def execute(self, request, pk=None):
        """Execute a data mapping"""
        mapping = self.get_object()
        
        # Create execution record
        execution = MappingExecution.objects.create(
            mapping=mapping,
            executed_by=request.user
        )
        
        try:
            engine = MappingEngine(mapping, execution)
            result = engine.execute()
            
            # Update mapping last run
            mapping.last_run = timezone.now()
            mapping.save()
            
            return Response(MappingExecutionSerializer(execution).data)
        except Exception as e:
            execution.status = 'failed'
            execution.error_details = [{'general_error': str(e)}]
            execution.completed_at = timezone.now()
            execution.save()
            
            return Response(
                {'error': str(e), 'execution': MappingExecutionSerializer(execution).data},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        """Test a mapping with sample data"""
        mapping = self.get_object()
        serializer = MappingTestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            engine = MappingEngine(mapping, None)
            preview_data = engine.test_mapping(
                sample_size=serializer.validated_data['sample_size']
            )
            
            return Response(preview_data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def preview(self, request):
        """Get preview data for creating a new mapping"""
        api_id = request.data.get('api_endpoint_id')
        db_id = request.data.get('database_id')
        table_name = request.data.get('target_table')
        
        if not all([api_id, db_id, table_name]):
            missing = []
            if not api_id: missing.append('api_endpoint_id')
            if not db_id: missing.append('database_id')
            if not table_name: missing.append('target_table')
            
            return Response(
                {'error': f'Missing required fields: {", ".join(missing)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get API and DB
            from apis.models import APIEndpoint
            from databases.models import DatabaseConnection
            import requests
            
            try:
                api_endpoint = APIEndpoint.objects.get(id=api_id, owner=request.user)
            except APIEndpoint.DoesNotExist:
                return Response(
                    {'error': f'API endpoint with id {api_id} not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            try:
                database = DatabaseConnection.objects.get(id=db_id, owner=request.user)
            except DatabaseConnection.DoesNotExist:
                return Response(
                    {'error': f'Database with id {db_id} not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get sample API response by directly calling the API
            api_sample = {}
            try:
                # Build request parameters
                url = api_endpoint.get_full_url()
                headers = api_endpoint.headers.copy()
                params = api_endpoint.query_params.copy()
                
                # Add authentication
                if api_endpoint.auth_type == 'api_key':
                    api_key = api_endpoint.auth_credentials.get('api_key')
                    key_location = api_endpoint.auth_credentials.get('key_location', 'header')
                    key_name = api_endpoint.auth_credentials.get('key_name', 'X-API-Key')
                    
                    if key_location == 'header':
                        headers[key_name] = api_key
                    else:
                        params[key_name] = api_key
                        
                elif api_endpoint.auth_type == 'bearer':
                    token = api_endpoint.auth_credentials.get('token')
                    headers['Authorization'] = f'Bearer {token}'
                
                # Make request
                if api_endpoint.http_method == 'GET':
                    response = requests.get(url, headers=headers, params=params, timeout=10)
                else:
                    body = api_endpoint.body_template if api_endpoint.http_method in ['POST', 'PUT', 'PATCH'] else None
                    response = requests.request(
                        method=api_endpoint.http_method,
                        url=url,
                        headers=headers,
                        params=params,
                        json=body,
                        timeout=10
                    )
                
                if response.status_code < 300:
                    try:
                        api_sample = response.json()
                    except:
                        api_sample = {"text_response": response.text[:1000]}
                        
            except Exception as e:
                print(f"Error calling API: {str(e)}")
                # Use sample from body template if available
                if api_endpoint.body_template:
                    api_sample = {"sample_from_template": api_endpoint.body_template}
            
            # Get DB schema directly
            db_schema = {}
            try:
                from databases.db_adapters.factory import DatabaseAdapterFactory
                
                config = {
                    'host': database.host,
                    'port': database.port,
                    'database': database.database,
                    'schema': database.schema,
                    'username': database.username,
                    'password': database.password,
                    'ssl_enabled': database.ssl_enabled,
                    'options': database.connection_options
                }
                
                if database.db_type == 'mongodb':
                    config['mongodb_connection_type'] = database.mongodb_connection_type
                
                adapter = DatabaseAdapterFactory.create_adapter(database.db_type, config)
                full_schema = adapter.get_schema()
                
                # Extract the specific table/collection
                if 'tables' in full_schema and table_name in full_schema['tables']:
                    db_schema = full_schema['tables'][table_name]
                elif 'collections' in full_schema and table_name in full_schema['collections']:
                    db_schema = full_schema['collections'][table_name]
                    
            except Exception as e:
                print(f"Error getting schema: {str(e)}")
            
            # Get field suggestions
            matcher = FieldMatcher()
            suggested_mappings = matcher.suggest_mappings(api_sample, db_schema)
            
            # Validate types
            validator = TypeValidator()
            type_validations = validator.validate_mappings(suggested_mappings, api_sample, db_schema)
            
            response_data = {
                'api_sample': api_sample,
                'db_schema': db_schema,
                'suggested_mappings': suggested_mappings,
                'type_validations': type_validations
            }
            
            return Response(response_data)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def execution_history(self, request, pk=None):
        """Get execution history for a mapping"""
        mapping = self.get_object()
        executions = mapping.executions.all()[:20]
        serializer = MappingExecutionSerializer(executions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def available_transformations(self, request):
        """Get available transformation templates"""
        transformations = TransformationTemplate.objects.all()
        serializer = TransformationTemplateSerializer(transformations, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def validation_rules(self, request):
        """Get validation rules for frontend"""
        from .services.validation_rules import export_validation_rules
        return Response(export_validation_rules())


class TransformationTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TransformationTemplate.objects.all()
    serializer_class = TransformationTemplateSerializer
    permission_classes = [IsAuthenticated]
            