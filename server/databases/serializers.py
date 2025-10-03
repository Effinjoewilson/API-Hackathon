from rest_framework import serializers
from .models import DatabaseConnection, DatabaseTestLog


class DatabaseConnectionSerializer(serializers.ModelSerializer):
    owner_username = serializers.ReadOnlyField(source='owner.username')
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    username = serializers.CharField(required=True)
    
    class Meta:
        model = DatabaseConnection
        fields = [
            'id', 'name', 'description', 'db_type', 'host', 'port', 
            'database', 'schema', 'username', 'password', 'ssl_enabled',
            'connection_options', 'pool_size', 'max_overflow', 'pool_timeout',
            'owner', 'owner_username', 'created_at', 'updated_at', 
            'last_tested', 'connection_status', 'last_error', 
            'cached_schema', 'schema_updated_at', 'mongodb_connection_type',
            'atlas_connection_string'
        ]
        read_only_fields = ['owner', 'created_at', 'updated_at', 'last_tested', 
                          'connection_status', 'last_error', 'cached_schema', 
                          'schema_updated_at']
    
    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)
    
    def to_representation(self, instance):
        """Remove sensitive data from response"""
        ret = super().to_representation(instance)
        # Never return password
        ret.pop('password', None)
        # Mask username for security
        if 'username' in ret and ret['username']:
            ret['username'] = ret['username'][:2] + '***' if len(ret['username']) > 2 else '***'
        return ret


class DatabaseTestRequestSerializer(serializers.Serializer):
    """Serializer for database test requests"""
    test_query = serializers.CharField(required=False, allow_blank=True)


class DatabaseTestLogSerializer(serializers.ModelSerializer):
    tested_by_username = serializers.ReadOnlyField(source='tested_by.username')
    database_name = serializers.ReadOnlyField(source='database.name')
    
    class Meta:
        model = DatabaseTestLog
        fields = [
            'id', 'database', 'database_name', 'tested_by', 
            'tested_by_username', 'tested_at', 'is_successful', 
            'error_message', 'response_time_ms', 'test_query', 'server_info'
        ]


class DatabaseSchemaSerializer(serializers.Serializer):
    """Serializer for database schema response"""
    tables = serializers.DictField(required=False)
    collections = serializers.DictField(required=False)
    summary = serializers.DictField()
    updated_at = serializers.DateTimeField()