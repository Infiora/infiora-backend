"""
Health check URLs
"""

from django.urls import path

from . import views

app_name = "health"

urlpatterns = [
    path("health/", views.health_check, name="health_check"),
    path("health/ready/", views.readiness_check, name="readiness_check"),
    path("health/live/", views.liveness_check, name="liveness_check"),
]
