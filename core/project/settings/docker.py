import os

if IN_DOCKER or os.path.isfile("/.dockerenv"):  # type: ignore # noqa: F821
    # We need it to serve static files with DEBUG=False
    assert MIDDLEWARE[:1] == ["django.middleware.security.SecurityMiddleware"]  # type: ignore # noqa: F821
    MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")  # type: ignore # noqa: F821
    STORAGES = {
        "default": {
            "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
        },
        "staticfiles": {
            "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
        },
    }
