from rest_framework import serializers
from .models import APIEndpoint, APITestLog

class APIEndpointSerializer(serializers.ModelSerializer):
    owner_username = serializers.ReadOnlyField(source='owner.username')
    full_url = serializers.ReadOnlyField(source='get_full_url')
    
    class Meta:
        model = APIEndpoint
        fields = [
            'id', 'name', 'description', 'base_url', 'endpoint_path',
            'http_method', 'auth_type', 'auth_credentials', 'headers',
            'query_params', 'body_schema', 'expected_response_format',
            'response_schema', 'owner', 'owner_username', 'created_at',
            'updated_at', 'is_active', 'category', 'tags', 'version',
            'full_url'
        ]
        read_only_fields = ['owner', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)
    
    def validate_auth_credentials(self, value):
        """Ensure sensitive auth data is properly structured"""
        auth_type = self.initial_data.get('auth_type', 'none')
        
        if auth_type == 'api_key' and 'api_key' not in value:
            raise serializers.ValidationError("API Key is required for API Key authentication")
        elif auth_type == 'bearer' and 'token' not in value:
            raise serializers.ValidationError("Token is required for Bearer authentication")
        
        return value


class APITestLogSerializer(serializers.ModelSerializer):
    tested_by_username = serializers.ReadOnlyField(source='tested_by.username')
    api_endpoint_name = serializers.ReadOnlyField(source='api_endpoint.name')
    
    class Meta:
        model = APITestLog
        fields = [
            'id', 'api_endpoint', 'api_endpoint_name', 'tested_by',
            'tested_by_username', 'tested_at', 'request_headers',
            'request_params', 'request_body', 'response_status',
            'response_headers', 'response_body', 'response_time_ms',
            'is_success', 'error_message'
        ]
        read_only_fields = ['tested_by', 'tested_at']


class APITestRequestSerializer(serializers.Serializer):
    """Serializer for testing API endpoints"""
    headers = serializers.JSONField(required=False, default=dict)
    params = serializers.JSONField(required=False, default=dict)
    body = serializers.JSONField(required=False, allow_null=True)