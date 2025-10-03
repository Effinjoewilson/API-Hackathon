from django.db import models
from django.contrib.auth.models import User
from cryptography.fernet import Fernet
import os
import json
from django.conf import settings

# Use a fixed key from environment or generate one ONCE and save it
ENCRYPTION_KEY = os.environ.get('DB_ENCRYPTION_KEY')
if not ENCRYPTION_KEY:
    # Generate a key ONCE and print it
    key = Fernet.generate_key()
    ENCRYPTION_KEY = key
else:
    ENCRYPTION_KEY = ENCRYPTION_KEY.encode()

cipher = Fernet(ENCRYPTION_KEY)


class DatabaseConnection(models.Model):
    DB_TYPES = [
        ('postgresql', 'PostgreSQL'),
        ('mysql', 'MySQL'),
        ('mongodb', 'MongoDB'),
        ('mssql', 'SQL Server'),
    ]
    
    CONNECTION_STATUS = [
        ('active', 'Active'),
        ('failed', 'Failed'),
        ('unchecked', 'Not Tested'),
    ]
    
    # Basic Information
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    db_type = models.CharField(max_length=20, choices=DB_TYPES)
    
    # Connection Details
    host = models.CharField(max_length=255)
    port = models.IntegerField()
    database = models.CharField(max_length=255)
    schema = models.CharField(max_length=255, blank=True, null=True)  # For PostgreSQL
    
    # MongoDB specific
    mongodb_connection_type = models.CharField(
        max_length=20, 
        choices=[('standard', 'Standard'), ('atlas', 'Atlas')],
        default='standard',
        blank=True
    )
    atlas_connection_string = models.TextField(blank=True, null=True)  # For storing parsed Atlas info
    
    # Encrypted credentials
    _username = models.TextField(db_column='username')
    _password = models.TextField(db_column='password')
    
    # Connection Options
    ssl_enabled = models.BooleanField(default=False)
    connection_options = models.JSONField(default=dict, blank=True)
    
    # Pooling Settings (placeholders for future)
    pool_size = models.IntegerField(default=5)
    max_overflow = models.IntegerField(default=10)
    pool_timeout = models.IntegerField(default=30)
    
    # Metadata
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='database_connections')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_tested = models.DateTimeField(null=True, blank=True)
    connection_status = models.CharField(max_length=20, choices=CONNECTION_STATUS, default='unchecked')
    last_error = models.TextField(blank=True)
    
    # Schema cache
    cached_schema = models.JSONField(default=dict, blank=True)
    schema_updated_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.name} ({self.get_db_type_display()})"
    
    @property
    def username(self):
        if self._username:
            return cipher.decrypt(self._username.encode()).decode()
        return ''
    
    @username.setter
    def username(self, value):
        if value:
            self._username = cipher.encrypt(value.encode()).decode()
        else:
            self._username = ''
    
    @property
    def password(self):
        if self._password:
            return cipher.decrypt(self._password.encode()).decode()
        return ''
    
    @password.setter
    def password(self, value):
        if value:
            self._password = cipher.encrypt(value.encode()).decode()
        else:
            self._password = ''
    
    def get_connection_string(self):
        """Get database-specific connection string"""
        if self.db_type == 'postgresql':
            return f"postgresql://{self.username}:{self.password}@{self.host}:{self.port}/{self.database}"
        elif self.db_type == 'mysql':
            return f"mysql://{self.username}:{self.password}@{self.host}:{self.port}/{self.database}"
        elif self.db_type == 'mongodb':
            return f"mongodb://{self.username}:{self.password}@{self.host}:{self.port}/{self.database}"
        elif self.db_type == 'mssql':
            return f"mssql+pymssql://{self.username}:{self.password}@{self.host}:{self.port}/{self.database}"
        return ""


class DatabaseTestLog(models.Model):
    database = models.ForeignKey(DatabaseConnection, on_delete=models.CASCADE, related_name='test_logs')
    tested_by = models.ForeignKey(User, on_delete=models.CASCADE)
    tested_at = models.DateTimeField(auto_now_add=True)
    
    # Test Results
    is_successful = models.BooleanField(default=False)
    error_message = models.TextField(blank=True)
    response_time_ms = models.IntegerField()
    
    # Additional info
    test_query = models.TextField()
    server_info = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-tested_at']