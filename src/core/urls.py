from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', views.health_check, name='health_check'),
    path('metrics/', views.metrics, name='metrics'),
    path('', views.health_check, name='root_health_check'),  # Also available at root
]
