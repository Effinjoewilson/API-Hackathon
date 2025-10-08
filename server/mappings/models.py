from django.db import models
from django.contrib.auth.models import User
from apis.models import APIEndpoint
from databases.models import DatabaseConnection
import json


class DataMapping(models.Model):
    MAPPING_STATUS = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]
    
    # Basic Information
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Relationships
    api_endpoint = models.ForeignKey(APIEndpoint, on_delete=models.CASCADE, related_name='mappings')
    database = models.ForeignKey(DatabaseConnection, on_delete=models.CASCADE, related_name='mappings')
    target_table = models.CharField(max_length=255)
    
    # Mapping Configuration
    field_mappings = models.JSONField(default=list)  # List of field mapping objects
    """
    Example field_mappings structure:
    [
        {
            "source_path": "data.user.email",
            "target_column": "email",
            "transformations": ["lowercase", "trim"],
            "default_value": null,
            "skip_if_null": false
        }
    ]
    """
    
    # Options
    update_on_conflict = models.BooleanField(default=False)
    conflict_columns = models.JSONField(default=list)  # Columns to check for conflicts
    batch_size = models.IntegerField(default=100)
    
    # Metadata
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='data_mappings')
    status = models.CharField(max_length=20, choices=MAPPING_STATUS, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_run = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-updated_at']
        unique_together = [['name', 'owner']]
    
    def __str__(self):
        return f"{self.name} ({self.api_endpoint.name} → {self.database.name})"


class MappingExecution(models.Model):
    EXECUTION_STATUS = [
        ('running', 'Running'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('partial', 'Partial Success'),
    ]
    
    mapping = models.ForeignKey(DataMapping, on_delete=models.CASCADE, related_name='executions')
    executed_by = models.ForeignKey(User, on_delete=models.CASCADE)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Execution details
    status = models.CharField(max_length=20, choices=EXECUTION_STATUS, default='running')
    total_records = models.IntegerField(default=0)
    processed_records = models.IntegerField(default=0)
    failed_records = models.IntegerField(default=0)
    
    # Data
    api_response = models.JSONField(default=dict, blank=True)
    error_details = models.JSONField(default=list, blank=True)
    execution_time_ms = models.IntegerField(null=True, blank=True)
    
    class Meta:
        ordering = ['-started_at']


class TransformationTemplate(models.Model):
    """Reusable transformation templates"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    transformation_code = models.CharField(max_length=50)  # e.g., 'lowercase', 'parse_date'
    parameters = models.JSONField(default=dict, blank=True)  # Additional params if needed
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name