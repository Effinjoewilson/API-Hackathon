from django.contrib import admin
from .models import Activity

@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ['title', 'type', 'status', 'timestamp']
    list_filter = ['type', 'status']
    search_fields = ['title', 'details']
    ordering = ['-timestamp']
