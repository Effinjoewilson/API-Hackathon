from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import APIEndpointViewSet

router = DefaultRouter()
router.register(r'endpoints', APIEndpointViewSet, basename='api-endpoint')

urlpatterns = [
    path('', include(router.urls)),
]