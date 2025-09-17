from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

API_PREFIX = "v1/"

urlpatterns = [
    path("__debug__/", include("debug_toolbar.urls")),
    path("admin/", admin.site.urls),
    path("", include("core.apps.health.urls")),  # Health checks at root level
    path(f"api/{API_PREFIX}", include("core.apps.accounts.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
