# CORS Configuration Logic
# This file sets CORS behavior based on configured origins

# Configure CORS settings for development
CORS_ALLOW_ALL_ORIGINS = False  # Use specific origins for security
CORS_ALLOW_CREDENTIALS = True  # Allow cookies and auth headers
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]
CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]
