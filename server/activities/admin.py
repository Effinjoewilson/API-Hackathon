from django.contrib import admin
from .models import Activity, GeneratedDocumentation

@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ['title', 'type', 'status', 'timestamp']
    list_filter = ['type', 'status']
    search_fields = ['title', 'details']
    ordering = ['-timestamp']

@admin.register(GeneratedDocumentation)
class GeneratedDocumentationAdmin(admin.ModelAdmin):
    list_display = ['owner', 'created_at', 'updated_at', 'is_active']
    list_filter = ['is_active', 'created_at', 'updated_at']
    search_fields = ['owner__username', 'owner__email']
    readonly_fields = ['created_at', 'updated_at']