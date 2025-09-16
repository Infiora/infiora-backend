from datetime import timedelta

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(days=365),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework_simplejwt.authentication.JWTAuthentication",),
}

AUTHENTICATION_BACKENDS = [
    "core.apps.accounts.authentication.EmailOrUsernameModelBackend",
    "django.contrib.auth.backends.ModelBackend",
]
