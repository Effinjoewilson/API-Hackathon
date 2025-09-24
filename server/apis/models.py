from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import json

class APIEndpoint(models.Model):
    AUTH_TYPES = [
        ('none', 'No Authentication'),
        ('api_key', 'API Key'),
        ('bearer', 'Bearer Token'),
        ('oauth', 'OAuth 2.0'),
    ]
    
    HTTP_METHODS = [
        ('GET', 'GET'),
        ('POST', 'POST'),
        ('PUT', 'PUT'),
        ('PATCH', 'PATCH'),
        ('DELETE', 'DELETE'),
    ]
    
    # Basic Information
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    base_url = models.URLField()
    endpoint_path = models.CharField(max_length=500)  # e.g., /users/{id}
    http_method = models.CharField(max_length=10, choices=HTTP_METHODS, default='GET')
    
    # Authentication
    auth_type = models.CharField(max_length=20, choices=AUTH_TYPES, default='none')
    auth_credentials = models.JSONField(default=dict, blank=True)  # Encrypted in practice
    
    # Headers and Parameters
    headers = models.JSONField(default=dict, blank=True)
    query_params = models.JSONField(default=dict, blank=True)
    body_schema = models.JSONField(default=dict, blank=True)  # For POST/PUT requests
    
    # Response Configuration
    expected_response_format = models.CharField(max_length=20, default='json')
    response_schema = models.JSONField(default=dict, blank=True)
    
    # Metadata
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='api_endpoints')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    # Organization
    category = models.CharField(max_length=100, blank=True)
    tags = models.JSONField(default=list, blank=True)
    version = models.CharField(max_length=20, default='1.0')
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.name} - {self.http_method} {self.endpoint_path}"
    
    def get_full_url(self):
        return f"{self.base_url.rstrip('/')}/{self.endpoint_path.lstrip('/')}"


class APITestLog(models.Model):
    api_endpoint = models.ForeignKey(APIEndpoint, on_delete=models.CASCADE, related_name='test_logs')
    tested_by = models.ForeignKey(User, on_delete=models.CASCADE)
    tested_at = models.DateTimeField(auto_now_add=True)
    
    # Request Details
    request_headers = models.JSONField(default=dict)
    request_params = models.JSONField(default=dict)
    request_body = models.JSONField(default=dict, null=True, blank=True)
    
    # Response Details
    response_status = models.IntegerField()
    response_headers = models.JSONField(default=dict)
    response_body = models.JSONField(default=dict, null=True, blank=True)
    response_time_ms = models.IntegerField()
    
    # Result
    is_success = models.BooleanField(default=False)
    error_message = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-tested_at']