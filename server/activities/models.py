from django.db import models
from django.contrib.auth.models import User

class Activity(models.Model):
    ACTIVITY_TYPES = (
        ('api_test', 'API Test'),
        ('mapping_execution', 'Mapping Execution'),
        ('database_test', 'Database Test'),
    )
    
    STATUS_CHOICES = (
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('partial', 'Partial'),
    )
    
    type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    title = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name_plural = 'Activities'
        ordering = ['-timestamp']  # Most recent first

class GeneratedDocumentation(models.Model):
    """Store generated documentation"""
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='generated_docs')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Store all documentation in a JSON field
    documentation_content = models.JSONField(default=dict, blank=True)
    """
    Structure:
    {
        "setup": "content...",
        "developer": "content...",
        "api": "content...",
        "design": "content...",
        "full": "complete markdown..."
    }
    """
    
    # Metadata
    generation_activity = models.ForeignKey(Activity, on_delete=models.SET_NULL, null=True, related_name='documentation')
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-updated_at']
        
    def __str__(self):
        return f"Documentation generated on {self.created_at.strftime('%Y-%m-%d %H:%M')}"
    
    @property
    def setup_content(self):
        return self.documentation_content.get('setup', '')
    
    @property
    def developer_content(self):
        return self.documentation_content.get('developer', '')
    
    @property
    def api_content(self):
        return self.documentation_content.get('api', '')
    
    @property
    def design_content(self):
        return self.documentation_content.get('design', '')
    
    @property
    def full_content(self):
        return self.documentation_content.get('full', '')