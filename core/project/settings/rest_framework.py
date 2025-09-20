from datetime import timedelta

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(days=365),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework_simplejwt.authentication.JWTAuthentication",),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "core.shared.pagination.StandardResultsSetPagination",
}

AUTHENTICATION_BACKENDS = [
    "core.apps.accounts.authentication.EmailOrUsernameModelBackend",
    "django.contrib.auth.backends.ModelBackend",
]

SPECTACULAR_SETTINGS = {
    "TITLE": "Infiora API",
    "DESCRIPTION": "Comprehensive API documentation for Infiora Backend",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
    "SCHEMA_PATH_PREFIX": "/api/",
    "SECURITY": [{"bearerAuth": []}],
    "AUTHENTICATION_WHITELIST": ["rest_framework_simplejwt.authentication.JWTAuthentication"],
    "POSTPROCESSING_HOOKS": [],
}
