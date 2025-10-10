from django.db import models

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
