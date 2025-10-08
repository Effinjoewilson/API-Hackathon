from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DataMappingViewSet, TransformationTemplateViewSet

router = DefaultRouter()
router.register(r'data-mappings', DataMappingViewSet, basename='data-mapping')
router.register(r'transformations', TransformationTemplateViewSet, basename='transformation')

urlpatterns = [
    path('', include(router.urls)),
]