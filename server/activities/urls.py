from django.urls import path
from . import views

urlpatterns = [
    path('recent/', views.recent_activities, name='recent-activities'),
]