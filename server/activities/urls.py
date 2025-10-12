from django.urls import path
from . import views

urlpatterns = [
    path('recent/', views.recent_activities, name='recent-activities'),
    path('generate-documentation/', views.GenerateDocumentationView.as_view(), name='generate_documentation'),
]