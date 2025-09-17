# CORS Configuration Logic
# This file sets CORS behavior based on configured origins

# If specific CORS origins are configured, use them and disable allow_all
# Otherwise, allow all origins (useful for development)
if CORS_ALLOWED_ORIGINS:  # type: ignore # noqa: F821
    CORS_ALLOW_ALL_ORIGINS = False
else:
    CORS_ALLOW_ALL_ORIGINS = True
