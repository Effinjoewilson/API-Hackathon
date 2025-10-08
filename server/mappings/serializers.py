from rest_framework import serializers
from .models import DataMapping, MappingExecution, TransformationTemplate
from apis.models import APIEndpoint
from databases.models import DatabaseConnection
from apis.serializers import APIEndpointSerializer
from databases.serializers import DatabaseConnectionSerializer


class DataMappingSerializer(serializers.ModelSerializer):
    api_endpoint_name = serializers.ReadOnlyField(source='api_endpoint.name')
    database_name = serializers.ReadOnlyField(source='database.name')
    owner_username = serializers.ReadOnlyField(source='owner.username')
    
    class Meta:
        model = DataMapping
        fields = [
            'id', 'name', 'description', 'api_endpoint', 'api_endpoint_name',
            'database', 'database_name', 'target_table', 'field_mappings',
            'update_on_conflict', 'conflict_columns', 'batch_size',
            'owner', 'owner_username', 'status', 'created_at', 'updated_at',
            'last_run'
        ]
        read_only_fields = ['owner', 'created_at', 'updated_at', 'last_run']
    
    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)
    
    def validate(self, data):
        # Ensure API and DB belong to the same user
        user = self.context['request'].user
        
        if 'api_endpoint' in data:
            if data['api_endpoint'].owner != user:
                raise serializers.ValidationError("You don't have access to this API endpoint")
        
        if 'database' in data:
            if data['database'].owner != user:
                raise serializers.ValidationError("You don't have access to this database")
        
        return data


class DataMappingDetailSerializer(DataMappingSerializer):
    api_endpoint = APIEndpointSerializer(read_only=True)
    database = DatabaseConnectionSerializer(read_only=True)


class MappingExecutionSerializer(serializers.ModelSerializer):
    mapping_name = serializers.ReadOnlyField(source='mapping.name')
    executed_by_username = serializers.ReadOnlyField(source='executed_by.username')
    
    class Meta:
        model = MappingExecution
        fields = [
            'id', 'mapping', 'mapping_name', 'executed_by', 'executed_by_username',
            'started_at', 'completed_at', 'status', 'total_records',
            'processed_records', 'failed_records', 'api_response',
            'error_details', 'execution_time_ms'
        ]
        read_only_fields = ['executed_by', 'started_at']


class TransformationTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransformationTemplate
        fields = ['id', 'name', 'description', 'transformation_code', 'parameters']


class MappingTestSerializer(serializers.Serializer):
    """Serializer for testing mappings"""
    sample_size = serializers.IntegerField(default=5, min_value=1, max_value=20)


class MappingPreviewSerializer(serializers.Serializer):
    """Serializer for mapping preview data"""
    api_sample = serializers.JSONField()
    db_schema = serializers.JSONField()
    suggested_mappings = serializers.ListField(child=serializers.DictField())
    type_validations = serializers.DictField()