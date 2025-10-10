from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Activity
from rest_framework import serializers

class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = ['id', 'type', 'status', 'title', 'timestamp', 'details']

@api_view(['GET'])
def recent_activities(request):
    activities = Activity.objects.all()[:10]  # Get latest 10 activities
    serializer = ActivitySerializer(activities, many=True)
    return Response(serializer.data)
