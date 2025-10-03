from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.utils import timezone
import time
from .models import DatabaseConnection, DatabaseTestLog
from .serializers import (
    DatabaseConnectionSerializer, 
    DatabaseTestLogSerializer, 
    DatabaseTestRequestSerializer,
    DatabaseSchemaSerializer
)
from .db_adapters.factory import DatabaseAdapterFactory


class DatabaseConnectionViewSet(viewsets.ModelViewSet):
    serializer_class = DatabaseConnectionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter databases by owner"""
        queryset = DatabaseConnection.objects.filter(owner=self.request.user)
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search) |
                Q(host__icontains=search)
            )
        
        # Filter by type
        db_type = self.request.query_params.get('db_type', None)
        if db_type:
            queryset = queryset.filter(db_type=db_type)
        
        # Filter by status
        connection_status = self.request.query_params.get('status', None)
        if connection_status:
            queryset = queryset.filter(connection_status=connection_status)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        """Test database connection"""
        database = self.get_object()
        serializer = DatabaseTestRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create adapter
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
        
        # Add MongoDB-specific config
        if database.db_type == 'mongodb':
            config['mongodb_connection_type'] = database.mongodb_connection_type
        
        adapter = DatabaseAdapterFactory.create_adapter(database.db_type, config)
        
        # Test connection
        start_time = time.time()
        success, message, server_info = adapter.test_connection()
        response_time = int((time.time() - start_time) * 1000)
        
        # Update database status
        database.last_tested = timezone.now()
        database.connection_status = 'active' if success else 'failed'
        database.last_error = message if not success else ''
        database.save()
        
        # Log the test
        test_log = DatabaseTestLog.objects.create(
            database=database,
            tested_by=request.user,
            is_successful=success,
            error_message=message if not success else '',
            response_time_ms=response_time,
            test_query=adapter.get_test_query(),
            server_info=server_info
        )
        
        return Response({
            'success': success,
            'message': message,
            'server_info': server_info,
            'response_time_ms': response_time,
            'test_log_id': test_log.id
        })
    
    @action(detail=True, methods=['get', 'post'])
    def schema(self, request, pk=None):
        """Get or refresh database schema"""
        database = self.get_object()
        
        # Check if we should refresh schema
        refresh = request.method == 'POST' or request.query_params.get('refresh', False)
        
        # Use cached schema if available and not refreshing
        if not refresh and database.cached_schema and database.schema_updated_at:
            # Check if cache is recent (within last hour)
            cache_age = timezone.now() - database.schema_updated_at
            if cache_age.total_seconds() < 3600:  # 1 hour
                return Response({
                    **database.cached_schema,
                    'updated_at': database.schema_updated_at,
                    'from_cache': True
                })
        
        # Fetch fresh schema
        try:
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
            
            # Add MongoDB-specific config
            if database.db_type == 'mongodb':
                config['mongodb_connection_type'] = database.mongodb_connection_type
            
            adapter = DatabaseAdapterFactory.create_adapter(database.db_type, config)
            
            schema_data = adapter.get_schema()
            
            # Update cache
            database.cached_schema = schema_data
            database.schema_updated_at = timezone.now()
            database.save()
            
            return Response({
                **schema_data,
                'updated_at': database.schema_updated_at,
                'from_cache': False
            })
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def test_history(self, request, pk=None):
        """Get test history for a database"""
        database = self.get_object()
        logs = database.test_logs.all()[:20]
        serializer = DatabaseTestLogSerializer(logs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def types(self, request):
        """Get supported database types"""
        return Response([
            {'value': 'postgresql', 'label': 'PostgreSQL'},
            {'value': 'mysql', 'label': 'MySQL'},
            {'value': 'mongodb', 'label': 'MongoDB'},
            {'value': 'mssql', 'label': 'SQL Server'},
        ])